/**
 * @param {import('puppeteer').Page} page - The Puppeteer page instance.
 * @param {function} onEventData - Callback function to handle event data when the listener is triggered
 */
/* eslint-disable no-undef */
const gppEventListener = async (page, onEventData) => {
    try {
        // Expose the callback function to the page context
        // @ts-ignore
        await page.exposeFunction('handleGPPEventData', gppData => {
            onEventData(gppData);  // Call the onEventData callback with the event data
        });

        // Add event listener to the page using __gppapi
        await page.evaluate(() => {
            // @ts-ignore
            if (typeof window.__gpp === 'function') {
                // @ts-ignore
                window.__gpp('addEventListener', (gppData, success) => {
                    if (success) {
                        console.log('GPP Event Listener triggered:', gppData);
                        // Call the exposed function in Node.js context with tcData
                        // @ts-ignore
                        window.handleGPPEventData(gppData);
                    } else {
                        console.error('Failed to retrieve GPP Event Data.');
                    }
                });
            } else {
                console.warn('__gpp is not available on the window object');
            }
        });
        console.log('GPP Event Listener added successfully.');
    } catch (error) {
        console.error('Error adding GPP Event Listener:', error);
    }
};

module.exports = gppEventListener;