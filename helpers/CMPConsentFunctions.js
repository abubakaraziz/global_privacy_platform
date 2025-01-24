/**
 * @param {import('puppeteer').Page} page - The Puppeteer page instance.
 */
/* eslint-disable no-undef */
const oneTrustActiveGroups = async page => {
    try {
        const oneTrustActiveGroupsObject = await page.evaluate(() => new Promise(resolve => {
                // Check if OneTrustActiveGroups exists on the window object
                // @ts-ignore
            if (typeof window.OnetrustActiveGroups !== 'string') {
                console.log('OneTrustActiveGroups object not found or not a string');
                resolve(null); // Resolve with null if OneTrustActiveGroups doesn't exist
                return;
            }
                // Call the OneTrustActiveGroups object if it exists
                // @ts-ignore
            resolve(window.OnetrustActiveGroups);
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

module.exports = oneTrustActiveGroups;