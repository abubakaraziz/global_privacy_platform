const fs = require('fs');
const path = require('path');
const program = require('commander');

// Define the folder containing JSON files
// const dataFolder = '/Users/jawadsaeed/Documents/SPROJ/tracker-radar-collector/data';
program
  .option('--i <path>', 'Input directory for data files')
  .option('--o <path>', 'Output file for summary data')
  .parse(process.argv);

const options = program.opts();
console.log(options);

/**
 * @typedef {Object} GppObject
 * @property {string} gppVersion
 * @property {string} cmpStatus
 * @property {string} cmpDisplayStatus
 * @property {string} signalStatus
 * @property {string[]} supportedAPIs
 * @property {number} cmpId
 * @property {number[]} sectionList
 * @property {number[]} applicableSections
 * @property {string} gppString
 * @property {Object} parsedSections
 */

/**
 * @typedef {Object} InputData
 * @property {string} initialUrl
 * @property {string} finalUrl
 * @property {boolean} timeout
 * @property {number} testStarted
 * @property {number} testFinished
 * @property {GppObject} data
 */

/**
 * @typedef {Object} GlobalStats
 * @property {number} validFiles
 * @property {number} failingFiles
 * @property {number} timeouts
 * @property {number} totalTime
 * @property {number} avgTime
 * @property {number} gppApiEntries
 */

// Variables to hold aggregated results
/** @type {GlobalStats} */
let globalStats = {
    validFiles: 0,
    failingFiles: 0,
    timeouts: 0,
    totalTime: 0,
    avgTime: 0,
    gppApiEntries: 0
};

// Arrays to store URLs with corresponding non-empty API values
/** @type {Array<{ url: string, gppObject: string[] }>} */
let gppApiEntries = [];

/**
 * Processes a single JSON file, updating global and CMP statistics.
 * 
 * @param {string} filePath - The path to the JSON file
 */
function processFile(filePath) {
    try {
    /** @type {InputData} */
        const parsedData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        // Getting the data fields from the json
        const {initialUrl, timeout, testStarted, testFinished, data} = parsedData;

    // Update global stats
        if (timeout) {
            globalStats.timeouts++;
        } else {
            globalStats.validFiles++;
            const duration = testFinished - testStarted;
            globalStats.totalTime += duration;
        }

    // So the data field has all the different collector results
    // We need to check if the gppObjects field is empty or not since that indicates the presence of the GPP api
    // If it is not empty, we need to update the gppApiEntries
        // @ts-ignore
        if (data.gpp.gppObjects.length > 0) {
            // @ts-ignore
            const gppObject = data.gpp.gppObjects[0];
            // Push the entire object to the gppApiEntries array
            gppApiEntries.push({
                url: initialUrl,
                gppObject
            });
            // Update the number of GPP API entries
            globalStats.gppApiEntries++;
        }
    } catch (error) {
        console.error(`Error processing file ${filePath}: ${error.message}`);
        globalStats.failingFiles++;
    }
}

// Read and process all files in the data folder
fs.readdirSync(program.i).forEach(file => {
    const filePath = path.join(program.i, file);
    processFile(filePath);
});

// Create final result object
const result = {
    global: globalStats,
    gppApiEntries
};

// Write result to a new JSON file
// fs.writeFileSync('/Users/jawadsaeed/Documents/SPROJ/tracker-radar-collector/summary/framework-summary.json', JSON.stringify(result, null, 2));
const main = () => {
    const outputDir = path.dirname(program.o);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, {recursive: true});
    }

    fs.readdirSync(program.i).forEach(file => {
        const filePath = path.join(program.i, file);
        processFile(filePath);
    });
    fs.writeFileSync(program.o, JSON.stringify(result, null, 2));
};

main();

console.log('Processing completed. Results saved in ' + program.output);
