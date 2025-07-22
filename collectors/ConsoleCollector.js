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

        /**@type {Object[]}  */
        this.capturedLogs = [];
    }

    /**
     * @param {Object} targetInfo - Information about the target.
     * @param {import('puppeteer').CDPSession} targetInfo.cdpClient - The CDP session for the target.
     * @param {string} targetInfo.url - The URL of the target.
     * @param {string} targetInfo.type - The type of the target (e.g., 'page', 'iframe').
     * @returns {Promise<void>} - A promise that resolves when the listener is attached.
     */
    async addTarget({cdpClient, type, url}) {
        if (type !== 'page') {
            return;
        }

        await cdpClient.send('Runtime.enable');
        
        cdpClient.on('Runtime.consoleAPICalled', (event) => {
            const message = event.args.map(arg => arg.value || arg.description || '').join(' ');
            this.capturedLogs.push({
                level: event.type,
                message: message,
                timestamp: event.timestamp,
                url: url
            });
        });

        console.log(`Console listener attached via CDP to: ${url}`);
    }

    /**
     * @returns {Object[]} - An array of captured console log messages.
     */
    getData() {
        return this.capturedLogs;
    }
}
module.exports = ConsoleCollector;