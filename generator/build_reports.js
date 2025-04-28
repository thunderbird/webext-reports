/**
 * This script is heavily based on the work of Christopher Leidigh:
 * https://github.com/cleidigh/ThunderKdB/blob/master/scripts/genExtensionList.js
 */

// Debug logging (0 - errors and basic logs only, 1 - verbose debug)
const debugLevel = 0;

const fs = require('fs-extra');

// replacement for deprecated request
const bent = require('bent');
const bentGetTEXT = bent('GET', 'string', 200);

const rootDir = "data";
const reportDir = "../docs";
const extsAllJsonFileName = `${rootDir}/xall.json`;

const RELEASE = 137;
const SUPPORTED_VERSIONS = [60, 68, 78, 91, 102, 115, 128, RELEASE];

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

const compatible_128 = [
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

const ignored = [
    "986223", // Thunderbird Addons Test
    "988559", // Unified Folders Debugging
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
    "987729", // New Folder Filters Button
    "988234", // tbhints (insignificant, stale)
    "988575", // Filtered Folder to Favorite (insignificant, stale)
    "988592", // Hide Duplicates From 'All Mail' (insignificant, stale)
    "988392", //Message List Preview
]

const wip = {
    "356507": "", // Header Tools Lite
    "988091": "", // Expression Search - NG
    "987740": "", // Nostalgy++/ Manage, search and archive
    "64758": "", // xnotepp
    "988185": "", // Bookmarks: eMails and XNotes
    "988100": "", // Folders for search, onDisk Status- Glo
    "6533": "https://github.com/threadvis/ThreadVis/issues/58#issuecomment-2304477952",
}

const pending_pr = {
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

const contacted = {
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

const investigated = {
    "4454": "", // Priority Switcher
    "988411": "", // Thunvatar
    "988323": "", // Real sender of italian PEC
    "986323": "https://github.com/caligraf/ConfirmBeforeDelete/issues/25",
    "49594": "https://github.com/tomaszkrajewski/tb-subswitch/issues/7",
}

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


var gAlternativeData;

var groups = [
    {
        id: "128",
        header: "Thunderbird Nebula reports"
    },
    {
        id: "general",
        header: "General reports"
    },
    {
        id: "115",
        header: "Thunderbird Supernova reports"
    },
    {
        id: "102",
        header: "Thunderbird 102 reports"
    },
    {
        id: "91",
        header: "Thunderbird 91 reports"
    },
    {
        id: "78",
        header: "Thunderbird 78 reports"
    },
    {
        id: "68",
        header: "Thunderbird 68 reports"
    },

]
var reports = {
    // -- v128 -------------------------------------------------------------------------------------
    "atn-tb128": {
        group: "128",
        header: "Extensions compatible with Thunderbird 128, as seen by ATN.",
        template: "report-template.html",
        enabled: true,
        json: true,
        generate: genStandardReport,
        rowData: function (extJson) {
            let v128 = getExtData(extJson, "128").data;
            let vRelease = getExtData(extJson, `${RELEASE}`).data;
            let include = !!v128;
            let badges = [];

            if (include) {
                let isExperiment = vRelease ? vRelease.experiment : v128.experiment;

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
                if (discontinued.includes(`${extJson.id}`)) {
                    badges.push({ badge: "discontinued" });
                }
                let themeExperiment = v128.manifest?.theme_experiment;
                if (themeExperiment) {
                    badges.push({ badge: "theme_experiment" });
                }
                if (!v128.legacy && v128.mext && !v128.experiment && !themeExperiment) {
                    badges.push({ badge: "pure" });
                }
            };

            return { include, badges }
        }
    },
    "lost-tb115-to-tb128": {
        group: "128",
        header: "Extensions which have been lost from TB115 to TB128, as seen by ATN.",
        template: "report-template.html",
        enabled: true,
        generate: genStandardReport,
        rowData: function (extJson) {
            let v128 = getExtData(extJson, "128").data;
            let v115 = getExtData(extJson, "115").data;
            let include = (!!v115 && !v128 && !ignored.includes(`${extJson.id}`))
            let badges = [];

            if (include) {
                if (discontinued.includes(`${extJson.id}`)) {
                    badges.push({ badge: "discontinued" });
                }

                if (Object.keys(investigated).includes(`${extJson.id}`)) {
                    let payload = investigated[`${extJson.id}`];
                    let badge = { badge: "investigated", tooltip: payload }
                    if (payload.startsWith("http")) {
                        badge.link = payload;
                    }
                    badges.push(badge);
                } else if (Object.keys(pending_pr).includes(`${extJson.id}`)) {
                    badges.push({ badge: "pending_pr", link: pending_pr[extJson.id] });
                } else if (Object.keys(contacted).includes(`${extJson.id}`)) {
                    let info = contacted[`${extJson.id}`];
                    let badge = { badge: "contacted", tooltip: info }
                    if (info.startsWith("http")) {
                        badge.link = info
                    }
                    badges.push(badge);
                } else if (messagesUpdate.includes(`${extJson.id}`)) {
                    badges.push({ badge: "messages_update", tooltip: "Missing messagesUpdate permission" });
                } else if (Object.keys(wip).includes(`${extJson.id}`)) {
                    let info = wip[`${extJson.id}`];
                    let badge = { badge: "wip", tooltip: info };
                    if (info.startsWith("http")) {
                        badge.link = info
                    }
                    badges.push(badge);
                }

                if (badges.length == 0) {
                    badges.push({ badge: "unknown" });
                }

                if (reports["experiments-without-upper-limit"].rowData(extJson).include) {
                    badges.push({ badge: "no_limit_experiment", link: "experiments-without-upper-limit.html" });
                }
                if (attachmentAPI.includes(`${extJson.id}`)) {
                    badges.push({ badge: "attachment_api" });
                }
                if (recipientChangedAPI.includes(`${extJson.id}`)) {
                    badges.push({ badge: "recipientChanged_api" });
                }
                let themeExperiment = v128?.manifest?.theme_experiment;
                if (themeExperiment) {
                    badges.push({ badge: "theme_experiment" });
                }

            }

            return { include, badges };
        }
    },
    /*"missing-messagesUpdate-permission": {
        group: "128",
        header: "Extensions using <i>messages.update()</i> or <i>folders.markAsRead()</i>in Thunderbird 128, without requesting the <i>messagesUpdate</i> permission.",
        template: "report-template.html",
        enabled: true,
        generate: genStandardReport,
        rowData: function (extJson) {
            let data = getExtData(extJson, "128").data;
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
        template: "report-template.html",
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

            let data = getExtData(extJson, "102").data;
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
    "valid-128-according-to-strict-max-but-atn-value-reduced": {
        group: "128",
        header: "Extensions whose strict_max_version allows installation in Thunderbird 128, but ATN value has been lowered to signal incompatibility (which is ignored during install and app upgrade).",
        template: "report-template.html",
        enabled: true,
        generate: genStandardReport,
        rowData: function (extJson) {
            let vCurrent = getExtData(extJson, "current").data;
            if (!vCurrent)
                return { include: false };

            let atn_max = vCurrent?.atn?.compatibility?.thunderbird?.max || "*";
            let strict_max = vCurrent.manifest?.applications?.gecko?.strict_max_version ||
                vCurrent.manifest?.browser_specific_settings?.gecko?.strict_max_version ||
                "*";

            let baseReport = reports["max-atn-value-reduced-below-max-xpi-value"].rowData(extJson);
            let badges = [];
            let manually_lowered = baseReport.include &&
                compareVer(strict_max, 128) > 0 && // xpi limit > 115
                compareVer(atn_max, "128.*") < 0; // atn limit < 115.*


            let themeExperiment = vCurrent.manifest?.theme_experiment;
            if (themeExperiment) {
                badges.push({ badge: "theme_experiment" });
            }
            if (!vCurrent.legacy && vCurrent.mext && !vCurrent.experiment && !themeExperiment) {
                badges.push({ badge: "pure" });
            }
            if (discontinued.includes(`${extJson.id}`)) {
                badges.push({ badge: "discontinued" });
            }

            if (Object.keys(pending_pr).includes(`${extJson.id}`)) {
                badges.push({ badge: "pending_pr", link: pending_pr[extJson.id] });
            } else if (Object.keys(contacted).includes(`${extJson.id}`)) {
                badges.push({ badge: "contacted", tooltip: contacted[`${extJson.id}`] });
            } else if (messagesUpdate.includes(`${extJson.id}`)) {
                badges.push({ badge: "messages_update", tooltip: "Missing messagesUpdate permission" });
            }

            return { include: manually_lowered, badges };
        }
    },
    "experiments-without-upper-limit": {
        group: "128",
        header: "Experiments without upper limit in ATN.",
        template: "report-template.html",
        enabled: true,
        generate: genStandardReport,
        rowData: function (extJson) {
            let vCurrent = getExtData(extJson, "current").data;
            let atn_max = vCurrent?.atn?.compatibility?.thunderbird?.max || "*";
            let atn_min = vCurrent?.atn?.compatibility?.thunderbird?.min || "*";
            let include = !ignored.includes(`${extJson.id}`) && !!vCurrent && vCurrent.mext && vCurrent.experiment && atn_max == "*";
            let badges = [];

            if (discontinued.includes(`${extJson.id}`)) {
                badges.push({ badge: "discontinued" });
            }
            if (compatible_128.includes(`${extJson.id}`)) {
                badges.push({ badge: "compatible" });
            }
            if (Object.keys(pending_pr).includes(`${extJson.id}`)) {
                badges.push({ badge: "pending_pr", link: pending_pr[extJson.id] });
            }
            if (Object.keys(investigated).includes(`${extJson.id}`)) {
                let payload = investigated[`${extJson.id}`];
                let badge = { badge: "investigated", tooltip: payload }
                if (payload.startsWith("http")) {
                    badge.link = payload;
                }
                badges.push(badge);
            }
            if (Object.keys(contacted).includes(`${extJson.id}`)) {
                badges.push({ badge: "contacted", tooltip: contacted[`${extJson.id}`] });
            }

            return { include, badges };
        }
    },
    "lost-pure-webext-with-upper-limit": {
        group: "128",
        header: "Lost pure WebExtensions with an unnecessary max_version_setting (excluding theme_experiments).",
        template: "report-template.html",
        enabled: true,
        generate: genStandardReport,
        rowData: function (extJson) {
            let vCurrent = getExtData(extJson, "current").data;
            let v128 = getExtData(extJson, "128").data;
            if (!vCurrent)
                return { include: false };

            let themeExperiment = vCurrent.manifest?.theme_experiment;
            let include = !discontinued.includes(`${extJson.id}`) && !v128 && !themeExperiment && !vCurrent.legacy && vCurrent.mext && !vCurrent.experiment;

            let badges = [];
            if (compatible_128.includes(`${extJson.id}`)) {
                badges.push({ badge: "compatible" });
            }
            if (Object.keys(investigated).includes(`${extJson.id}`)) {
                let payload = investigated[`${extJson.id}`];
                let badge = { badge: "investigated", tooltip: payload }
                if (payload.startsWith("http")) {
                    badge.link = payload;
                }
                badges.push(badge);
            } else if (Object.keys(pending_pr).includes(`${extJson.id}`)) {
                badges.push({ badge: "pending_pr", link: pending_pr[extJson.id] });
            } else if (Object.keys(contacted).includes(`${extJson.id}`)) {
                badges.push({ badge: "contacted", tooltip: contacted[`${extJson.id}`] });
            } else if (messagesUpdate.includes(`${extJson.id}`)) {
                badges.push({ badge: "messages_update", tooltip: "Missing messagesUpdate permission" });
            }

            return { include, badges };
        }
    },
    "experiment-status": {
        group: "128",
        header: "Extensions with added or removed Experiments.",
        template: "report-template.html",
        enabled: true,
        generate: genStandardReport,
        rowData: function (extJson) {
            let v128 = getExtData(extJson, "128").data;
            let vRelease = getExtData(extJson, `${RELEASE}`).data;
            let include = !!v128;
            let badges = [];
            let includeForReal = false;

            if (include) {
                let isExperiment = vRelease ? vRelease.experiment : v128.experiment;
                if (isExperiment) {
                    badges.push({ badge: "experiment" });
                }
                if (!isExperiment && experiments_feb_2025.includes(`${extJson.id}`)) {
                    badges.push({ badge: "experiment_migrated" });
                    includeForReal = true;
                }
                if (isExperiment && !experiments_feb_2025.includes(`${extJson.id}`)) {
                    badges.push({ badge: "experiment_new" });
                    includeForReal = true;
                }
            };

            return { include: includeForReal, badges }
        }
    },
    // -- general ----------------------------------------------------------------------------------
    "all": {
        group: "general",
        header: "All Extensions compatible with TB60 or newer.",
        template: "report-template.html",
        enabled: true,
        generate: genStandardReport,
        rowData: function (extJson) {
            let data = getAllData(extJson);
            return { include: !!Object.values(data).find(version => version.version) };
        },
    },
    "wrong-order": {
        group: "general",
        header: "Extension with wrong upper limit setting in older versions, which will lead to the wrong version reported compatible by ATN.",
        template: "report-template.html",
        enabled: true,
        generate: genStandardReport,
        rowData: function (extJson) {
            let v115 = getExtData(extJson, "115").version;
            let v102 = getExtData(extJson, "102").version;
            let v91 = getExtData(extJson, "91").version;
            let v78 = getExtData(extJson, "78").version;
            let v68 = getExtData(extJson, "68").version;
            let v60 = getExtData(extJson, "60").version;

            if (v60 && v68 && compareVer(v60, v68) > 0) return { include: true };
            if (v60 && v78 && compareVer(v60, v78) > 0) return { include: true };
            if (v60 && v91 && compareVer(v60, v91) > 0) return { include: true };
            if (v60 && v102 && compareVer(v60, v102) > 0) return { include: true };
            if (v60 && v115 && compareVer(v60, v115) > 0) return { include: true };

            if (v68 && v78 && compareVer(v68, v78) > 0) return { include: true };
            if (v68 && v91 && compareVer(v68, v91) > 0) return { include: true };
            if (v68 && v102 && compareVer(v68, v102) > 0) return { include: true };
            if (v68 && v115 && compareVer(v68, v115) > 0) return { include: true };

            if (v78 && v91 && compareVer(v78, v91) > 0) return { include: true };
            if (v78 && v102 && compareVer(v78, v102) > 0) return { include: true };
            if (v78 && v115 && compareVer(v78, v115) > 0) return { include: true };

            if (v91 && v102 && compareVer(v91, v102) > 0) return { include: true };
            if (v91 && v115 && compareVer(v91, v115) > 0) return { include: true };

            if (v102 && v115 && compareVer(v102, v115) > 0) return { include: true };

            return { include: false };
        },
    },
    "purge-candidates": {
        group: "general",
        header: "All Extensions not compatible with TB68, which should be purged from ATN.",
        template: "report-template.html",
        enabled: true,
        generate: genStandardReport,
        rowData: function (extJson) {
            let data = getAllData(extJson);
            return { include: !Object.entries(data).some(([v, d]) => v > 60 && d.version) };
        },
    },
    "parsing-error": {
        group: "general",
        header: "Extensions whose XPI files could not be parsed properly and are excluded from analysis.",
        template: "report-template.html",
        enabled: true,
        generate: genStandardReport,
        rowData: function (extJson) {
            let current_version = getExtData(extJson, "current").data;
            return { include: !current_version };
        }
    },
    "recent-activity": {
        group: "general",
        header: "Extensions updated within the last 2 weeks.",
        template: "report-template.html",
        enabled: true,
        generate: genStandardReport,
        rowData: function (extJson) {
            let current_version = getExtData(extJson, "current").data;
            if (current_version) {
                let c = current_version.atn.files[0].created;
                let cv = new Date(c);
                let today = new Date();
                const msDay = 24 * 60 * 60 * 1000;
                let d = (today - cv) / msDay;
                return { include: (d <= 14) };
            }
            return { include: false };
        }
    },
    "recent-addition": {
        group: "general",
        header: "Extensions created within the last year.",
        template: "report-template.html",
        enabled: true,
        generate: genStandardReport,
        rowData: function (extJson) {
            let current_version = getExtData(extJson, "current").data;
            if (current_version) {
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
    "requested-permissions": {
        group: "general",
        header: "Extensions requesting WebExtension permissions.",
        template: "report-template.html",
        enabled: true,
        generate: genStandardReport,
        rowData: function (extJson) {
            let data = getExtData(extJson, "current").data;
            let badges = [];

            let permissions = data?.manifest?.permissions;
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

            let manifest = data?.manifest;
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
    "max-atn-value-raised-above-max-xpi-value": {
        group: "general",
        header: "Extensions whose max version has been raised in ATN above the XPI value (excluding legacy extensions).",
        template: "report-template.html",
        enabled: true,
        generate: genStandardReport,
        rowData: function (extJson) {
            let vCurrent = getExtData(extJson, "current").data;
            if (!vCurrent)
                return { include: false };

            let atn_max = vCurrent?.atn?.compatibility?.thunderbird?.max || "*";
            let strict_max = vCurrent.manifest?.applications?.gecko?.strict_max_version ||
                vCurrent.manifest?.browser_specific_settings?.gecko?.strict_max_version ||
                "*";

            let include = vCurrent.mext && !vCurrent.legacy && (compareVer(strict_max, atn_max) < 0);
            let badges = [];
            if (discontinued.includes(`${extJson.id}`)) {
                badges.push({ badge: "discontinued" });
            }
            return { include, badges };
        }
    },
    "max-atn-value-reduced-below-max-xpi-value": {
        group: "general",
        header: "Extensions whose max version has been reduced in ATN below the XPI value, which is ignored during install and app upgrade (excluding legacy).",
        template: "report-template.html",
        enabled: true,
        generate: genStandardReport,
        rowData: function (extJson) {
            let vCurrent = getExtData(extJson, "current").data;
            if (!vCurrent)
                return { include: false };

            let atn_max = vCurrent?.atn?.compatibility?.thunderbird?.max || "*";
            let strict_max = vCurrent.manifest?.applications?.gecko?.strict_max_version ||
                vCurrent.manifest?.browser_specific_settings?.gecko?.strict_max_version ||
                "*";

            let include = vCurrent.mext && !vCurrent.legacy && (compareVer(strict_max, atn_max) > 0);
            let badges = [];
            if (discontinued.includes(`${extJson.id}`)) {
                badges.push({ badge: "discontinued" });
            }
            let themeExperiment = vCurrent.manifest?.theme_experiment;
            if (themeExperiment) {
                badges.push({ badge: "theme_experiment" });
            }
            if (!vCurrent.legacy && vCurrent.mext && !vCurrent.experiment && !themeExperiment) {
                badges.push({ badge: "pure" });
            }

            if (Object.keys(contacted).includes(`${extJson.id}`)) {
                badges.push({ badge: "contacted", tooltip: contacted[`${extJson.id}`] });
            }
            if (Object.keys(pending_pr).includes(`${extJson.id}`)) {
                badges.push({ badge: "pending_pr", link: pending_pr[extJson.id] });
            }
            if (filterAPI.includes(`${extJson.id}`)) {
                badges.push({ badge: "filter_api" });
            }

            return { include, badges };
        }
    },
    "pure-webext-with-upper-limit": {
        group: "general",
        header: "Pure WebExtensions with an unnecessary max_version_setting (excluding theme_experiments).",
        template: "report-template.html",
        enabled: true,
        generate: genStandardReport,
        rowData: function (extJson) {
            let vCurrent = getExtData(extJson, "current").data;
            if (!vCurrent)
                return { include: false };

            let themeExperiment = vCurrent.manifest?.theme_experiment;
            let atn_max = vCurrent?.atn?.compatibility?.thunderbird?.max || "*";
            let strict_max = vCurrent.manifest?.applications?.gecko?.strict_max_version ||
                vCurrent.manifest?.browser_specific_settings?.gecko?.strict_max_version ||
                "*";
            let include = !themeExperiment && !vCurrent.legacy && vCurrent.mext && !vCurrent.experiment && (strict_max != "*" || atn_max != "*");


            let badges = [];
            if (discontinued.includes(`${extJson.id}`)) {
                badges.push({ badge: "discontinued" });
            }
            if (Object.keys(contacted).includes(`${extJson.id}`)) {
                badges.push({ badge: "contacted", tooltip: contacted[`${extJson.id}`] });
            }
            return { include, badges };
        }
    },
    "latest-current-mismatch": {
        group: "general",
        header: "Extensions, where the latest upload is for an older release, which will fail to install in current ESR (current = defined current in ATN) from within the add-on manager.",
        template: "report-template.html",
        enabled: true,
        generate: genStandardReport,
        rowData: function (extJson) {
            let data = Object.entries(getAllData(extJson));
            let sorted = data.sort(([a], [b]) => parseInt(a) - parseInt(b));
            let vHighest = sorted.map(([v, d]) => d).filter(d => d.version).pop();
            let vCurrent = getExtData(extJson, "current");
            return { include: !reports["wrong-order"].rowData(extJson).include && !!vHighest && vHighest.version != vCurrent.version };
        },
    },
    // -- v115 -------------------------------------------------------------------------------------
    "atn-tb115": {
        group: "115",
        header: "Extensions compatible with Thunderbird 115 as seen by ATN.",
        template: "report-template.html",
        enabled: true,
        json: true,
        generate: genStandardReport,
        rowData: function (extJson) {
            let v115 = getExtData(extJson, "115").data;
            let include = !!v115;
            let badges = [];

            if (include) {
                if (v115.experiment) {
                    badges.push({ badge: "experiment" });
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
                let themeExperiment = v115.manifest?.theme_experiment;
                if (themeExperiment) {
                    badges.push({ badge: "theme_experiment" });
                }
                if (!v115.legacy && v115.mext && !v115.experiment && !themeExperiment) {
                    badges.push({ badge: "pure" });
                }
            };

            return { include, badges }
        }
    },
    "lost-tb102-to-tb115": {
        group: "115",
        header: "Extensions which have been lost from TB102 to TB115, as seen by ATN.",
        template: "report-template.html",
        enabled: true,
        generate: genStandardReport,
        rowData: function (extJson) {
            let v115 = getExtData(extJson, "115").data;
            let v102 = getExtData(extJson, "102").data;

            let include = (!!v102 && !v115 && !ignored.includes(`${extJson.id}`));
            let badges = [];

            if (include) {
                if (discontinued.includes(`${extJson.id}`)) {
                    badges.push({ badge: "discontinued" });
                }
                if (Object.keys(investigated).includes(`${extJson.id}`)) {
                    let payload = investigated[`${extJson.id}`];
                    let badge = { badge: "investigated", tooltip: payload }
                    if (payload.startsWith("http")) {
                        badge.link = payload;
                    }
                    badges.push(badge);
                }
                if (Object.keys(pending_pr).includes(`${extJson.id}`)) {
                    badges.push({ badge: "pending_pr", link: pending_pr[extJson.id] });
                }
                if (Object.keys(contacted).includes(`${extJson.id}`)) {
                    badges.push({ badge: "contacted", tooltip: contacted[`${extJson.id}`] });
                }
                if (Object.keys(wip).includes(`${extJson.id}`)) {
                    let info = wip[`${extJson.id}`];
                    let badge = { badge: "wip", tooltip: info };
                    if (info.startsWith("http")) {
                        badge.link = info
                    }
                    badges.push(badge);
                }

                if (badges.length == 0) {
                    badges.push({ badge: "unknown" });
                }

                if (filterAPI.includes(`${extJson.id}`)) {
                    badges.push({ badge: "filter_api" });
                }
                if (reports["pure-webext-with-upper-limit"].rowData(extJson).include) {
                    badges.push({ badge: "pure", link: "pure-webext-with-upper-limit.html" });
                }
                if (reports["experiments-without-upper-limit"].rowData(extJson).include) {
                    badges.push({ badge: "no_limit_experiment", link: "experiments-without-upper-limit.html" });
                }
                if (attachmentAPI.includes(`${extJson.id}`)) {
                    badges.push({ badge: "attachment_api" });
                }
                if (recipientChangedAPI.includes(`${extJson.id}`)) {
                    badges.push({ badge: "recipientChanged_api" });
                }
                let themeExperiment = v115?.manifest?.theme_experiment;
                if (themeExperiment) {
                    badges.push({ badge: "theme_experiment" });
                }

            }

            return { include, badges };
        }
    },
    // -- v102 -------------------------------------------------------------------------------------
    "atn-tb102": {
        group: "102",
        header: "Extensions compatible with Thunderbird 102 as seen by ATN.",
        template: "report-template.html",
        enabled: true,
        generate: genStandardReport,
        rowData: function (extJson) {
            let v102 = getExtData(extJson, "102").data;
            let include = !!v102;
            let badges = [];

            if (include) {
                let themeExperiment = v102.manifest?.theme_experiment;
                if (themeExperiment) {
                    badges.push({ badge: "theme_experiment" });
                }
                if (v102.experiment) {
                    badges.push({ badge: "experiment" });
                }
                if (!v102.legacy && v102.mext && !v102.experiment && !themeExperiment) {
                    badges.push({ badge: "pure" });
                }
            }

            return { include, badges };
        }
    },
    "lost-tb91-to-tb102": {
        group: "102",
        header: "Extensions which have been lost from TB91 to TB102, as seen by ATN.",
        template: "report-template.html",
        enabled: true,
        generate: genStandardReport,
        rowData: function (extJson) {
            let v102 = getExtData(extJson, "102").version;
            let v91 = getExtData(extJson, "91").version;
            let include = (!!v91 && !v102);

            let badges = [];
            if (include) {
                if (getAlternative(extJson)) {
                    badges.push({ badge: "alternative_available" });
                }
                if (discontinued.includes(`${extJson.id}`)) {
                    badges.push({ badge: "discontinued" });
                }
                if (Object.keys(contacted).includes(`${extJson.id}`)) {
                    badges.push({ badge: "contacted", tooltip: contacted[`${extJson.id}`] });
                }
                if (badges.length == 0) {
                    badges.push({ badge: "unknown" });
                }
            }
            return { include, badges };
        }
    },
    // -- v91 --------------------------------------------------------------------------------------
    "atn-tb91": {
        group: "91",
        header: "Extensions compatible with Thunderbird 91 as seen by ATN.",
        template: "report-template.html",
        enabled: true,
        generate: genStandardReport,
        rowData: function (extJson) {
            let v91 = getExtData(extJson, "91").data;
            let include = !!v91;
            let badges = [];

            if (include) {
                let themeExperiment = v91.manifest?.theme_experiment;
                if (themeExperiment) {
                    badges.push({ badge: "theme_experiment" });
                }
                if (v91.experiment) {
                    badges.push({ badge: "experiment" });
                }
                if (!v91.legacy && v91.mext && !v91.experiment && !themeExperiment) {
                    badges.push({ badge: "pure" });
                }
            };

            return { include, badges }
        }
    },
    "lost-tb78-to-tb91": {
        group: "91",
        header: "Extensions which have been lost from TB78 to TB91, as seen by ATN.",
        template: "report-template.html",
        enabled: true,
        generate: genStandardReport,
        rowData: function (extJson) {
            let v91 = getExtData(extJson, "91").version;
            let v78 = getExtData(extJson, "78").version;
            let include = !!v78 && !v91;

            let badges = [];
            if (include) {
                if (getAlternative(extJson)) {
                    badges.push({ badge: "alternative_available" });
                } else {
                    badges.push({ badge: "unknown" });
                }
            }
            return { include, badges };
        }
    },
    // -- v78 --------------------------------------------------------------------------------------
    "atn-tb78": {
        group: "78",
        header: "Extensions compatible with Thunderbird 78 as seen by ATN.",
        template: "report-template.html",
        enabled: true,
        generate: genStandardReport,
        rowData: function (extJson) {
            let v78 = getExtData(extJson, "78").data;
            let include = !!v78;
            let badges = [];

            if (include) {
                let themeExperiment = v78.manifest?.theme_experiment;
                if (themeExperiment) {
                    badges.push({ badge: "theme_experiment" });
                }
                if (v78.experiment) {
                    badges.push({ badge: "experiment" });
                }
                if (!v78.legacy && v78.mext && !v78.experiment && !themeExperiment) {
                    badges.push({ badge: "pure" });
                }
            };

            return { include, badges }
        }
    },
    "lost-tb68-to-tb78": {
        group: "78",
        header: "Extensions which have been lost from TB68 to TB78, as seen by ATN.",
        template: "report-template.html",
        enabled: true,
        generate: genStandardReport,
        rowData: function (extJson) {
            let v78 = getExtData(extJson, "78").version;
            let v68 = getExtData(extJson, "68").version;
            return { include: !!v68 && !v78 };
        }
    },
    // -- 68 ------------------------------------------------------------------- -------------------
    "atn-tb68": {
        group: "68",
        header: "Extensions compatible with Thunderbird 68 as seen by ATN.",
        template: "report-template.html",
        enabled: true,
        generate: genStandardReport,
        rowData: function (extJson) {
            let v68 = getExtData(extJson, "68").data;
            let include = !!v68;
            let badges = [];

            if (include) {
                let themeExperiment = v68.manifest?.theme_experiment;
                if (themeExperiment) {
                    badges.push({ badge: "theme_experiment" });
                }
                if (!v68.legacy && v68.mext && !v68.experiment && !themeExperiment) {
                    badges.push({ badge: "pure" });
                }
            };

            return { include, badges }
        }
    },
    "lost-tb60-to-tb68": {
        group: "68",
        header: "Extensions which have been lost from TB60 to TB68, as seen by ATN.",
        template: "report-template.html",
        enabled: true,
        generate: genStandardReport,
        rowData: function (extJson) {
            let v68 = getExtData(extJson, "68").version;
            let v60 = getExtData(extJson, "60").version;
            return { include: !!v60 && !v68 };
        }
    }
}

// -----------------------------------------------------------------------------

function genStandardReport(extsJson, name, report) {
    let extsListFile = fs.readFileSync(report.template, 'utf8');
    let rows = [];
    let stats = [];
    let json = [];

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

        let rank = extJson.xpilib.rank;
        let current_version = getExtData(extJson, "current").data;
        let v_min = current_version?.atn.compatibility.thunderbird.min || "*";
        let v_max = current_version?.atn.compatibility.thunderbird.max || "*";
        let v_strict_max = current_version?.manifest?.applications?.gecko?.strict_max_version ||
            current_version?.manifest?.browser_specific_settings?.gecko?.strict_max_version ||
            "*";

        // Helper function to return the version cell for a given version
        const cv = (v) => {
            let rv = [];
            let { version, data } = getExtData(extJson, v);

            if (version) {
                rv.push(version);
            }

            if (data) {
                let cBadge_type_setup = { bLeftText: 'T', bRightText: 'MX', bColor: 'purple', bTooltip: "Extension Type:" };
                let cBadge_legacy_setup = { bLeftText: 'L', bRightText: '+', bColor: 'green', bTooltip: "Legacy Type:" };
                let cBadge_experiment_setup = { bLeftText: 'E', bRightText: '+', bColor: 'blue', bTooltip: "Experiment APIs: " };

                if (data.mext == true && data.legacy == false) {
                    cBadge_type_setup.bRightText = "MX"
                    cBadge_type_setup.bTooltip += "&#10; - MX : MailExtension (manifest.json)";
                } else if (data.mext == true && data.legacy == true) {
                    cBadge_type_setup.bRightText = "WE"
                    cBadge_type_setup.bTooltip += "&#10; - WE : Legacy WebExtension (manifest.json)";
                } else {
                    cBadge_type_setup.bRightText = "RDF";
                    cBadge_type_setup.bTooltip += "&#10; - RDF : Legacy Extension (install.rdf)";
                }
                rv.push(makeBadgeElement(cBadge_type_setup));

                if (data.legacy == true) {
                    if (data.legacy_type == 'xul') {
                        cBadge_legacy_setup.bRightText = "XUL"
                        cBadge_legacy_setup.bTooltip += "&#10; - XUL : XUL overlay (requires restart)";
                    } else {
                        cBadge_legacy_setup.bRightText = "BS"
                        cBadge_legacy_setup.bTooltip += "&#10; - RS : Bootstrap";
                    }
                    rv.push(makeBadgeElement(cBadge_legacy_setup));
                }

                if (data.manifest?.theme_experiment) {
                    rv.push(makeBadgeElement({ bLeftText: 'E', bRightText: 'Theme', bColor: 'blue', bTooltip: "Theme Experiment" }));
                }

                if (data.experiment) {
                    if (data.experimentSchemaNames.includes("WindowListener")) {
                        cBadge_experiment_setup.bRightText = "WL"
                    } else if (data.experimentSchemaNames.includes("BootstrapLoader")) {
                        cBadge_experiment_setup.bRightText = "BL"
                    }

                    let schema = data.experimentSchemaNames;
                    if (schema) {
                        let max = Math.min(schema.length, 14);
                        for (let index = 0; index < max; index++) {
                            cBadge_experiment_setup.bTooltip += `&#10; - ${schema[index]}`;
                        };

                        if (data.experimentSchemaNames.length > 15) {
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
		  <td style="text-align: left"  valign="top">${name_link}${getAlternative(extJson) ? getAlternative(extJson).join("") : ""}</td>
		  <td style="text-align: right" valign="top">${extJson.average_daily_users}</td>
		  <td style="text-align: right" valign="top">${cv("60")}</td>
		  <td style="text-align: right" valign="top">${cv("68")}</td>
		  <td style="text-align: right" valign="top">${cv("78")}</td>
		  <td style="text-align: right" valign="top">${cv("91")}</td>
		  <td style="text-align: right" valign="top">${cv("102")}</td>
		  <td style="text-align: right" valign="top">${cv("115")}</td>
		  <td style="text-align: right" valign="top">${cv("128")}</td>
		  <td style="text-align: right" valign="top">${cv(`${RELEASE}`)}</td>
		  <td style="text-align: right" valign="top">${current_version?.atn.files[0].created.split('T')[0]}</td>
		  <td style="text-align: right" valign="top">${cv("current")}</td>
		  <td style="text-align: right" valign="top">${v_min}</td>
		  <td style="text-align: right" valign="top">${v_strict_max}</td>
		  <td style="text-align: right" valign="top">${v_max}</td>
		  <td style="text-align: right; font-style: italic" valign="top">${rowData.badges ? rowData.badges.map(e => getBadgeElement(e.badge, e.link, e.tooltip)).join("<br>") : ""}</td>
		</tr>`;
    }

    const getJsonData = (extJson, appVersion, v) => {
        let data = getExtData(extJson, v);
        return {
            appVersion,
            extVersion: data.version,
            webextension: data?.data?.mext,
            experiment: data?.data?.experiment,
        }
    }

    extsJson.map((extJson, index) => {
        debug('Extension ' + extJson.id + ' Index: ' + index);

        if (extJson === null) {
            return "";
        }

        if (extJson.xpilib === undefined) {
            console.error('Error, xpilib data missing: ' + extJson.slug);
            extJson.xpilib = {};
        }
        extJson.xpilib.rank = index + 1;

        let rowData = report.rowData(extJson);
        if (rowData.include) {
            rows.push(genStandardRow(extJson, rowData));
            if (rowData.badges) stats.push(...rowData.badges);
            json.push({
                id: extJson.guid,
                icons: extJson.icons,
                compat: [
                    getJsonData(extJson, "TB 115 (ESR)", "115"),
                    getJsonData(extJson, "TB 128 (ESR)", "128"),
                    getJsonData(extJson, `TB ${RELEASE} (Release)`, RELEASE),
                ],
                badges: rowData.badges ? rowData.badges.map(e => e.badge) : []
            })
        } else {
            debug('Skip ' + extJson.slug);
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
    extsListFile = extsListFile.replace('__table__', rows.join("\n"));

    extsListFile = extsListFile.replace('__stats__', stats_entries.join("\n"));

    fs.ensureDirSync(`${reportDir}`);
    fs.writeFileSync(`${reportDir}/${name}.html`, extsListFile);
    if (report.json) {
        fs.writeFileSync(`${reportDir}/${name}.json`, JSON.stringify(json, null, 2));
    }

    debug('Done');
    return rows.length;
}

// -----------------------------------------------------------------------------

function debug(...args) {
    if (debugLevel > 0) {
        console.debug(...args);
    }
}

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

// A versioncompare, taken from https://jsfiddle.net/vanowm/p7uvtbor/
function compareVer(a, b) {
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
    let data = version && ext_data
        ? ext_data[version]
        : null;

    return { version, data };
}

async function loadAlternativeData() {
    return bentGetTEXT("https://raw.githubusercontent.com/thundernest/extension-finder/master/data.yaml").then(alternativeDataToLinks);
}

async function alternativeDataToLinks(data) {
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
            if (entry.r_link)
                entries[entry.u_id].push(`<br> &#8627; <a href="${entry.r_link}">${entry.r_name}</a>`);
            else
                entries[entry.u_id].push(`<br> &#8627; ${entry.r_name}`);

        }
    } while (i < lines.length);

    return entries;
}

function getAlternative(extJson) {
    return gAlternativeData[extJson.guid];
}

// -----------------------------------------------------------------------------

function genIndex(index) {
    let extsListFile = fs.readFileSync("index-template.html", 'utf8');
    let today = new Date().toISOString().split('T')[0];
    extsListFile = extsListFile.replace('__date__', today);
    extsListFile = extsListFile.replace('__index__', index.join(""));
    fs.ensureDirSync(`${reportDir}`);
    fs.writeFileSync(`${reportDir}/index.html`, extsListFile);
}

async function main() {
    console.log("Downloading alternative add-ons data...");
    gAlternativeData = await loadAlternativeData();

    console.log('Generating reports...');
    let extsJson = fs.readJSONSync(extsAllJsonFileName);
    let index = [];
    for (let group of groups) {
        index.push(`<h1><a name="group${group.id}"></a>${group.header}</h1>`);
        for (let [name, report] of Object.entries(reports)) {
            if (report.enabled && report.group == group.id) {
                console.log("  -> " + name);
                let counts = report.generate(extsJson, name, report);
                index.push(`<p><a href="${name}.html">${name}</a> (${counts})</p><blockquote><p>${report.header}</p></blockquote>`);
            }
        }
    }
    genIndex(index);
}

main();
