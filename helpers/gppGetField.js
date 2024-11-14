/**
 * @param {import('puppeteer').Page} page - The Puppeteer page instance.
 * @param {string} fieldName - The field name to retrieve from the GPP object.
 */
/* eslint-disable no-undef */
const callGPPgetField = async(page, fieldName) => {
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
    } catch{
        console.error('Error calling GPP function');
        return null;
    }
};

module.exports = callGPPgetField;