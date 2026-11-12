import fs from 'node:fs/promises';
import https from 'node:https';
import decompress from 'decompress';
import bent from 'bent';

import { createWriteStream } from 'node:fs';

export const requestJson = bent('GET', 'json', 200);
export const requestText = bent('GET', 'string', 200);

// Debug logging (0 - errors and basic logs only, 1 - verbose debug)
const DEBUG_LEVEL = 0

export function filterUniqueEntries(arr) {
    return arr.reduce((acc, item) => {
        if (!acc.includes(item)) {
            acc.push(item);
        }
        return acc;
    }, []);
}

export async function getThunderbirdVersions() {
    const {
        THUNDERBIRD_ESR,
        THUNDERBIRD_ESR_NEXT,
        LATEST_THUNDERBIRD_VERSION,
    } = await requestJson("https://product-details.mozilla.org/1.0/thunderbird_versions.json");

    let { releases } = await requestJson("https://product-details.mozilla.org/1.0/thunderbird.json")
    // ESR releases were not named "esr" between 45 and 115 (only a single 115
    // release is), they are named "esr" again since 128.
    let SUPPORTED_VERSIONS = Object.entries(releases)
        .filter(([name, value]) => name.endsWith("esr"))
        .map(([name, value]) => Number(value.version.split(".")[0]));
    // Hardcode the values in between.
    SUPPORTED_VERSIONS.push(45, 52, 60, 68, 78, 91, 102, 115);

    const getVersion = (v) => v ? Number(v.split(".")[0]) : null;
    const ESR = getVersion(THUNDERBIRD_ESR);
    const NEXT_ESR = getVersion(THUNDERBIRD_ESR_NEXT);
    const RELEASE = getVersion(LATEST_THUNDERBIRD_VERSION);

    if (ESR) SUPPORTED_VERSIONS.push(ESR);
    if (NEXT_ESR) SUPPORTED_VERSIONS.push(NEXT_ESR);
    if (RELEASE) SUPPORTED_VERSIONS.push(RELEASE);

    SUPPORTED_VERSIONS = filterUniqueEntries(SUPPORTED_VERSIONS)
        .sort((a, b) => a - b)
        .slice(-7);

    return {
        ESR,
        ESR_VERSION: THUNDERBIRD_ESR,
        NEXT_ESR,
        RELEASE,
        RELEASE_VERSION: LATEST_THUNDERBIRD_VERSION,
        SUPPORTED_VERSIONS,
    }
}

export function debug(...args) {
    if (DEBUG_LEVEL > 0) {
        console.debug(...args);
    }
}

export async function exists(path) {
    try {
        await fs.access(path, fs.constants.F_OK);
        return true;
    } catch {
        return false;
    }
}

export async function writePrettyJSONFile(f, json) {
    try {
        return await fs.writeFile(f, JSON.stringify(json, null, 4));
    } catch (err) {
        console.error("Error in writePrettyJSONFile()", f, err);
        throw err;
    }
}

export function fileUnzip(source, destination) {
    return decompress(source, destination, {
        filter: file => !file.path.endsWith('/') // Skip directory entries
      });
}

export function isCompatible(esr, min, max) {
    let mMin = parseInt(min.split(".").shift());
    let mMax = parseInt(max.split(".").shift());
    return (
        (min == "*" || mMin <= esr) &&
        (max == "*" || mMax >= esr)
    );
}

// A versioncompare, taken from https://jsfiddle.net/vanowm/p7uvtbor/
export function compareVer(a, b) {
    function prep(t) {
        return ("" + t)
            //treat non-numerical characters as lower version
            //replacing them with a negative number based on charcode of first character
            .replace(/[^0-9\.]+/g, function (c) { return "." + ((c = c.replace(/[\W_]+/, "")) ? c.toLowerCase().charCodeAt(0) - 65536 : "") + "." })
            //remove trailing "." and "0" if followed by non-numerical characters (1.0.0b);
            .replace(/(?:\.0+)*(\.-[0-9]+)(\.[0-9]+)?\.*$/g, "$1$2")
            .split('.');
    }

    if (a != "*" && b == "*") return -1;
    if (a == "*" && b != "*") return 1;
    if (a == "*" && b == "*") return 0;

    a = prep(a);
    b = prep(b);
    for (var i = 0; i < Math.max(a.length, b.length); i++) {
        //convert to integer the most efficient way
        a[i] = ~~a[i];
        b[i] = ~~b[i];
        if (a[i] > b[i])
            return 1;
        else if (a[i] < b[i])
            return -1;
    }
    return 0;
}

/**
 * Helper function to download a file.
 *
 * The first request goes to services.addons.thunderbird.net, which by-passes the
 * CDN (which may throw a 403 at us). It redirects to the file on
 * addons.thunderbird.net, which must NOT be rewritten, the file is not served
 * by services.addons.thunderbird.net (403). If that fails, the original URL is
 * tried as it is.
 *
 * @param {string} url - The URL to download.
 * @param {string} filePath - The path to write the downloaded file to.
 */
export async function downloadToFile(url, filePath) {
    const bypassUrl = url.replace("//addons.thunderbird.net/", "//services.addons.thunderbird.net/");
    try {
        return await requestToFile(bypassUrl, filePath);
    } catch (err) {
        if (bypassUrl === url) {
            throw err;
        }
        console.log(`         - Download via ${new URL(bypassUrl).host} failed (${err.message}), trying ${new URL(url).host}`);
        return await requestToFile(url, filePath);
    }
}

function requestToFile(url, filePath, redirects = 0) {
    return new Promise((resolve, reject) => {
        https
            .get(url, (response) => {
                const { statusCode, headers } = response;

                // Handle redirects (3xx), the target may be relative.
                if (statusCode >= 300 && statusCode < 400 && headers.location) {
                    response.resume(); // consume data to free up memory
                    if (redirects >= 5) {
                        return reject(new Error(`Too many redirects`));
                    }
                    return requestToFile(new URL(headers.location, url).href, filePath, redirects + 1)
                        .then(resolve)
                        .catch(reject);
                }

                // Handle errors
                if (statusCode !== 200) {
                    response.resume(); // consume data to free up memory
                    return reject(new Error(`Request Failed. Status Code: ${statusCode} (${new URL(url).host}${new URL(url).pathname.split("/").slice(0, 3).join("/")})`));
                }

                const file = createWriteStream(filePath);
                response.pipe(file);
                file.on("finish", () => {
                    file.close(() => {
                        resolve(filePath);
                    });
                });
                file.on("error", reject);
            })
            .on("error", reject);
    });
}
