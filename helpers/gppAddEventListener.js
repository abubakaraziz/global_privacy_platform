/**
 * @param {import('puppeteer').Page} page - The Puppeteer page instance.
 */
/* eslint-disable no-undef */
const gppAddEventListener = async page => {
    try {
        // Add event listener to the page using __gpp
        const eventData = await page.evaluate(() => new Promise(resolve => {
            // Check if __gpp function exists on the window object
            // @ts-ignore
            if (typeof window.__gpp !== 'function') {
                resolve(null);
                return;
            }

            // Adding a timeout in case function call takes too long
            setTimeout(() => resolve(null), 3000);
            // Register the event listener and get the event object
            // @ts-ignore
            const eventObj = window.__gpp('addEventListener', () => {});
            resolve(eventObj);
        }));

        if (eventData) {
            return eventData;
        }
        return null;
        
    } catch (error) { // eslint-disable-line @typescript-eslint/no-unused-vars
        return null;
    }
};

module.exports = gppAddEventListener;