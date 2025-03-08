import json
import os
import argparse
import pandas as pd

# Define the list of CMPs to search for
CMPs = ["OneTrust", "Didomi", "CookieBot", "Quantcast", "Usercentrics"]

def analyze_crawl_results(crawl_dir):
    # Create an empty DataFrame with CMPs and Consent Object as column names
    df = pd.DataFrame(columns=["Website"] + CMPs + ["Consent Object"])
    
    # Iterate through all JSON files in the directory
    for filename in os.listdir(crawl_dir):
        if filename.endswith('.json'):
            filepath = os.path.join(crawl_dir, filename)
            with open(filepath, 'r', encoding='utf-8') as f:
                data = json.load(f)
                website = data.get('finalUrl', 'Unknown')
                
                # Initialize a row with default values
                row = {"Website": website}
                for cmp in CMPs:
                    row[cmp] = False
                
                # Check for CMPs in the data
                cmps_present = data.get('data', {}).get('gpp', {}).get('cmpsPresent', [])
                for cmp in cmps_present:
                    if cmp in CMPs:
                        row[cmp] = True

                # Store the entire cmpConsentObject under the Consent Object column
                row["Consent Object"] = data.get('data', {}).get('gpp', {}).get('cmpConsentObject', [])

                # Append the row to the DataFrame using loc to avoid deprecated append()
                df.loc[len(df)] = row
    return df


if __name__ == "__main__":
    # Use argparser to get the directory of the crawl results

    parser = argparse.ArgumentParser(description="CMP Analysis on the Crawl folder.")
    parser.add_argument("--crawl", required=True, help="Path to the crawl folder")

    args = parser.parse_args()

    # Calling the main function to conduct the analysis
    df = analyze_crawl_results(args.crawl)

    print(df)