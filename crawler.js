/* eslint-disable max-lines */
const puppeteer = require('puppeteer');
const chalk = require('chalk').default;
const {createTimer} = require('./helpers/timer');
const wait = require('./helpers/wait');
const tldts = require('tldts');
const {scrollPageToBottom, scrollPageToTop} = require('./helpers/autoscrollFunctions');
const {TimeoutError} = require('puppeteer').errors;
const optOutFromCMPs = require('./helpers/CMPOptOut');
const fs = require('fs');
const path = require('path');
const {overWriteGPP, overWriteUSPAPI} = require("./helpers/injectGpp");


const DEFAULT_USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.6834.159 Safari/537.36';
const MOBILE_USER_AGENT = 'Mozilla/5.0 (Linux; Android 10; Pixel 2 XL) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/93.0.4577.63 Mobile Safari/537.36';

const DEFAULT_VIEWPORT = {
    width: 1910,//px
    height: 1020//px
};
const MOBILE_VIEWPORT = {
    width: 412,
    height: 691,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true
};


// for debugging: will lunch in window mode instad of headless, open devtools and don't close windows after process finishes
const VISUAL_DEBUG = false;

/**
 * @param {number} waitTime
 */
function sleep(waitTime) {
    return new Promise(resolve => setTimeout(resolve, waitTime));
}

/**
     * @param {number} maxValue
     */
function getRandomUpTo(maxValue) {
    return Math.floor(Math.random() * maxValue);
}

/**
 * @param {function(...any):void} log
 * @param {string} proxyHost
 * @param {string} executablePath path to chromium executable to use
 * @param {boolean} headless 
 */
function openBrowser(log, proxyHost, executablePath, headless) {
    /**
     * @type {import('puppeteer').BrowserLaunchArgumentOptions}
     */
    const args = {
        args: [
            // enable FLoC
            '--enable-blink-features=InterestCohortAPI',
            //'--enable-features="FederatedLearningOfCohorts:update_interval/10s/minimum_history_domain_size_required/1,FlocIdSortingLshBasedComputation,InterestCohortFeaturePolicy"',
            '--js-flags="--async-stack-traces --stack-trace-limit 32"',
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--ignore-certificate-errors',
            '--start-maximized',
            '--disable-infobars',
            '--no-first-run'
        ],
        headless: 'new'
    };
    if (VISUAL_DEBUG) {
        args.headless = false;
        args.devtools = true;
    }
    // By default, chrome run in headless mode, so if we need to run chrome in non-headless mode, we need to set the headless option to false. 
    if (!headless) {
        args.headless = false;
    }
    if (proxyHost) {
        let url;
        try {
            url = new URL(proxyHost);
        } catch {
            log('Invalid proxy URL');
        }

        args.args.push(`--proxy-server=${proxyHost}`);
        args.args.push(`--host-resolver-rules="MAP * ~NOTFOUND , EXCLUDE ${url.hostname}"`);
    }
    if (executablePath) {
        // @ts-ignore there is no single object that encapsulates properties of both BrowserLaunchArgumentOptions and LaunchOptions that are allowed here
        args.executablePath = executablePath;
        console.log("Executable path: ", executablePath);
    }

    // @ts-ignore
    return puppeteer.launch(args);
}

/**
 * @param {import('puppeteer').BrowserContext} context
 * @param {URL} url
 * @param {{collectors: import('./collectors/BaseCollector')[], log: function(...any):void, urlFilter: function(string, string):boolean, emulateMobile: boolean, emulateUserAgent: boolean, optOut: boolean, runInEveryFrame: string | function():void, maxLoadTimeMs: number, extraExecutionTimeMs: number, saveCookies?:boolean, loadCookies?:boolean, cookieJarPath?:string, delayAfterScrollingMs?:number, collectorFlags: Object.<string, string>, injectAPIs?: boolean}} data
 *
 * @returns {Promise<CollectResult>}
*/
async function getSiteData(context, url, {
    collectors,
    log,
    urlFilter,
    emulateUserAgent,
    emulateMobile,
    runInEveryFrame,
    maxLoadTimeMs,
    extraExecutionTimeMs,
    optOut,
    injectAPIs,
    saveCookies,
    loadCookies,
    cookieJarPath,
    delayAfterScrollingMs,
    collectorFlags,
}) {
    const testStarted = Date.now();
    const delayTime = delayAfterScrollingMs || 20000; // Default to 20 seconds if not configured
    /**
     * @type {{cdpClient: import('puppeteer').CDPSession, type: string, url: string}[]}
     */
    const targets = [];

    const collectorOptions = {
        context,
        url,
        log,
        collectorFlags
    };

    for (let collector of collectors) {
        const timer = createTimer();

        try {
            // eslint-disable-next-line no-await-in-loop
            await collector.init(collectorOptions);
            log(`${collector.id()} init took ${timer.getElapsedTime()}s`);
        } catch (e) {
            log(chalk.yellow(`${collector.id()} init failed`), chalk.gray(e.message), chalk.gray(e.stack));
        }
    }

    let pageTargetCreated = false;

    // initiate collectors for all contexts (main page, web worker, service worker etc.)
    context.on('targetcreated', async target => {
        // we have already initiated collectors for the main page, so we ignore the first page target
        if (target.type() === 'page' && !pageTargetCreated) {
            pageTargetCreated = true;
            return;
        }

        const timer = createTimer();
        let cdpClient = null;
        
        try {
            cdpClient = await target.createCDPSession();
        } catch (e) {
            log(chalk.yellow(`Failed to connect to "${target.url()}"`), chalk.gray(e.message), chalk.gray(e.stack));
            return;
        }

        const simpleTarget = {url: target.url(), type: target.type(), cdpClient};
        targets.push(simpleTarget);

        try {
            // we have to pause new targets and attach to them as soon as they are created not to miss any data
            await cdpClient.send('Target.setAutoAttach', {autoAttach: true, waitForDebuggerOnStart: true});
        } catch (e) {
            log(chalk.yellow(`Failed to set "${target.url()}" up.`), chalk.gray(e.message), chalk.gray(e.stack));
            return;
        }

        for (let collector of collectors) {
            try {
                // eslint-disable-next-line no-await-in-loop
                await collector.addTarget(simpleTarget);
            } catch (e) {
                log(chalk.yellow(`${collector.id()} failed to attach to "${target.url()}"`), chalk.gray(e.message), chalk.gray(e.stack));
            }
        }

        try {
            // resume target when all collectors are ready
            await cdpClient.send('Runtime.enable');
            await cdpClient.send('Runtime.runIfWaitingForDebugger');
        } catch (e) {
            log(chalk.yellow(`Failed to resume target "${target.url()}"`), chalk.gray(e.message), chalk.gray(e.stack));
            return;
        }

        log(`${target.url()} (${target.type()}) context initiated in ${timer.getElapsedTime()}s`);
    });

    // Create a new page in a pristine context.
    const page = await context.newPage();

    //Load cookies if needed
    if (loadCookies) {
        console.log("Loading cookies from cookie jar: ", cookieJarPath);
        
        try {
            if (fs.existsSync(cookieJarPath)) {
                const cookies = JSON.parse(fs.readFileSync(cookieJarPath, 'utf-8'));
                console.log("Cookies loaded from file: ", cookieJarPath);
                await page.setCookie(...cookies);
                console.log("Cookies set via page.setCookie for browser context");
            } else {
                console.error("Cookie Jar file not found.");
            }
     
        }   catch(error) {
            console.log("Error loading cookies: ", error);
        }
 
    }

    // optional function that should be run on every page (and subframe) in the browser context
    if (runInEveryFrame) {
        page.evaluateOnNewDocument(runInEveryFrame);
    }

    // Overwrite __gpp API to capture GPP data
    if (injectAPIs) {
        
        await page.evaluateOnNewDocument(overWriteGPP); // Inject our own GPP implementation
        await page.evaluateOnNewDocument(overWriteUSPAPI); //Inject our own USP API implementation
    }

    // We are creating CDP connection before page target is created, if we create it only after
    // new target is created we will miss some requests, API calls, etc.
    const cdpClient = await page.target().createCDPSession();

    // without this, we will miss the initial request for the web worker or service worker file
    await cdpClient.send('Target.setAutoAttach', {autoAttach: true, waitForDebuggerOnStart: true});

    const initPageTimer = createTimer();
    for (let collector of collectors) {
        try {
            // eslint-disable-next-line no-await-in-loop
            await collector.setPage(page);
            // eslint-disable-next-line no-await-in-loop
            await collector.addTarget({url: url.toString(), type: 'page', cdpClient});
        } catch (e) {
            log(chalk.yellow(`${collector.id()} failed to attach to page`), chalk.gray(e.message), chalk.gray(e.stack));
        }
    }
    log(`page context initiated in ${initPageTimer.getElapsedTime()}s`);

    if (emulateUserAgent) {
        await page.setUserAgent(emulateMobile ? MOBILE_USER_AGENT : DEFAULT_USER_AGENT);
    }

    await page.setViewport(emulateMobile ? MOBILE_VIEWPORT : DEFAULT_VIEWPORT);

    // if any prompts open on page load, they'll make the page hang unless closed
    page.on('dialog', dialog => dialog.dismiss());

    // catch and report crash errors
    page.on('error', e => log(chalk.red(e.message)));

    let timeout = false;

    try {
        await page.goto(url.toString(), {timeout: maxLoadTimeMs, waitUntil: 'networkidle0'});
    } catch (e) {
        if (e instanceof TimeoutError || (e.name && e.name === 'TimeoutError')) {
            log(chalk.yellow('Navigation timeout exceeded.'));

            for (let target of targets) {
                if (target.type === 'page') {
                    // eslint-disable-next-line no-await-in-loop
                    // Comment out the following linem, because even after page is still loading after timeout, we do not want to
                    // prevent external scripts from loading, because we want to collect all data from the page.
                    // 
                    //await target.cdpClient.send('Page.stopLoading');
                    
                }
            }
            timeout = true;
        } else {
            throw e;
        }
    }

    let cmpOptOutResults;
    console.log("CMP Opt-out Flag: ", optOut);

    if (optOut) {
        console.log("Wait for 5 more seconds before opting out of CMPs");
        await sleep(5000);
        console.log("Opting out of CMPs ");
        cmpOptOutResults = await optOutFromCMPs(page);
    }


    try {
        // Using the puppetter-autoscroll-down package to scroll to the bottom of the page
        await scrollPageToBottom(page, {
            size: 700 + getRandomUpTo(200),
            delay: 500 + getRandomUpTo(100),
        });
    } catch{
        console.log("Unable to scroll to the bottom of the page");
    }

    console.log("Done scrolling to the bottom of the page");
    
    console.log(`Waiting for configurable delay ${delayTime} milliseconds before calling consent API`);  
    await sleep(delayTime);

    for (let collector of collectors) {
        const postLoadTimer = createTimer();
        try {
            // collector.setPage(page);
            // eslint-disable-next-line no-await-in-loop
            await collector.postLoad();
            log(`${collector.id()} postLoad took ${postLoadTimer.getElapsedTime()}s`);
        } catch (e) {
            log(chalk.yellow(`${collector.id()} postLoad failed`), chalk.gray(e.message), chalk.gray(e.stack));
        }
    }

    try {
        console.log("Scrolling to the top of the page");
        await scrollPageToTop(page, {
            size: 700 + getRandomUpTo(200),
            delay: 150 + getRandomUpTo(100),
        });
    } catch {
        console.log("Failed to scroll to top of the page.");
    }

    // give website a bit more time for things to settle
    await sleep(extraExecutionTimeMs);

    const finalUrl = page.url();
    /**
     * @type {Object<string, Object>}
     */
    const data = {};

    for (let collector of collectors) {
        const getDataTimer = createTimer();
        try {
            // eslint-disable-next-line no-await-in-loop
            const collectorData = await collector.getData({
                finalUrl,
                urlFilter: urlFilter && urlFilter.bind(null, finalUrl),
                // @ts-ignore
                page,
            });
            data[collector.id()] = collectorData;
            log(`getting ${collector.id()} data took ${getDataTimer.getElapsedTime()}s`);
        } catch (e) {
            log(chalk.yellow(`getting ${collector.id()} data failed`), chalk.gray(e.message), chalk.gray(e.stack));
            data[collector.id()] = null;
        }
    }

    for (let target of targets) {
        try {
            // eslint-disable-next-line no-await-in-loop
            await target.cdpClient.detach();
        } catch {
            // we don't care that much because in most cases an error here means that target already detached
        }
    }

    if (!VISUAL_DEBUG) {
        await page.close();
    }

    if(optOut) {
        data.cmpOptOutResults = cmpOptOutResults;
    }

   
    if (saveCookies) {
        console.log("Saving cookies to cookie jar: ", cookieJarPath);
        try {
            //save data.cookies to a json file
            const cookieData = data.cookies;
            // console.log("Cookies: ", cookieData);

            const dir = path.dirname(cookieJarPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, {recursive: true});
            }
        
            fs.writeFileSync(cookieJarPath, JSON.stringify(cookieData, null, 2), 'utf-8');
            console.log("Cookies saved to file: ", cookieJarPath);
        } catch (error) {
            console.error("Error saving cookies: ", error);
        }
    }

    return {
        initialUrl: url.toString(),
        finalUrl,
        timeout,
        testStarted,
        testFinished: Date.now(),
        data
    };
}

/**
 * @param {string} documentUrl
 * @param {string} requestUrl
 * @returns {boolean}
 */
function isThirdPartyRequest(documentUrl, requestUrl) {
    const mainPageDomain = tldts.getDomain(documentUrl);

    return tldts.getDomain(requestUrl) !== mainPageDomain;
}

/**
 * @param {URL} url
 * @param {{collectors?: import('./collectors/BaseCollector')[], log?: function(...any):void, filterOutFirstParty?: boolean, emulateMobile?: boolean, emulateUserAgent?: boolean, proxyHost?: string, browserContext?: import('puppeteer').BrowserContext, runInEveryFrame?: string | function():void, executablePath?: string, maxLoadTimeMs?: number, extraExecutionTimeMs?: number, optOut?: boolean, saveCookies?:boolean, loadCookies?:boolean, headless?: boolean, cookieJarPath?:string, delayAfterScrollingMs?: number, collectorFlags?: Object.<string, string>, injectAPIs?: boolean}} options
 * @param {import('puppeteer').BrowserContext} browserContext
 * @returns {Promise<CollectResult>}
 */
module.exports = async (url, options, browserContext) => {
    const log = options.log || (() => {});
    const browser = browserContext ? null : await openBrowser(log, options.proxyHost, options.executablePath, options.headless);
    // Create a new browser context.
    const context = browserContext || await browser.defaultBrowserContext();
    // const context = options.browserContext || await browser.createIncognitoBrowserContext();

    let data = null;

    const maxLoadTimeMs = options.maxLoadTimeMs || 30000;
    const extraExecutionTimeMs = options.extraExecutionTimeMs || 2500;
    const maxTotalTimeMs = maxLoadTimeMs * 2;

    try {
        data = await wait(getSiteData(context, url, {
            collectors: options.collectors || [],
            log,
            urlFilter: options.filterOutFirstParty === true ? isThirdPartyRequest.bind(null) : null,
            emulateUserAgent: options.emulateUserAgent !== false, // true by default
            emulateMobile: options.emulateMobile,
            runInEveryFrame: options.runInEveryFrame,
            maxLoadTimeMs,
            extraExecutionTimeMs,
            optOut: options.optOut,
            saveCookies: options.saveCookies,
            loadCookies: options.loadCookies,
            cookieJarPath: options.cookieJarPath,
            delayAfterScrollingMs: options.delayAfterScrollingMs,
            collectorFlags: options.collectorFlags,
            injectAPIs: options.injectAPIs
        }), maxTotalTimeMs);
    } catch(e) {
        log(chalk.red('Crawl failed'), e.message, chalk.gray(e.stack));
        throw e;
    } finally {
        // only close the browser if it was created here and not debugging
        if (browser && !VISUAL_DEBUG) {
            await browser.close();
        }

        //close the browser if it was open in non-headless mode
        if (browser && !options.headless) {
            await browser.close();
        }
    }

    return data;
};

module.exports.openBrowser = openBrowser;
module.exports.VISUAL_DEBUG = VISUAL_DEBUG;

/**
 * @typedef {Object} CollectResult
 * @property {string} initialUrl URL from which the crawler began the crawl (as provided by the caller)
 * @property {string} finalUrl URL after page has loaded (can be different from initialUrl if e.g. there was a redirect)
 * @property {boolean} timeout true if page didn't fully load before the timeout and loading had to be stopped by the crawler
 * @property {number} testStarted time when the crawl started (unix timestamp)
 * @property {number} testFinished time when the crawl finished (unix timestamp)
 * @property {import('./helpers/collectorsList').CollectorData} data object containing output from all collectors
*/
