/**
 * @param {import('puppeteer').Page} page - The Puppeteer page instance.
 * @param {any} gppObject - The GPP object to use for the getSection calls.
 */
/* eslint-disable no-undef */
const GPPgetSections = async(page, gppObject) => {
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
                // eslint-disable-next-line no-await-in-loop
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
    } catch{
        console.error('Could not do GPP getSections');
        return null;
    }
};

module.exports = GPPgetSections;