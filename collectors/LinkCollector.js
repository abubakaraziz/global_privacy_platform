/* eslint-disable no-await-in-loop */
const BaseCollector = require('./BaseCollector');
const tld = require('tldts');
const {URL} = require('url');

const INNER_LINKS_QUERY = `
// Collect href attributes from a and button elements
(function getLinks() {
    const links = window.document.querySelectorAll('a, button');
    let linkAttrs = [];
    for (const link of links) {
        const href = link.getAttribute('href');
        if (href) {
            linkAttrs.push(href);
        }
    }
    // Return a unique list of link URLs
    return [...new Set(linkAttrs)];
})();
`;


const EXCLUDED_EXTS = [".jpg", ".jpeg", ".pdf", ".png"];

class LinkCollector extends BaseCollector {

    id() {
        return 'links';
    }

    /**
     * @param {import('./BaseCollector').CollectorInitOptions} options
     */
    init({
        log,
    }) {
        this._log = log;
        // @ts-ignore
        this._links = [];
        // @ts-ignore
        this._internalLinks = [];
    }

    /**
     * @param {string} linkUrlStripped
     * @param {string} pageDomain
     * @param {string} pageUrl
     * @returns {boolean}
     */
    shouldIncludeLink(linkUrlStripped, pageDomain, pageUrl) {
        // Remove fragments from both linkUrlStripped and pageUrl for comparison
        const linkUrlNoFragment = linkUrlStripped.split('#')[0];
        const pageUrlNoFragment = pageUrl.split('#')[0];

        // Ignore external links
        if (tld.getDomain(linkUrlStripped) !== pageDomain) {
            this._log(`Will skip the external link: ${linkUrlStripped}`);
            return false;
        }

        // Ignore links with disallowed extensions
        if (EXCLUDED_EXTS.some(fileExt => linkUrlStripped.includes(fileExt))) {
            this._log(`Bad file extension, will skip: ${linkUrlStripped}`);
            return false;
        }

        // Ignore links that are just fragments or lead back to the same page with a fragment
        if (linkUrlNoFragment === pageUrlNoFragment) {
            this._log(`Skipping same-page or fragment link: ${linkUrlStripped}`);
            return false;
        }

        return true;
    }

    /**
     * @param {any} links
     * @param {string} pageUrl
     * @param {string} pageDomain
     */
    controlLinks(links, pageUrl, pageDomain) {
        const returnLinks = [];
        for (let link of links) {
            // Convert to absolute URL
            link = new URL(link, pageUrl).href.toLowerCase();

            // Strip fragment and trailing slash
            const linkUrlStripped = link.replace(/\/$/, '');
            if (this.shouldIncludeLink(linkUrlStripped, pageDomain, pageUrl)) {
                returnLinks.push(linkUrlStripped);
            }
        }
        return [...new Set(returnLinks)]; // Ensure uniqueness
    }

    /**
     * @param {{ finalUrl?: string; urlFilter?: any; page?: any; }} [options]
     */
    async getData(options) {
        // await options.page.waitForTimeout(5000);
        // scroll to the top of the page
        // await scrollToTop(options.page);
        console.log("Scrolling to the top of the page");
        // await options.page.evaluate(() => {
        //     window.scrollTo(0, 0);
        // });
        const page = options.page;
        // console.log("The page is: ", page);
        const pageUrl = page.url().toLowerCase();
        const pageDomain = tld.getDomain(pageUrl);

        // Get internal page links, filtering out login and signup links
        const innerLinks = this.controlLinks(await page.evaluate(INNER_LINKS_QUERY), pageUrl, pageDomain);

        // Set the collected internal links
        this._links = innerLinks.slice(0, 15); // Collect only up to 15 links
        
        // Checking how many links are being returned following the crawl
        this._log(`Found ${this._links.length} internal links`);

        return this._links;
    }

}

module.exports = LinkCollector;