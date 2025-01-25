/**
 * @param {import('puppeteer').Page} page - The Puppeteer page instance.
 */
/* eslint-disable no-undef */
const oneTrustActiveGroups = async page => {
    try {
        const oneTrustActiveGroupsObject = await page.evaluate(() => new Promise(resolve => {
                // Check if OneTrustActiveGroups exists on the window object
                // @ts-ignore
            if (typeof window.OnetrustActiveGroups === 'string') {
                // @ts-ignore
                resolve(window.OnetrustActiveGroups);
            }
            resolve(null);
        }));
        if (oneTrustActiveGroupsObject) {
            console.log('OneTrustActiveGroups object retrieved:', oneTrustActiveGroupsObject);
        } else {
            console.log('No OneTrustActiveGroups object retrieved.');
        }
        return oneTrustActiveGroupsObject; // Return the retrieved object
    } catch{
        console.error('Error getting OneTrustActiveGroups object');
        return null;
    }
};

// const oneTrustActiveGroups = async page => {
//     try {
//         const oneTrustActiveGroupsObject = await page.evaluate(() => {
//             // Check if OneTrustActiveGroups exists on the window object
//             // @ts-ignore
//             if (typeof window.OnetrustActiveGroups === 'string') {
//                 // @ts-ignore
//                 return window.OnetrustActiveGroups;
//             }
//             return null;
//         });
//         if (oneTrustActiveGroupsObject) {
//             console.log('OneTrustActiveGroups object retrieved:', oneTrustActiveGroupsObject);
//         } else {
//             console.log('No OneTrustActiveGroups object retrieved.');
//         }
//         return oneTrustActiveGroupsObject; // Return the retrieved object
//     } catch {
//         console.error('Error getting OneTrustActiveGroups object');
//         return null;
//     }
// };

/**
 * @param {import('puppeteer').Page} page - The Puppeteer page instance.
 */
/* eslint-disable no-undef */
const didomiUserStatus = async page => {
    try {
        const didomiUserStatusObject = await page.evaluate(() => new Promise(resolve => {
                // Check if DidomiUserStatus exists on the window object
                // @ts-ignore
            if (window.Didomi) {
                console.log('Didomi CMP found');
                // @ts-ignore
                // Checking the the user status function exists
                // @ts-ignore
                if (typeof window.Didomi.getCurrentUserStatus === 'function') {
                    // @ts-ignore
                    resolve(window.Didomi.getCurrentUserStatus());
                } else {
                    console.log('Didomi.getCurrentUserStatus function not found');
                    resolve(null);
                }
            } else {
                console.log('Didomi CMP not found');
                resolve(null);
            }
        }));
        if (didomiUserStatusObject) {
            console.log('Didomi object retrieved:', didomiUserStatusObject);
        } else {
            console.log('No Didomi object retrieved.');
        }
        return didomiUserStatusObject; // Return the retrieved object
    } catch{
        console.error('Error getting Didomi object');
        return null;
    }
};

module.exports = {oneTrustActiveGroups, didomiUserStatus};