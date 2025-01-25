const BaseCollector = require("./BaseCollector");


class ConsoleCollector extends BaseCollector {
    
    /**
     * @returns {string} - The ID of the collector.
     */
    id() {
        return "console";
    }

    /**
     * @param {Object} options 
     * @param {function} options.log
     * @param {import('puppeteer').BrowserContext} options.context
     */
    init(options) {
        this._log = options.log;
        this.context = options.context;

        /**@type {string[]}  */
        this.capturedLogs = [];
       
        // this.attachedPages = new Set();
    }

    /**
     * @param {Object} targetInfo - Information about the target.
     * @param {import('puppeteer').CDPSession} targetInfo.cdpClient - The CDP session for the target.
     * @param {string} targetInfo.url - The URL of the target.
     * @param {string} targetInfo.type - The type of the target (e.g., 'page', 'iframe').
     * @returns {Promise<void>} - A promise that resolves when the listener is attached.
     */
    async addTarget(targetInfo) {
        if (targetInfo.type !== 'page') {
            return;
        }

        const pages = await this.context.pages();

        if (pages.length === 0) {
            console.error('No pages found in context yet');
            return;
        }
        const page = pages[0];

        //Prevent adding multiple listeners to the same page
        // if (this.attachedPages.has(page)) {
        //     return;
        // }
        // this.attachedPages.add(page);

        //Capture all console messages
        page.on("console", msg => {
            const logMessage = msg.text();
            this.capturedLogs.push(logMessage);
        });

        console.log(`Console listener attached to page: ${targetInfo.url}`);
    }

    /**
     * @returns {string[]} - An array of captured console log messages.
     */
    getData() {
        return this.capturedLogs;
    }
}
module.exports = ConsoleCollector;