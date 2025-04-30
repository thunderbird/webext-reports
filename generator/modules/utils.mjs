import fs from 'node:fs/promises';
import https from 'node:https';
import extract from 'extract-zip';
import bent from 'bent';

import { createWriteStream } from 'node:fs';

export const requestJson = bent('GET', 'json', 200);
export const requestText = bent('GET', 'string', 200);

// Debug logging (0 - errors and basic logs only, 1 - verbose debug)
const DEBUG_LEVEL = 0

export async function getThunderbirdVersions() {
    const {
        THUNDERBIRD_ESR,
        THUNDERBIRD_ESR_NEXT,
        LATEST_THUNDERBIRD_VERSION,
    } = await requestJson("https://product-details.mozilla.org/1.0/thunderbird_versions.json");
    
    const getVersion = (v) => v ? Number(v.split(".")[0]) : null;
    const ESR = getVersion(THUNDERBIRD_ESR);
    const NEXT_ESR = getVersion(THUNDERBIRD_ESR_NEXT);
    const RELEASE = getVersion(LATEST_THUNDERBIRD_VERSION);
    
    let SUPPORTED_VERSIONS = [68, 78, 91, 102, 115];
    if (ESR) SUPPORTED_VERSIONS.push(ESR);
    if (NEXT_ESR) SUPPORTED_VERSIONS.push(NEXT_ESR);
    if (RELEASE) SUPPORTED_VERSIONS.push(RELEASE);

    return {
        ESR,
        NEXT_ESR,
        RELEASE,
        SUPPORTED_VERSIONS
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

export function fileUnzip(source, options) {
    return extract(source, options, function (err) {
        // extraction is complete. make sure to handle the err
        console.error("Error in fileUnzip()", source, err);
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
 * @param {string} url - The URL to download.
 * @param {string} filePath - The path to write the downloaded file to.
 */
export async function downloadToFile(url, filePath) {
    let task = Promise.withResolvers();
    const file = createWriteStream(filePath);
    https
        .get(url, (response) => {
            const { statusCode, headers } = response;


            // Handle redirects (3xx)
            if (statusCode >= 300 && statusCode < 400 && headers.location) {
                response.resume(); // consume data to free up memory
                return downloadToFile(headers.location, filePath)
                    .then(task.resolve)
                    .catch(task.reject);
            }

            // Handle errors
            if (statusCode !== 200) {
                response.resume(); // consume data to free up memory
                return task.reject(new Error(`Request Failed. Status Code: ${statusCode}`));
            }

            response.pipe(file);
            file.on("finish", () => {
                file.close(() => {
                    task.resolve(filePath);
                });
            });
        })
        .on("error", (err) => {
            task.reject(err);
        });
    return task.promise;
}
