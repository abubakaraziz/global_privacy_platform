/**
 * @param {import('puppeteer').Page} page - The Puppeteer page instance.
 */
/* eslint-disable no-undef */
const tcfPing = async page => {
    try {
        const tcfObject = await page.evaluate(() => new Promise(resolve => {
            // Check if __tcfapi function exists on the window object
            // @ts-ignore
            if (typeof window.__tcfapi !== 'function') {
                resolve(null); // Resolve with null if __tcfapi doesn't exist
                return;
            }
            // Call the __tcfapi function if it exists
            // @ts-ignore
            window.__tcfapi('getTCData', 2, (tcData, success) => {
                if (success) {
                    resolve(tcData);
                } else {
                    resolve(null);
                }
            });
        }));
        if (tcfObject) {
            console.log('TCF object retrieved:', tcfObject);
        } else {
            console.log('No TCF object retrieved.');
        }
        return tcfObject; // Return the retrieved object
    } catch (error) {
        console.error('Error calling TCF function:', error);
        return null;
    }
};

module.exports = tcfPing;