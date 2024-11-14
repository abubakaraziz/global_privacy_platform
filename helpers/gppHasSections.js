/**
 * @param {import('puppeteer').Page} page - The Puppeteer page instance.
 * @param {any} gppObject - The GPP object to use for the hasSection calls.
 */
/* eslint-disable no-undef */
const callGPPhasSections = async (page, gppObject) => {
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
                // eslint-disable-next-line no-await-in-loop
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
    } catch{
        console.error('Error checking for sections');
        return null;
    }
};

module.exports = callGPPhasSections;