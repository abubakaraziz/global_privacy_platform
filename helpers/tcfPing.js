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

            // Adding a simple timeout in case function call takes too long
            setTimeout(() => resolve(null), 5000);

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
        
        return tcfObject; // Return the retrieved object
    } catch{
        console.log('Error calling TCF function');
        return null;
    }
};

module.exports = tcfPing;