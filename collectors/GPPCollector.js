/* eslint-disable no-undef */
/* eslint-disable no-await-in-loop */
const BaseCollector = require("./BaseCollector");
const createDeferred = require("../helpers/deferred");
// Loading in the helper uspPing function
const uspPing = require("../helpers/uspPing");
const gppPing = require("../helpers/gppPing");
const callGPPhasSections = require("../helpers/gppHasSections");
const callGPPgetSections = require("../helpers/gppGetSections");
const callGPPgetField = require("../helpers/gppGetField");
const tcfPing = require("../helpers/tcfPing");
const tcfEventListener = require("../helpers/tcfEventListener");
const gppEventListener = require("../helpers/gppEventListener");
const {oneTrustActiveGroups, didomiUserStatus} = require("../helpers/CMPConsentFunctions");
// const didomiUserStatus = require("../helpers/CMPConsentFunctions");
const CMPCollector = require("./CMPCollector");
// const {
//     optOutDidomi,
//     optOutOneTrust,
//     optOutQuantcast,
//     optOutCookieBot,
// } = require("../helpers/optoutHelpers");

/**
 * @typedef {Object} ScanResult
 * @property {any[]} cmpData
 * @property {string[]} gppObjects
 * @property {{ api: any; hasSection: any; }[]} hasSections
 * @property {{ api: any; getSection: any; }[]} getSections
 * @property {any[]} getField
 * @property {string[]} uspString
 * @property {string[]} tcfString
 * @property {string[]} tcfEventListenerData
 * @property {string[]} gppEventListenerData
 * @property {string[]} OneTrustActiveGroups
 * @property {any} DidomiCurrentUserStatus
 */

/**
 *
 *
 * @param {import('puppeteer').Page} page - The Puppeteer page instance.
 * @returns {Promise<void>} - A promise that resolves when the page has been scrolled to the bottom.
 */

class GPPCollector extends BaseCollector {
    id() {
        return "gpp";
    }

    /**
     * @param {import('./BaseCollector').CollectorInitOptions} options
     */
    init(options) {
        this._log = options.log;
        this.context = options.context;
        this.pendingScan = createDeferred();
        /** @type {ScanResult} */
        this.scanResult = {
            cmpData: [],
            gppObjects: [],
            hasSections: [],
            getSections: [],
            getField: [],
            uspString: [],
            tcfString: [],
            tcfEventListenerData: [],
            gppEventListenerData: [],
            OneTrustActiveGroups: [],
            DidomiCurrentUserStatus: [],
        };

        //intialize the CMP collector as well
        this.cmpCollector = new CMPCollector();
        this.cmpCollector.init(options);
    }

    /**
     * @param {{cdpClient: import('puppeteer').CDPSession, url: string, type: import('./TargetCollector').TargetType}} targetInfo
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async addTarget(targetInfo) {

        if (targetInfo.type !== 'page') {
            console.warn(`Skipping non-page target: ${targetInfo.url}`);
            return;
        }
    
        const pages = await this.context.pages(); // Wait for pages to be available
        if (pages.length === 0) {
            console.error('No pages found in context yet');
            return;
        }
        const page = pages[0];

        //@ts-ignore
        const updateTCFScanResult = tcData => {
            this.scanResult.tcfEventListenerData.push(tcData);
            // console.log('TCF event data added to scanResult:', tcData);
        };

        //@ts-ignore    
        const updateGPPScanResult = gppData => {
            this.scanResult.gppEventListenerData.push(gppData);
            console.log("GPP event data added to scanResult:", gppData);
        };


        //@ts-ignore
        await page.exposeFunction('handleTCFEventData', tcData => {
            console.log('TCF Event Listener triggered:', tcData);
            updateTCFScanResult(tcData);  // Call the onEventData callback with the event data
        });


        // Expose the callback function to the page context
        // @ts-ignore
        await page.exposeFunction('handleGPPEventData', gppData => {
            updateGPPScanResult(gppData);  // Call the onEventData callback with the event data
        });
    
        console.log(`Script injected for target: ${targetInfo.url}`);
    }

    async postLoad() {
        /**
         * @type {string[]}
         */
        const gppObjects = [];
        const hasSections = [];
        const getSections = [];
        const getFields = [];

        /**
         * @type {any[]}
         */
        let cmpData = [];

        const pages = await this.context.pages();

        if (pages.length > 0) {
            const page = pages[0];

            // @ts-ignore
            const tcfApiAvailable = await page.evaluate(() => typeof window.__tcfapi === "function");

            if (tcfApiAvailable) {
                console.log("TCF API is available on the window object");

                // Callback to store tcData in scanResult

                // Add event listener defined above to listen for TCF events
                await tcfEventListener(page);
            } else {
                console.warn("__tcfapi is not available on the window object");
            }

            // @ts-ignore
            const gppApiAvailable = await page.evaluate(() => typeof window.__gpp === "function");

            if (gppApiAvailable) {
                console.log("GPP API is available on the window object");

                // Add event listener defined above to listen for GPP events
                await gppEventListener(page);
            } else {
                console.warn("__gpp is not available on the window object");
            }

            // Code for checking if OneTrust CMP is being used
            // @ts-ignore
            console.log("Checking for OneTrust CMP...");
            const oneTrustGroups = await oneTrustActiveGroups(page);
            if (oneTrustGroups) {
                this.scanResult.OneTrustActiveGroups.push(oneTrustGroups);
                console.log("OneTrust Active Groups retrieved:", oneTrustGroups);
            } else {
                console.log("No OneTrust Active Groups retrieved.");
            }

            // Checking for the Didomi CMP and retriving the consent onject
            // @ts-ignore
            console.log("Checking for Didomi CMP...");
            const didomiStatus = await didomiUserStatus(page);
            if (didomiStatus) {
                this.scanResult.DidomiCurrentUserStatus.push(didomiStatus);
                console.log("Didomi Current User Status retrieved:", didomiStatus);
            } else {
                console.log("No Didomi Current User Status retrieved.");
            }


            console.log("Attempting to retrieve GPP objects...");
            const gppObject = await gppPing(page);

            if (gppObject) {
                gppObjects.push(gppObject);
                // console.log('GPP object retrieved:', gppObject);
            } else {
                console.log("No GPP object retrieved.");
            }

            console.log("Attempting to check for sections...");
            const hasSection = await callGPPhasSections(page, gppObject);

            if (hasSection) {
                hasSections.push(...hasSection);
                // console.log('Sections found:', hasSection);
            } else {
                console.log("No sections found.");
            }

            console.log("Attempting to get sections...");
            // const getSection = await this.callGPPgetSections(page, gppObject);
            const getSection = await callGPPgetSections(page, gppObject);

            if (getSection) {
                getSections.push(...getSection);
                // console.log('Sections found:', getSection);
            } else {
                console.log("No sections found.");
            }

            console.log("Attempting to get field...");
            // const getField = await this.callGPPgetField(page, "tcfcav1.LastUpdated");
            // const getField = await this.callGPPgetField(page, "tcfcav1.CmpId");
            const getField = await callGPPgetField(page, "tcfcav1.CmpId");

            if (getField) {
                getFields.push(getField);
                // console.log('Field found:', getField);
            } else {
                console.log("No field found.");
            }

            console.log("Attempting to retrieve USP string...");
            const uspString = await uspPing(page);

            if (uspString) {
                this.scanResult.uspString.push(uspString);
                // console.log('USP string retrieved:', uspString);
            } else {
                console.log("No USP string retrieved.");
            }

            console.log("Attempting to retrieve TCF string...");
            const tcfString = await tcfPing(page);

            if (tcfString) {
                this.scanResult.tcfString.push(tcfString);
                // console.log('TCF string retrieved:', tcfString);
            } else {
                console.log("No TCF string retrieved.");
            }
        }
        this.pendingScan.resolve();

        this.scanResult = {
            cmpData,
            gppObjects,
            hasSections,
            getSections,
            getField: getFields,
            uspString: this.scanResult.uspString,
            tcfString: this.scanResult.tcfString,
            tcfEventListenerData: this.scanResult.tcfEventListenerData,
            gppEventListenerData: this.scanResult.gppEventListenerData,
            OneTrustActiveGroups: this.scanResult.OneTrustActiveGroups,
            DidomiCurrentUserStatus: this.scanResult.DidomiCurrentUserStatus,
        };
        // console.log('Scan result:', this.scanResult);
    }

    getData() {
        return this.scanResult;
    }
}
module.exports = GPPCollector;
