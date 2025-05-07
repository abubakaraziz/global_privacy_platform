/**
 * @param {import('puppeteer').Page} page - The Puppeteer page instance.
 */
/* eslint-disable no-undef */
const getGTMObject =  page => {

    const gtmObjectPromise = page.evaluate(() => {
              // @ts-ignore
                //get the window.google_tag_data object
        if (window.google_tag_data) {
                    // @ts-ignore
            return window.google_tag_data;
        }
        return null;
    });
            
    const timeoutPromise = new Promise(resolve => {
        setTimeout(() => {
            resolve(null);
        }, 5000); // 5 seconds timeout
    });
    
    return Promise.race([gtmObjectPromise, timeoutPromise]);

    
};

/**
 * @param {import('puppeteer').Page} page - The Puppeteer page instance.
 */
/* eslint-disable no-undef */
const getDataLayer = page => {
    
    const dataLayerPromise = page.evaluate(() => {
            // @ts-ignore
        if (window.dataLayer) {
                // @ts-ignore
            return window.dataLayer;
        }
        return null;
    });
    
    const timeoutPromise = new Promise(resolve => {
        setTimeout(() => {
            resolve(null);
        }, 5000); // 5 seconds timeout
    });

    return Promise.race([dataLayerPromise, timeoutPromise]);
};

module.exports = {getGTMObject, getDataLayer};