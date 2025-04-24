import pandas as pd
import os
import json

# folder_path_1 = '/Users/jawadsaeed/Documents/SPROJ/global_privacy_platform/Crawls/combined_cmp_crawl'
# folder_path_2 = '/Users/jawadsaeed/Documents/SPROJ/global_privacy_platform/Crawls/combined_cmp_crawl_new'
# Quantcast testing
# folder_path_1 = '/Users/jawadsaeed/Documents/SPROJ/global_privacy_platform/Crawls/quantcast_test_old'
# folder_path_2 = '/Users/jawadsaeed/Documents/SPROJ/global_privacy_platform/Crawls/quantcast_test_new'
# New combined cmp crawl testing
# folder_path_1 = '/Users/jawadsaeed/Documents/SPROJ/global_privacy_platform/Crawls/combined_cmp_crawl_old'
# folder_path_2 = '/Users/jawadsaeed/Documents/SPROJ/global_privacy_platform/Crawls/combined_cmp_crawl_new_1'
# Onetrust testing
# folder_path_1 = '/Users/jawadsaeed/Documents/SPROJ/global_privacy_platform/Crawls/onetrust_groups_test_old'
# folder_path_2 = '/Users/jawadsaeed/Documents/SPROJ/global_privacy_platform/Crawls/onetrust_groups_test_new'
# # Didomi testing
# folder_path_1 = '/Users/jawadsaeed/Documents/SPROJ/global_privacy_platform/Crawls/didomi_userstatus_test_old'
# folder_path_2 = '/Users/jawadsaeed/Documents/SPROJ/global_privacy_platform/Crawls/didomi_userstatus_test_new'
# Cookiebot testing
# Didomi testing
# folder_path_1 = '/Users/jawadsaeed/Documents/SPROJ/global_privacy_platform/Crawls/cookiebot_test_old'
# folder_path_2 = '/Users/jawadsaeed/Documents/SPROJ/global_privacy_platform/Crawls/cookiebot_test_new'
# Usercentrics testing
# folder_path_1 = '/Users/jawadsaeed/Documents/SPROJ/global_privacy_platform/Crawls/usercentrics_test_old'
# folder_path_2 = '/Users/jawadsaeed/Documents/SPROJ/global_privacy_platform/Crawls/usercentrics_test_new'
# 100 URL crawl
folder_path_1 = '/Users/jawadsaeed/Documents/SPROJ/global_privacy_platform/Crawls/100_url_crawl_old'
folder_path_2 = '/Users/jawadsaeed/Documents/SPROJ/global_privacy_platform/Crawls/100_url_crawl_new'

# CSV_OUTPUT_PATH = '../new_cmp_analysis.csv'
# CSV_OUTPUT_PATH = '../new_cmp_analysis_quantcast.csv'
# CSV_OUTPUT_PATH = '../new_cmp_analysis_combined_crawl.csv'
# CSV_OUTPUT_PATH = '../new_cmp_analysis_onetrust.csv'
# CSV_OUTPUT_PATH = '../new_cmp_analysis_didomi.csv'
# CSV_OUTPUT_PATH = '../new_cmp_analysis_cookiebot.csv'
# CSV_OUTPUT_PATH = '../new_cmp_analysis_usercentrics.csv'
CSV_OUTPUT_PATH = '../new_cmp_analysis_100_url_crawl.csv'

# First getting the common files from the 2 folders
files_1 = set(os.listdir(folder_path_1))
files_2 = set(os.listdir(folder_path_2))
common_files = files_1.intersection(files_2)
print("The number of common files between the two folders are: ", len(common_files))

records = []
cmp_keys = ["isOneTrust", "isDidomi", "isCookieBot", "isUsercentrics", "isQuantcast"]

for file in common_files:
    # If file is metadata.json, skip it
    if file == "metadata.json":
        continue
    print("Processing file: ", file)
    file_path_1 = os.path.join(folder_path_1, file)
    file_path_2 = os.path.join(folder_path_2, file)
    
    try:
        with open(file_path_1, 'r') as f:
            data_1 = json.load(f)
        with open(file_path_2, 'r') as f:
            data_2 = json.load(f)
    except Exception as e:
        print(f"Skipping {file} due to read error: {e}")
        continue

    old_cmps = data_1.get("data", {}).get("gpp", {}).get("cmpsPresent", [])
    # Assume cmpConsentObject is a list of dictionaries
    cmp_object_list = data_2.get("data", {}).get("gpp", {}).get("cmpConsentObject", [])

    # Initialize detection dictionary with all False
    cmp_detected = {key: False for key in cmp_keys}

    # Loop through the list to update detection status
    for cmp_entry in cmp_object_list:
        for key in cmp_keys:
            if cmp_entry.get(key, False):
                cmp_detected[key] = True

    record = {
        "filename": file,
        "old_cmps": ', '.join(old_cmps) if old_cmps else None,
        **cmp_detected
    }
    records.append(record)

# Save to CSV
df = pd.DataFrame(records)
df.to_csv(CSV_OUTPUT_PATH, index=False)
print(f"\nCSV written to {CSV_OUTPUT_PATH}")