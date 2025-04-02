import json
import os
import argparse

def analyze_timeout_error_rates(crawl_dir):
    timeoutErrorCount = 0
    numberOfWebsites = 0
    # Iterate through all JSON files in the directory
    for filename in os.listdir(crawl_dir):
        if filename.endswith('.json') and filename != 'metadata.json':
            filepath = os.path.join(crawl_dir, filename)
            with open(filepath, 'r', encoding='utf-8') as f:
                data = json.load(f)
                ifTimeout = data.get('timeout')
                # Increment the timeout error count if the condition is met
                if ifTimeout:
                    timeoutErrorCount += 1
                numberOfWebsites += 1

    # Calculate the timeout error rate
    if numberOfWebsites > 0:
        timeoutErrorRate = (timeoutErrorCount / numberOfWebsites) * 100
    else:
        timeoutErrorRate = 0
    
    return numberOfWebsites, timeoutErrorRate, timeoutErrorCount

if __name__ == "__main__":
    # Run the function to analyze the timeout error rates
    # Use argparser to get the directory of the crawl results
    parser = argparse.ArgumentParser(description="Analyze timeout error rates in crawl results.")
    parser.add_argument("--crawl", required=True, help="Path to the crawl folder")
    args = parser.parse_args()

    # Calling the main function
    numberOfWebsites, timeout_error_rate, timeoutCount = analyze_timeout_error_rates(args.crawl)
    print(f"Number of Websites: {numberOfWebsites}")
    print(f"Timeout Errors: {timeoutCount}")
    print(f"Timeout Error Rate: {timeout_error_rate:.2f}%")