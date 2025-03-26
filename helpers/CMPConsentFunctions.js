/**
 * @param {import('puppeteer').Page} page - The Puppeteer page instance.
 */
/* eslint-disable no-undef */
const oneTrustActiveGroups = async page => {
    try {
        const oneTrustData = await page.evaluate(async () => {
            const result = {};
            //@ts-ignore
            if(window.OneTrust) {
                console.log("OneTrust CMP found");

                //@ts-ignore
                if (typeof window.OnetrustActiveGroups === "string") {
                    //@ts-ignore
                    result.activeGroups = window.OnetrustActiveGroups;
                } else {
                    result.activeGroups = null;
                }
                
                //@ts-ignore
                if (typeof window.OneTrust.GetDomainData === "function") {
                    //@ts-ignore 
                    // eslint-disable-next-line new-cap
                    result.domainData = await window.OneTrust.GetDomainData();
                } else {
                    result.domainData = null;
                }
  
                return result;
            }
            console.log("OneTrust CMP not found");
            return null;
        
        });
  
        if (oneTrustData) {
            console.log("OneTrust data retrieved.");
        } else {
            console.log("No OneTrust data retrieved.");
        }
        return oneTrustData;
    } catch (error) {
        console.log("Error getting OneTrust data", error);
        return null;
    }
};

/**
 * @param {import('puppeteer').Page} page - The Puppeteer page instance.
 */
/* eslint-disable no-undef */
const didomiUserStatus = async page => {
    try {
        const didomiUserStatusObject = await page.evaluate(() => new Promise(resolve => {
                // Check if DidomiUserStatus exists on the window object
                // @ts-ignore
            if (window.Didomi) {
                console.log('Didomi CMP found');
                // @ts-ignore
                // Checking the the user status function exists
                // @ts-ignore
                if (typeof window.Didomi.getCurrentUserStatus === 'function') {
                    // @ts-ignore
                    resolve(window.Didomi.getCurrentUserStatus());
                } else {
                    console.log('Didomi.getCurrentUserStatus function not found');
                    resolve(null);
                }
            } else {
                console.log('Didomi CMP not found');
                resolve(null);
            }
        }));
        if (didomiUserStatusObject) {
            console.log('Didomi object retrieved.');
        } else {
            console.log('No Didomi object retrieved.');
        }
        return didomiUserStatusObject; // Return the retrieved object
    } catch {
        console.log("Error getting Didomi object");
        return null;
    }
};

/**
 * @param {import('puppeteer').Page} page - The Puppeteer page instance.
 */
/* eslint-disable no-undef */
const cookieBotConsent = async page => {
    try {
        const cookieBotConsentObject = await page.evaluate(() => new Promise(resolve => {
                    // Check if CookieBot exists on the window object
                    // @ts-ignore
            if (window.Cookiebot) {
                console.log("CookieBot CMP found");
                        // @ts-ignore

                        // Checking if the consent object exists and retrieving it
                        // @ts-ignore
                if (typeof window.Cookiebot.consent === "object") {
                            // @ts-ignore
                    resolve(window.Cookiebot.consent);
                } else {
                    console.log("Cookiebot.consent object not found");
                    resolve(null);
                }
            } else {
                console.log("CookieBot CMP not found");
                resolve(null);
            }
        }));

        if (cookieBotConsentObject) {
            console.log("CookieBot object retrieved:", cookieBotConsentObject);
        } else {
            console.log("No CookieBot object retrieved.");
        }

        return cookieBotConsentObject; // Return the retrieved object
    } catch {
        console.log("Error getting CookieBot object");
        return null;
    }
};

/**
 * @param {import('puppeteer').Page} page - The Puppeteer page instance.
 */
/* eslint-disable no-undef */
const osanoConsent = async page => {
    try {
        const osanoConsentObject = await page.evaluate(() => new Promise(resolve => {
                    // Check if Osano exists on the window object
                    // @ts-ignore
            if (window.Osano) {
                console.log("Osano CMP found");
                        // @ts-ignore

                        // Checking if the consent object exists and retrieving it
                        // @ts-ignore
                if (typeof window.Osano.cm.getConsent === 'function') {
                            // @ts-ignore
                    resolve(window.Osano.cm.getConsent());
                } else {
                    console.log("Osano.consent object not found");
                    resolve(null);
                }
            } else {
                console.log("Osano CMP not found");
                resolve(null);
            }
        }));

        if (osanoConsentObject) {
            console.log("Osano object retrieved:", osanoConsentObject);
        } else {
            console.log("No Osano object retrieved.");
        }

        return osanoConsentObject; // Return the retrieved object
    } catch {
        console.log("Error getting Osano object");
        return null;
    }
};

/**
 * @param {import('puppeteer').Page} page - The Puppeteer page instance.
 */
/* eslint-disable no-undef */
const usercentricsConsent = async page => {
    try {
        const usercentricsConsentObject = await page.evaluate(async () => {
            // @ts-ignore
            if (window.UC_UI) {
                console.log("Usercentrics CMP found");
                // @ts-ignore
                const servicesInfo = await window.UC_UI.getServicesFullInfo();
                // @ts-ignore
                const allAccepted = window.UC_UI.areAllConsentsAccepted();
                const object = {allAccepted, servicesInfo};
                // console.log("Usercentrics object retrieved:", object);
                return object;
            }
            console.log("Usercentrics CMP not found");
            return null;
        });
      
        if (usercentricsConsentObject) {
            console.log("Usercentrics object retrieved.");
        } else {
            console.log("No Usercentrics object retrieved.");
        }
      
        return usercentricsConsentObject;
    } catch {
        console.log("Error getting Usercentrics object");
        return null;
    }
};

/**
 * @param {import('puppeteer').Page} page - The Puppeteer page instance.
 */
/* eslint-disable no-undef */
const quantcastPresence = async page => {
    try {
        const result = await page.evaluate(() => {
            console.log("Checking for Quantcast CMP");
            
            const consentDialog = document.querySelector(".qc-cmp2-summary-buttons");
            if (consentDialog) {
                console.log("Quantcast CMP found");
                return true;
            }
            console.log("Quantcast CMP not found");
            return false;
        });

        return result;
    } catch {
        console.log("Error getting Quantcast object");
        return false;
    }
};

module.exports = {oneTrustActiveGroups, didomiUserStatus, cookieBotConsent, osanoConsent, usercentricsConsent, quantcastPresence};
