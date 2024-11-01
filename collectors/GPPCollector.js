/* eslint-disable no-await-in-loop */
const BaseCollector = require('./BaseCollector');
const createDeferred = require('../helpers/deferred');
// Loading in the helper uspPing function
const uspPing = require('../helpers/uspPing');
const gppPing = require('../helpers/gppPing');
const callGPPhasSections = require('../helpers/gppHasSections');
const callGPPgetSections = require('../helpers/gppGetSections');
const callGPPgetField = require('../helpers/gppGetField');

/**
 * @typedef {Object} ScanResult
 * @property {string[]} gppObjects
 * @property {{ api: any; hasSection: any; }[]} hasSections
 * @property {{ api: any; getSection: any; }[]} getSections
 * @property {any[]} getField
 * @property {string[]} uspString
 */

/**
 * Scrolls to the bottom of the page in increments.
 *
 * @param {import('puppeteer').Page} page - The Puppeteer page instance.
 * @returns {Promise<void>} - A promise that resolves when the page has been scrolled to the bottom.
 */

class GPPCollector extends BaseCollector {
    id() {
        return 'gpp';
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
            getField: [],
            uspString: []
        };
    }

    async postLoad() {
        /**
         * @type {string[]}
         */
        const gppObjects = [];
        const hasSections = [];
        const getSections = [];
        const getFields = [];
    
        const pages = await this.context.pages();


        if (pages.length > 0) {
            const page = pages[0];
            
            // Scroll to the bottom of the page to load all the content
            // await page.waitForTimeout(2000);
            // await scrollToBottom(page);
          
            // let gppObject  = [""]
            console.log('Attempting to retrieve GPP objects...');
            const gppObject = await gppPing(page);

            if (gppObject) {
                gppObjects.push(gppObject);
                console.log('GPP object retrieved:', gppObject);
            } else {
                console.log('No GPP object retrieved.');
            }

            console.log('Attempting to check for sections...');
            const hasSection = await callGPPhasSections(page, gppObject);

            if (hasSection) {
                hasSections.push(...hasSection);
                console.log('Sections found:', hasSection);
            } else {
                console.log('No sections found.');
            }

            console.log('Attempting to get sections...');
            // const getSection = await this.callGPPgetSections(page, gppObject);
            const getSection = await callGPPgetSections(page, gppObject);

            if (getSection) {
                getSections.push(...getSection);
                console.log('Sections found:', getSection);
            } else {
                console.log('No sections found.');
            }

            console.log('Attempting to get field...');
            // const getField = await this.callGPPgetField(page, "tcfcav1.LastUpdated");
            // const getField = await this.callGPPgetField(page, "tcfcav1.CmpId");
            const getField = await callGPPgetField(page, "tcfcav1.CmpId");

            if (getField) {
                getFields.push(getField);
                console.log('Field found:', getField);
            } else {
                console.log('No field found.');
            }

            console.log('Attempting to retrieve USP string...');
            const uspString = await uspPing(page);

            if (uspString) {
                this.scanResult.uspString.push(uspString);
                console.log('USP string retrieved:', uspString);
            } else {
                console.log('No USP string retrieved.');
            }
        }
        this.pendingScan.resolve();
        this.scanResult = {
            gppObjects,
            hasSections,
            getSections,
            getField: getFields,
            uspString: this.scanResult.uspString
        };
        console.log('Scan result:', this.scanResult);
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