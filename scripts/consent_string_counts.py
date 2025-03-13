import json
from collections import Counter
import os
import pandas as pd

# Give the path for the directory containing the JSON files
crawl_path = "/Users/jawadsaeed/Downloads/output_all"

def consent_string_counts(directory_path):
    consent_string_counter = pd.DataFrame(columns=["Consent String", "Count"])

    # Initialize counters for each consent string type
    consent_counts = {"GPP": 0, "USP": 0, "TCF": 0}

    files_processed = 0

    # Iterating over the json files in the directory
    for filename in os.listdir(directory_path):
        if filename.endswith(".json"):
            filepath = os.path.join(directory_path, filename)
            try:
                with open(filepath, "r", encoding="utf-8") as file:
                    data = json.load(file)
                     # Increment counts if consent strings are present
                    gpp_string = data.get("data", {}).get("gpp", {}).get("gppObjects", [])
                    usp_string = data.get("data", {}).get("gpp", {}).get("uspString", [])
                    tcf_string = data.get("data", {}).get("gpp", {}).get("tcfString", [])

                    if gpp_string:
                        consent_counts["GPP"] += 1
                    if usp_string:
                        consent_counts["USP"] += 1
                    if tcf_string:
                        consent_counts["TCF"] += 1

            except Exception as e:
                print(f"Error processing file: {filepath}")
                print(e)
            
            files_processed += 1
    
    print(f"Processed {files_processed} files")

    # Converting to a dataframe
    consent_string_counter = pd.DataFrame(list(consent_counts.items()), columns=["Consent String", "Count"])

    # Adding the adoption percentages to the dataframe
    consent_string_counter["Adoption Percentage"] = (consent_string_counter["Count"] / files_processed) * 100

    return consent_string_counter

# Call the function with the directory path
consent_counts = consent_string_counts(crawl_path)
print(consent_counts)
                    