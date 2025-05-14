/* eslint-disable max-lines */
// @ts-nocheck

/**
 * Didomi CMP opt-in logic.
 * @param {import('puppeteer').Page} page - The Puppeteer page instance.
 */

/* eslint-disable no-undef */
async function optInDidomi(page) {
    console.log("Checking for Didomi CMP");

    const didomiResultPromise = page.evaluate(async () => {
        let result = {};
        result.isDidomi = false;
        result.optedIn = false;
       
        // @ts-ignore
        if (window.Didomi) {
            result.isDidomi = true;
            console.log("Didomi banner visible, opting in");

            try {
                // @ts-ignore
                await window.Didomi.setUserAgreeToAll();
                result.optedIn = true;
            } catch {
                console.log("Error opting in to Didomi.");
            }
        }
        
        return result;
    });

    const timeoutPromise = new Promise(resolve => setTimeout(() => resolve({
        isDidomi: false,
        optedIn: false,
        timeout: true,
    }), 5000));

    const finalResult = await Promise.race([didomiResultPromise, timeoutPromise]);

    return finalResult;
}


/**
 * OneTrust opt-in logic
 * @param {import('puppeteer').Page} page - The Puppeteer page instance.
 */
async function optInOneTrust(page) {
    console.log("Checking for OneTrust CMP");

    const oneTrustResultPromise = page.evaluate(async () => {
        let result = {};
        result.isOneTrust = false;
        result.optedIn = false;

        // @ts-ignore
        if (window.OneTrust) {
            result.isOneTrust = true;
            console.log("OneTrust banner visible, opting in");

            try {
                // @ts-ignore
                // eslint-disable-next-line new-cap
                await window.OneTrust.AllowAll();

                result.optedIn = true;
            } catch (error) {
                console.error("Error opting in to OneTrust:", error);
            }
        }
        return result;
    });

    const timeoutPromise = new Promise(resolve => setTimeout(() => resolve({
        isOneTrust: false,
        optedIn: false,
        timeout: true,
    }), 5000));
    

    const finalResult =  await Promise.race([oneTrustResultPromise, timeoutPromise]);

    return finalResult;
}

/**
 * Cookiebot opt-in logic
 * @param {import('puppeteer').Page} page - The Puppeteer page instance.
 */
async function optInCookieBot(page) {
    console.log("Checking for Cookiebot CMP");

    const cookieBotResultPromise = page.evaluate(async () => {
        let result = {};
        result.isCookiebot = false;
        result.optedIn = false;

        // @ts-ignore
        if (window.CookieConsent) {
            result.isCookiebot = true;
            console.log("Cookiebot CMP detected, opting in");
            try {
                // @ts-ignore
                await window.CookieConsent.submitCustomConsent(true, true, true, false); //parameters: optInPreferences, optInStatistics, optInMarketing, isImpliedConsent
                result.optedIn = true;
           
            } catch (error) {
                console.error("Error getting Cookiebot data:", error);
            }
        }
        return result;
    });

    const timeoutPromise = new Promise(resolve => setTimeout(() => resolve({
        isCookiebot: false,
        optIn: false,
        timeout: true,
    }), 5000));

    const finalResult = await Promise.race([cookieBotResultPromise, timeoutPromise]);

    return finalResult;
}

/**
 * Quantcast opt-in logic
 * @param {import('puppeteer').Page} page - The Puppeteer page instance.
 */
async function optInQuantcast(page) {
    
    console.log("Checking for Quantcast CMP");
    const qcResult = {};
    qcResult.isQuantcast = false;
    qcResult.oldBanner = false;
    qcResult.uspBanner = false;
    qcResult.optedIn = false;

    let consentDialog = null;
    try {
        //first, im gonna get the QC CMP dialog box
        consentDialog = await page.waitForSelector('div[class^="qc-cmp2"]', {
            timeout: 2000,
        });
    } catch (e) {
        if (e.name === "TimeoutError") {
            console.log("Quantcast CMP first banner not found or not visible");
        } else {
            console.log("Error opting out of Quantcast first banner.");
        }
    }

    //if dialog is not found, we know there is no QC here
    if (!consentDialog) {
        console.log("No Quantcast CMP found");
        return qcResult;
    }

    qcResult.isQuantcast = true;

    //this page.$$ method is a Puppeteer method that returns an array of all elements that match the selector
    const buttons = await page.$$(".qc-cmp2-summary-buttons button");

    if (buttons.length > 0) {
        qcResult.oldBanner = true;

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

        if (qcResult.optedIn) {
            console.log("Opted in to Quantcast CMP");
            return qcResult;
        }
    }

    //if the old banner was not found, we need to check for the new one
    console.log("Checking for QC Usp Consent Dialog");
    const secondBanner = await page.$(".qc-usp-ui-form-content");

    //this entire block is for the USP banner
    if (secondBanner) {
        console.log("QC Usp Consent Dialog found");
        qcResult.isQuantcast = true;
        qcResult.uspBanner = true;

        const preferencesMenu = await page.$("button.qc-cmp2-list-item-header");

        if (preferencesMenu) {
            console.log("Preferences menu found, clicking...");
            await preferencesMenu.evaluate(btn => btn.click());

            await new Promise(resolve => setTimeout(resolve, 5000));

            const optInResult = await page.evaluate(async () => {
                const toggles = Array.from(document.querySelectorAll('button[role="switch"]'));
                for (const btn of toggles) {
                    if (btn.getAttribute("aria-checked") === "true") {
                        // @ts-ignore
                        btn.click();
                        // eslint-disable-next-line no-await-in-loop
                        await Promise.race([
                            //gives DOM the chance to render changes so we dont end up skipping any
                            new Promise(resolve => requestAnimationFrame(resolve)),
                            new Promise(resolve => setTimeout(resolve, 200)),
                        ]);
                    }
                }

                const uspButtons = Array.from(document.querySelectorAll(".qc-usp-ui-form-content button"));

                //temporary pause for testing
                await new Promise(resolve => setTimeout(resolve, 2000));

                for (const btn of uspButtons) {
                    const text = btn.textContent.trim().toLowerCase();
                    if (text.includes("confirm") || text.includes("save")) {
                        // @ts-ignore
                        btn.click();
                        return true;
                    }
                }

                return false;
            });

            if (optInResult) {
                qcResult.optedIn = true;
            }
        }
    }

    return qcResult;
}

/**
 * Usercentrics opt-in logic
 * @param {import('puppeteer').Page} page - The Puppeteer page instance.
 */
async function optInUserCentrics(page) {
    console.log("Checking for UserCentrics CMP");

    const ucResultPromise = page.evaluate(async () => {
        let result = {};
        result.isUserCentrics = false;
        result.optedIn = false;

        // @ts-ignore
        if (window.UC_UI) {
            result.isUserCentrics = true;
            console.log("UserCentrics CMP detected, opting in");

            try {
                // @ts-ignore
                await window.UC_UI.acceptAllConsents();
                result.optedIn = true;
            } catch {
                console.log("Error opting in to UserCentrics.");
            }
        }

        return result;
    });

    const timeoutPromise = new Promise(resolve => setTimeout(() => resolve({
        isUserCentrics: false,
        optedIn: false,
        timeout: true,
    }), 5000));

    const finalResult = await Promise.race([ucResultPromise, timeoutPromise]);

    return finalResult;
}

/**
 * Osano opt-in logic
 * @param {import('puppeteer').Page} page - The Puppeteer page instance.
 */
async function optInOsano(page) {
    console.log("Checking for Osano CMP");

    const osanoResultPromise = page.evaluate(async () => {
        let result = {};
        result.isOsano = false;
        result.optedInCookies = false;
        result.optedInSelling = false;

        // @ts-ignore
        if (window.Osano) {
            result.isOsano = true;
            console.log("Osano CMP detected, opting in");

            //@ts-ignore
            await window.Osano.cm.showDrawer();
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for the drawer to open
            const toggles = Array.from(document.querySelectorAll('input.osano-cm-toggle__input:not([disabled])'));

            toggles.forEach(toggle => {
                // If the toggle is unchecked, click to check
                if (!toggle.checked) {
                    toggle.click();
                }
            });

            await new Promise(resolve => setTimeout(resolve, 5000)); // Wait for the toggles to update

            const saveButton = document.querySelector('button.osano-cm-save');
            if (saveButton) {
                saveButton.click();
                result.optedInCookies = true;
            }

            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for the toggles to update

            //@ts-ignore
            await window.Osano.cm.showDoNotSell();

            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for the drawer to open


            const infoDialog = document.querySelector('.osano-cm-info--do_not_sell');
            if (infoDialog) {
                const toggle = infoDialog.querySelector('input[type="checkbox"][data-category="OPT_OUT"]');
                if (toggle && toggle.checked && !toggle.disabled) {
                    toggle.click(); // Turn OFF the toggle
                }

                await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for the toggles to update

                const saveButton2 = infoDialog.querySelector('button.osano-cm-save');
                if (saveButton2) {
                    saveButton2.click();
                    result.optedInSelling = true;
                }
            }
            
        }

        return result;
    });

    const timeoutPromise = new Promise(resolve => setTimeout(() => resolve({
        isOsano: false,
        optedOutCookies: false,
        optedOutSelling: false,
        timeout: true,
    }), 10000));

    const finalResult = await Promise.race([osanoResultPromise, timeoutPromise]);
    return finalResult;


}


module.exports = {optInDidomi, optInOneTrust, optInCookieBot, optInQuantcast, optInUserCentrics, optInOsano};