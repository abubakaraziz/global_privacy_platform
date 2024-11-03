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
        }
    });
}
/**
 * Quantcast opt-out logic
 * @param {import('puppeteer').Page} page - The Puppeteer page instance.
 */
async function optOutQuantcast(page) {
    console.log("Quantcast CMP detected");
    await page.evaluate(() => {
        const consentDialog = document.querySelector(".qc-cmp2-summary-buttons");
        if (consentDialog) {
            const innerButtons = Array.from(consentDialog.querySelectorAll("button"));
            const rejectButton = innerButtons.find(button => button.textContent.toLowerCase().includes("reject") ||
                    button.textContent.toLowerCase().includes("disagree"));
            if (rejectButton) {
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
        }
    });
}

module.exports = {optOutDidomi, optOutOneTrust, optOutQuantcast};
