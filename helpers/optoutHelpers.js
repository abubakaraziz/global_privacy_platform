/* eslint-disable no-console */ // Disable console warnings in this file

/**
 * Didomi CMP opt-out logic.
 * @param {import('puppeteer').Page} page - The Puppeteer page instance.
 */

/* eslint-disable no-undef */
async function optOutDidomi(page) {
    console.log("Didomi CMP detected");
    await page.evaluate(() => {
        console.log("checking for didomi notice");
        // @ts-ignore
        if (window.Didomi && window.Didomi.notice.isVisible()) {
            console.log("didomi banner visible, opting out");
            // @ts-ignore
            window.Didomi.setUserDisagreeToAll();
        } else {
            console.log("Didomi CMP or its functions not found");
        }
    });
}

/**
 * OneTrust opt-out logic
 * @param {import('puppeteer').Page} page - The Puppeteer page instance.
 */
async function optOutOneTrust(page) {
    console.log("OneTrust CMP detected");
    await page.evaluate(() => {
        console.log("Opting out of OneTrust");
        // @ts-ignore
        if (window.OneTrust) {
            // @ts-ignore
            // eslint-disable-next-line new-cap
            window.OneTrust.RejectAll();
        } else {
            console.log("OneTrust CMP or its functions not found");
        }
    });
}
/**
 * Quantcast opt-out logic
 * @param {import('puppeteer').Page} page - The Puppeteer page instance.
 */
async function optOutQuantcast(page) {
   
    await page.evaluate(() => {
        console.log("Opting out of Quantcast");
        const consentDialog = document.querySelector(".qc-cmp2-summary-buttons");
        if (consentDialog) {
            const innerButtons = Array.from(consentDialog.querySelectorAll("button"));
            const rejectButton = innerButtons.find(button => button.textContent.toLowerCase().includes("reject") ||
                    button.textContent.toLowerCase().includes("disagree"));
            if (rejectButton) {
                console.log("Reject button clicked");
                rejectButton.click();
            } else {        //if there isnt a reject button on main banner, look for a button that leads to more options in a sub-banner which should contain a Reject All button
                const moreOptionsButton = Array.from(document.querySelectorAll('button')).find(button => button.textContent.includes('More options'));
                if (moreOptionsButton) {
                    moreOptionsButton.click();
                    const rejectAllButton = Array.from(document.querySelectorAll('button')).find(button => button.textContent.toLowerCase().includes('reject all'));
                    if (rejectAllButton) {
                        rejectAllButton.click();
                    }
                }
            }
        } else {
            console.log("Quantcast CMP consent banner not found");
        }
    });
}

/** 
 * Cookiebot opt-out logic
 * @param {import('puppeteer').Page} page - The Puppeteer page instance.
 */
async function optOutCookieBot(page) {
    await page.evaluate(() => {
        // Precautionary check to see if the Cookie Consent framework is loaded and that submitCustomConsent is a function
        // @ts-ignore
        if (window.CookieConsent && typeof window.CookieConsent.submitCustomConsent === 'function') {
            // @ts-ignore
            window.CookieConsent.submitCustomConsent(false, false, false, false); //parameters: optInPreferences, optInStatistics, optInMarketing, isImpliedConsent
            console.log("Opted out of Cookiebot");
            
            //no need for verifying this atm as declined doesnt get updated on time even though it has often opted out successfully
            
            // setTimeout(() => {
            //     // @ts-ignore
            //     if (window.CookieConsent.declined) {
            //         console.log("Successfully declined consent for Cookiebot.");
            //     } else {
            //         console.log("Failed to decline consent for Cookiebot.");
            //         //Optional: can include DOM traversal method here as a backup in the future in case the above method fails
            //     }
            // }, 500);
           
        } else {
            console.log("Cookiebot Consent banner not found.");
        }
    });
}

module.exports = {optOutDidomi, optOutOneTrust, optOutQuantcast, optOutCookieBot};
