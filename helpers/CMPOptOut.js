const {optOutOneTrust, optOutCookieBot, optOutDidomi, optOutQuantcast, optOutUserCentrics} = require('./optoutHelpers');

/**
 * CMP Opt-Out Conducted in this function
 * @param {import('puppeteer').Page} page - The Puppeteer page instance.
 */
const optOutFromCMPs = async page => {
    const cmpResults = [];
    // Checking if CMPs are present on the page and opting out if they are
    try {
        const oneTrustResult = await optOutOneTrust(page);
        if (oneTrustResult) {
            cmpResults.push(oneTrustResult);
        }
    } catch {
        console.error("Error opting out of OneTrust CMP");
    }
    try {
        const cookieBotResult = await optOutCookieBot(page);
        if (cookieBotResult) {
            cmpResults.push(cookieBotResult);
        }
    } catch {
        console.error("Error opting out of CookieBot CMP");
    }
    try {
        const didomiResult = await optOutDidomi(page);
        if (didomiResult) {
            cmpResults.push(didomiResult);
        }
    } catch {
        console.error("Error opting out of Didomi CMP");
    }
    try {
        const qcResult = await optOutQuantcast(page);
        if (qcResult) {
            cmpResults.push(qcResult);
        }
    } catch {
        console.error("Error opting out of Quantcast CMP");
    }
    try {
        const ucResult = await optOutUserCentrics(page);
        if (ucResult) {
            cmpResults.push(ucResult);
        }
    } catch (error) {
        console.error("Error opting out of UserCentrics CMP", error);
    }

    return cmpResults;
};

module.exports = optOutFromCMPs;