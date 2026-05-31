# Global Privacy Platform Opt-Out Research Crawler

🕸 Privacy research crawler based on DuckDuckGo's [Tracker Radar Collector](https://github.com/duckduckgo/tracker-radar-collector), modified to investigate the effectiveness of different opt-out mechanisms and analyze Global Privacy Platform (GPP) implementations across websites.

This work builds upon our previous research in ["Johnny Still Can't Opt-out: Assessing the IAB CCPA Compliance Framework"](https://abubakaraziz.com/assets/pdf/iab-ccpa-compliance.pdf), extending the analysis to newer privacy frameworks and opt-out mechanisms.

## Research Focus

This crawler is designed to analyze:
- **Opt-out mechanism effectiveness** across different privacy frameworks
- **Global Privacy Platform (GPP)** compliance and implementation patterns
- **Cross-website privacy behavior** variations
- **Request patterns** and **tracking behaviors** before/after opt-out signals

## What We Added

On top of the upstream collector, this repo adds:

- **GPP Collector** (`gpp`): Detects Global Privacy Platform implementations. Collects GPP API objects, section data, `addEventListener` events, USP strings, TCF data, and CMP consent objects (OneTrust, Didomi, CookieBot, Quantcast).
- **Console Collector** (`console`): Captures all browser console output (log, error, warning, info) via CDP — message, level, timestamp, and source URL.
- **Opt-out signals**: GPC (`Sec-GPC` header + `navigator.globalPrivacyControl`), GPP/USP API injection, and interactive CMP opt-out.
- **Enhanced RequestCollector**: image dimension detection for tracking-pixel analysis.

Enable collectors via the `dataCollectors` array in your config:
```json
"dataCollectors": ["requests", "cookies", "gpp", "console"]
```

## Ongoing Research

⚠️ **This is an active research project**, under continuous development as we investigate privacy opt-out mechanisms across the web.

If you plan to use this code for research, please contact **aziz.muh@northeastern.edu** to discuss your research questions. My current paper is in submission, and I'd appreciate coordinating to avoid overlapping work.

## How do I use it?

Experiments are defined by config files in `configs/`. Each crawl is run with `npm run crawl -- --config <path>`.

### Quick start: baseline crawl

The default config crawls 20 representative websites with no opt-out signal (the control condition). It collects APIs, cookies, network requests, and IAB consent strings (GPP/USP) if present.

```sh
cd global_privacy_platform
npm run crawl -- --config configs/default.json
```

Output is written to `./data/default/`. The URL list is in `configs/default_urls.txt` — edit it to use your own sites.

### GPC (Global Privacy Control)

Crawls with the GPC signal active: sets the `Sec-GPC: 1` HTTP header on every request and injects `navigator.globalPrivacyControl = true` into every page.

```sh
npm run crawl -- --config configs/gpc.json
```

Output is written to `./data/gpc/`.

### GPP/USP API Injection

Injects stub `__gpp` and `__uspapi` privacy APIs into every page to test how sites respond when the GPP/USP API is present.

```sh
npm run crawl -- --config configs/inject_apis.json
```

Output is written to `./data/inject_apis/`.

> **Proxy note:** The original crawls were run from California (over AWS, via a SOCKS5 proxy: `"proxyConfig": "socks5://localhost:11000"`) to test CCPA behavior. These configs omit the proxy. Add `"proxyConfig"` to the JSON to route traffic through a different location.

> **Chrome binary:** Tested with Chrome for Testing `132.0.6834.110`, already included in the repo at `./chrome/chrome-linux64-chromefortesting-132.0.6834.110/chrome`. All configs point to it via `executablePath` — no setup needed. If it's missing, download it with:
> ```sh
> wget https://storage.googleapis.com/chrome-for-testing-public/132.0.6834.110/linux64/chrome-linux64.zip
> unzip chrome-linux64.zip
> mv chrome-linux64 chrome/chrome-linux64-chromefortesting-132.0.6834.110
> ```

### Use it from the command line

Configs are the main interface, but you can also crawl a single URL directly. CLI flags override config values.

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

## Output format

Each successfully crawled website creates a separate file named after the site. The output data format is defined in `crawler.js` (see the `CollectResult` type). A `metadata.json` file is also written per crawl, containing the crawl configuration, system configuration, and high-level stats.

## Data post-processing

An example post-processing script you can use as a template is in `post-processing/summary.js`:

```sh
node ./post-processing/summary.js -i ./collected-data/ -o ./result.json
```

ℹ️ For large datasets you may need to raise Node's memory limit, e.g. `node --max_old_space_size=4096`.
