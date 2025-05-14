const {
    optInOneTrust,
    optInCookieBot,
    optInDidomi,
    optInQuantcast,
    optInUserCentrics,
    optInOsano,
} = require("./optinHelpers");

/**
 * CMP Opt-In Conducted in this function
 * @param {import('puppeteer').Page} page - The Puppeteer page instance.
 */
const optInForCMPs = async page => {
    const cmpResults = [];

    const oneTrustResult = await optInOneTrust(page);
    cmpResults.push(oneTrustResult);

    const cookieBotResult = await optInCookieBot(page);
    cmpResults.push(cookieBotResult);

    const didomiResult = await optInDidomi(page);
    cmpResults.push(didomiResult);
    
    const qcResult = await optInQuantcast(page);
    cmpResults.push(qcResult);
       
    const ucResult = await optInUserCentrics(page);
    cmpResults.push(ucResult);

    const osanoResult = await optInOsano(page);
    cmpResults.push(osanoResult);

    return cmpResults;
};

module.exports = optInForCMPs;
