# Global Privacy Platform Opt-Out Research Crawler
🕸 Privacy research crawler based on DuckDuckGo's [Tracker Radar Collector](https://github.com/duckduckgo/tracker-radar-collector), modified to investigate the effectiveness of different opt-out mechanisms and analyze Global Privacy Platform (GPP) implementations across websites.

This work builds upon our previous research in ["Johnny Still Can't Opt-out: Assessing the IAB CCPA Compliance Framework"](https://abubakaraziz.com/assets/pdf/iab-ccpa-compliance.pdf), extending the analysis to newer privacy frameworks and opt-out mechanisms.

## Research Focus

This crawler is designed to analyze:
- **Opt-out mechanism effectiveness** across different privacy frameworks
- **Global Privacy Platform (GPP)** compliance and implementation patterns  
- **Cross-website privacy behavior** variations
- **Request patterns** and **tracking behaviors** before/after opt-out signals

## Key Enhancements

- **Enhanced RequestCollector**: Added image dimension detection for tracking pixel analysis
- **LinkCollector**: Systematic internal link discovery for comprehensive website coverage
- **GPP Integration**: Support for Global Privacy Platform signal injection and analysis
- **Opt-out Testing**: Configurable opt-out mechanisms (GPC, GPP, cookie preferences)

## New Data Collectors

- **GPP Collector** (`gpp`): Detects Global Privacy Platform implementations on websites. Collects GPP API objects, section data, addEventListener events, USP strings, TCF data, and CMP consent objects (OneTrust, Didomi, CookieBot, Quantcast).
- **Console Collector** (`console`): Captures all browser console output (log, error, warning, info) via CDP, recording the message, level, timestamp, and source URL.

Add them to your config via the `dataCollectors` array:
```json
"dataCollectors": ["requests", "cookies", "gpp", "console"]
```

## Ongoing Research

⚠️ **This is an active research project.** The codebase is under continuous development as we investigate privacy opt-out mechanisms across the web.

### Research Collaboration Notice

If you plan to use this code for research purposes, please contact me at **aziz.muh@northeastern.edu** to discuss your research questions. My current paper is in the submission process, and I'd appreciate coordinating to avoid overlapping work.

## How do I use it?

### Quick start: run the default baseline crawl

The default config crawls 20 representative websites with no opt-out signal (the control condition). It collects APIs, cookies, network requests, and IAB consent strings (GPP/USP) if present on the page.

From the repo root:

```sh
cd global_privacy_platform
npm run crawl -- --config configs/default.json
```

Output is written to `./data/default/`. The URL list is in `configs/default_urls.txt` — edit it to use your own sites.

### GPP/USP API Injection

Injects stub `__gpp` and `__uspapi` privacy APIs into every page to test how sites respond when the GPP/USP API is present.

```sh
npm run crawl -- --config configs/inject_apis.json
```

Output is written to `./data/inject_apis/`.

### GPC (Global Privacy Control)

Crawls with the GPC signal active: sets the `Sec-GPC: 1` HTTP header on every request and injects `navigator.globalPrivacyControl = true` into every page context.

```sh
npm run crawl -- --config configs/gpc.json
```

Output is written to `./data/gpc/`.

> **Proxy note:** The original experiments used a California-based SOCKS5 proxy (`"proxyConfig": "socks5://localhost:11000"`) to simulate CCPA jurisdiction. The config here omits the proxy — add `"proxyConfig"` to the JSON if you need geolocation.

> **Chrome binary:** This tool was tested with Chrome for Testing `132.0.6834.110`. The binary is already included in the repo at:
> ```
> ./chrome/chrome-linux64-chromefortesting-132.0.6834.110/chrome
> ```
> All config files point to this path via `executablePath` — no setup needed. If for any reason the binary is missing, download it with:
> ```sh
> wget https://storage.googleapis.com/chrome-for-testing-public/132.0.6834.110/linux64/chrome-linux64.zip
> unzip chrome-linux64.zip
> mv chrome-linux64 chrome/chrome-linux64-chromefortesting-132.0.6834.110
> ```
> It may work with a newer Chrome version, but that has not been fully tested — update `executablePath` in the config if you use a different binary.

### Use it from the command line

1. Clone this project locally
2. Install all dependencies (`npm i`)
3. Run the command line tool:

```sh
npm run crawl -- -u "https://example.com" -o ./data/ -v
```

Available options:

- `-o, --output <path>` - (required) output folder where output files will be created
- `-u, --url <url>` - single URL to crawl
- `-i, --input-list <path>` - path to a text file with list of URLs to crawl (each in a separate line)
- `-d, --data-collectors <list>` - comma separated list (e.g `-d 'requests,cookies'`) of data collectors that should be used (all by default)
- `-c, --crawlers <number>` - override the default number of concurrent crawlers (default number is picked based on the number of CPU cores)
- `--reporters <list>` - comma separated list (e.g. `--reporters 'cli,file,html'`) of reporters to be used ('cli' by default)
- `-v, --verbose` - instructs reporters to log additional information (e.g. for "cli" reporter progress bar will not be shown when verbose logging is enabled)
- `-l, --log-path <path>` - instructs reporters where all logs should be written to
- `-f, --force-overwrite` - overwrite existing output files (by default entries with existing output files are skipped)
- `-3, --only-3p` - don't save any first-party data (e.g. requests, API calls for the same eTLD+1 as the main document)
- `-m, --mobile` - emulate a mobile device when crawling
- `-p, --proxy-config <host>` - optional SOCKS proxy host
- `-r, --region-code <region>` - optional 2 letter region code. For metadata only
- `-a, --disable-anti-bot` - disable simple build-in anti bot detection script injected to every frame
- `--chromium-version <version_number>` - use custom version of Chromium (e.g. "843427") instead of using the default
- `--config <path>` - path to a config file that allows to set all the above settings (and more). Note that CLI flags have a higher priority than settings passed via config. See `configs/default.json` for a working example.
- `--autoconsent-action <action>` - automatic autoconsent action (requires the `cmps` collector). Possible values: optIn, optOut
- `--load-cookies` - load cookies from a cookie jar file before crawling
- `--cookie-jar-path <path>` - path to the cookie jar JSON file to load
- `--save-cookies` - save collected cookies to the cookie jar after crawling
- `--delay-after-scrolling-ms <number>` - delay in milliseconds after scrolling interactions before collecting data
- `--opt-out` - enable CMP opt-out mechanism interaction
- `--http-headers <json>` - custom HTTP headers to send with requests (e.g. `'{"Sec-GPC": "1"}'`)
- `--inject-gpc-nav` - inject `navigator.globalPrivacyControl = true` into pages to signal GPC support
- `--inject-apis` - inject privacy API overrides into page context, including the GPP API (`__gpp`) and USP API (`__uspapi`)
- `--headless` - run the browser in headless mode (enabled by default in config files)

### Use it as a module

1. Install this project as a dependency (`npm i git+https://github.com:duckduckgo/tracker-radar-collector.git`).

2. Import it:

```js
// you can either import a "crawlerConductor" that runs multiple crawlers for you
const {crawlerConductor} = require('tracker-radar-collector');
// or a single crawler
const {crawler} = require('tracker-radar-collector');

// you will also need some data collectors (/collectors/ folder contains all build-in collectors)
const {RequestCollector, CookieCollector, …} = require('tracker-radar-collector');
```

3. Use it:

```js
crawlerConductor({
    // required ↓
    urls: ['https://example.com', {url: 'https://duck.com', dataCollectors: [new ScreenshotCollector()]}, …], // two formats available: first format will use default collectors set below, second format will use custom set of collectors for this one url
    dataCallback: (url, result) => {…},
    // optional ↓
    dataCollectors: [new RequestCollector(), new CookieCollector()],
    failureCallback: (url, error) => {…},
    numberOfCrawlers: 12,// custom number of crawlers (there is a hard limit of 38 though)
    logFunction: (...msg) => {…},// custom logging function
    filterOutFirstParty: true,// don't save any first-party data (false by default)
    emulateMobile: true,// emulate a mobile device (false by default)
    proxyHost: 'socks5://myproxy:8080',// SOCKS proxy host (none by default)
    antiBotDetection: true,// if anti bot detection script should be injected (true by default)
    chromiumVersion: '843427',// Chromium version that should be downloaded and used instead of the default one
    maxLoadTimeMs: 30000,// how long should crawlers wait for the page to load, defaults to 30s
    extraExecutionTimeMs: 2500,// how long should crawlers wait after page loads before collecting data, defaults to 2.5s
});
```

**OR** (if you prefer to run a single crawler)

```js
// crawler will throw an exception if crawl fails
const data = await crawler(new URL('https://example.com'), {
    // optional ↓
    collectors: [new RequestCollector(), new CookieCollector(), …],
    log: (...msg) => {…},
    urlFilter: (url) => {…},// function that, for each request URL, decides if its data should be stored or not
    emulateMobile: false,
    emulateUserAgent: false,// don't use the default puppeteer UA (default true)
    proxyHost: 'socks5://myproxy:8080',
    browserContext: context,// if you prefer to create the browser context yourself (to e.g. use other browser or non-incognito context) you can pass it here (by default crawler will create an incognito context using standard chromium for you)
    runInEveryFrame: () => {window.alert('injected')},// function that should be executed in every frame (main + all subframes)
    executablePath: '/some/path/Chromium.app/Contents/MacOS/Chromium',// path to a custom Chromium installation that should be used instead of the default one
    maxLoadTimeMs: 30000,// how long should the crawler wait for the page to load, defaults to 30s
    extraExecutionTimeMs: 2500,// how long should crawler wait after page loads before collecting data, defaults to 2.5s
});
```

ℹ️ Hint: check out `crawl-cli.js` and `crawlerConductor.js` to see how `crawlerConductor` and `crawler` are used in the wild.

## Output format

Each successfully crawled website will create a separate file named after the website (when using the CLI tool). Output data format is specified in `crawler.js` (see `CollectResult` type definition).
Additionally, for each crawl `metadata.json` file will be created containing crawl configuration, system configuration and some high-level stats. 

## Data post-processing

Example post-processing script, that can be used as a template, can be found in `post-processing/summary.js`. Execute it from the command line like this:

```sh
node ./post-processing/summary.js -i ./collected-data/ -o ./result.json
```

ℹ️ Hint: When dealing with huge amounts of data you may need to increase nodejs's memory limit e.g. `node --max_old_space_size=4096`.

## Creating new collectors

Each collector needs to extend the `BaseCollector` and has to override following methods:

- `id()` which returns name of the collector (e.g. 'cookies')
- `getData(options)` which should return collected data. `options` have following properties:
    - `finalUrl` - final URL of the main document (after all redirects) that you may want to use,
    - `filterFunction` which, if provided, takes an URL and returns a boolean telling you if given piece of data should be returned or filtered out based on its origin.

Additionally, each collector can override following methods:

- `init(options)` which is called before the crawl begins
- `addTarget(targetInfo)` which is called whenever new target is created (main page, iframe, web worker etc.)
- `postLoad()` which is called after the page has loaded. This is the place for executing heavy page interactions (`extraExecutionTimeMs` is applied after this hook).

There are couple of built-in collectors in the `collectors/` folder. `CookieCollector` is the simplest one and can be used as a template.

Each new collector has to be added in two places to be discoverable:
- `crawlerConductor.js` - so that `crawlerConductor` knows about it (and it can be used in the CLI tool)
- `main.js` - so that the new collector can be imported by other projects

You can also add types to define the structure of the data exported by your collector. These should be added to the `CollectorData` type in `collectorsList.js`. This will add type hints to all places where the data is used in the code.
