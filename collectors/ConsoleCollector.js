const BaseCollector = require("./BaseCollector");

/**
 * @typedef { import('./BaseCollector').CollectorInitOptions } CollectorInitOptions
 */

class ConsoleCollector extends BaseCollector {
    /**
     * @returns {string} - The ID of the collector.
     */
    id() {
        return "console";
    }

    /**
     * @param {CollectorInitOptions} options
     */
    init(options) {
        this._log = options.log;
        this.context = options.context;
        this.filters = /** @type {string[]} */ (
            options.collectorFlags.consoleFilters
        );

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
        if (targetInfo.type !== "page") {
            return;
        }

        const pages = await this.context.pages();

        if (pages.length === 0) {
            console.error("No pages found in context yet");
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

            //if filters are passed only include the logs that start with one of the filters
            if (this.filters?.length > 0) {
                for (const filter of this.filters) {
                    if (logMessage.startsWith(filter)) {
                        this.capturedLogs.push(logMessage);
                        break;
                    }
                }
            } else {
                this.capturedLogs.push(logMessage);
            }
        });

        console.log(`Console listener attached to page: ${targetInfo.url}`);
    }

    /**
     * @returns {string[]} - An array of captured console log messages.
     */
    getData() {
        console.log("console filter", this.filters);
        return this.capturedLogs;
    }
}
module.exports = ConsoleCollector;
