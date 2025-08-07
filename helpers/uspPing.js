/**
 * @param {import('puppeteer').Page} page - The Puppeteer page instance.
 */
/* eslint-disable no-undef */
const uspPing = async page => {
    try {
        const uspString = await page.evaluate(() => new Promise(resolve => {
            // Check if __uspapi function exists on the window object
            // @ts-ignore
            if (typeof window.__uspapi !== 'function') {
                resolve(null); // Resolve with null if __uspapi doesn't exist
                return;
            }

            // Adding a simple timeout in case function call takes too long
            setTimeout(() => resolve(null), 5000);

            // Call the __uspapi function if it exists
            // @ts-ignore
            window.__uspapi('getUSPData',1, (uspData, success) => {
                if (success) {
                    resolve(uspData);
                } else {
                    resolve(null);
                }
            });
        }));
        return uspString; // Return the retrieved object
    } catch{
        console.log('Error calling USP function in Ping');
        return null;
    }
};

module.exports = uspPing;
