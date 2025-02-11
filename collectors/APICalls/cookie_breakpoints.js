/* eslint-disable max-lines */
/**
 * @type {{global?: string, proto?: string, props: PropertyBreakpoint[], methods: MethodBreakpoint[]}[]}
 */
const breakpoints = [
   
 
    {
        proto: 'Document',
        props: [
            {name: 'cookie', description: 'Document.cookie getter'},
            {name: 'cookie', description: 'Document.cookie setter', setter: true, saveArguments: true},
            // {name: 'timeline'}, - not in Chromium
        ],
        methods: [
           
        ]
    },
    {
        proto: 'CookieStore', // modern version of document.cookie
        props: [
        ],
        methods: [
            {name: 'get'},
            {name: 'getAll'},
            {name: 'set', saveArguments: true},
        ]
    },
    
];

module.exports = breakpoints;

/**
 * @typedef MethodBreakpoint
 * @property {string} name - name of the method
 * @property {string=} test - test expression that should trigger given breakpoint
 * @property {string=} description - human redable description of a breakpoint
 * @property {string=} condition - additional condition that has to be truthy for the breakpoint to fire
 * @property {boolean=} saveArguments - save arguments of each call (defaults to false)
 * @property {string=} cdpId - optional breakpointID from CDP
 */

 /**
 * @typedef PropertyBreakpoint
 * @property {string} name - name of the property
 * @property {string=} test - test expression that should trigger given breakpoint
 * @property {string=} description - human redable description of a breakpoint
 * @property {string=} condition - additional condition that has to be truthy for the breakpoint to fire
 * @property {boolean=} saveArguments - save arguments of each call (defaults to false)
 * @property {boolean=} setter - hook up to a property setter instead of getter (which is a default)
 * @property {string=} cdpId - optional breakpointID from CDP
 */

 /**
  * @typedef {MethodBreakpoint | PropertyBreakpoint} Breakpoint
  */
