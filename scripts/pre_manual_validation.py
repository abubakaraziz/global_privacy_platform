import os
import json
import pandas as pd
import tldextract

# Defining known CMP indicators
known_cmp_indicators = {
    "quantcast": ["cmp.inmobi.com"],
    "onetrust": ["onetrust"],
    "trustarc": ["trustarc"],
    "cookiebot": ["cookiebot"],
    "didomi": ["didomi"],
}

cmp_keys = ["isOneTrust", "isDidomi", "isCookieBot", "isUsercentrics", "isQuantcast"]



def cmp_request_analysis(folder_path, output_csv_path):
    unique_cmp_records = {}

    for filename in os.listdir(folder_path):
        if filename.endswith(".json") and filename != "metadata.json":
            print(f"Processing file: {filename}")
            file_path = os.path.join(folder_path, filename)
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    initial_url = data.get("initialUrl", "")
                    requests = data.get("data", {}).get("requests", [])
                    cmp_object_list = data.get("data", {}).get("gpp", {}).get("cmpConsentObject", [])

                    # Initialize detection dictionary with all False
                    cmp_detected = {key: False for key in cmp_keys}

                    # Loop through the list to update detection status
                    for cmp_entry in cmp_object_list:
                        for key in cmp_keys:
                            if cmp_entry.get(key, False):
                                cmp_detected[key] = True

                    for request in requests:
                        url = request.get("url", "")
                        request_domain_name = tldextract.extract(url).registered_domain
                        for cmp_name, indicators in known_cmp_indicators.items():
                            if any(indicator in url for indicator in indicators):
                                print(f"Found {cmp_name} in {url}")
                                # Only add if not already recorded
                                if initial_url not in unique_cmp_records:
                                    unique_cmp_records[initial_url] = {
                                        "initial_url": initial_url,
                                        "cmp_name": cmp_name,
                                        "request_url": url,
                                        "request_domain_name": request_domain_name,
                                        **cmp_detected,
                                    }
                                break
            except Exception as e:
                print(f"Error processing {filename}: {e}")
    
    # Convert the records into a DataFrame
    df = pd.DataFrame(list(unique_cmp_records.values()))
    df.to_csv(output_csv_path, index=False)
    print(f"\nCSV written to {output_csv_path}")


# Variables for passing into the main function
folder_path = "/Users/jawadsaeed/Documents/SPROJ/global_privacy_platform/Crawls/quantcast_test_new"
output_csv_path = "../cmp_request_analysis_quantcast.csv"

# Call the function
cmp_request_analysis(folder_path, output_csv_path)