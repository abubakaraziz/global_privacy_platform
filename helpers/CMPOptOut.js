const {optOutOneTrust, optOutCookieBot, optOutDidomi, optOutQuantcast, optOutUserCentrics, optOutOsano} = require('./optoutHelpers');

/**
 * CMP Opt-Out Conducted in this function
 * @param {import('puppeteer').Page} page - The Puppeteer page instance.
 */
const optOutFromCMPs = async page => {
    const cmpResults = [];
    
    // Checking if CMPs are present on the page and opting out if they are
    const oneTrustResult = await optOutOneTrust(page);
    cmpResults.push(oneTrustResult);
      
    const cookieBotResult = await optOutCookieBot(page);
    cmpResults.push(cookieBotResult);
    
    const didomiResult = await optOutDidomi(page);
    cmpResults.push(didomiResult);
    
    const qcResult = await optOutQuantcast(page);
    cmpResults.push(qcResult);
/* 
    const ucResult = await optOutUserCentrics(page);
    cmpResults.push(ucResult);

    const osanoResult = await optOutOsano(page);
    cmpResults.push(osanoResult);
*/
    return cmpResults;
};

module.exports = optOutFromCMPs;