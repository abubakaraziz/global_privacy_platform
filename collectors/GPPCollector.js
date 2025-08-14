/* eslint-disable no-undef */
/* eslint-disable no-await-in-loop */
/* eslint-disable max-lines */
const BaseCollector = require("./BaseCollector");
const createDeferred = require("../helpers/deferred");
// Loading in the helper uspPing function
const uspPing = require("../helpers/uspPing");
const gppPing = require("../helpers/gppPing");
const callGPPhasSections = require("../helpers/gppHasSections");
const callGPPgetSections = require("../helpers/gppGetSections");
const tcfPing = require("../helpers/tcfPing");
const {oneTrustActiveGroups, didomiUserStatus, cookieBotConsent, quantcastPresence} = require("../helpers/CMPConsentFunctions");

/**
 * @typedef {Object} ScanResult
 * @property {string[]} gppObjects
 * @property {{ api: any; hasSection: any; }[]} hasSections
 * @property {{ api: any; getSection: any; }[]} getSections
 * @property {string[]} uspString
 * @property {string[]} tcfString
 * @property {any} cmpConsentObject
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
            gppObjects: [],
            hasSections: [],
            getSections: [],
            uspString: [],
            tcfString: [],
            cmpConsentObject: [],
        };
    }

    /**
     * @param {import('puppeteer').Page} page
     */
   /* eslint-disable-next-line require-await */
    async setPage(page) {
        this.page = page;
        // 
        // //@ts-ignore
        // const updateTCFScanResult = tcData => {
        //     this.scanResult.tcfEventListenerData.push(tcData);
        //     // console.log('TCF event data added to scanResult:', tcData);
        // };
        // 
        // //@ts-ignore    
        // const updateGPPScanResult = gppData => {
        //     this.scanResult.gppEventListenerData.push(gppData);
        //     // console.log("GPP event data added to scanResult:", gppData);
        // };
        // 
        // 
        // //@ts-ignore
        // await page.exposeFunction('handleTCFEventData', tcData => {
        //     console.log('TCF Event Listener triggered.');
        //     updateTCFScanResult(tcData);  // Call the onEventData callback with the event data
        // });
        // 
        // 
        // // Expose the callback function to the page context
        // // @ts-ignore
        // await page.exposeFunction('handleGPPEventData', gppData => {
        //     console.log('GPP Event Listener triggered.');
        //     updateGPPScanResult(gppData);  // Call the onEventData callback with the event data
        // });
        // 
        // console.log(`Script injected for page: ${page.url} in setPage`);
        // 
    }

    /**
     * @param {{cdpClient: import('puppeteer').CDPSession, url: string, type: import('./TargetCollector').TargetType}} targetInfo
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async addTarget(targetInfo) {
        
    }

    async postLoad() {
        /**
         * @type {string[]}
         */
        const gppObjects = [];
        const hasSections = [];
        const getSections = [];

        const pages = await this.context.pages();
       
        if (pages.length > 0) {
            const page = this.page;
 

            // CMP Detection and Retrieve Consent Object Below
            
            const oneTrustData = await oneTrustActiveGroups(page);
            this.scanResult.cmpConsentObject.push(oneTrustData);
        
            // Checking for the Didomi CMP and retrieving the consent object    
            const didomiStatus = await didomiUserStatus(page);
            this.scanResult.cmpConsentObject.push(didomiStatus);
            
            // Checking for the CookieBot CMP and retrieving the consent object
            // @ts-ignore
            const cookieBotConsentObject = await cookieBotConsent(page);
            this.scanResult.cmpConsentObject.push(cookieBotConsentObject);
            
            
            // Checking for the Quantcast CMP and retrieving the consent object
            const quantCastPresent = await quantcastPresence(page);
            this.scanResult.cmpConsentObject.push(quantCastPresent);
           
            
            


            //get GPP ping 
            const gppObject = await gppPing(page);

            if (gppObject) {
                gppObjects.push(gppObject);
            }
            //Check GPP hasSections for sections that we get from gppObject
            const hasSection = await callGPPhasSections(page, gppObject);

            if (hasSection) {
                hasSections.push(...hasSection);
            }
            //get GPP getSections for sections that we get from gppObject
            const getSection = await callGPPgetSections(page, gppObject);
            if (getSection) {
                getSections.push(...getSection);
            }

            //get uspString
            const uspString = await uspPing(page);

            if (uspString) {
                this.scanResult.uspString.push(uspString);
            }

            
            //get tcfString
            const tcfString = await tcfPing(page);

            if (tcfString) {
                this.scanResult.tcfString.push(tcfString);
            }
        }
        this.pendingScan.resolve();

        this.scanResult = {
            gppObjects,
            hasSections,
            getSections,
            uspString: this.scanResult.uspString,
            tcfString: this.scanResult.tcfString,
            cmpConsentObject: this.scanResult.cmpConsentObject,
        };
    }

    getData() {
        return this.scanResult;
    }
}
module.exports = GPPCollector;