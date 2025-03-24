/**
 * Didomi CMP opt-in logic.
 * @param {import('puppeteer').Page} page - The Puppeteer page instance.
 */

/* eslint-disable no-undef */
async function optInDidomi(page) {
    console.log("Checking for Didomi CMP");
    const didomiResult = await page.evaluate(() => {
        let found = false;
        let optedIn = false;
        try {
            // @ts-ignore
            if (window.Didomi) {
                found = true;
                console.log("Didomi banner visible, opting in");
                // @ts-ignore
                window.Didomi.setUserAgreeToAll();
                optedIn = true;
            } else {
                console.log("Didomi CMP or its optin functions not found");
            }
        } catch {
            console.log("Error opting in for Didomi.");
            optedIn = false;
        }
        const name = "Didomi";
        return {name, found, optedIn};
    });

    if (didomiResult.found) {
        return didomiResult;
    }
    return null;
}


/**
 * OneTrust opt-in logic
 * @param {import('puppeteer').Page} page - The Puppeteer page instance.
 */
async function optInOneTrust(page) {
    console.log("Checking for OneTrust CMP");
    const result = await page.evaluate(() => {
        let found = false;
        let optedIn = false;
        try {
            // @ts-ignore
            if (window.OneTrust) {
                found = true;
                console.log("OneTrust CMP detected, opting in");
                // @ts-ignore
                // eslint-disable-next-line new-cap
                window.OneTrust.AllowAll();
                optedIn = true;
            } else {
                console.log("OneTrust CMP or its optin functions not found");
            }
        } catch {
            console.error("Error opting out of OneTrust");
            optedIn = false;
        }
        const name = "OneTrust";
        return {name, found, optedIn};
    });

    //only return a valid result object if CMP was at least detected
    if (result.found) {
        return result;
    }
    return null;
}

/**
 * Cookiebot opt-in logic
 * @param {import('puppeteer').Page} page - The Puppeteer page instance.
 */
async function optInCookieBot(page) {
    console.log("Checking for Cookiebot CMP");
    const result = await page.evaluate(() => {
        
        let found = false;
        let optedIn = false;
        try {
            // @ts-ignore
            if (window.CookieConsent) {
                found = true;
                console.log("Cookiebot CMP detected, opting in");

                // @ts-ignore
                if (typeof window.CookieConsent.submitCustomConsent === 'function') {
                // @ts-ignore
                    window.CookieConsent.submitCustomConsent(true, true, true, false); //parameters: optInPreferences, optInStatistics, optInMarketing, isImpliedConsent
                    console.log("Opted in for Cookiebot");
                    optedIn = true;
                }
            } else {
                console.log("Cookiebot Consent object not found.");
            }
        } catch  {
            console.log("Error opting in for Cookiebot");
            optedIn = false;
        }
        const name = "Cookiebot";
        return {name, found, optedIn};
    });

    if (result.found) {
        return result;
    }
    return null;
}

/**
 * Quantcast opt-in logic
 * @param {import('puppeteer').Page} page - The Puppeteer page instance.
 */
async function optInQuantcast(page) {
    console.log("Checking for Quantcast CMP");
    const qcResult = {name: "Quantcast", found: false, optedIn: false};

    try {
        //first, im gonna get the QC CMP dialog box
        const consentDialog = await page.waitForSelector(".qc-cmp2-summary-buttons", {timeout: 2000});

        if (consentDialog) {
            qcResult.found = true;
            console.log("Quantcast CMP detected, opting in");

            //this page.$$ method is a Puppeteer method that returns an array of all elements that match the selector
            const buttons = await page.$$(".qc-cmp2-summary-buttons button");

            let acceptButton = null;
            for (const button of buttons) {
                // eslint-disable-next-line no-await-in-loop
                const buttonText = await page.evaluate(el => el.textContent, button);
                if (buttonText.toLowerCase().includes("agree") || buttonText.toLowerCase().includes("accept")) {
                    acceptButton = button;
                    break;
                }
            }

            //if we have the accept button, we can just directly click it to opt out.
            if (acceptButton) {
                console.log("Accept button found, clicking");
                await acceptButton.evaluate(btn => btn.click());
                qcResult.optedIn = true;
            }
            
        }
    } catch (error) {
        if (error.name === "TimeoutError") {
            console.log("Quantcast CMP not found or not visible");
        } else {
            console.log("Error opting in for Quantcast.");
        }
        qcResult.optedIn = false;
    }
   
    if (qcResult.found) {
        return qcResult;
    }
    return null;
}

/**
 * Usercentrics opt-out logic
 * @param {import('puppeteer').Page} page - The Puppeteer page instance.
 */
async function optInUserCentrics(page) {
    console.log("Checking for UserCentrics CMP");
    const ucResult = await page.evaluate(async () => {
        let found = false;
        let optedIn = false;

        try {
            // @ts-ignore
            if (window.UC_UI) {
                found = true;
                console.log("UserCentrics CMP detected, opting in");
                // @ts-ignore
                if(typeof window.UC_UI.denyAllConsents === 'function') {
                    // @ts-ignore
                    await window.UC_UI.acceptAllConsents();
                    optedIn = true;
                }
            } else {
                console.log("UserCentrics CMP or its functions not found");
            }
        } catch {
            console.log("Error opting in for UserCentrics.");
            optedIn = false;
        }
        const name = "UserCentrics";
        return {name, found, optedIn};
    });

    if (ucResult.found) {
        return ucResult;
    }
    return null;
}


module.exports = {optInDidomi, optInOneTrust, optInCookieBot, optInQuantcast, optInUserCentrics};