/**
 * @param {import('puppeteer').Page} page - The Puppeteer page instance.
 */
/* eslint-disable no-undef */
const oneTrustActiveGroups = async page => {
  
    const oneTrustData = await page.evaluate(async () => {
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
                } catch (error) {}
            }

           //@ts-ignore
                if (typeof window.OnetrustActiveGroups === "string") {
                    //@ts-ignore
                    result.activeGroups = window.OnetrustActiveGroups;
                } 
         
            
            return result;
        
        });
        return oneTrustData;
    
};

/**
 * @param {import('puppeteer').Page} page - The Puppeteer page instance.
 */
/* eslint-disable no-undef */
const didomiUserStatus = async page => {
   
    const didomiUserStatusObject = await page.evaluate(async() => {
        const result = {};
        result.isDidomi = false;
        result.getCurrentUserStatus = null; 
    // @ts-ignore
        if (window.Didomi) {
            result.isDidomi = true
            try{
            // @ts-ignore
            result.getCurrentUserStatus = await window.Didomi.getCurrentUserStatus()
            }catch{}
       
        }
        return result
        });
        return didomiUserStatusObject; 
};

/**
 * @param {import('puppeteer').Page} page - The Puppeteer page instance.
 */
/* eslint-disable no-undef */
const cookieBotConsent = async page => {
    
    const cookieBotConsentObject = await page.evaluate(async () =>{
        // Check if CookieBot exists on the window object
        // @ts-ignore
        const result = {};
        result.isCookieBot = false;
        result.consent = null;
        // @ts-ignore
        if (window.Cookiebot) {
        try{
        // @ts-ignore
        result.consent = await window.Cookiebot.consent;
        }catch{}
    }
        return result;  
        });

        return cookieBotConsentObject; // Return the retrieved object
    
};

/**
 * @param {import('puppeteer').Page} page - The Puppeteer page instance.
 */
/* eslint-disable no-undef */
const usercentricsConsent = async page => {    
    
        const usercentricsConsentObject = await page.evaluate(async () => {
            const result = {}
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
      
        return usercentricsConsentObject;
    
};

/**
 * @param {import('puppeteer').Page} page - The Puppeteer page instance.
 */
/* eslint-disable no-undef */
const quantcastPresence = async page => {
    const result = {};
    result.isQuantcast = false;
    result.isQuantcast = await page.evaluate(() => {
        
    const element = document.querySelector('[class^="qc-cmp2"]');
        if (element) {
        return true;
        }
    return false;
    });

    return result;
    
};

module.exports = {oneTrustActiveGroups, didomiUserStatus, cookieBotConsent, usercentricsConsent, quantcastPresence};
