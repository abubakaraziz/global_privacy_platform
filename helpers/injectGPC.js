// const GPCDomSignal = `
//     // eslint-disable-next-line prefer-reflect, no-undef
//     Object.defineProperty(navigator, 'globalPrivacyControl', {
//         get() {
//             // Capture and log the call stack whenever this property is accessed
//             const stack = new Error().stack;
//             console.log('web_gpc_called:', stack);

//             // Return the GPC value
//             return true;
//         },
//         configurable: false,
//         enumerable: true,
//     });`;

const GPCDomSignal = `
    Object.defineProperty(navigator, 'globalPrivacyControl', {
        get() {
            const stack = new Error().stack;
            console.log('web_gpc_called:', stack);
            return true;
        },
        set() {
            const stack = new Error().stack;
            console.error('Attempted to overwrite globalPrivacyControl:', stack);
            throw new TypeError('Cannot overwrite read-only property "globalPrivacyControl".');
        },
        configurable: false,
        enumerable: true,
    });
`;

module.exports = GPCDomSignal;