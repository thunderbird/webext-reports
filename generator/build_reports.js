/**
 * This script is heavily based on the work of Christopher Leidigh:
 * https://github.com/cleidigh/ThunderKdB/blob/master/scripts/genExtensionList.js
 */

import fs from 'node:fs/promises';
import * as utils from "./modules/utils.mjs";

const rootDir = "data";
const reportDir = "../docs";
const extsAllJsonFileName = `${rootDir}/data.json`;

const {
    ESR,
    NEXT_ESR,
    RELEASE,
    ESR_VERSION,
    RELEASE_VERSION,
    SUPPORTED_VERSIONS
} = await utils.getThunderbirdVersions();

//const {fastFindInFiles} = require('fast-find-in-files');

const badge_definitions = {
    "compatible": { bRightText: 'Compatible (manually tested)', bLeftText: 'Status', bColor: 'darkgreen' },
    "alternative_available": { bRightText: 'Alternative Available', bLeftText: 'Status', bColor: 'darkgreen' },
    "pending_pr": { bRightText: 'Pending Pull Request', bLeftText: 'Status', bColor: 'darkgreen' },
    "contacted": { bRightText: 'Waiting for Feedback', bLeftText: 'Status', bColor: 'green' },
    "messages_update": { bRightText: 'Missing messagesUpdate', bLeftText: 'Status', bColor: 'green' },
    "wip": { bRightText: 'Work in progress', bLeftText: 'Status', bColor: 'gold' },
    "investigated": { bRightText: 'Ongoing Analysis', bLeftText: 'Status', bColor: 'orange' },
    "discontinued": { bRightText: 'Discontinued', bLeftText: 'Status', bColor: 'D3D3D3' },
    "unknown": { bRightText: 'Unknown', bLeftText: 'Status', bColor: 'c90016' },

    "permission": { bLeftText: 'permission', bColor: 'orange', bTooltip: "Requested Permission" },
    "theme_experiment": { bRightText: 'Theme Experiment', bLeftText: '⠀', bColor: 'blue' },
    "pure": { bRightText: 'Pure WebExtension', bLeftText: '⠀', bColor: '570861' },
    "no_limit_experiment": { bRightText: 'Limitless Experiment', bLeftText: '⠀', bColor: 'ff8800' },
    "experiment": { bRightText: 'Experiment (legacy)', bLeftText: '⠀', bColor: 'ff8800' },
    "experiment_new": { bRightText: 'New Experiment since Feb 2025', bLeftText: '⠀', bColor: 'darkred' },
    "experiment_migrated": { bRightText: 'Migrated Experiment since Feb 2025', bLeftText: '⠀', bColor: 'darkgreen' },

    "attachment_api": { bRightText: 'Attachment API Candidate', bLeftText: '⠀', bColor: 'white' },
    "recipientChanged_api": { bRightText: 'onRecipientChanged API', bLeftText: '⠀', bColor: 'white' },
    "column_api": { bRightText: 'Needs Column Support', bLeftText: '⠀', bColor: 'darkred' },
    "filter_api": { bRightText: 'Needs Custom QuickFilter Support', bLeftText: '⠀', bColor: 'darkred' },
}

const experiments_feb_2025 = [
    "986686",
    "4631",
    "711780",
    "640",
    "195275",
    "4654",
    "47144",
    "988138",
    "634298",
    "773590",
    "986325",
    "986643",
    "987716",
    "986338",
    "987840",
    "386321",
    "54035",
    "2533",
    "438634",
    "217293",
    "10052",
    "64758",
    "4970",
    "3254",
    "11005",
    "90003",
    "986685",
    "372870",
    "987783",
    "1556",
    "987908",
    "987798",
    "987934",
    "1279",
    "988090",
    "12018",
    "988096",
    "742199",
    "987900",
    "987906",
    "987931",
    "988116",
    "987888",
    "988001",
    "12802",
    "244848",
    "987885",
    "11646",
    "324497",
    "646888",
    "1898",
    "986682",
    "987740",
    "116388",
    "6533",
    "331319",
    "987775",
    "811161",
    "986692",
    "988190",
    "356507",
    "987764",
    "988091",
    "1203",
    "11727",
    "2874",
    "769143",
    "988215",
    "988195",
    "310",
    "987911",
    "987865",
    "987689",
    "2561",
    "988057",
    "988108",
    "988035",
    "986632",
    "988056",
    "987787",
    "987784",
    "987914",
    "988081",
    "988289",
    "360086",
    "987987",
    "676875",
    "3492",
    "987933",
    "407832",
    "987786",
    "987729",
    "508826",
    "161710",
    "161820",
    "987821",
    "987785",
    "988770",
    "988416",
    "49594",
    "988293",
    "988559",
    "690062",
    "988383",
    "986523",
    "988572",
    "987857",
    "986610",
    "988567",
    "844927",
    "559954",
    "988724",
    "988230",
    "988772",
    "988806",
    "988539",
    "988303",
    "745576",
    "615980",
    "534258",
    "986230",
    "987868",
    "988837",
    "987869",
    "988794",
    "987988",
    "988849",
    "988728",
    "852623",
    "987922",
    "987989",
    "988530",
    "988106",
    "987915",
    "988875",
    "988260",
    "988816",
    "988571",
    "988848",
    "988790",
    "988722",
    "988100",
    "988281",
    "988826",
    "988732",
    "988827"
]

const ignored = [
    "986223", // Thunderbird Addons Test
    "988559", // Unified Folders Debugging
    "988827", // Account check
    "986549", // layout@sample.extensions.thunderbird.net - broken DB, points to a theme
]

const discontinued = [
    "702920", //addon/thunderhtmledit/
    "219725", //addon/autoslide/
    "986572", //addon/flat-folder-tree-updated/ - broken, core does not seem to support add-on modes anymore -> API
    "987978", //addon/monterail-darkness-extended/ - uses old WL and bad colors in TB91 already
    "987660", //addon/taskviewflexlayout/
    "987928", //addon/tabsinstatusbariconsinmenubar/
    "988198", //addon/dontrestoretabsrevival/
    "988370", //addon/spacebar-clicker/
    "987665", //addon/lefttodaysubpaneorlogoorclock/
    "987945", //addon/treechildrenheight50/
    "367989", //addon/rise-of-the-tools/
    "987901", //addon/transfer-immunity/ - Uses an experiment for alert, uses dead link - https://www.transferimmunity.com/
    "988086", //addon/confirmconversionsatselecting/ - probably discontinued
    "987727", //addon/monterail-full-dark-2/ - probably discontinued
    "987726", //addon/monterail-dark-2-0-for-tb-68/ - probably discontinued
    "987796", //MessagePreview
    "902",    //addon/getsendbutton/
    "2548",   //https://github.com/thsmi/sieve/issues/893", // sieve
    "2610",   //"https://github.com/tjeb/Mailbox-Alert/issues/70", // MailBoxAlert
    "988131", // Larger Message List - Still needed after 115 density settings? sunset ?
    "987757", //TaskviewStyles
    "987863", //Eventview"
    "988000", //TaskviewGridLayout
    "987976", //FindTasksButton"
    "987779", //BrowseInTab
    "988188", //MoreLayouts
    "987979", //AttachmentCount
    "15102",  //Manually sort folders
    "988173", //Thunderkey
    "988196", //メッセージフィルターボタン
    "987925", // EML Editor
    "988214", // Filter email folders -> https://addons.thunderbird.net/en-US/thunderbird/addon/filtered-folder-to-favorite/
    "987838", // Sender Domain
    "987995", // Hide Local Folders for TB78++ 
    "988234", // tbhints (insignificant, stale)
    "988575", // Filtered Folder to Favorite (insignificant, stale)
    "988592", // Hide Duplicates From 'All Mail' (insignificant, stale)
    "988392", //Message List Preview
]

// -----------------------------------------------------------------------------
const compatible = {
    "128": [
        "988608",	//Open Google Chat
        "988166",	//googlesearchwebapp
        "988718",	//CollectAddresses
        "988167",	//todowebapp
        "987916",	//telegramwebapp
        "988171",	//msofficewebapp
        "988168",	//onedrivewebapp
        "988126",	//ResizeTbWidth
        "988170",	//skypewebapp
        "988428",	//TileNote
        "988451",	//PowerFolder
        "988431",	//RainbowMemo
        "988748",	//Check before sending email
        "988169",	//wikipediasearchwebapp
        // Experiments
        "987911",   // Spam Scores
        "47144",    // Mail Merge
        "988057",   // KeepRunning
        "407832",   // Filter Button
        "844927",   // ToggleReplied
        "988770",   // Auto Profile Picture
    ]
}

const wip = {
    "128": {
        "128": {
            "356507": "", // Header Tools Lite
            "988091": "", // Expression Search - NG
            "987740": "", // Nostalgy++/ Manage, search and archive
            "64758": "", // xnotepp
            "988185": "", // Bookmarks: eMails and XNotes
            "988100": "", // Folders for search, onDisk Status- Glo
            "6533": "https://github.com/threadvis/ThreadVis/issues/58#issuecomment-2304477952",
        }
    }
}

const pending_pr = {
    "128": {
        "327780": "https://github.com/vanowm/TB-Auto-Select-Latest-Message/pull/6", //Auto Select Latest Message
        "988715": "https://github.com/JohannesBuchner/thunderbird-ai-grammar-mailextension/pull/4", //AI Grammar
        "988698": "https://github.com/2AStudios/tb-export2csv/pull/3", //tb-export2csv 
        //"711780" : "https://github.com/TB-throwback/LookOut-fix-version/pull/119", //Lookout Fixed 
        "711456": "https://drive.google.com/file/d/1PpJO6UjudJF6F_V922-ul1wMphrDBOn3/view?usp=sharing", // TexTra
        "987900": "https://github.com/mlazdans/qnote/pull/55", // QNote
        //"742199" : "https://github.com/mganss/AttachFromClipboard/pull/16", // Attach from Clipboard
        //"11727"  : "https://github.com/isshiki/ReFwdFormatter/pull/7", // ReFwdFormatter
        "987865": "https://github.com/alkatrazstudio/prev-colors/pull/3", // Previous Colors
        "360086": "https://drive.google.com/file/d/1QScEmQ-RfzdVeWux6O-GrBmTJpRNyytQ/view?usp=sharing", // Toggle Headers
        //"987911" : "https://github.com/friedPotat0/Spam-Scores/pull/63", // Spam Scores
        // messagesUpdate
        "287743": "https://github.com/MailHops/mailhops-plugin/pull/40", // MailHops
        "987984": "https://github.com/justreportit/thunderbird/pull/69", // Just Report It
        "988314": "https://github.com/thirdinsight/AutoMarkFolderRead/pull/9", // Auto-Mark Folder Read
        "988532": "https://github.com/xot/tagger/pull/4", // Tagger
        "987823": "https://github.com/a-tak/auto-bucket/pull/170", // AutoBucket
        "988069": "https://github.com/KenichiTanino/spam_header_checker_for_ocn/pull/1", // SPAM Check for OCN
        "988260": "https://github.com/peterfab9845/original-to-column/pull/2", // X-Original-To Column
        // TB128 updates
        "988096": "https://github.com/thestonehead/ThunderbirdAttachmentExtractor/pull/26", // Attachment Extractor
        "1279": "https://github.com/theodore-tegos/xpunge-tb/pull/1", // XPurge
        "988001": "https://github.com/opto/Imageview/issues/6", // Attachment Viewer: view in a tab, slid
        "1898": "https://github.com/voccs/folderflags/pull/17", // Folder Flags
        "988035": "https://gitlab.com/jfx2006/markdown-here-revival/-/merge_requests/4", //Markdown Here Revival
        "988228": "https://github.com/CamielBouchier/cb_thunderlink/pull/68", // Thunderlink
        "987986": "https://drive.google.com/file/d/10oRqrKDzSRBmNXa3WMtPJm9jJdZPyfW9/view?usp=sharing", // Select Prev on Delete
        "988230": "https://drive.google.com/file/d/1-2mMbzEkmyrACNG87gvZvP2gLuC85VnG/view?usp=sharing", // MetaClean for Thunderbird
        "559954": "https://github.com/ganast/tidybird/pull/113", // TidyBird
        "988416": "https://github.com/aramir/QuickFilterBy/pull/6", // QuickFilterBy
        "986230": "https://github.com/peci1/mailing-list-filter/pull/1", // Mailing list filter
        "161820": "https://github.com/tomaszkrajewski/tb-alertswitch/pull/1", // Alert Switch
        "988376": "https://github.com/kgraefe/thunderbird-pgp-universal/pull/3", // PGP Universal
    }
}

const contacted = {
    "128": {
        // Enforced lifts
        "988389": "Works! Enforced max version lift since 102", // Thunderbird OpenProject
        "988258": "Works! Enforced max version lift since 102", // Recently
        "988427": "Works! Enforced max version lift since 102", // EnhancedReplyHeaders - can use more new APIs and could be a top spot candidate
        "331666": "Works! Enforced max version lift since 128", // QuickArchiver
        "988561": "Works! Enforced max version lift since 128", // Freecosys - Провайдер FileLink
        // Candidates for enforced lifts
        "988146": "Works, needs max version lift", // smartCompose
        // Update instructions
        "987821": "https://github.com/HiraokaHyperTools/OpenAttachmentByExtension/issues/11",
        "988108": "https://addons.thunderbird.net/en-US/reviewers/review/openpgp-alias-updater",
        "508826": "https://addons.thunderbird.net/en-US/reviewers/review/eds-calendar-integration",
        "988303": "https://addons.thunderbird.net/en-US/reviewers/review/tud-cert-phishing-report",
        "988686": "https://addons.thunderbird.net/en-US/reviewers/review/multimonth-view",
        // Beta
        "986338": "https://github.com/jobisoft/EAS-4-TbSync/issues/267#issuecomment-2297181031", // Provider for Exchange ActiveSync"

    }
}

const investigated = {
    "128": {
        "4454": "", // Priority Switcher
        "988411": "", // Thunvatar
        "988323": "", // Real sender of italian PEC
        "986323": "https://github.com/caligraf/ConfirmBeforeDelete/issues/25",
        "49594": "https://github.com/tomaszkrajewski/tb-subswitch/issues/7",
    }
}

// -----------------------------------------------------------------------------

const messagesUpdate = [
    "217293", // signal-spam
    "287743", // mailhops
    "320395", // remindit
    "46207", // mailmindr
    "4970", // tag-toolbar
    "566490", // expertspam
    "704523", // europeanmx
    "986632", // spambee
    "987823", // autobucket
    "987834", // spoofdetection
    "987907", // mark-gmail-read\2478313\src\background.js
    "987984", // just-report-it\2476824\src\scripts\background.js
    "988024", // open-in-browser\2477587\src\background.js
    "988069", // spam-check-for-ocn\2475472\src\background.js
    "988252", // reply-to-all-selected-mail\2482250\src\background.js
    "988314", // auto-mark-folder-read\2477943\src\js\background.js
    "988371", // replymarksread\2477988\src\src\replymarksread.js
    "988439", // remindme\2478544\src\scripts\background.js
    "988447", // gmail-labels\2478584\src\src\background.js
    "988463", // grapevine\2478656\src\lib\AutoArchiver.js
    "988476", // if-this-then-connector\2478751\src\if-background.js
    "988532", // tagger\2479956\src\background.js
    "988566", // mark-read-on-tab-open\2482102\src\src\opentabmarksread.js
    "988677", // sync-for-tb\2485183\src\sy-background.js
    "988752", // mark-subfolders-read\2487282\src\background.js
    "988356", // auto-mark-as-read\2486030\src\options.js
    "988510", // vault56 protection
    "987689", // changequote
    // Experiments NOT notified, waiting for PR
    //986323 confirmbeforedelete
    //987900 qnote\2480264\src\scripts\utils-message.js
    //988173 thunderkey\2476427\src\src\background.js
    // UUps
    //987858 mark-all-read-we -- uuups folders.markAsRead should need messagesUpdate instead of accountsFolders
]

// Keep to inform users about WebExt API
const columnAPI = [
    "987911", //addon/spam-scores/
    "987915", //addon/mahour-iranian-date/ 
    "195275", //addon/send-later-3/
    "690062", //Sender Frequency
    "4454",   //Priority Switcher
    "988260", //X-Original-To Column
    "988323", //Real sender of italian PEC
    "988411", //Thunvatar
    "372603", //Enhanced Priority Display
    "676875", //Rspamd-spamness
    "54035",  //Thunderbird Conversations
    "987900", //QNote
    "331666", //QuickArchiver
]

const filterAPI = [
    "634298", // CardBook
    "987900", // QNote
]

const recentFoldersAPI = [
    "559954", // TidyBird
]

const attachmentAPI = [
    "988376", //PGP Universal
    "711780", //Lookout Fixed
]

const recipientChangedAPI = [
    "988146", //smartCompose
    "116388", //Automatic Dictionary
]

const statusBarAPI = [
    "988115", //addon/clippings-tb/
    "986692", //addon/profile-switcher/
]

// -----------------------------------------------------------------------------

var gAlternativeData;
var groups = [];

// Add groups for imprtant versions first.
for (let version of [...SUPPORTED_VERSIONS].sort((a, b) => b - a)) {
    if (RELEASE == version) {
        groups.push({
            id: `release`,
            header: `Thunderbird ${version} (monthly release) reports`
        });
    } else if (NEXT_ESR == version) {
        groups.push({
            id: `${version}`,
            header: `Thunderbird ${version} (next ESR) reports`
        });
    } else if (ESR == version) {
        groups.push({
            id: `${version}`,
            header: `Thunderbird ${version} (current ESR) reports`
        });
    }
}

// Add general group.
groups.push({
    id: "general",
    header: "General reports"
})

// Add groups for other supported versions.
for (let version of [...SUPPORTED_VERSIONS].sort((a, b) => b - a)) {
    if ([RELEASE, NEXT_ESR, ESR].includes(version)) {
        continue;
    }
    groups.push({
        id: `${version}`,
        header: `Thunderbird ${version} (ESR) reports`
    });
}

// Add general reports
var reports = [
    {
        id: "all",
        group: "general",
        json: true,
        header: `All Extensions compatible with TB${SUPPORTED_VERSIONS.at(0)} or newer.`,
        template: "templates/report-template.html",
        enabled: true,
        generate: genStandardReport,
        rowData: function (extJson) {
            let data = getAllData(extJson);
            return { include: !!Object.values(data).find(version => version.version) };
        },
    },

    {
        id: "unsafe-eval",
        group: "general",
        header: "Extensions using unsafe-eval CSP, which is not permitted on ATN.",
        template: "templates/report-template.html",
        enabled: true,
        generate: genStandardReport,
        rowData: function (extJson) {
            let current_ext_data = getExtData(extJson, `current`).ext_data;
            if (!current_ext_data)
                return { include: false }

            let include = /['"]unsafe-eval['"]/.test(JSON.stringify(current_ext_data.manifest));

            return { include }
        }
    },
    {
        id: "wrong-order",
        group: "general",
        header: "Extension with wrong upper limit setting in older versions, which will lead to the wrong version reported compatible by ATN.",
        template: "templates/report-template.html",
        enabled: true,
        generate: genStandardReport,
        rowData: function (extJson) {
            let data = Object.values(getAllData(extJson)).map(e => e.version);
            for (let idx1 = 0; idx1 < data.length - 1; idx1++) {
                if (!data[idx1]) continue;

                for (let idx2 = idx1 + 1; idx2 < data.length; idx2++) {
                    if (!data[idx2]) continue;
                    if (utils.compareVer(data[idx1], data[idx2]) > 0) {
                        return { include: true }
                    }
                }
            }

            /* Old static code for reference:

            let v115 = getExtData(extJson, "115").version;
            let v102 = getExtData(extJson, "102").version;
            let v91 = getExtData(extJson, "91").version;
            let v78 = getExtData(extJson, "78").version;
            let v68 = getExtData(extJson, "68").version;
            let v60 = getExtData(extJson, "60").version;

            if (v60 && v68 && utils.compareVer(v60, v68) > 0) return { include: true };
            if (v60 && v78 && utils.compareVer(v60, v78) > 0) return { include: true };
            if (v60 && v91 && utils.compareVer(v60, v91) > 0) return { include: true };
            if (v60 && v102 && utils.compareVer(v60, v102) > 0) return { include: true };
            if (v60 && v115 && utils.compareVer(v60, v115) > 0) return { include: true };

            if (v68 && v78 && utils.compareVer(v68, v78) > 0) return { include: true };
            if (v68 && v91 && utils.compareVer(v68, v91) > 0) return { include: true };
            if (v68 && v102 && utils.compareVer(v68, v102) > 0) return { include: true };
            if (v68 && v115 && utils.compareVer(v68, v115) > 0) return { include: true };

            if (v78 && v91 && utils.compareVer(v78, v91) > 0) return { include: true };
            if (v78 && v102 && utils.compareVer(v78, v102) > 0) return { include: true };
            if (v78 && v115 && utils.compareVer(v78, v115) > 0) return { include: true };

            if (v91 && v102 && utils.compareVer(v91, v102) > 0) return { include: true };
            if (v91 && v115 && utils.compareVer(v91, v115) > 0) return { include: true };

            if (v102 && v115 && utils.compareVer(v102, v115) > 0) return { include: true };
            */

            return { include: false };
        },
    },
    {
        id: "latest-current-mismatch",
        group: "general",
        header: "Extensions, where the latest upload is for an older release, which will fail to install in current ESR (current = defined current in ATN) from within the add-on manager.",
        template: "templates/report-template.html",
        enabled: true,
        generate: genStandardReport,
        rowData: function (extJson) {
            let data = Object.entries(getAllData(extJson));
            let sorted = data.sort(([a], [b]) => parseInt(a) - parseInt(b));
            let vHighest = sorted.map(([v, d]) => d).filter(d => d.version).pop();
            let vCurrent = getExtData(extJson, "current");

            let include = !reports.find(r => r.id == "wrong-order").rowData(extJson).include && !!vHighest && vHighest.version != vCurrent.version;

            return { include };
        },
    },
    {
        id: "parsing-error",
        group: "general",
        header: "Extensions whose XPI files could not be parsed properly and are excluded from analysis.",
        template: "templates/report-template.html",
        enabled: true,
        generate: genStandardReport,
        rowData: function (extJson) {
            let current_ext_data = getExtData(extJson, "current").ext_data;
            return { include: !current_ext_data };
        }
    },
    {
        id: "recent-activity",
        group: "general",
        header: "Extensions updated within the last 2 weeks.",
        template: "templates/report-template.html",
        enabled: true,
        generate: genStandardReport,
        rowData: function (extJson) {
            let { atn_data } = getExtData(extJson, "current");
            if (atn_data) {
                let c = atn_data.files[0].created;
                let cv = new Date(c);
                let today = new Date();
                const msDay = 24 * 60 * 60 * 1000;
                let d = (today - cv) / msDay;
                return { include: (d <= 14) };
            }
            return { include: false };
        }
    },
    {
        id: "recent-addition",
        group: "general",
        header: "Extensions created within the last year.",
        template: "templates/report-template.html",
        enabled: true,
        generate: genStandardReport,
        rowData: function (extJson) {
            let current_ext_data = getExtData(extJson, "current").ext_data;
            if (current_ext_data) {
                let c = extJson.created;
                let cv = new Date(c);
                let today = new Date();
                const msDay = 24 * 60 * 60 * 1000;
                let d = (today - cv) / msDay;
                return { include: (d <= 365) };
            }
            return { include: false };
        }
    },
    {
        id: "requested-permissions",
        group: "general",
        header: "Extensions requesting WebExtension permissions.",
        template: "templates/report-template.html",
        enabled: true,
        generate: genStandardReport,
        rowData: function (extJson) {
            let { ext_data: current_ext_data } = getExtData(extJson, "current");
            let badges = [];

            let permissions = current_ext_data?.manifest?.permissions;
            if (Array.isArray(permissions)) {
                for (let permission of permissions) {
                    // We do not see each individual contentScript definition
                    if (permission.includes(":/") || permission == "<all_urls>") {
                        if (badges.filter(e => e.badge == "permission.contentScript").length == 0) {
                            badges.push({ badge: `permission.contentScript` });
                        }
                    } else {
                        badges.push({ badge: `permission.${permission}` });
                    }
                }
            }

            let manifest = current_ext_data?.manifest;
            const keys = ["compose_action", "browser_action", "message_display_action", "cloud_file", "commands"];
            if (manifest) {
                for (let key of keys)
                    if (manifest[key])
                        badges.push({ badge: `permission.${key}` });
            }

            return {
                include: !!permissions,
                badges
            };
        },
    },
    {
        id: "max-atn-value-raised-above-max-xpi-value",
        group: "general",
        header: "Extensions whose max version has been raised in ATN above the XPI value.",
        template: "templates/report-template.html",
        enabled: true,
        generate: genStandardReport,
        rowData: function (extJson) {
            let {
                ext_data: current_ext_data,
                atn_data: current_atn_data,
            } = getExtData(extJson, "current")

            if (!current_ext_data || !current_atn_data)
                return { include: false };

            let atn_max = current_atn_data.compatibility?.thunderbird?.max || "*";
            let strict_max = current_ext_data.manifest?.applications?.gecko?.strict_max_version ||
                current_ext_data.manifest?.browser_specific_settings?.gecko?.strict_max_version ||
                "*";

            let include = current_ext_data.webExtension && !current_ext_data.legacy && (utils.compareVer(strict_max, atn_max) < 0);
            let badges = [];
            if (discontinued.includes(`${extJson.id}`)) {
                badges.push({ badge: "discontinued" });
            }
            if (current_ext_data.experiment) {
                badges.push({ badge: "experiment" });
            }
            return { include, badges };
        }
    },
    {
        id: "max-atn-value-reduced-below-max-xpi-value",
        group: "general",
        header: "Extensions whose max version has been reduced in ATN below the XPI value, which is ignored during install and app upgrade (excluding legacy).",
        template: "templates/report-template.html",
        enabled: true,
        generate: genStandardReport,
        rowData: function (extJson) {
            let {
                ext_data: current_ext_data,
                atn_data: current_atn_data,
            } = getExtData(extJson, "current")

            if (!current_ext_data || !current_atn_data)
                return { include: false };

            let atn_max = current_atn_data.compatibility?.thunderbird?.max || "*";
            let strict_max = current_ext_data.manifest?.applications?.gecko?.strict_max_version ||
                current_ext_data.manifest?.browser_specific_settings?.gecko?.strict_max_version ||
                "*";

            let include = current_ext_data.webExtension && !current_ext_data.legacy && (utils.compareVer(strict_max, atn_max) > 0);
            let badges = [];
            if (discontinued.includes(`${extJson.id}`)) {
                badges.push({ badge: "discontinued" });
            }
            let themeExperiment = current_ext_data.manifest?.theme_experiment;
            if (themeExperiment) {
                badges.push({ badge: "theme_experiment" });
            }
            if (!current_ext_data.legacy && current_ext_data.webExtension && !current_ext_data.experiment && !themeExperiment) {
                badges.push({ badge: "pure" });
            }

            if (filterAPI.includes(`${extJson.id}`)) {
                badges.push({ badge: "filter_api" });
            }

            return { include, badges };
        }
    },
    {
        id: "pure-webext-with-upper-limit",
        group: "general",
        header: "Pure WebExtensions with an unnecessary max_version_setting (excluding theme_experiments).",
        template: "templates/report-template.html",
        enabled: true,
        generate: genStandardReport,
        rowData: function (extJson) {
            let {
                ext_data: current_ext_data,
                atn_data: current_atn_data,
            } = getExtData(extJson, "current");

            if (!current_ext_data || !current_atn_data)
                return { include: false };

            let themeExperiment = current_ext_data.manifest?.theme_experiment;
            let atn_max = current_atn_data.compatibility?.thunderbird?.max || "*";
            let strict_max = current_ext_data.manifest?.applications?.gecko?.strict_max_version ||
                current_ext_data.manifest?.browser_specific_settings?.gecko?.strict_max_version ||
                "*";

            let include = !themeExperiment &&
                !current_ext_data.legacy &&
                current_ext_data.webExtension &&
                !current_ext_data.experiment &&
                (strict_max != "*" || atn_max != "*");

            let badges = [];
            if (discontinued.includes(`${extJson.id}`)) {
                badges.push({ badge: "discontinued" });
            }
            return { include, badges };
        }
    },
    {
        id: "experiment-status",
        group: "general",
        header: "Extensions with added or removed Experiments.",
        template: "templates/report-template.html",
        enabled: true,
        generate: genStandardReport,
        rowData: function (extJson) {
            let release_ext_data = getExtData(extJson, `${RELEASE}`).ext_data;
            if (!release_ext_data)
                return { include: false }

            let badges = [];
            let include = false;
            let isExperiment = release_ext_data.experiment;

            if (isExperiment) {
                badges.push({ badge: "experiment" });
            }
            if (!isExperiment && experiments_feb_2025.includes(`${extJson.id}`)) {
                badges.push({ badge: "experiment_migrated" });
                include = true;
            }
            if (isExperiment && !experiments_feb_2025.includes(`${extJson.id}`)) {
                badges.push({ badge: "experiment_new" });
                include = true;
            }

            return { include, badges }
        }
    },
]

// Add version specific reports.
for (let version of [...SUPPORTED_VERSIONS].sort((a, b) => b - a)) {
    let group = version == RELEASE ? "release" : `${version}`
    let groupName = version == RELEASE ? "release" : `tb${version}`

    reports.push({
        id: `atn-${groupName}`,
        group,
        header: `Extensions compatible with Thunderbird ${version} as seen by ATN.`,
        template: "templates/report-template.html",
        enabled: true,
        generate: genStandardReport,
        rowData: function (extJson) {
            let this_ext_data = getExtData(extJson, `${version}`).ext_data;
            let current_ext_data = getExtData(extJson, `current`).ext_data;

            let include = !!this_ext_data;
            let badges = [];

            if (include) {
                let themeExperiment = this_ext_data.manifest?.theme_experiment;
                if (themeExperiment) {
                    badges.push({ badge: "theme_experiment" });
                }
                if (!this_ext_data.legacy && this_ext_data.webExtension && !this_ext_data.experiment && !themeExperiment) {
                    badges.push({ badge: "pure" });
                }

                // For ESR and NEXT_ESR we calculate the number of experiments based on
                // the current version.
                let isExperiment = current_ext_data && [ESR, NEXT_ESR].includes(version)
                    ? current_ext_data.experiment
                    : this_ext_data.experiment;
                if (isExperiment) {
                    badges.push({ badge: "experiment" });
                }

                if (!isExperiment && experiments_feb_2025.includes(`${extJson.id}`)) {
                    badges.push({ badge: "experiment_migrated" });
                }
                if (isExperiment && !experiments_feb_2025.includes(`${extJson.id}`)) {
                    badges.push({ badge: "experiment_new" });
                }
                if (filterAPI.includes(`${extJson.id}`)) {
                    badges.push({ badge: "filter_api" });
                }
                if (attachmentAPI.includes(`${extJson.id}`)) {
                    badges.push({ badge: "attachment_api" });
                }
                if (recipientChangedAPI.includes(`${extJson.id}`)) {
                    badges.push({ badge: "recipientChanged_api" });
                }
            };

            return { include, badges }
        }
    });

    let idx = SUPPORTED_VERSIONS.indexOf(version);
    if (idx > 0) {
        reports.push({
            id: `lost-tb${SUPPORTED_VERSIONS[idx - 1]}-to-${groupName}`,
            group,
            header: `Extensions which have been lost from TB${SUPPORTED_VERSIONS[idx - 1]} to TB${version}, as seen by ATN.`,
            template: "templates/report-template.html",
            enabled: true,
            generate: genStandardReport,
            rowData: function (extJson) {
                let {
                    version: this_version
                } = getExtData(extJson, `${version}`);
                let {
                    version: last_version,
                    ext_data: last_ext_data
                } = getExtData(extJson, `${SUPPORTED_VERSIONS[idx - 1]}`);

                if (!last_ext_data)
                    return { include: false }

                let badges = [];
                if (compatible[`${version}`]?.includes(`${extJson.id}`)) {
                    badges.push({ badge: "compatible" });
                }
                if (pending_pr[`${version}`] && Object.keys(pending_pr[`${version}`]).includes(`${extJson.id}`)) {
                    badges.push({ badge: "pending_pr", link: pending_pr[`${version}`][extJson.id] });
                }
                if (wip[`${version}`] && Object.keys(wip[`${version}`]).includes(`${extJson.id}`)) {
                    badges.push({ badge: "wip", link: wip[`${version}`][extJson.id] });
                }
                if (investigated[`${version}`] && Object.keys(investigated[`${version}`]).includes(`${extJson.id}`)) {
                    let payload = investigated[`${version}`][`${extJson.id}`];
                    let badge = { badge: "investigated", tooltip: payload }
                    if (payload.startsWith("http")) {
                        badge.link = payload;
                    }
                    badges.push(badge);
                }
                if (contacted[`${version}`] && Object.keys(contacted[`${version}`]).includes(`${extJson.id}`)) {
                    badges.push({ badge: "contacted", tooltip: contacted[`${version}`][`${extJson.id}`] });
                }

                let themeExperiment = last_ext_data.manifest?.theme_experiment;
                if (themeExperiment) {
                    badges.push({ badge: "theme_experiment" });
                }
                if (!last_ext_data.legacy && last_ext_data.webExtension && !last_ext_data.experiment && !themeExperiment) {
                    badges.push({ badge: "pure" });
                }
                if (last_ext_data.experiment) {
                    badges.push({ badge: "experiment" });
                }

                return { include: !!last_version && !this_version, badges };

            }
        });
    }

    if ([ESR, NEXT_ESR, RELEASE].includes(version)) {
        reports.push({
            id: `valid-${group}-according-to-strict-max-but-atn-value-reduced`,
            group,
            header: `Extensions whose strict_max_version allows installation in Thunderbird ${version}, but ATN value has been lowered to signal incompatibility (which is ignored during install and app upgrade).`,
            template: "templates/report-template.html",
            enabled: true,
            generate: genStandardReport,
            rowData: function (extJson) {
                let {
                    ext_data: current_ext_data,
                    atn_data: current_atn_data,
                } = getExtData(extJson, "current");

                if (!current_ext_data || !current_atn_data)
                    return { include: false };

                let atn_max = current_atn_data.compatibility?.thunderbird?.max || "*";
                let strict_max = current_ext_data.manifest?.applications?.gecko?.strict_max_version ||
                    current_ext_data.manifest?.browser_specific_settings?.gecko?.strict_max_version ||
                    "*";

                let baseReport = reports.find(r => r.id == "max-atn-value-reduced-below-max-xpi-value").rowData(extJson);
                let badges = [];
                let manually_lowered = baseReport.include &&
                    utils.compareVer(strict_max, version) > 0 &&
                    utils.compareVer(atn_max, `${version}.*`) < 0;


                let themeExperiment = current_ext_data.manifest?.theme_experiment;
                if (themeExperiment) {
                    badges.push({ badge: "theme_experiment" });
                }
                if (!current_ext_data.legacy && current_ext_data.webExtension && !current_ext_data.experiment && !themeExperiment) {
                    badges.push({ badge: "pure" });
                }
                if (discontinued.includes(`${extJson.id}`)) {
                    badges.push({ badge: "discontinued" });
                }

                if (compatible[`${version}`]?.includes(`${extJson.id}`)) {
                    badges.push({ badge: "compatible" });
                }
                if (pending_pr[`${version}`] && Object.keys(pending_pr[`${version}`]).includes(`${extJson.id}`)) {
                    badges.push({ badge: "pending_pr", link: pending_pr[`${version}`][extJson.id] });
                }
                if (investigated[`${version}`] && Object.keys(investigated[`${version}`]).includes(`${extJson.id}`)) {
                    let payload = investigated[`${version}`][`${extJson.id}`];
                    let badge = { badge: "investigated", tooltip: payload }
                    if (payload.startsWith("http")) {
                        badge.link = payload;
                    }
                    badges.push(badge);
                }
                if (contacted[`${version}`] && Object.keys(contacted[`${version}`]).includes(`${extJson.id}`)) {
                    badges.push({ badge: "contacted", tooltip: contacted[`${version}`][`${extJson.id}`] });
                }

                if (messagesUpdate.includes(`${extJson.id}`)) {
                    badges.push({ badge: "messages_update", tooltip: "Missing messagesUpdate permission" });
                }

                return { include: manually_lowered, badges };
            }
        });
        reports.push({
            id: `experiments-${group}-without-upper-limit`,
            group,
            header: `Experiments without upper limit in ATN for which can be installed in Thunderbird ${version}.`,
            template: "templates/report-template.html",
            enabled: true,
            generate: genStandardReport,
            rowData: function (extJson) {
                let {
                    ext_data: current_ext_data,
                    atn_data: current_atn_data,
                } = getExtData(extJson, "current");

                if (!current_ext_data || !current_atn_data)
                    return { include: false };

                let atn_max = current_atn_data.compatibility?.thunderbird?.max || "*";
                let atn_min = current_atn_data.compatibility?.thunderbird?.min || "*";
                let include = !!current_ext_data && current_ext_data.webExtension && current_ext_data.experiment && atn_max == "*";
                let badges = [];

                if (discontinued.includes(`${extJson.id}`)) {
                    badges.push({ badge: "discontinued" });
                }

                if (compatible[`${version}`]?.includes(`${extJson.id}`)) {
                    badges.push({ badge: "compatible" });
                }

                return { include, badges };
            }
        });
        reports.push({
            id: `lost-${group}-pure-webext-with-upper-limit`,
            group,
            header: `Lost pure WebExtensions for Thunderbird ${version} with an unnecessary max_version_setting (excluding theme_experiments).`,
            template: "templates/report-template.html",
            enabled: true,
            generate: genStandardReport,
            rowData: function (extJson) {
                let current_ext_data = getExtData(extJson, `current`).ext_data;
                let this_ext_data = getExtData(extJson, `${SUPPORTED_VERSIONS[idx]}`).ext_data;
                let last_ext_data = getExtData(extJson, `${SUPPORTED_VERSIONS[idx - 1]}`).ext_data;
                if (!last_ext_data || !current_ext_data)
                    return { include: false };

                let themeExperiment = this_ext_data?.manifest?.theme_experiment;
                let include =
                    !discontinued.includes(`${extJson.id}`) &&
                    !this_ext_data &&
                    !themeExperiment &&
                    !current_ext_data.legacy &&
                    !current_ext_data.experiment &&
                    current_ext_data.webExtension;

                let badges = [];
                if (compatible[`${version}`]?.includes(`${extJson.id}`)) {
                    badges.push({ badge: "compatible" });
                }
                if (pending_pr[`${version}`] && Object.keys(pending_pr[`${version}`]).includes(`${extJson.id}`)) {
                    badges.push({ badge: "pending_pr", link: pending_pr[`${version}`][extJson.id] });
                }
                if (wip[`${version}`] && Object.keys(wip[`${version}`]).includes(`${extJson.id}`)) {
                    badges.push({ badge: "wip", link: wip[`${version}`][extJson.id] });
                }
                if (investigated[`${version}`] && Object.keys(investigated[`${version}`]).includes(`${extJson.id}`)) {
                    let payload = investigated[`${version}`][`${extJson.id}`];
                    let badge = { badge: "investigated", tooltip: payload }
                    if (payload.startsWith("http")) {
                        badge.link = payload;
                    }
                    badges.push(badge);
                }
                if (contacted[`${version}`] && Object.keys(contacted[`${version}`]).includes(`${extJson.id}`)) {
                    badges.push({ badge: "contacted", tooltip: contacted[`${version}`][`${extJson.id}`] });
                }

                if (messagesUpdate.includes(`${extJson.id}`)) {
                    badges.push({ badge: "messages_update", tooltip: "Missing messagesUpdate permission" });
                }

                return { include, badges };
            }
        });
    }
}

/*"missing-messagesUpdate-permission": {
        group: "128",
        header: "Extensions using <i>messages.update()</i> or <i>folders.markAsRead()</i>in Thunderbird 128, without requesting the <i>messagesUpdate</i> permission.",
        template: "templates/report-template.html",
        enabled: true,
        generate: genStandardReport,
        rowData: function (extJson) {
            let data = getExtData(extJson, "128").ext_data;
            if (!data) {
                return { include: false };
            }
            
            let permissions = data?.manifest?.permissions;
            let messagesUpdate = Array.isArray(permissions) &&  permissions.includes("messagesUpdate")
            let badges = [];
            let include = false;

            // update a message
            if (data && !messagesUpdate) {
                const result = fastFindInFiles({ 
                    directory: `${data.localExtensionDir}/src`, 
                    needle: ".messages.update"
                })
                const lines = result.length && result.flatMap(r => r.queryHits.map(h => h.link)).join("\n")

                if (lines) {
                    include = true;
                    badges.push({ badge: "messages_update", tooltip: "browser.messages.update()" })
                }
            }
            // update a folder
            if (data && !messagesUpdate) {
                const result = fastFindInFiles({ 
                    directory: `${data.localExtensionDir}/src`, 
                    needle: ".folders.markAsRead"
                })
                const lines = result.length && result.flatMap(r => r.queryHits.map(h => h.link)).join("\n")

                if (lines) {
                    include = true;
                    badges.push({ badge: "messages_update", tooltip: "browser.folders.markAsRead()" })
                }
            }

            return { include, badges };
        },
    },*/
/*"mail-folder-picker": {
    group: "general",
    header: "Extensions which use a mail folder picker",
    template: "templates/report-template.html",
    enabled: true,
    generate: genStandardReport,
    rowData: function (extJson) {
        let mfp = [
            6533, // threadvis
            988356, // Auto Mark as read
            988087, // Message Mover
            12018, // Quick Folder Move
            46207, // mailmindr
        ]
        if (mfp.includes(extJson.id)) {
            return { include: true };
        }

        let data = getExtData(extJson, "102").ext_data;
        if (data) {
            const result = fastFindInFiles({ 
                directory: `${data.localExtensionDir}/src`, 
                needle: `folder-menupopup`
            })
            if (result.length > 0) {
                return { include: true };
            }
        }

        return { include: false };
    },
},*/

// -----------------------------------------------------------------------------

async function genStandardReport(extsJson, name, report) {
    let extsListFile = await fs.readFile(report.template, 'utf8');
    let rows = [];
    let stats = [];
    let json = {
        generated: Date.now(),
        addons: []
    };

    function genStandardRow(extJson, rowData) {
        let default_locale = extJson.default_locale;
        if (default_locale === undefined) {
            if (typeof extJson.name["en-US"] === 'string') {
                default_locale = "en-US";
            } else {
                let locales = Object.keys(extJson.name);
                default_locale = extJson.name[locales[0]];
            }
        } else {
            if (typeof extJson.name["en-US"] !== 'string') {
                let locales = Object.keys(extJson.name);
                default_locale = locales[0];
            }
        }

        const idSlug = `${extJson.id}-${extJson.slug}`;
        const name_link = `<a id="${idSlug}" href="${extJson.url}">${extJson.name[default_locale].substr(0, 38)}</a>`;

        let {
            ext_data: current_ext_data,
            atn_data: current_atn_data,
        } = getExtData(extJson, "current");

        if (!current_ext_data || !current_atn_data)
            return { include: false };

        let rank = extJson.xpilib.rank;
        let v_min = current_atn_data?.compatibility.thunderbird.min || "*";
        let v_max = current_atn_data?.compatibility.thunderbird.max || "*";
        let v_strict_max = current_ext_data?.manifest?.applications?.gecko?.strict_max_version ||
            current_ext_data?.manifest?.browser_specific_settings?.gecko?.strict_max_version ||
            "*";

        // Helper function to return the version cell for a given version
        const cv = (v) => {
            let rv = [];
            let { version, ext_data } = getExtData(extJson, v);

            if (version) {
                rv.push(version);
            }

            if (ext_data) {
                let cBadge_type_setup = { bLeftText: 'T', bRightText: 'MX', bColor: 'purple', bTooltip: "Extension Type:" };
                let cBadge_legacy_setup = { bLeftText: 'L', bRightText: '+', bColor: 'green', bTooltip: "Legacy Type:" };
                let cBadge_experiment_setup = { bLeftText: 'E', bRightText: '+', bColor: 'blue', bTooltip: "Experiment APIs: " };

                if (ext_data.webExtension == true && ext_data.legacy == false) {
                    cBadge_type_setup.bRightText = "MX"
                    cBadge_type_setup.bTooltip += "&#10; - MX : MailExtension (manifest.json)";
                } else if (ext_data.webExtension == true && ext_data.legacy == true) {
                    cBadge_type_setup.bRightText = "WE"
                    cBadge_type_setup.bTooltip += "&#10; - WE : Legacy WebExtension (manifest.json)";
                } else {
                    cBadge_type_setup.bRightText = "RDF";
                    cBadge_type_setup.bTooltip += "&#10; - RDF : Legacy Extension (install.rdf)";
                }
                rv.push(makeBadgeElement(cBadge_type_setup));

                if (ext_data.legacy == true) {
                    if (ext_data.legacy_type == 'xul') {
                        cBadge_legacy_setup.bRightText = "XUL"
                        cBadge_legacy_setup.bTooltip += "&#10; - XUL : XUL overlay (requires restart)";
                    } else {
                        cBadge_legacy_setup.bRightText = "BS"
                        cBadge_legacy_setup.bTooltip += "&#10; - RS : Bootstrap";
                    }
                    rv.push(makeBadgeElement(cBadge_legacy_setup));
                }

                if (ext_data.manifest?.theme_experiment) {
                    rv.push(makeBadgeElement({ bLeftText: 'E', bRightText: 'Theme', bColor: 'blue', bTooltip: "Theme Experiment" }));
                }

                if (ext_data.experiment) {
                    if (ext_data.experimentSchemaNames.includes("WindowListener")) {
                        cBadge_experiment_setup.bRightText = "WL"
                    } else if (ext_data.experimentSchemaNames.includes("BootstrapLoader")) {
                        cBadge_experiment_setup.bRightText = "BL"
                    }

                    let schema = ext_data.experimentSchemaNames;
                    if (schema) {
                        let max = Math.min(schema.length, 14);
                        for (let index = 0; index < max; index++) {
                            cBadge_experiment_setup.bTooltip += `&#10; - ${schema[index]}`;
                        };

                        if (ext_data.experimentSchemaNames.length > 15) {
                            cBadge_experiment_setup.bTooltip += "&#10; ...";
                        }
                    }
                    rv.push(makeBadgeElement(cBadge_experiment_setup));
                }
            }

            return rv.join("<br>");
        }

        return `
		<tr>
		  <td style="text-align: right" valign="top">${rank}</td>
		  <td style="text-align: right" valign="top">${extJson.id}</td>
		  <td style="text-align: left"  valign="top">${name_link}${getAlternativeLinks(extJson)}</td>
		  <td style="text-align: right" valign="top">${extJson.average_daily_users}</td>
		  ${SUPPORTED_VERSIONS.map(v => `<td style="text-align: right" valign="top">${cv(`${v}`)}</td>`).join("\n")}
		  <td style="text-align: right" valign="top">${current_atn_data?.files[0].created?.split('T')[0]}</td>
		  <td style="text-align: right" valign="top">${cv("current")}</td>
		  <td style="text-align: right" valign="top">${v_min}</td>
		  <td style="text-align: right" valign="top">${v_strict_max}</td>
		  <td style="text-align: right" valign="top">${v_max}</td>
		  <td style="text-align: right; font-style: italic" valign="top">${rowData.badges ? rowData.badges.map(e => getBadgeElement(e.badge, e.link, e.tooltip)).join("<br>") : ""}</td>
		</tr>`;
    }

    const getJsonData = (extJson, properties, v) => {
        let { ext_data, version } = getExtData(extJson, v);
        return {
            appVersion: v,
            ...properties,
            extVersion: version,
            isWebExtension: ext_data?.webExtension,
            isExperiment: ext_data?.experiment,
        }
    }

    // Gerate headers.
    let headers = `
    <tr>
        <th style="text-align: right">#</th>
        <th style="text-align: right">Id</th>
        <th style="text-align: left" >Name</th>
        <th style="text-align: right">Users</th>
        ${SUPPORTED_VERSIONS.map(v => `<th style="text-align: right">TB${v}</th>`).join("\n")
        }
        <th style="text-align: right">Activity</th>
        <th style="text-align: right">Current</th>
        <th style="text-align: right">Min (ATN)</th>
        <th style="text-align: right">Max (XPI)</th>
        <th style="text-align: right">Max (ATN)</th>
        <th style="text-align: right;">Notes</th>
    </tr>`;

    // Generate rows.
    extsJson.map((extJson, index) => {
        utils.debug('Extension ' + extJson.id + ' Index: ' + index);

        if (extJson === null) {
            return "";
        }

        if (extJson.xpilib === undefined) {
            console.error('Error, xpilib data missing: ' + extJson.slug);
            extJson.xpilib = {};
        }
        extJson.xpilib.rank = index + 1;

        let rowData = report.rowData(extJson);
        if (rowData.include && !ignored.includes(`${extJson.id}`)) {
            rows.push(genStandardRow(extJson, rowData));
            if (rowData.badges) stats.push(...rowData.badges);

            let compat = [];
            compat.push(getJsonData(extJson, { type: "release" }, `${RELEASE}`))
            if (NEXT_ESR) compat.push(getJsonData(extJson, { type: "next-esr" }, `${NEXT_ESR}`));
            compat.push(getJsonData(extJson, { type: "current-esr" }, `${ESR}`));

            json.addons.push({
                id: extJson.guid,
                icons: extJson.icons,
                compat,
                alternatives: getAlternativeEntries(extJson),
                dedicatedSupportOnRelease: extJson.guid == "{8845E3B3-E8FB-40E2-95E9-EC40294818C4}", // TEST
                badges: rowData.badges ? rowData.badges.map(e => e.badge) : []
            })
        } else {
            utils.debug('Skip ' + extJson.slug);
        }
    })

    // Calculate stats
    let stats_counts = {};
    for (let i = 0; i < stats.length; i++) {
        stats_counts[stats[i].badge] = 1 + (stats_counts[stats[i].badge] || 0);
    };

    function sortStats(a, b) {
        if (a[1] > b[1]) return -1;
        if (a[1] < b[1]) return 1;
        return 0;
    }

    // Generate stats
    let stats_entries = [];
    for (let [name, count] of Object.entries(stats_counts).sort(sortStats)) {
        stats_entries.push(`<tr><td style="text-align: right">${count}</td><td>${getBadgeElement(name)}</td></tr>`)
    }
    if (stats_entries.length > 0) {
        stats_entries.unshift("<h3>Statistics</h3>", "<table class='statstable'>");
        stats_entries.push("</table>");
    }


    extsListFile = extsListFile.replace('__header__', report.header);
    extsListFile = extsListFile.replace('__description__', report.description);

    extsListFile = extsListFile.replace('__count__', rows.length);
    let today = new Date().toISOString().split('T')[0];
    extsListFile = extsListFile.replace('__date__', today);
    extsListFile = extsListFile.replace('__table_header__', headers);
    extsListFile = extsListFile.replace('__table__', rows.join("\n"));

    extsListFile = extsListFile.replace('__stats__', stats_entries.join("\n"));

    await fs.mkdir(`${reportDir}`, { recursive: true });
    await fs.writeFile(`${reportDir}/${name}.html`, extsListFile);
    if (report.json) {
        json.addons.sort((a, b) => a.id.localeCompare(b.id));
        // Compare content before generating a new file.
        let curContent = "";
        let filename = `${reportDir}/${name}.json`;
        if (await utils.exists(filename)) {
            curContent = JSON.stringify(JSON.parse(await fs.readFile(filename, 'utf8')).addons);
        }
        let newContent = JSON.stringify(json.addons);
        if (curContent != newContent) {
            await fs.writeFile(filename, JSON.stringify(json, null, 2));
        }
    }

    utils.debug('Done');
    return rows.length;
}

// -----------------------------------------------------------------------------

function getBadgeElement(badgeName, bLink, bTooltip) {
    // Manipulate bRightText to reuse base badge.
    let badgeParts = badgeName.split(".");
    let badgeOpt;
    if (!badge_definitions[badgeName] && Array.isArray(badgeParts) && badge_definitions[badgeParts[0]]) {
        badgeOpt = { ...badge_definitions[badgeParts[0]] };
        badgeOpt.bRightText = badgeParts.slice(1).join(".");
    } else {
        badgeOpt = { ...badge_definitions[badgeName] };
    }
    if (bTooltip) {
        badgeOpt.bTooltip = bTooltip
    } else if (!badgeOpt.bTooltip) {
        badgeOpt.bTooltip = ""
    }
    return makeBadgeElement(badgeOpt, bLink);
}

function makeBadgeElement(bOpt, bLink) {
    let title = "";
    if (bOpt.bTooltip) { title = `title='${bOpt.bTooltip}'`; }
    else if (bLink) { title = `title='${bLink}'`; }

    let tag = `<img src='https://img.shields.io/badge/${bOpt.bLeftText}-${bOpt.bRightText}-${bOpt.bColor}.svg' ${title}>`
    return bLink ? `<a href="${bLink}">${tag}</a>` : tag;
}

function getAllData(extJson) {
    let data = {}
    for (let version of SUPPORTED_VERSIONS) {
        data[version] = getExtData(extJson, version);
    }
    return data;
}

// Returns the special xpilib object for the given version (or current).
function getExtData(extJson, v) {
    let cmp_data = extJson?.xpilib?.cmp_data;
    let version = cmp_data
        ? cmp_data[v]
        : null;

    let ext_data = extJson?.xpilib?.ext_data;

    return {
        version,
        ext_data: version && ext_data ? ext_data[version] : null,
        atn_data: version && extJson?.versions ? extJson.versions.find(e => e.version == version) : null
    };
}

async function loadAlternativeData() {
    return utils.requestText("https://raw.githubusercontent.com/thunderbird/extension-finder/master/data.yaml").then(parseAlternativeData);
}

async function parseAlternativeData(data) {
    let entries = {};

    let lines = data.split(/\r\n|\n/);
    let i = 0;

    do {
        let entry = {};
        while (i < lines.length) {
            i++;
            let line = lines[i - 1].trim();

            // End of Block
            if (line.startsWith("---")) {
                break;
            }
            // Skip comments.
            if (line.startsWith("#")) {
                continue;
            }
            let parts = line.split(":");
            let key = parts.shift().trim();
            if (key) {
                let value = parts.join(":").trim();
                entry[key] = value;
            }
        }

        // Add found entry.
        if (Object.keys(entry).length > 0) {
            if (!entries[entry.u_id]) {
                entries[entry.u_id] = [];
            }
            entries[entry.u_id].push({
                name: entry.r_name,
                link: entry.r_link,
                id: entry.r_id,
            });
        }
    } while (i < lines.length);

    return entries;
}

function getAlternativeEntries(extJson) {
    return gAlternativeData[extJson.guid];
}

function getAlternativeLinks(extJson) {
    let entries = getAlternativeEntries(extJson);
    if (!entries) {
        return ""
    }

    let links = entries.map(entry => {
        if (entry.link) {
            return `<br> &#8627; <a href="${entry.link}">${entry.name}</a>`;
        }
        return `<br> &#8627; ${entry.name}`;
    })
    return links.join("");
}

// -----------------------------------------------------------------------------

async function genIndex(index) {
    let extsListFile = await fs.readFile("templates/index-template.html", 'utf8');
    let today = new Date().toISOString().split('T')[0];
    extsListFile = extsListFile.replace('__date__', today);
    extsListFile = extsListFile.replace('__index__', index.join(""));
    await fs.mkdir(`${reportDir}`, { recursive: true });
    await fs.writeFile(`${reportDir}/index.html`, extsListFile);
}

async function main() {
    console.log("Downloading alternative add-ons data...");
    gAlternativeData = await loadAlternativeData();

    console.log('Generating reports...');
    let data = await fs.readFile(extsAllJsonFileName).then(rv => JSON.parse(rv));
    let extsJson = data.extension_data.sort((a, b) => {
        if (a.average_daily_users < b.average_daily_users) {
            return 1;
        } else if (a.average_daily_users > b.average_daily_users) {
            return -1;
        } else {
            return 0;
        };
    });

    let index = [];
    for (let group of groups) {
        index.push(`<h1><a name="group${group.id}"></a>${group.header}</h1>`);
        for (let report of reports) {
            if (report.enabled && report.group == group.id) {
                console.log("  -> " + report.id);
                let counts = await report.generate(extsJson, report.id, report);
                index.push(`<p><a href="${report.id}.html">${report.id}</a> (${counts})</p><blockquote><p>${report.header}</p></blockquote>`);
            }
        }
    }
    await genIndex(index);
    const githubWorkflowOutput = process.env.GITHUB_OUTPUT;
    if (githubWorkflowOutput) {
        await fs.appendFile(githubWorkflowOutput, `esr_version=${ESR_VERSION}\n`);
        await fs.appendFile(githubWorkflowOutput, `release_version=${RELEASE_VERSION}\n`);
    }
}

main();
