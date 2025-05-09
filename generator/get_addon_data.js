/**
 * This script is heavily based on the work of Christopher Leidigh:
 * https://github.com/cleidigh/ThunderKdB/blob/master/scripts/requesttb1.js
 * 
 * This script collects detailed information about add-ons available through
 * addons.thunderbird.net. It will find the compatible versions for each ESR
 * and will download its sources and extract information for later analysis.
 */

const DEBUG_FORCE_REPROCESSING = false;
const DEBUG_MAX_NUMBER_OF_ADDON_PAGES = 0;

const CHECK_ADDONS = [
  "savedsearchthemall@micz.it",
  "thunderai@micz.it",
  "thunderai-sparks@micz.it",
];

import fs from 'node:fs/promises';
import path from 'node:path';
import { parse } from 'comment-json';
import * as utils from "./modules/utils.mjs";

const rootDir = "data";
const downloadDir = 'downloads';
const extsAllJsonFileName = `${rootDir}/data.json`;
const extsAllLogFileName = `log.json`;

const { SUPPORTED_VERSIONS } = await utils.getThunderbirdVersions();

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
      await new Promise(resolve => setTimeout(resolve, 2000));
    } else {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    let killTimer;
    let killSwitch = new Promise((resolve, reject) => { killTimer = setTimeout(reject, 15000, "HardTimeout"); })
    rv = await Promise
      .race([utils.requestJson(url), killSwitch])
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

async function getExtensionFiles(extension) {
  const addon_identifier = extension.guid;
  const extRootName = `${extension.id}-${extension.slug}`;

  if (!extension.xpilib) {
    extension.xpilib = {};
  }

  // Reset found versions.
  extension.versions = [];
  // Reset version numbers for each ESR + current.
  extension.xpilib.cmp_data = {}
  // Keep processed extension data for relevant versions.
  if (!extension.xpilib.ext_data) {
    extension.xpilib.ext_data = {}
  }

  let cmp_data = extension.xpilib.cmp_data;
  let ext_data = extension.xpilib.ext_data;

  const reduceVersionData = (entry) => ({
    id: entry.id,
    compatibility: entry.compatibility.thunderbird
      ? { thunderbird: entry.compatibility.thunderbird }
      : null,
    files: entry.files.map(f => ({
      created: f.created,
      url: f.url
    })),
    version: entry.version
  });

  const foundVersions = [];

  try {
    // Get the full version history.
    let qs = { page: 0, page_size: 50 };
    let r = null;
    do {
      qs.page++;
      utils.debug('    Requesting version page: ' + qs.page);
      r = await requestATN(addon_identifier, 'versions', qs);
      if (r && r.results) {
        // Note: r.results is an array of results, not a single result
        let xpiFiles = r.results.map(reduceVersionData)
        let foundLegacyExtensions = 0;

        for (let xpiFile of xpiFiles) {
          foundVersions.push(xpiFile.version);
          extension.versions.push(xpiFile);

          if (ext_data[xpiFile.version] && !ext_data[xpiFile.version].webExtension) {
            foundLegacyExtensions++;
          }
        }

        // Check if we only found really old versions, to exit early on re-runs.
        if (foundLegacyExtensions == xpiFiles.length) {
          break;
        }
      }
    } while (r && r.next !== null);

    // Remove no longer existing versions from ext_data
    for (let version of Object.keys(ext_data)) {
      if (!foundVersions.includes(version)) {
        delete ext_data[version];
      }
    }

    // Extract compat information of supported ESR
    let esr_data = {}; // ext version data for each supported ESR
    for (let result of extension.versions) {
      if (!result.compatibility || !result.compatibility.thunderbird)
        continue;

      // Add current version (but use the data from the versions query, to avoid caching issues).
      if (result.version == extension.current_version.version) {
        esr_data.current = result;
      }

      // Update ESR comp data.
      let MIN = result.compatibility.thunderbird.min || "*";
      let MAX = result.compatibility.thunderbird.max || "*";
      for (let ESR of SUPPORTED_VERSIONS) {
        // The versions are ordered, so we take the first one of each ESR. The actual version numbers are not important.
        if (!esr_data[ESR] && utils.isCompatible(ESR, MIN, MAX)) {
          esr_data[ESR] = result;
        }
      }
    }

    // Download the XPI for each ESR
    for (let ESR of ["current"].concat(SUPPORTED_VERSIONS)) {
      // Skip, if there is no version for this ESR.
      if (!esr_data[ESR])
        continue;

      // Store the version compatible with this ESR.
      cmp_data[ESR] = esr_data[ESR].version;

      // Skip, if this version had been scanned already.
      let ext_version = esr_data[ESR].version;
      if (ext_data[ext_version]) {
        continue;
      }

      // Prepare the filenames used for downloading the XPI (use id instead
      // of version, as version could be not save for filesystem).
      const extRootDir = `${rootDir}/${downloadDir}/${extRootName}/${esr_data[ESR].id}`;
      const xpiFileURL = esr_data[ESR].files[0].url;
      // Do not use original filename, as it could be too long for the fs and truncated.
      const xpiFileName = "ext.xpi";

      // Prepare default xpi data.
      let data = {
        webExtension: false,
        legacy: false,
        experiment: false,
      };

      console.log(`     -> [${addon_identifier} (v${esr_data[ESR].version})]`);

      const MAX_RUNS = 2;
      for (let run = 1; run <= MAX_RUNS; run++) {
        let freshDownload = false;
        if (run > 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        } else {
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Skip download if it exists already.
        if (!await utils.exists(`${extRootDir}/xpi/${xpiFileName}`)) {
          console.log(`         - Downloading (${run}/${MAX_RUNS}) ${extRootDir}/xpi/${xpiFileName}`);
          freshDownload = true;
          await fs.mkdir(`${extRootDir}/xpi`, { recursive: true });
          try {
            await utils.downloadToFile(xpiFileURL, `${extRootDir}/xpi/${xpiFileName}`);
            console.log(`         - Download succeeded`);
          } catch (ex) {
            console.log(`         - Download failed`, ex);
            continue;
          }
        }

        if (await utils.exists(`${extRootDir}/src`)) {
          await fs.rm(`${extRootDir}/src`, { recursive: true, force: true });
          await fs.mkdir(`${extRootDir}/src`, { recursive: true });
        }
        
        // Extract XPI.
        try {
          console.log(`         - Unzipping ${extRootDir}/xpi/${xpiFileName}`);
          await utils.fileUnzip(path.resolve(`${extRootDir}/xpi/${xpiFileName}`), path.resolve(`${extRootDir}/src`));
          console.log(`         - Unzip succeeded`);
          break;
        } catch (ex) {
          console.log(`         - Unzip failed`, ex);
        }

        try {
          if (freshDownload) {
            console.log(`         - Removing ${extRootDir}/xpi/${xpiFileName}`);
            await fs.unlink(`${extRootDir}/xpi/${xpiFileName}`);
            console.log(`         - Removing succeeded`, ex);
          }
        } catch (ex) {
          console.log(`         - Removing failed`, ex);
        }
      }

      // Try to read the manifest.json.
      console.log(`         - Reading ${extRootDir}/src/manifest.json`);
      if (await utils.exists(`${extRootDir}/src/manifest.json`)) {
        await fs.chmod(`${extRootDir}/src/manifest.json`, 0o644);
        let manifest = await fs.readFile(`${extRootDir}/src/manifest.json`, 'utf-8');
        let manifestJson = parse(manifest.toString());

        // We have a manifest, so we consider this to be a WebExtension.
        data.webExtension = true;
        data.manifest = manifestJson;

        // Check legacy flag.
        if (manifestJson.legacy) {
          data.legacy = true;
          data.legacy_type = (typeof manifestJson.legacy.type === 'string') ? manifestJson.legacy.type : 'xul';
        }

        // Check experiments.
        if (manifestJson.experiment_apis) {
          let exp_apis = manifestJson.experiment_apis;
          data.experiment = true;
          data.experimentSchemaNames = Object.keys(exp_apis);
        }
        console.log(`         - Reading succeeded`);
      } else {
        // This is either a rdf or something really old. Ignore it.
        data.legacy_type = 'xul';
        console.log(`         - Reading failed (or a really old add-on)`);
      }
      ext_data[ext_version] = data;
    }

    return 1;
  } catch (ex) {
    console.error(`     -> Unexpected error in getExtensionFiles() for ${extension.slug}`, ex);
    return 0;
  }
}

async function getExtensions(extensions) {
  let startTime = new Date();
  let knownExtensions = new Set(Array.from(extensions.values()).map(e => e.id));

  utils.debug('Requesting information about all Thunderbird extensions using ATN API v4.');

  const reduceExtensionData = (entry) => ({
    id: entry.id,
    average_daily_users: entry.average_daily_users,
    current_version: {
      version: entry.current_version.version,
    },
    created: entry.created,
    default_locale: entry.default_locale,
    guid: entry.guid,
    icons: entry.icons,
    last_updated: entry.last_updated,
    name: entry.name,
    slug: entry.slug,
    type: entry.type,
    url: entry.url,
  });

  // We need to sort by created, which is a non-changing order, using average
  // daily users broke the pagination.
  let qs = { page: 0, app: "thunderbird", type: "extension", sort: "created" };
  let r = null;
  do {
    qs.page++;
    console.log(`    Searching for add-ons, page: ` + qs.page);
    r = await requestATN(null, 'search', qs);
    if (r && r.results) {
      for (let entry of r.results) {
        if (entry.guid == "layout@sample.extensions.thunderbird.net") {
          // This add-on is broken and cannot be retrieved via APIs.
          continue;
        }

        knownExtensions.delete(entry.id);
        let reducedEntry = reduceExtensionData(entry)
        reducedEntry.versions = [];
        reducedEntry.xpilib = { "cmp_data": {}, "ext_data": {} };


        // Merge pre-processed data from the already stored entry.
        if (!CHECK_ADDONS.includes(entry.guid)) {
          let alreadyStoredEntry = extensions.get(entry.id);
          if (alreadyStoredEntry?.xpilib) {
            reducedEntry.xpilib = alreadyStoredEntry.xpilib
          }
          if (alreadyStoredEntry?.versions) {
            reducedEntry.versions = alreadyStoredEntry.versions
          }
        }

        // This is the correct place to fix data stored in data.json.
        //let ext_data_keys = Object.keys(reducedEntry.xpilib.ext_data);
        //for (let ext_data_key of ext_data_keys) {
        //  delete reducedEntry.xpilib.ext_data[ext_data_key].atn;
        //}

        extensions.set(reducedEntry.id, reducedEntry);
      };
    }
  } while ((DEBUG_MAX_NUMBER_OF_ADDON_PAGES == 0 || DEBUG_MAX_NUMBER_OF_ADDON_PAGES > qs.page) && r && r.next !== null);

  // Remove deleted extensions.
  for (let deletedExtension of knownExtensions) {
    extensions.delete(deletedExtension);
  }

  console.log(`Execution time for getExtensions(): ${(new Date() - startTime) / 1000}`);
  console.log(`Total Extensions: ${extensions.size}`);
}

// -----------------------------------------------------------------------------

async function main() {
  console.log("Starting...");
  let startTime = new Date();

  // Read current state
  let extensions = new Map();
  await fs.mkdir(`${rootDir}`, { recursive: true });
  if (!DEBUG_FORCE_REPROCESSING && await utils.exists(extsAllJsonFileName)) {
    let data = await fs.readFile(extsAllJsonFileName, 'utf-8').then(rv => JSON.parse(rv))
    if (data.extension_data) {
      extensions = new Map(data.extension_data.map(e => [e.id, e]));
    }
  }

  console.log(" => Requesting information from ATN...");
  await getExtensions(extensions);

  console.log(" => Downloading XPIs and additional version Information from ATN ...");
  let total = extensions.size;
  let current = 1;
  for (let [id, extension] of extensions) {
    if (CHECK_ADDONS.includes(extension.guid)) {
      utils.debug(`    Processing ${extension.slug} (${current}/${total})`);
      await getExtensionFiles(extension);
      utils.debug(`    -> Done`);
    }
    current++;
  };

  console.log(" => Updating master JSON file...");
  let sorted_extension_data = Array.from(extensions.values()).sort((a, b) => {
    if (a.id < b.id) {
      return -1;
    } else if (a.id > b.id) {
      return 1;
    } else {
      return 0;
    }
  })
  await utils.writePrettyJSONFile(extsAllJsonFileName, {
    last_updated: startTime,
    extension_data: sorted_extension_data,
  });

  console.log(" => Updating extension log file ...");
  await utils.writePrettyJSONFile(extsAllLogFileName, sorted_extension_data.map(e => `${e.id}-${e.guid}-${e.slug}`).sort());

  console.log(" => Execution time for main(): " + (new Date() - startTime) / 1000);
}

main();
