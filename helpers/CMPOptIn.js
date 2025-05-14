const {optInOneTrust, optInCookieBot, optInDidomi, optInQuantcast, optInUserCentrics} = require('./optinHelpers');


/**
 * CMP Opt-In Conducted in this function
 * @param {import('puppeteer').Page} page - The Puppeteer page instance.
 */
const optInForCMPs = async page => {
    const cmpResults = [];
    // Checking if CMPs are present on the page and opting out if they are
    try {
        const oneTrustResult = await optInOneTrust(page);
        if (oneTrustResult) {
            cmpResults.push(oneTrustResult);
        }
    } catch {
        console.error("Error opting in for OneTrust CMP");
    }
    try {
        const cookieBotResult = await optInCookieBot(page);
        if (cookieBotResult) {
            cmpResults.push(cookieBotResult);
        }
    } catch {
        console.error("Error opting in for CookieBot CMP");
    }
    try {
        const didomiResult = await optInDidomi(page);
        if (didomiResult) {
            cmpResults.push(didomiResult);
        }
    } catch {
        console.error("Error opting out of Didomi CMP");
    }
    try {
        const qcResult = await optInQuantcast(page);
        if (qcResult) {
            cmpResults.push(qcResult);
        }
    } catch {
        console.error("Error opting in for Quantcast CMP");
    }
    try {
        const ucResult = await optInUserCentrics(page);
        if (ucResult) {
            cmpResults.push(ucResult);
        }
    } catch (error) {
        console.error("Error opting in for UserCentrics CMP", error);
    }

    return cmpResults;
};


module.exports = optInForCMPs;