/* eslint-disable max-lines */
/* eslint-disable no-console */ // Disable console warnings in this file


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
    console.log("Checking for Quantcast CMP");
    const qcResult = {};
    qcResult.isQuantcast = false;
    qcResult.oldBanner = false;
    qcResult.uspBanner = false;
    qcResult.optedOut = false;

    let consentDialog = null;
    try {
        //first, im gonna get the QC CMP dialog box
        consentDialog = await page.waitForSelector(".qc-cmp2-summary-buttons", {timeout: 2000});
    } catch (e) {
        if (e.name === "TimeoutError") {
            console.log("Quantcast CMP first banner not found or not visible");
        } else {
            console.log("Error opting out of Quantcast first banner.");
        }
    }

    if (consentDialog) {
        qcResult.isQuantcast = true;
        qcResult.oldBanner = true;

        console.log("Quantcast CMP detected, opting out");

        //this page.$$ method is a Puppeteer method that returns an array of all elements that match the selector
        const buttons = await page.$$(".qc-cmp2-summary-buttons button");

        let rejectButton = null;
        for (const button of buttons) {
            // eslint-disable-next-line no-await-in-loop
            const buttonText = await page.evaluate(el => el.textContent, button);
            if (buttonText.toLowerCase().includes("reject") || buttonText.toLowerCase().includes("deny") || buttonText.toLowerCase().includes("disagree")) {
                rejectButton = button;
                break;
            }
        }

        //if we have the reject button, we can just directly click it to opt out.
        if (rejectButton) {
            console.log("Reject button found, clicking");
            await rejectButton.evaluate(btn => btn.click());
            qcResult.optedOut = true;
        }

        if (qcResult.optedOut === false) {
            //if we dont have the reject button, we need to look for a 'more options' button to expand the dialog
            console.log("Reject button not found, looking for a 'more options' button...");

            let moreOptionsButton = null;
            for (const button of buttons) {
                // eslint-disable-next-line no-await-in-loop
                const buttonText = await page.evaluate(el => el.textContent, button);
                // eslint-disable-next-line max-depth
                if (buttonText.toLowerCase().includes("more options") || buttonText.toLowerCase().includes("manage") || buttonText.toLowerCase().includes("options")) {
                    moreOptionsButton = button;
                    break;
                }
            }

            if (moreOptionsButton) {
                // console.log("More options button found, clicking...");
                await moreOptionsButton.evaluate(btn => btn.click());
        
                //here, we need to wait for the new buttons to appear in this new dialog
                await page.waitForSelector("button", {timeout: 2000});
                const newButtons = await page.$$("button");
                let rejectAllButton = null;
                let saveAndExitButton = null;

                // eslint-disable-next-line max-depth
                for (const button of newButtons) {
                    // eslint-disable-next-line no-await-in-loop
                    const text = (await page.evaluate(el => el.textContent, button)).toLowerCase();
                    // eslint-disable-next-line max-depth
                    if (text.includes("reject all") && !rejectAllButton) {
                        rejectAllButton = button;
                    }
                    // eslint-disable-next-line max-depth
                    if (text.toLowerCase().includes("save and exit") || text.toLowerCase().includes("save & exit") || text.toLowerCase().includes("save")) {
                        saveAndExitButton = button;
                    }
                }
        
                // eslint-disable-next-line max-depth
                if (rejectAllButton) {
                    // console.log("Reject All button found, clicking...");
                    await rejectAllButton.evaluate(btn => btn.click());
                }

                // eslint-disable-next-line max-depth
                if (saveAndExitButton) {
                    console.log("Save and Exit button found, clicking...");
                    await saveAndExitButton.evaluate(btn => btn.click());
                    qcResult.optedOut = true;
                }
            } else {
                console.log("No more options button not found");
            }
        }

        //if we have opted out, we can just return the result
        if (qcResult.optedOut) {
            return qcResult;
        }
        console.log("No Opt out from first QC banner.");
    }
    
    //if the old banner was not found, we need to check for the new one
    console.log("Checking for QC Usp Consent Dialog");
    consentDialog = await page.$(".qc-usp-ui-form-content");

    if(consentDialog) {
        console.log("QC Usp Consent Dialog found");
        qcResult.isQuantcast = true;
        qcResult.uspBanner = true;

        const preferencesMenu = await page.$("button.qc-cmp2-list-item-header");

        if(preferencesMenu) {
            console.log("Preferences menu found, clicking...");
            await preferencesMenu.evaluate(btn => btn.click());
            
            const optOutResult = await page.evaluate(async () => {
                const toggles = Array.from(document.querySelectorAll('button[role="switch"]'));
                for (const btn of toggles) {
                    if (btn.getAttribute('aria-checked') === 'false') {
                        // @ts-ignore
                        btn.click();
                        // eslint-disable-next-line no-await-in-loop
                        await new Promise(requestAnimationFrame);       //gives DOM the chance to render changes so we dont end up skipping any
                    }
                }

                const buttons = Array.from(document.querySelectorAll('.qc-usp-ui-form-content button'));
                
                for (const btn of buttons) {
                    const text = btn.textContent.trim().toLowerCase();
                    if (text.includes('confirm') || text.includes('save')) {
                        // @ts-ignore
                        btn.click();
                        return true;
                    }
                }

                return false;
            });

            if (optOutResult) {
                qcResult.optedOut = true;
            }
        }
    }
   
    return qcResult;
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
