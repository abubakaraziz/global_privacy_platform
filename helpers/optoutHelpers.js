/* eslint-disable no-console */ // Disable console warnings in this file

const {sleep} = require('openai/core');

/**
 * Didomi CMP opt-out logic.
 * @param {import('puppeteer').Page} page - The Puppeteer page instance.
 */

/* eslint-disable no-undef */
async function optOutDidomi(page) {
    console.log("Checking for Didomi CMP");
    const didomiResult = await page.evaluate(() => {
        let found = false;
        let optedOut = false;
        try {
        // @ts-ignore
            if (window.Didomi) {
                found = true;
                console.log("Didomi banner visible, opting out");
            // @ts-ignore
                window.Didomi.setUserDisagreeToAll();
                optedOut = true;
            } else {
                console.log("Didomi CMP or its functions not found");
            }
        } catch {
            console.log("Error opting out of Didomi.");
            optedOut = false;
        }
        const name = "Didomi";
        return {name, found, optedOut};
    });

    if (didomiResult.found) {
        return didomiResult;
    }
    return null;
}

/**
 * OneTrust opt-out logic
 * @param {import('puppeteer').Page} page - The Puppeteer page instance.
 */
async function optOutOneTrust(page) {
    console.log("Checking for OneTrust CMP");
    const result = await page.evaluate(() => {
        let found = false;
        let optedOut = false;
        try {
            // @ts-ignore
            if (window.OneTrust) {
                found = true;
                console.log("OneTrust CMP detected, opting out");
                // @ts-ignore
                // eslint-disable-next-line new-cap
                window.OneTrust.RejectAll();
                optedOut = true;
            } else {
                console.log("OneTrust CMP or its functions not found");
            }
        } catch (error) {
            console.error("Error getting OneTrust data", error);
            optedOut = false;
        }
        const name = "OneTrust";
        return {name, found, optedOut};
    });

    //only return a valid result object if CMP was at least detected
    if (result.found) {
        return result;
    }
    return null;
}
/**
 * Quantcast opt-out logic
 * @param {import('puppeteer').Page} page - The Puppeteer page instance.
 */
async function optOutQuantcast(page) {
    
    //wait for a bit
    await sleep(2000);
    const qcResult = await page.evaluate(async () => {
        console.log("Checking for Quantcast CMP");
        let found = false;
        let optedOut = false;

        try {
            const consentDialog = document.querySelector(".qc-cmp2-summary-buttons");
            if (consentDialog) {
                found = true;
                console.log("Quantcast CMP consent banner found, opting out");
                
                // @ts-ignore
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                const innerButtons = Array.from(consentDialog.querySelectorAll("button"));

                console.log("Found buttons: ", innerButtons[0].textContent, innerButtons[1].textContent);

                const rejectButton = innerButtons.find(button => button.textContent.toLowerCase().includes("reject") ||
                    button.textContent.toLowerCase().includes("disagree"));
                if (rejectButton) {
                    console.log("Reject button clicked");
                    rejectButton.click();
                    optedOut = true;
                } else {        //if there isnt a reject button on main banner, look for a button that leads to more options in a sub-banner which should contain a Reject All button
                
                    const moreOptionsButton = Array.from(document.querySelectorAll('button')).find(button => button.textContent.toLowerCase().includes('more options'));
                    if (moreOptionsButton) {
                        moreOptionsButton.click();
                        await new Promise(resolve => setTimeout(resolve, 2000));
                        const newbuttons = Array.from(document.querySelectorAll('button'));
                        console.log("Found buttons: ", newbuttons[0].textContent, newbuttons[1].textContent);

                        const rejectAllButton = newbuttons.find(button => button.textContent.toLowerCase().includes('reject all'));
                    
                        //now, find and click the save and exit button 
                        const saveAndExitButton = newbuttons.find(button => button.textContent.toLowerCase().includes('save and exit') || button.textContent.toLowerCase().includes('save & exit') || button.textContent.toLowerCase().includes('save'));
                        
                        // eslint-disable-next-line max-depth
                        if (rejectAllButton) {
                            console.log("found reject all button");
                            rejectAllButton.click();
                        }
                        await new Promise(resolve => setTimeout(resolve, 2000));
                        // eslint-disable-next-line max-depth
                        if (saveAndExitButton) {
                            console.log("found save and exit button");
                            saveAndExitButton.click();
                            optedOut = true;
                        }
                    }
                }
            } else {
                console.log("Quantcast CMP or its consent banner not found");
            }

        } catch {
            console.log("Error opting out of Quantcast");
            optedOut = false;
        }
        const name = "Quantcast";
        return {name, found, optedOut};
    });

    if (qcResult.found) {
        return qcResult;
    }
    return null;
}

/**
 * Cookiebot opt-out logic
 * @param {import('puppeteer').Page} page - The Puppeteer page instance.
 */
async function optOutCookieBot(page) {
    console.log("Checking for Cookiebot CMP");
    const result = await page.evaluate(() => {
        
        let found = false;
        let optedOut = false;
        try {
        // @ts-ignore
            if (window.CookieConsent) {
                found = true;
                console.log("Cookiebot CMP detected, opting out");
                
                // @ts-ignore
                if (typeof window.CookieConsent.submitCustomConsent === 'function') {
                // @ts-ignore
                    window.CookieConsent.submitCustomConsent(false, false, false, false); //parameters: optInPreferences, optInStatistics, optInMarketing, isImpliedConsent
                    console.log("Opted out of Cookiebot");
                    optedOut = true;
                }
           
            } else {
                console.log("Cookiebot Consent banner not found.");
            }
        } catch  {
            console.error("Error getting Cookiebot data");
            optedOut = false;
        }
        const name = "Cookiebot";
        return {name, found, optedOut};
    });

    if (result.found) {
        return result;
    }
    return null;
}

/**
 * Usercentrics opt-out logic
 * @param {import('puppeteer').Page} page - The Puppeteer page instance.
 */
async function optOutUserCentrics(page) {
    console.log("Checking for UserCentrics CMP");
    const ucResult = await page.evaluate(async () => {
        let found = false;
        let optedOut = false;

        try {
            // @ts-ignore
            if (window.UC_UI) {
                found = true;
                console.log("UserCentrics CMP detected, opting out");
                // @ts-ignore
                if(typeof window.UC_UI.denyAllConsents === 'function') {
                    // @ts-ignore
                    await window.UC_UI.denyAllConsents();
                    optedOut = true;
                }
            } else {
                console.log("UserCentrics CMP or its functions not found");
            }
        } catch {
            console.log("Error opting out of UserCentrics.");
            optedOut = false;
        }
        const name = "UserCentrics";
        return {name, found, optedOut};
    });

    if (ucResult.found) {
        return ucResult;
    }
    return null;
}

module.exports = {optOutDidomi, optOutOneTrust, optOutQuantcast, optOutCookieBot, optOutUserCentrics};
