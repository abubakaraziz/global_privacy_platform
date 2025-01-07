const overWriteGPP = `
    Object.defineProperty(window, "__gpp", {
        value: function(command, callback) {
            //Define the GPP data object
            let gppData = {
                "gppVersion": "1.1",
                "cmpStatus": "loaded",
                "cmpDisplayStatus": "hidden",
                "signalStatus": "ready",
                "supportedAPIs": [
                    "6:uspv1",
                    "7:usnat",
                    "8:usca"
                ],
                "sectionList": [
                    6,
                    7,
                    8
                ],
                "applicableSections": [6, 7, 8], 
                "gppString": "DBABzYA~1YYN~BVVVVVVVVmA.YA~BVVFVVWY.YA",
                "parsedSections": {
                    "uspv1": "1YYN",
                    "usnat": {
                        "Version": 1,
                        "SharingNotice": 1,
                        "SaleOptOutNotice": 1,
                        "SharingOptOutNotice": 1,
                        "TargetedAdvertisingOptOutNotice": 1,
                        "SensitiveDataProcessingOptOutNotice": 1,
                        "SensitiveDataLimitUseNotice": 1,
                        "SaleOptOut": 1,
                        "SharingOptOut": 1,
                        "TargetedAdvertisingOptOut": 1,
                        "SensitiveDataProcessing": [
                            1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1
                        ],
                        "KnownChildSensitiveDataConsents": [1, 1],
                        "PersonalDataConsents": 1,
                        "MspaCoveredTransaction": 2,
                        "MspaOptOutOptionMode": 1,
                        "MspaServiceProviderMode": 2,
                        "GpcSegmentType": 1,
                        "Gpc": true
                    },
                    "usca": {
                        "Version": 1,
                        "SaleOptOutNotice": 1,
                        "SharingOptOutNotice": 1,
                        "SensitiveDataLimitUseNotice": 1,
                        "SaleOptOut": 1,
                        "SharingOptOut": 1,
                        "SensitiveDataProcessing": [
                            1, 1, 1, 1, 1, 1, 1, 1, 1
                        ],
                        "KnownChildSensitiveDataConsents": [1, 1],
                        "PersonalDataConsents": 1,
                        "MspaCoveredTransaction": 2,
                        "MspaOptOutOptionMode": 1,
                        "MspaServiceProviderMode": 2,
                        "GpcSegmentType": 1,
                        "Gpc": true
                    } 
                }
            };

            //Log the call for debugging purposes
            let stack = new Error().stack;
            console.log("web_gpp_called: ", command, ", Arguments: ", arguments, ", full stack: ", stack);

            //Callback with the GPP data
            if (callback) {
                callback(gppData, true); 
            }

            return 100;
        },
        writable: false,
        configurable: false
    });`;

const overWriteUSPAPI = `Object.defineProperty(window, "__uspapi", {
    value: function(command, version, callback) {
        let uspData = {
            "version": 1,
            "uspString": "1XYZ"
        };
        let success = true;
        let stack = new Error().stack;
        console.log("web_uspapi_called: ", arguments[2].name, ", Arguments: ", arguments, ", full stack: ", stack);
        callback(uspData, success);
        return 100;
    },
    writable: false,
    configurable: false
});`;

module.exports = {overWriteGPP, overWriteUSPAPI};