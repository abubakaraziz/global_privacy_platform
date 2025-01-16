const GPCDomSignal = `
    // eslint-disable-next-line prefer-reflect, no-undef
    Object.defineProperty(navigator, 'globalPrivacyControl', {
        get() {
            // Capture and log the call stack whenever this property is accessed
            const stack = new Error().stack;
            console.log('web_gpc_called:', stack);

            // Return the GPC value
            return true;
        },
        configurable: false,
        enumerable: true,
    });`;

module.exports = GPCDomSignal;