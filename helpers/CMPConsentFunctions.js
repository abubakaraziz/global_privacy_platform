/* eslint-disable new-cap */
/**
 * @param {import('puppeteer').Page} page - The Puppeteer page instance.
 */


/* eslint-disable no-undef */
const oneTrustActiveGroups = async page => {
  
    const oneTrustDataPromise = page.evaluate(async () => {
        const result = {};
        result.isOneTrust = false;
        result.domainData = null;
        result.activeGroups = null;
            //@ts-ignore 
        if(window.OneTrust) {
            result.isOneTrust = true;
            try {
                //@ts-ignore     
                result.domainData = await window.OneTrust.GetDomainData();
            } catch {}
        }

           //@ts-ignore
        if (typeof window.OnetrustActiveGroups === "string") {
                    //@ts-ignore
            result.activeGroups = window.OnetrustActiveGroups;
        }
         
        return result;
    });
    const timeoutPromise = new Promise(resolve => setTimeout(() => resolve({
        isOneTrust: false,
        domainData: null,
        activeGroups: null,
        timeout: true
    }), 5000));

    const finalResult = await Promise.race([oneTrustDataPromise, timeoutPromise]);

    return finalResult;
};


/**
 * @param {import('puppeteer').Page} page - The Puppeteer page instance.
 */
/* eslint-disable no-undef */
const didomiUserStatus = async page => {
   
    const didomiUserStatusObjectPromise = page.evaluate(async() => {
        const result = {};
        result.isDidomi = false;
        result.getCurrentUserStatus = null;
        // @ts-ignore
        if (window.Didomi) {
            result.isDidomi = true;
            try{
            // @ts-ignore
                result.getCurrentUserStatus = await window.Didomi.getCurrentUserStatus();
            }catch{}
       
        }
        return result;
    });
    const timeoutPromise = new Promise(resolve => setTimeout(() => resolve({
        isDidomi: false,
        getCurrentUserStatus: null,
        timeout: true
    }), 5000));

    const finalResult = await Promise.race([didomiUserStatusObjectPromise, timeoutPromise]);

    return finalResult;
};

/**
 * @param {import('puppeteer').Page} page - The Puppeteer page instance.
 */
/* eslint-disable no-undef */
const cookieBotConsent = async page => {
    
    const cookieBotConsentPromise = page.evaluate(() => {
        // Check if CookieBot exists on the window object
        // @ts-ignore
        const result = {};
        result.isCookieBot = false;
        result.consent = null;
        // @ts-ignore
        if (window.Cookiebot) {
            result.isCookieBot = true;

            // @ts-ignore
            result.consent = window.Cookiebot.consent;
        }
        return result;
    });

    const timeoutPromise = new Promise(resolve => {
        setTimeout(() => {
            resolve({
                isCookieBot: false,
                consent: null,
                timeout: true
            });
        }, 5000);
    });

    const finalResult = await Promise.race([cookieBotConsentPromise, timeoutPromise]);

    return finalResult;
};

/**
 * @param {import('puppeteer').Page} page - The Puppeteer page instance.
 */
/* eslint-disable no-undef */
const usercentricsConsent = async page => {
    
    const usercentricsConsentPromise = page.evaluate(async () => {
        const result = {};
        result.isUsercentrics = false;
        result.getServicesFullInfo = null;
        result.allAccepted = null;
            // @ts-ignore
        if (window.UC_UI) {
            result.isUsercentrics = true;
            try {
                // @ts-ignore
                result.getServicesFullInfo = await window.UC_UI.getServicesFullInfo();
            }catch{}
                    
            try{
                // @ts-ignore
                result.allAccepted = await window.UC_UI.areAllConsentsAccepted();
            }catch{}
        }
           
        return result;
    });

    const timeoutPromise = new Promise(resolve => setTimeout(() => resolve({
        isUserCentrics: false,
        getServicesFullInfo: null,
        allAccepted: null,
        timeout: true
    }), 5000));

    const finalResult = await Promise.race([usercentricsConsentPromise, timeoutPromise]);
      
    return finalResult;
};

/**
 * @param {import('puppeteer').Page} page - The Puppeteer page instance.
 */
/* eslint-disable no-undef */
const quantcastPresence = async page => {
    const result = {};
    result.isQuantcast = false;

    const QCPromise =  page.evaluate(() => {
        
        const element = document.querySelector('[class^="qc-cmp2"]');
        if (element) {
            return true;
        }
        return false;
    });
    
    const timeoutPromise = new Promise(resolve => {
        setTimeout(() => {
            resolve({
                isQuantcast: false,
                timeout: true
            });
        }, 5000);
    });

    result.isQuantcast = await Promise.race([QCPromise, timeoutPromise]);

    return result;
};

module.exports = {oneTrustActiveGroups, didomiUserStatus, cookieBotConsent, usercentricsConsent, quantcastPresence};
