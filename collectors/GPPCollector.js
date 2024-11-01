/* eslint-disable no-await-in-loop */
const BaseCollector = require('./BaseCollector');
const createDeferred = require('../helpers/deferred');

/**
 * @typedef {Object} ScanResult
 * @property {string[]} gppObjects
 * @property {{ api: any; hasSection: any; }[]} hasSections
 * @property {{ api: any; getSection: any; }[]} getSections
 * @property {any[]} getField
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
            getField: []
        };
    }

    /**
     * @param {import('puppeteer').Page} page - The Puppeteer page instance.
     */
    /* eslint-disable no-undef */
    async callGPPPing(page) {
        try {
            const gppObject = await page.evaluate(() => new Promise(resolve => {
                    // Check if __gpp function exists on the window object
                    // @ts-ignore
                if (typeof window.__gpp !== 'function') {
                    resolve(null); // Resolve with null if __gpp doesn't exist
                    return;
                }
                    // Call the __gpp function if it exists
                    // @ts-ignore
                window.__gpp('ping', (gppData, success) => {
                    if (success) {
                        resolve(gppData);
                    } else {
                        resolve(null);
                    }
                });
            }));
            if (gppObject) {
                console.log('GPP object retrieved:', gppObject);
            } else {
                console.log('No GPP object retrieved.');
            }
            return gppObject; // Return the retrieved object
        } catch (error) {
            console.error('Error calling GPP function:', error);
            return null;
        }
    }
    /* eslint-disable no-undef */
    

    /**
     * @param {import('puppeteer').Page} page - The Puppeteer page instance.
     * @param {any} gppObject - The GPP object to use for the hasSection calls.
     */
    async callGPPhasSections(page, gppObject) {
        try {
            // Extract supported APIs from the gppObject
            const supportedAPIs = gppObject.supportedAPIs;
            const hasSections = [];

            // Loop through each supported API and call hasSection
            for (const api of supportedAPIs) {
                // Extract the part after the colon (e.g., 'tcfcav1' from '5:tcfcav1')
                const apiIdentifier = api.split(':')[1];

                // Check if we have a valid apiIdentifier
                if (apiIdentifier) {
                    const hasSection = await page.evaluate(apiId => new Promise(resolve => {
                            // Check if __gpp function exists on the window object
                            // @ts-ignore
                        if (typeof window.__gpp !== 'function') {
                            resolve(null); // Resolve with null if __gpp doesn't exist
                            return;
                        }
                            // Call the __gpp function with the apiId
                            // @ts-ignore
                        window.__gpp('hasSection', (/** @type {Boolean} */ data, /** @type {Boolean} */ success) => {
                            if (success) {
                                resolve(data);
                            } else {
                                resolve(null);
                            }
                        }, apiId); // Pass the dynamic apiId (e.g., 'tcfcav1')
                    }), apiIdentifier);

                    // Add the result (true/false/null) to the hasSections array
                    hasSections.push({api: apiIdentifier, hasSection});
                }
            }
            return hasSections; // Return the array of sections
        } catch (error) {
            console.error('Error checking for sections:', error);
            return null;
        }
        
    }

    /**
     * @param {import('puppeteer').Page} page - The Puppeteer page instance.
     * @param {any} gppObject - The GPP object to use for the getSection calls.
     */
    async callGPPgetSections(page, gppObject) {
        try {
            // Extract supported APIs from the gppObject
            const supportedAPIs = gppObject.supportedAPIs;
            const getSections = [];

            // Loop through each supported API and call getSection
            for (const api of supportedAPIs) {
                // Extract the part after the colon (e.g., 'tcfcav1' from '5:tcfcav1')
                const apiIdentifier = api.split(':')[1];

                // Check if we have a valid apiIdentifier
                if (apiIdentifier) {
                    const getSection = await page.evaluate(apiId => new Promise(resolve => {
                            // Check if __gpp function exists on the window object
                            // @ts-ignore
                        if (typeof window.__gpp !== 'function') {
                            resolve(null); // Resolve with null if __gpp doesn't exist
                            return;
                        }
                            // Call the __gpp function with the apiId
                            // @ts-ignore
                        window.__gpp('getSection', (/** @type {Boolean} */ data, /** @type {Boolean} */ success) => {
                            if (success) {
                                resolve(data);
                            } else {
                                resolve(null);
                            }
                        }, apiId); // Pass the dynamic apiId (e.g., 'tcfcav1')
                    }), apiIdentifier);

                    // Add the result (true/false/null) to the getSections array
                    getSections.push({api: apiIdentifier, getSection});
                }
            }
            return getSections; // Return the array of sections
        } catch (error) {
            console.error('Error checking for sections:', error);
            return null;
        }
    }

    /**
     * @param {import('puppeteer').Page} page - The Puppeteer page instance.
     * @param {string} fieldName - The field name to retrieve from the GPP object.
     */
    async callGPPgetField(page, fieldName) {
        try {
            const getField = await page.evaluate(field => new Promise(resolve => {
                    // Check if __gpp function exists on the window object
                    // @ts-ignore
                if (typeof window.__gpp !== 'function') {
                    resolve(null); // Resolve with null if __gpp doesn't exist
                    return;
                }
                    // Call the __gpp function if it exists
                    // @ts-ignore
                window.__gpp('getField', (gppData, success) => {
                    if (success) {
                        resolve(gppData);
                    } else {
                        resolve(null);
                    }
                }, field);
            }), fieldName);  // Pass fieldName as an argument here
            
            if (getField) {
                console.log('GPP field retrieved:', getField);
            } else {
                console.log('No GPP field retrieved.');
            }
            return getField; // Return the retrieved object
        } catch (error) {
            console.error('Error calling GPP function:', error);
            return null;
        }
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
            const gppObject = await this.callGPPPing(page);

            if (gppObject) {
                gppObjects.push(gppObject);
                console.log('GPP object retrieved:', gppObject);
            } else {
                console.log('No GPP object retrieved.');
            }

            console.log('Attempting to check for sections...');
            const hasSection = await this.callGPPhasSections(page, gppObject);

            if (hasSection) {
                hasSections.push(...hasSection);
                console.log('Sections found:', hasSection);
            } else {
                console.log('No sections found.');
            }

            console.log('Attempting to get sections...');
            const getSection = await this.callGPPgetSections(page, gppObject);

            if (getSection) {
                getSections.push(...getSection);
                console.log('Sections found:', getSection);
            } else {
                console.log('No sections found.');
            }

            console.log('Attempting to get field...');
            // const getField = await this.callGPPgetField(page, "tcfcav1.LastUpdated");
            const getField = await this.callGPPgetField(page, "tcfcav1.CmpId");

            if (getField) {
                getFields.push(getField);
                console.log('Field found:', getField);
            } else {
                console.log('No field found.');
            }
        }
        this.pendingScan.resolve();
        this.scanResult = {
            gppObjects,
            hasSections,
            getSections,
            getField: getFields
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