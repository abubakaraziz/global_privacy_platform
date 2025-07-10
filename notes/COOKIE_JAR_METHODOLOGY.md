# Cookie Jar Training Methodology

## Overview
We developed a systematic approach to create a "seasoned" cookie jar that simulates realistic browsing behavior by accumulating cookies from popular websites. This methodology enables testing how websites respond to users with established browsing histories rather than pristine browser profiles.

## Training Phase
Our cookie jar training employed a stateful crawling approach across 50 high-traffic websites. Using a shared browser context, we sequentially visited each website while maintaining persistent cookie storage throughout the session. This approach mirrors authentic user browsing patterns where cookies accumulate naturally across multiple site visits.

### Key Parameters:
- **Stateful crawling**: `statefulCrawl: true` to maintain browser context persistence
- **Sequential accumulation**: Each website inherits cookies from all previously visited sites
- **Single browser session**: One shared browser instance prevents cookie isolation
- **No intermediate saves**: Cookies accumulate in browser memory without file I/O overhead

## Cookie Collection
We utilized Chrome DevTools Protocol (CDP) `Storage.getCookies` to extract comprehensive cookie data, including security attributes (`secure`, `httpOnly`), domain scope, expiration times, and SameSite policies. This ensures compatibility with modern browser security requirements and cookie prefixes (e.g., `__Secure-`, `__Host-`).

### Technical Implementation:
```javascript
// Training Configuration
{
    "statefulCrawl": true,      // Maintain browser context across sites
    "loadCookies": false,       // Start with empty cookie jar
    "saveCookies": true,        // Save accumulated cookies at end
    "urls": "path/to/top-50-websites.txt"
}
```

## Deployment Phase
The trained cookie jar is deployed in subsequent experiments by loading the accumulated cookies into fresh browser instances before visiting target websites. This approach provides:
- **Consistent baseline**: Each test starts with identical cookie state
- **Realistic user simulation**: Websites observe established browsing patterns
- **Controlled testing**: Isolation between test sites prevents cross-contamination

### Deployment Configuration:
```javascript
// Testing Configuration
{
    "statefulCrawl": false,     // Isolated testing per website
    "loadCookies": true,        // Load seasoned cookie jar
    "saveCookies": false,       // Preserve original jar
    "cookieJarPath": "path/to/seasoned-cookies.json"
}
```

## Research Applications
This methodology enables investigation of how websites modify behavior, tracking mechanisms, or consent flows when encountering users with established digital footprints versus new users with empty cookie stores.

### Advantages:
1. **Authenticity**: Simulates real user browsing patterns
2. **Reproducibility**: Consistent cookie state across experiments
3. **Scalability**: Can train on any number of websites
4. **Flexibility**: Supports both isolated and stateful testing modes

### Use Cases:
- **Privacy research**: Analyzing tracking behavior differences
- **Consent flow studies**: Testing CMP responses to established users
- **Behavioral analysis**: Understanding personalization mechanisms
- **Security research**: Investigating cookie-based vulnerabilities

## Technical Details

### Cookie Data Structure:
Each cookie includes comprehensive metadata:
- `name`, `value`: Core cookie data
- `domain`, `path`: Scope information
- `expires`, `session`: Lifetime management
- `secure`, `httpOnly`: Security attributes
- `sameSite`: Cross-site policy

### Browser Context Management:
The methodology leverages Puppeteer's browser context isolation to maintain cookie persistence during training while enabling clean separation during testing phases.

## Conclusion
This approach provides a controlled yet realistic testing environment for privacy research and behavioral analysis, bridging the gap between sterile laboratory conditions and authentic user experiences.