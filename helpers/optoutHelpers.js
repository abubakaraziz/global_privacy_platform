/* eslint-disable no-console */ // Disable console warnings in this file

/**
 * Didomi CMP opt-out logic.
 * @param {import('puppeteer').Page} page - The Puppeteer page instance.
 */

/* eslint-disable no-undef */
async function optOutDidomi(page) {
    console.log("Checking for Didomi CMP");
    await page.evaluate(() => {
        // @ts-ignore
        if (window.Didomi && window.Didomi.notice.isVisible()) {
            console.log("Didomi banner visible, opting out");
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
    console.log("Checking for OneTrust CMP");
    await page.evaluate(() => {
        // @ts-ignore
        if (window.OneTrust) {
            console.log("OneTrust CMP detected, opting out");
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
    
    //wait for a bit
    await page.waitForTimeout(2000);
    await page.evaluate(async () => {
        console.log("Checking for Quantcast CMP");
        
        const consentDialog = document.querySelector(".qc-cmp2-summary-buttons");
        if (consentDialog) {
            console.log("Quantcast CMP consent banner found, opting out");
            //wait for a bit
            // @ts-ignore
            await new Promise(resolve => setTimeout(resolve, 2000));
            const innerButtons = Array.from(consentDialog.querySelectorAll("button"));

            console.log("Found buttons: ", innerButtons[0].textContent, innerButtons[1].textContent);

            const rejectButton = innerButtons.find(button => button.textContent.toLowerCase().includes("reject") ||
                    button.textContent.toLowerCase().includes("disagree"));
            if (rejectButton) {
                console.log("Reject button clicked");
                rejectButton.click();
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
                        
                    if (rejectAllButton) {
                        console.log("found reject all button");
                        rejectAllButton.click();
                    }
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    if (saveAndExitButton) {
                        console.log("found save and exit button");
                        saveAndExitButton.click();
                    }
                }
            }
        } else {
            console.log("Quantcast CMP or its consent banner not found");
        }
    });
}

/**
 * Cookiebot opt-out logic
 * @param {import('puppeteer').Page} page - The Puppeteer page instance.
 */
async function optOutCookieBot(page) {
    console.log("Checking for Cookiebot CMP");
    await page.evaluate(() => {
        // Precautionary check to see if the Cookie Consent framework is loaded and that submitCustomConsent is a function
        // @ts-ignore
        if (window.CookieConsent && typeof window.CookieConsent.submitCustomConsent === 'function') {
            console.log("Cookiebot CMP detected, opting out");
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

/**
 * Osano opt-out logic
 * @param {import('puppeteer').Page} page - The Puppeteer page instance.
 */
async function optOutOsano(page) {
    console.log("Checking for Osano CMP");
    await page.waitForFunction(() => window.Osano.cm.showDoNotSell);
    await page.evaluate(async () => {
        // @ts-ignore
        if (window.Osano) {
            console.log("Osano CMP detected, opting out");
            // @ts-ignore
            if(window.Osano.cm.showDoNotSell) {
                console.log("Osano CMP showDoNotSell function found");
            }
           
                // @ts-ignore
            await window.Osano.cm.showDoNotSell();
            

            const toggle = document.querySelector('#osano-cm-drawer-toggle--category_OPT_OUT');

            if (toggle) {
                console.log("Toggle switch found");
                toggle.checked = false;
                
                const isOn = toggle.classList.contains("osano-cm-toggle__on");

                if (isOn) {
                    console.log("Toggle is ON, turning it OFF");
                    toggle.click();
                } else {
                    console.log("Toggle is already OFF");
                }
            } else {
                console.log("Toggle switch not found");
            }

        } else {
            console.log("Osano CMP or its functions not found");
        }
    });
}

/**
 * Usercentrics opt-out logic
 * @param {import('puppeteer').Page} page - The Puppeteer page instance.
 */
async function optOutUserCentrics(page) {
    console.log("Checking for UserCentrics CMP");
    await page.evaluate(async () => {
        // @ts-ignore
        if (window.UC_UI) {
            console.log("UserCentrics CMP detected, opting out");
            // @ts-ignore
            await window.UC_UI.denyAllConsents();
        } else {
            console.log("UserCentrics CMP or its functions not found");
        }
    });
}

module.exports = {optOutDidomi, optOutOneTrust, optOutQuantcast, optOutCookieBot, optOutOsano, optOutUserCentrics};
