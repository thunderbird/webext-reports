/**
 * This script is heavily based on the work of Christopher Leidigh:
 * https://github.com/cleidigh/ThunderKdB/blob/master/scripts/requesttb1.js
 * 
 * This script collects detailed information about add-ons available through
 * addons.thunderbird.net. It will find the compatible versions for each ESR
 * and will download its sources and extract information for later analysis.
 */

// Define which ESR are supported.
const SUPPORTED_ESR = [60, 68, 78, 91, 102, 115, 128, 136, 137];
// Debug logging (0 - errors and basic logs only, 1 - verbose debug)
const debugLevel = 1;
// Debug option to speed up processing.
const maxNumberOfAddonPages = 0;

// replacement for deprecated request
const bent = require('bent');
const bentGetJSON = bent('GET', 'json', 200);

const fs = require('fs-extra');
const https = require("https");
const path = require('path');
const extract = require('extract-zip')
const convert = require('xml-js');

const {
  parse,
  stringify,
  assign
} = require('comment-json');

const rootDir = "data";
const downloadDir = 'downloads';
const extsAllJsonFileName = `${rootDir}/xall.json`;
const extsAllLogFileName = `log.json`;

function debug(...args) {
  if (debugLevel > 0) {
    console.debug(...args);
  }
}

function fileUnzip(source, options) {
  return extract(source, options, function (err) {
    // extraction is complete. make sure to handle the err
    console.error("Error in fileUnzip()", source, err);
  });
}

// cleidigh - Utility to get install.rdf values
function rdfGetValue(file, valuePath) {

  var xml = fs.readFileSync(file, 'utf8');
  var options = { ignoreComment: true, alwaysChildren: true, compact: true };
  var result = convert.xml2js(xml, options);

  var rdfXMLPath = 'result.RDF.' + valuePath + '._text';
  try {
    if (eval(rdfXMLPath) === undefined || eval(rdfXMLPath) === null) {
      return null;
    }
  } catch (error) {
    return null;
  }
  return eval(rdfXMLPath);
}

async function writePrettyJSONFile(f, json) {
  try {
    return await fs.outputFile(f, JSON.stringify(json, null, 4));
  } catch (err) {
    console.error("Error in writePrettyJSONFile()", f, err);
    throw err;
  }
}

async function requestATN(addon_id, query_type, options) {
  let url;
  switch (query_type) {
    case "details":
      url = `https://addons.thunderbird.net/api/v4/addons/addon/${addon_id}`;
      break;

    case "versions":
      url = `https://addons.thunderbird.net/api/v4/addons/addon/${addon_id}/versions/`;
      break;

    case "search":
      url = "https://addons.thunderbird.net/api/v4/addons/search/";
      break;

    default:
      throw new Error(`Unknown ATN command <${query_type}>`);
  }

  if (options) {
    let opts = [];
    for (let [key, value] of Object.entries(options)) {
      opts.push(`${key}=${encodeURIComponent(value)}`);
    }
    url = url + "?" + opts.join("&");
  }

  // Retry on error, using a hard timeout enforced from the client side.
  let rv;
  for (let i = 0; (!rv && i < 10); i++) {
    if (i > 0) {
      console.error("Retry", i);
      await new Promise(resolve => setTimeout(resolve, 10000));
    }

    let killTimer;
    let killSwitch = new Promise((resolve, reject) => { killTimer = setTimeout(reject, 15000, "HardTimeout"); })
    rv = await Promise
      .race([bentGetJSON(url), killSwitch])
      .catch(err => {
        console.error('Error in ATN request', addon_id || query_type, err);
        return null;
      });

    // node will continue to "wait" after the script finished, if we do not
    // clear the timeouts.
    clearTimeout(killTimer);
  }
  return rv;
}

// Common check on compatibility string.
function isCompatible(esr, min, max) {
  let mMin = parseInt(min.split(".").shift());
  let mMax = parseInt(max.split(".").shift());
  return (
    (min == "*" || mMin <= esr) &&
    (max == "*" || mMax >= esr)
  );
}

/**
 * Helper function to download a file.
 *
 * @param {string} url - The URL to download.
 * @param {string} filePath - The path to write the downloaded file to.
 */
async function downloadURL(url, filePath) {
  await new Promise(resolve => setTimeout(resolve, 2500));
  return new Promise((resolve, reject) => {
    const file = createWriteStream(filePath);
    https
      .get(url, (response) => {
        response.pipe(file);
        file.on("finish", () => {
          file.close(() => {
            resolve();
          });
        });
      })
      .on("error", (err) => {
        reject(err);
      });
  });
}

//async function downloadURL(url, destFile) {
//  fs.writeFileSync(`${destFile}`, await download(url));
//  debug('done!');
//}

async function getExtensionFiles(extension) {
  const addon_identifier = extension.guid;
  const extRootName = `${extension.id}-${extension.slug}`;

  try {
    // Get the full version history.
    let qs = { page: 0, page_size: 50 };
    let ext_versions = [];
    let r = null;
    do {
      qs.page++;
      debug('    Requesting version page: ' + qs.page);
      r = await requestATN(addon_identifier, 'versions', qs);
      if (r && r.results) {
        // Note: r.results is an array of results, not a single result
        ext_versions = ext_versions.concat(r.results);
      }
    } while (r && r.next !== null);

    // Save individual JSON version file.
    let versionsFile = `${rootDir}/versiondata/${extRootName}.json`;
    await writePrettyJSONFile(versionsFile, ext_versions);

    // Extract compat information of supported ESR
    esr_data = {}; // ext version data for each supported ESR
    for (let result of ext_versions) {
      if (!result.compatibility.thunderbird)
        continue;

      // Add current version (but use the data from the versions query, to avoid caching issues).
      if (result.version == extension.current_version.version) {
        esr_data.current = result;
      }

      // Update ESR comp data.
      let MIN = result.compatibility.thunderbird.min || "*";
      let MAX = result.compatibility.thunderbird.max || "*";
      for (let ESR of SUPPORTED_ESR) {
        // The versions are ordered, so we take the first one of each ESR. The actual version numbers are not important.
        if (!esr_data[ESR] && isCompatible(ESR, MIN, MAX)) {
          esr_data[ESR] = result;
        }
      }
    }

    // Some logs
    console.log(`    Current version for ${addon_identifier} is ${esr_data.current.version} with ATN compMax = ${esr_data.current.compatibility.thunderbird.max || "*"}`);

    let cmp_data = {}; // Version numbers of most recent releases for each ESR.
    let ext_data = {}; // Extension details for each ESR relevant version.
    // Download the XPI for each ESR
    for (let ESR of ["current"].concat(SUPPORTED_ESR)) {
      // Skip, if there is no version for this ESR.
      if (!esr_data[ESR])
        continue;

      // Store the version compatible with this ESR.
      cmp_data[ESR] = esr_data[ESR].version;

      // Skip, if this version had been scanned already.
      let ext_version = esr_data[ESR].version;
      if (ext_data[ext_version])
        continue;

      // Prepare the filenames used for downloading the XPI (use id instead
      // of version, as version could be not save for filesystem).
      const extRootDir = `${rootDir}/${downloadDir}/${extRootName}/${esr_data[ESR].id}`;
      const xpiFileURL = esr_data[ESR].files[0].url;
      // Do not use original filename, as it could be too long for the fs and truncated.
      const xpiFileName = "ext.xpi";

      // Prepare default xpi data.
      let data = {
        atn: esr_data[ESR],
        mext: false,
        legacy: false,
        experiment: false,
        localExtensionDir: extRootDir,
      };

      // Skip download if it exists already
      if (!fs.existsSync(`${extRootDir}/xpi/${xpiFileName}`)) {
        debug(`Downloading to ${extRootDir}/xpi/${xpiFileName}`);
        fs.ensureDirSync(`${extRootDir}/xpi`);
        await downloadURL(xpiFileURL, `${extRootDir}/xpi/${xpiFileName}`);
      }

      // Extract XPI.
      if (!fs.existsSync(`${extRootDir}/src`) || fs.readdirSync(`${extRootDir}/src`).length === 0) {
        //fs.removeSync(`${extRootDir}/src`);
        await fileUnzip(path.resolve(`${extRootDir}/xpi/${xpiFileName}`), { dir: path.resolve(`${extRootDir}/src`) });
      }

      // Try to read the manifest.json.
      if (fs.existsSync(`${extRootDir}/src/manifest.json`)) {
        let manifestJson = parse(fs.readFileSync(`${extRootDir}/src/manifest.json`).toString())
        // let manifestJson = fs.readJSONSync(`${extRootDir}/src/manifest.json`, { throws: false });

        // We have a manifest, so we consider this a WebExtension.
        data.mext = true;
        data.manifest = manifestJson;

        // check legacy
        if (manifestJson.legacy) {
          data.legacy = true;
          data.legacy_type = (typeof manifestJson.legacy.type === 'string') ? manifestJson.legacy.type : 'xul';
        }

        // check experiments
        if (manifestJson.experiment_apis) {
          let exp_apis = manifestJson.experiment_apis;
          data.experiment = true;
          data.experimentSchemaNames = Object.keys(exp_apis);
        }
      } else if (fs.existsSync(`${extRootDir}/src/install.rdf`)) {
        data.legacy = true;
        const installRDFExtType = rdfGetValue(`${extRootDir}/src/install.rdf`, 'Description[\"em:type\"]');
        const installRDFExtBootstrap = rdfGetValue(`${extRootDir}/src/install.rdf`, 'Description[\"em:bootstrap\"]');
        if (installRDFExtType === 2 && installRDFExtBootstrap) {
          data.legacy_type = 'bootstrap';
        } else {
          data.legacy_type = 'xul';
        }
      } else {
        console.error(`Error in getExtensionFiles() for ${extension.slug}, no manifest.json and no index.rdf found.`)
        continue;
      }
      ext_data[ext_version] = data;
    }

    // Remove properties, which are probably not needed for analysis.
    // Note: current_version is cloned into xpilib.
    const not_needed_properties = [
      "current_version",
      "categories",
      "description",
      "developer_comments",
      "homepage",
      "previews",
      "summary",
      "ratings",
      "tags",
    ];
    for (let p of not_needed_properties) {
      delete extension[p];
    }

    // Attach cmp_data and ext_data to the extension object.
    extension.xpilib = {};
    extension.xpilib.cmp_data = cmp_data; // for each esr + current the version number
    extension.xpilib.ext_data = ext_data; // ext data for each esr relevant version

    return 1;
  } catch (e) {
    console.error(`Error in getExtensionFiles() for ${extension.slug}`, e);
    return 0;
  }
}

async function getExtensions() {
  let startTime = new Date();

  debug('Requesting information about all Thunderbird extensions using ATN API v4.');
  // We need to sort by created, which is a non-changing order, users broke the pagination.
  let qs = { page: 0, app: "thunderbird", type: "extension", sort: "created" };
  let r = null;
  let extensions = [];

  do {
    qs.page++;
    debug('Requesting search page: ' + qs.page);
    r = await requestATN(null, 'search', qs);
    if (r && r.results) {
      extensions = extensions.concat(r.results);
    }
  } while ((maxNumberOfAddonPages == 0 || maxNumberOfAddonPages > qs.page) && r && r.next !== null);

  debug('Execution time for getExtensions(): ' + (new Date() - startTime) / 1000);
  debug('Total Extensions found: ' + extensions.length);
  return extensions;
}


// -----------------------------------------------------------------------------


async function main() {
  console.log("Starting...");
  let startTime = new Date();

  console.log(" => Requesting information from ATN...");
  let extensions = await getExtensions();

  console.log(" => Creating master JSON file...");
  fs.ensureDirSync(`${rootDir}`);
  await writePrettyJSONFile(extsAllLogFileName, extensions.map(e => `${e.id}-${e.guid}-${e.slug}`).sort());

  let sorted_extensions = extensions.sort((a, b) => {
    if (a.average_daily_users < b.average_daily_users) {
      return 1;
    } else if (a.average_daily_users > b.average_daily_users) {
      return -1;
    } else {
      return 0;
    }
  })


  console.log(" => Downloading XPIs and additional version Information from ATN ...");
  let total = sorted_extensions.length;
  let current = 1;
  for (let extension of sorted_extensions) {
    console.log(`    Getting files for ${extension.guid} (${current}/${total})`);
    await getExtensionFiles(extension);
    current++;
  };

  console.log(" => Updating master JSON file...");
  await writePrettyJSONFile(extsAllJsonFileName, sorted_extensions);
  console.log(" => Execution time for main(): " + (new Date() - startTime) / 1000);
}

main();
