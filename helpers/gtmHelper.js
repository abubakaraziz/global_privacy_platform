/**
 * @param {import('puppeteer').Page} page - The Puppeteer page instance.
 */
/* eslint-disable no-undef */
const getGTMObject = async page => {
    try {
        const gtmObject = await page.evaluate(async () => {
          // @ts-ignore
          //get the window.google_tag_data object
            if (window.google_tag_data) {
                // @ts-ignore
                const tagData = await window.google_tag_data;

                return tagData;
            }
            return null;
        });
        return gtmObject;
    } catch {
        console.log("Unable to get google tag data.");
        return null;
    }
};

/**
 * @param {import('puppeteer').Page} page - The Puppeteer page instance.
 */
/* eslint-disable no-undef */
const getDataLayer = async page => {
    try {
        const dataLayer = await page.evaluate(async () => {
            // @ts-ignore
            if (window.dataLayer) {
                // @ts-ignore
                const dataLayerObject = await window.dataLayer;

                return dataLayerObject;
            }
            return null;
        });
        return dataLayer;
    } catch {
        console.log("Unable to get dataLayer Object.");
        return null;
    }
};

module.exports = {getGTMObject, getDataLayer};