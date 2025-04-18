const os = require('os');
const cores = os.cpus().length;
const chalk = require('chalk').default;
const async = require('async');
const crawl = require('./crawler');
const URL = require('url').URL;
const {createTimer} = require('./helpers/timer');
const createDeferred = require('./helpers/deferred');
// const downloadCustomChromium = require('./helpers/downloadCustomChromium');
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const BaseCollector = require('./collectors/BaseCollector');
const f = require('fs');
// const notABot = require('./helpers/notABot');
const puppeteer = require('puppeteer');
const notABot = f.readFileSync('./helpers/stealth.min.js', 'utf8');
const {openBrowser, VISUAL_DEBUG} = require('./crawler');


const MAX_NUMBER_OF_CRAWLERS = 38;// by trial and error there seems to be network bandwidth issues with more than 38 browsers. 
const MAX_NUMBER_OF_RETRIES = 2;


/**
 * @param {string} urlString 
 * @param {BaseCollector[]} dataCollectors
 * @param {function} log 
 * @param {boolean} filterOutFirstParty
 * @param {function(URL, import('./crawler').CollectResult): void} dataCallback 
 * @param {boolean} emulateMobile
 * @param {string} proxyHost
 * @param {boolean} antiBotDetection
 * @param {string} executablePath
 * @param {number} maxLoadTimeMs
 * @param {number} extraExecutionTimeMs
 * @param {boolean} optOut
 * @param {boolean} semiAutomated
 * @param {boolean} statefulCrawl
 * @param {boolean} saveCookies
 * @param {boolean} loadCookies
 * @param {string} cookieJarPath
 * @param {puppeteer.BrowserContext} browserContext
 * @param {Object.<string, string>} collectorFlags
 */
async function crawlAndSaveData(urlString, dataCollectors, log, filterOutFirstParty, dataCallback, emulateMobile, proxyHost, antiBotDetection, executablePath, maxLoadTimeMs, extraExecutionTimeMs, optOut, semiAutomated, statefulCrawl, saveCookies, loadCookies, cookieJarPath, collectorFlags, browserContext) {
    const url = new URL(urlString);
    /**
     * @type {function(...any):void} 
     */
    const prefixedLog = (...msg) => log(chalk.gray(`${url.hostname}:`), ...msg);

    // @ts-ignore
    const data = await crawl(
 url, {
     log: prefixedLog,
        // @ts-ignore
     collectors: dataCollectors.map(collector => new collector.constructor()),
     filterOutFirstParty,
     emulateMobile,
     proxyHost,
     runInEveryFrame: antiBotDetection ? notABot : undefined,
     executablePath,
     maxLoadTimeMs,
     extraExecutionTimeMs,
     optOut,
     semiAutomated,
     saveCookies,
     loadCookies,
     cookieJarPath,
     collectorFlags,
 },
    browserContext
);

    dataCallback(url, data);
}


/**
 * @param {{urls: Array<string|{url:string,dataCollectors?:BaseCollector[]}>, dataCallback: function(URL, import('./crawler').CollectResult): void, dataCollectors?: BaseCollector[], failureCallback?: function(string, Error): void, numberOfCrawlers?: number, logFunction?: function, filterOutFirstParty: boolean, emulateMobile: boolean, proxyHost: string, antiBotDetection?: boolean, chromiumVersion?: string, maxLoadTimeMs?: number, extraExecutionTimeMs?: number, executablePath?: string , optOut?: boolean, semiAutomated?: boolean, statefulCrawl?:boolean, saveCookies?:boolean, loadCookies?:boolean, cookieJarPath?:string, collectorFlags?: Object.<string, boolean>}} options
 */
module.exports = async options => {
    const deferred = createDeferred();
    const log = options.logFunction || (() => {});
    const failureCallback = options.failureCallback || (() => {});

    let numberOfCrawlers = options.numberOfCrawlers || Math.floor(cores * 0.8);
    numberOfCrawlers = Math.min(MAX_NUMBER_OF_CRAWLERS, numberOfCrawlers, options.urls.length);

    // Increase number of listeners so we have at least one listener for each async process
    if (numberOfCrawlers > process.getMaxListeners()) {
        process.setMaxListeners(numberOfCrawlers + 1);
    }
    log(chalk.cyan(`Number of crawlers: ${numberOfCrawlers}\n`));

    /**
     * @type {string}
     */
    let executablePath = options.executablePath;
    // if (options.chromiumVersion) {
    //     executablePath = await downloadCustomChromium(log, options.chromiumVersion);
    // }
    let browserContext = null;
    let browser = null;
    if (options.statefulCrawl) {
        console.log("Stateful crawl is enabled.");
       
        // @ts-ignore
        browser = await openBrowser(log, options.proxyHost, executablePath);
        browserContext = browser.defaultBrowserContext();
        // options.browserContext = browserContext;
    }


    async.eachOfLimit(options.urls, numberOfCrawlers, (urlItem, idx, callback) => {
        const urlString = (typeof urlItem === 'string') ? urlItem : urlItem.url;
        let dataCollectors = options.dataCollectors;

        // there can be a different set of collectors for every item
        if ((typeof urlItem !== 'string') && urlItem.dataCollectors) {
            dataCollectors = urlItem.dataCollectors;
        }

        log(chalk.cyan(`Processing entry #${Number(idx) + 1} (${urlString}).`));
        const timer = createTimer();

        const task = crawlAndSaveData.bind(null, urlString, dataCollectors, log, options.filterOutFirstParty, options.dataCallback, options.emulateMobile, options.proxyHost, (options.antiBotDetection !== false), executablePath, options.maxLoadTimeMs, options.extraExecutionTimeMs, options.optOut, options.semiAutomated, options.statefulCrawl, options.saveCookies, options.loadCookies, options.cookieJarPath, options.collectorFlags, browserContext);

        async.retry(MAX_NUMBER_OF_RETRIES, task, err => {
            if (err) {
                log(chalk.red(`Max number of retries (${MAX_NUMBER_OF_RETRIES}) exceeded for "${urlString}".`));
                failureCallback(urlString, err);
            } else {
                log(chalk.cyan(`Processing "${urlString}" took ${timer.getElapsedTime()}s.`));
            }

            callback();
        });
    }, err => {
        if (err) {
            deferred.reject(err);
        } else {
            deferred.resolve();
        }
    });

    await deferred.promise;

    if (browser && !VISUAL_DEBUG) {
        await browser.close();
    }
};
