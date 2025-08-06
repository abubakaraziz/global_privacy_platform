const overWriteGPP = `
(function() {
  
  function customGPP(command, callback, parameter) {
      // Log every GPP command execution with stack trace
      console.log("gpp_command_executed:", command, "parameter:", parameter, "stack:", new Error().stack);
      
      let registeredListeners = {}; // Stores registered listeners with their listenerId
      let nextListenerId = 1;       //Maintain a counter for the listenerId to keep them unique

      //Define the GPP data object
      let gppData = {
          "gppVersion": "1.1",
          "cmpStatus": "loaded",
          "cmpDisplayStatus": "visible",
          "signalStatus": "ready",
          "supportedAPIs": [
              "6:uspv1",
              "7:usnat",
              "8:usca",
              "9:usva"
          ],
          "cmpId": 10,
          "sectionList": [
              6,
              7,
              8,
              9
          ],
          "applicableSections": [6, 7, 8, 9], 
          "gppString": "DBABzMA~1YYN~BVVVVVVVVVWA.QA~BVVVVVWA.QA~BVVVVWA",
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
              },
              "usva": {
                  "Version": 1,
                  "SharingNotice": 1,
                  "SaleOptOutNotice": 1,
                  "TargetedAdvertisingOptOutNotice": 1,
                  "SaleOptOut": 1,
                  "TargetedAdvertisingOptOut": 1,
                  "SensitiveDataProcessing": [
                      1, 1, 1, 1, 1, 1, 1, 1
                  ],
                  "KnownChildSensitiveDataConsents": 1,
                  "MspaCoveredTransaction": 2,
                  "MspaOptOutOptionMode": 1,
                  "MspaServiceProviderMode": 2
              }
          }
      };

      //Execute the Callback function according to the relevant command
      if (command === "ping") {
          callback(gppData, true);  // Pass the PingReturn object w/ success
      } else if (command === "hasSection") {
          const hasSection = gppData.supportedAPIs.some((section) => section.includes(parameter));
          callback(hasSection, true);  // Pass hasSection boolean
      } else if (command === "getSection") {
          const section = gppData.parsedSections[parameter];
          if (section) {
              callback(section, true);
          } else {
              callback(null, false);
          }
      } else if (command === "getField") {
          if (parameter) {
              const [section, field] = parameter.split(".");
              const sectionData = gppData.parsedSections[section];

              if (sectionData && sectionData[field]) {
                  callback(sectionData[field], true);
              } else {
                  callback(null, false);
              }
          } else {
              callback(null, false);
          }
      } else if (command === "addEventListener") {
          const listenerId = nextListenerId++;
          registeredListeners[listenerId] = {
              eventName: "listenerRegistered",
              listenerId: listenerId,
              data: {listenerRegistered: true},
              pingData: gppData
          };
          callback(registeredListeners[listenerId], true);
      } else if (command === "removeEventListener") {
          const listenerId = parameter;
          if (registeredListeners[listenerId]) {
              delete registeredListeners[listenerId];
              callback(true, true);
          } else {
              callback(false, true);
          }
      } else {
          //Invalid command
          callback(null, false);
      }

      return 100; 
  }

  //Define a property that intercepts reads/writes:
  Object.defineProperty(window, "__gpp", {
    configurable: false,

    get() {
      //Every time code accesses window.__gpp, we return our custom implementation
      return customGPP;
    },
    set(newValue) {
      //If any code tries to overwrite __gpp, log and do nothing
      console.log("overwrite_gpp:", newValue);
      console.log("overwrite_gpp_stack:",new Error().stack);
    }
  });
})();
`;


const overWriteUSPAPI = `
(function() {
    function customUSPAPI(command, version, callback) {
        let uspData = {
            "version": 1,
            "uspString": "1YYN"
        };
        let success = true;
        let stack = new Error().stack;
        console.log("web_uspapi_called: ", arguments[2] ? arguments[2].name : 'anonymous', ", Arguments: ", arguments, ", full_stack: ", stack);
        callback(uspData, success);
        return 100;
    }

    // Define a property that intercepts reads/writes using getter/setter pattern:
    // - get(): Called every time code accesses window.__uspapi (e.g., var api = window.__uspapi)
    // - set(): Called every time code tries to assign to window.__uspapi (e.g., window.__uspapi = newFunction)
    // - configurable: false prevents deletion or modification of this property descriptor
    Object.defineProperty(window, "__uspapi", {
        configurable: false,

        get() {
            // Every time code accesses window.__uspapi, we log the stack trace and return our custom implementation
            // This captures all read attempts including: var api = window.__uspapi, window.__uspapi(), etc.
            console.log("reading_window._uspapi_stack:", new Error().stack);
            return customUSPAPI;
        },
        set(newValue) {
            // If any code tries to overwrite __uspapi, log the attempt but don't actually change anything
            // This captures all write attempts including: window.__uspapi = newFunction, window.__uspapi = null, etc.
            console.log("overwrite_uspapi with:", newValue);
            console.log("ovewrite_uspapi_stack:", new Error().stack);
        }
    });
})();`;

module.exports = {overWriteGPP, overWriteUSPAPI};