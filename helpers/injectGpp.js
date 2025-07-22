const overWriteGPP = `
(function() {
  
  function customGPP(command, callback, parameter) {
      let registeredListeners = {}; // Stores registered listeners with their listenerId
      let nextListenerId = 1;       //Maintain a counter for the listenerId to keep them unique

      //Define the GPP data object
      let gppData = {
          "gppVersion": "1.1",
          "cmpStatus": "loaded",
          "cmpDisplayStatus": "hidden",
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
          "gppString": "DBABzMA~1YYN~BVVVVVVVVmA.YA~BVVVVVWY.YA~BVVVVWY",
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
      //Every time code accesses window.__gpp, we log the stack trace and return our custom implementation
      console.log("[Intercept] Reading window.__gpp", new Error().stack);
      return customGPP;
    },
    set(newValue) {
      //If any code tries to overwrite __gpp, log and do nothing
      console.log("[Intercept] Attempt to overwrite __gpp with:", newValue, new Error().stack);
    }
  });
})();
`;


const overWriteUSPAPI = `Object.defineProperty(window, "__uspapi", {
    value: function(command, version, callback) {
        let uspData = {
            "version": 1,
            "uspString": "1YYN"
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