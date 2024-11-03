// /**
//  * @param {import('puppeteer').Page} page - The Puppeteer page instance.
//  * @param {function} onEventData - Callback function to handle event data when the listener is triggered
//  */
// /* eslint-disable no-undef */
// const tcfEventListener = async (page, onEventData) => {
//     try {
//         // Execute code within the page context
//         await page.evaluate(callbackName => {
//             // Check if __tcfapi function exists on the window object
//             if (typeof window.__tcfapi !== 'function') {
//                 console.warn('__tcfapi is not available on the window object');
//                 return;
//             }

//             // Call the __tcfapi function to add an event listener
//             window.__tcfapi('addEventListener', 2, (tcData, success) => {
//                 if (success) {
//                     console.log('TCF Event Listener triggered:', tcData);
//                     // Call the callback defined in Puppeteer context with tcData
//                     window[callbackName](tcData);  // This calls the callback with tcData
//                 } else {
//                     console.error('Failed to retrieve TCF Event Data.');
//                 }
//             });
//         }, onEventData.name); // Pass the name of the callback function to the evaluate scope

//         console.log('TCF Event Listener added successfully.');
//     } catch (error) {
//         console.error('Error adding TCF Event Listener:', error);
//     }
// };

// module.exports = tcfEventListener;

/**
 * @param {import('puppeteer').Page} page - The Puppeteer page instance.
 * @param {function} onEventData - Callback function to handle event data when the listener is triggered
 */
/* eslint-disable no-undef */
const tcfEventListener = async (page, onEventData) => {
    try {
        // Expose the callback function to the page context
        // @ts-ignore
        await page.exposeFunction('handleTCFEventData', tcData => {
            onEventData(tcData);  // Call the onEventData callback with the event data
        });

        // Add event listener to the page using __tcfapi
        await page.evaluate(() => {
            // @ts-ignore
            if (typeof window.__tcfapi === 'function') {
                // @ts-ignore
                window.__tcfapi('addEventListener', 2, (tcData, success) => {
                    if (success) {
                        console.log('TCF Event Listener triggered:', tcData);
                        // Call the exposed function in Node.js context with tcData
                        // @ts-ignore
                        window.handleTCFEventData(tcData);
                    } else {
                        console.error('Failed to retrieve TCF Event Data.');
                    }
                });
            } else {
                console.warn('__tcfapi is not available on the window object');
            }
        });

        console.log('TCF Event Listener added successfully.');
    } catch (error) {
        console.error('Error adding TCF Event Listener:', error);
    }
};

module.exports = tcfEventListener;
