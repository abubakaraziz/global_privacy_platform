/**
 * @param {import('puppeteer').Page} page - The Puppeteer page instance.
 */
/* eslint-disable no-undef */
const gppPing = async page => {
    try {
        const gppObject = await page.evaluate(() => new Promise(resolve => {
                // Check if __gpp function exists on the window object
                // @ts-ignore
            if (typeof window.__gpp !== 'function') {
                resolve(null); // Resolve with null if __gpp doesn't exist
                return;
            }

            // Adding a simple timeout in case function call takes too long
            setTimeout(() => resolve(null), 5000);

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
    } catch{
        console.log('Error calling GPP function in Ping');
        return null;
    }
};

module.exports = gppPing;