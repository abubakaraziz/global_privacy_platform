const GPCDomSignal = `
    Object.defineProperty(Navigator.prototype, 'globalPrivacyControl', {
        get() {
            const stack = new Error().stack;
            console.log('web_gpc_called:', stack);
            return true;
        },
        set() {
            const stack = new Error().stack;
            console.log('Attempt to write web_gpc:', stack);
        },
        configurable: false
    });
`;

module.exports = GPCDomSignal;