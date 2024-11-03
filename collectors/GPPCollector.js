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
const CMPCollector = require("./CMPCollector");
const {
    optOutDidomi,
    optOutOneTrust,
    optOutQuantcast,
    optOutCookieBot,
} = require("../helpers/optoutHelpers");

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
        await this.cmpCollector.addTarget(targetInfo);
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

            // Callback to store tcData in scanResult
            // @ts-ignore
            const updateScanResultWithEventData = tcData => {
                this.scanResult.tcfEventListenerData.push(tcData);
                // console.log('TCF event data added to scanResult:', tcData);
            };

            // Add event listener defined above to listen for TCF events
            await tcfEventListener(page, updateScanResultWithEventData);

            //next step: try detecting CMPs and opting out of data sharing
            try {
                //call the CMP collector postLoad
                await this.cmpCollector.postLoad();

                //get the data from the CMP collector
                cmpData = await this.cmpCollector.getData();

                console.log("CMP data retrieved by GPP collector:", cmpData);

                if (cmpData) {
                    //now that we have the CMP data, we can check if it belongs to one of our target CMPs
                    if (cmpData[0].name === "com_didomi.io") {
                        //if the CMP is Didomi, we follow the Didomi specific logic
                        console.log("Didomi CMP detected");

                        await optOutDidomi(page);
                    } else if (cmpData[0].name === "Onetrust") {
                        //if the CMP is OneTrust, we follow the OneTrust specific logic based on: https://developer.onetrust.com/onetrust/docs/javascript-api
                        console.log("OneTrust CMP detected");

                        await optOutOneTrust(page);
                    } else if (cmpData[0].name === "quantcast") {
                        //if the CMP is Quantcast, we follow the Quantcast specific logic based on: 
                        console.log("Quantcast CMP detected");

                        await optOutQuantcast(page);
                    } else if (cmpData[0].name === "Cybotcookiebot") {
                        //if the CMP is CookieBot, we follow the CookieBot specific logic based on: https://www.cookiebot.com/en/developer/ 
                        console.log("CookieBot CMP detected");

                        await optOutCookieBot(page);
                    }
                }
            } catch (error) {
                console.error(
                    "Error while processing CMP data or opting out:",
                    error
                );
            }

            // Scroll to the bottom of the page to load all the content
            // await page.waitForTimeout(2000);
            // await scrollToBottom(page);

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

            console.log("CMP data retrieved by GPP collector:", cmpData);
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
        };
        // console.log('Scan result:', this.scanResult);
    }

    getData() {
        // await options.page.waitForTimeout(5000);
        // scroll to the top of the page
        // await scrollToTop(options.page);
        console.log("Scrolling to the top of the page");
        // await options.page.evaluate(() => {
        //     window.scrollTo(0, 0);
        // });

        return this.scanResult;
    }
}

module.exports = GPPCollector;
