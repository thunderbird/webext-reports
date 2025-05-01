Description
===========

After a fresh clone of the repository, running the Node.js script `generator/get_addon_data.js` will:

- Download relevant versions of all Add-ons hosted on [addons.thunderbird.net](https://addons.thunderbird.net) into `generator/data/downloads/`.
- Analyze the downloaded Add-ons.
- Extract and store relevant information in `generator/data/data.json`.

The downloaded Add-on files are no longer needed after processing and can be safely deleted. On subsequent runs, the script will download only new or updated Add-ons and update `data.json` accordingly.

If the `data.json` file attached to the latest [release](https://github.com/thunderbird/webext-reports/releases) is manually placed at `generator/data/data.json` before executing the script, the initial bulk download is skipped — only new or updated Add-ons will be fetched and processed.

Once the `data.json` file has been generated or copied, the Node.js script `generator/build_reports.js` can be run to generate the actual reports, which will be saved in the `docs/` directory.

Usage
=====

```
cd generator
npm install

node get_addon_data.js
node build_reports.js
```
