// @ts-nocheck
/* eslint-disable max-lines */
/* eslint-disable no-console */ // Disable console warnings in this file

/**
 * Didomi CMP opt-out logic.
 * @param {import('puppeteer').Page} page - The Puppeteer page instance.
 */

/* eslint-disable no-undef */
async function optOutDidomi(page) {
    console.log("Checking for Didomi CMP");

    const didomiResultPromise = page.evaluate(async () => {
        let result = {};
        result.isDidomi = false;
        result.optedOut = false;
       
        // @ts-ignore
        if (window.Didomi) {
            result.isDidomi = true;
            console.log("Didomi banner visible, opting out");

            try {
                // @ts-ignore
                await window.Didomi.setUserDisagreeToAll();
                result.optedOut = true;
            } catch {
                console.log("Error opting out of Didomi.");
            }
        }
        
        return result;
    });

    const timeoutPromise = new Promise(resolve => setTimeout(() => resolve(null), 5000));

    const finalResult = await Promise.race([didomiResultPromise, timeoutPromise]);

    return finalResult;
}

/**
 * OneTrust opt-out logic
 * @param {import('puppeteer').Page} page - The Puppeteer page instance.
 */
async function optOutOneTrust(page) {
    console.log("Checking for OneTrust CMP");

    const oneTrustResultPromise = await page.evaluate(async () => {
        let result = {};
        result.isOneTrust = false;
        result.optedOut = false;

        // @ts-ignore
        if (window.OneTrust) {
            result.isOneTrust = true;
            console.log("OneTrust banner visible, opting out");

            try {
                // @ts-ignore
                // eslint-disable-next-line new-cap
                await window.OneTrust.RejectAll();

                result.optedOut = true;
            } catch (error) {
                console.error("Error opting out of OneTrust:", error);
            }
        }
        return result;
    });

    const timeoutPromise = new Promise(resolve => setTimeout(() => resolve(null), 5000));
    

    const finalResult =  await Promise.race([oneTrustResultPromise, timeoutPromise]);

    return finalResult;
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

    //if there are any buttons we know that the old banner exists - this entire block is for the old banner
    if (buttons.length > 0) {
        qcResult.oldBanner = true;

        let rejectButton = null;
        for (const button of buttons) {
            // eslint-disable-next-line no-await-in-loop
            const buttonText = await page.evaluate(
                el => el.textContent,
                button
            );
            if (
                buttonText.toLowerCase().includes("reject") ||
                buttonText.toLowerCase().includes("deny") ||
                buttonText.toLowerCase().includes("disagree")
            ) {
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
                const buttonText = await page.evaluate(
                    el => el.textContent,
                    button
                );
                // eslint-disable-next-line max-depth
                if (
                    buttonText.toLowerCase().includes("more options") ||
                    buttonText.toLowerCase().includes("manage") ||
                    buttonText.toLowerCase().includes("options")
                ) {
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
                    const text = // eslint-disable-next-line no-await-in-loop
                    (await page.evaluate(el => el.textContent, button)).toLowerCase();
                    // eslint-disable-next-line max-depth
                    if (text.includes("reject all") && !rejectAllButton) {
                        rejectAllButton = button;
                    }
                    // eslint-disable-next-line max-depth
                    if (
                        text.toLowerCase().includes("save and exit") ||
                        text.toLowerCase().includes("save & exit") ||
                        text.toLowerCase().includes("save")
                    ) {
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

            const optOutResult = await page.evaluate(async () => {
                const toggles = Array.from(document.querySelectorAll('button[role="switch"]'));
                for (const btn of toggles) {
                    if (btn.getAttribute("aria-checked") === "false") {
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

    const cookieBotResultPromise = page.evaluate(async () => {
        let result = {};
        result.isCookiebot = false;
        result.optedOut = false;

        // @ts-ignore
        if (window.CookieConsent) {
            result.isCookiebot = true;
            console.log("Cookiebot CMP detected, opting out");
            try {
                // @ts-ignore
                await window.CookieConsent.submitCustomConsent(false, false, false, false); //parameters: optInPreferences, optInStatistics, optInMarketing, isImpliedConsent
                result.optedOut = true;
           
            } catch (error) {
                console.error("Error getting Cookiebot data:", error);
            }
        }
        return result;
    });

    const timeoutPromise = new Promise(resolve => setTimeout(() => resolve(null), 5000));

    const finalResult = await Promise.race([cookieBotResultPromise, timeoutPromise]);

    return finalResult;
}

/**
 * Usercentrics opt-out logic
 * @param {import('puppeteer').Page} page - The Puppeteer page instance.
 */
async function optOutUserCentrics(page) {
    console.log("Checking for UserCentrics CMP");

    const ucResultPromise = page.evaluate(async () => {
        let result = {};
        result.isUserCentrics = false;
        result.optedOut = false;

        // @ts-ignore
        if (window.UC_UI) {
            result.isUserCentrics = true;
            console.log("UserCentrics CMP detected, opting out");

            try {
                // @ts-ignore
                await window.UC_UI.denyAllConsents();
                result.optedOut = true;
            } catch {
                console.log("Error opting out of UserCentrics.");
            }
        }

        return result;
    });

    const timeoutPromise = new Promise(resolve => setTimeout(() => resolve(null), 5000));

    const finalResult = await Promise.race([ucResultPromise, timeoutPromise]);

    return finalResult;
}

module.exports = {
    optOutDidomi,
    optOutOneTrust,
    optOutQuantcast,
    optOutCookieBot,
    optOutUserCentrics,
};
