from collections import Counter
import re
from tabulate import tabulate
import os
import pandas as pd

# Paths to the log file, URLs file, and output JSON folder
# log_file_path = "/Users/jawadsaeed/Downloads/boston_default_crawl_log/default_boston_config_0"
# log_file_path = "/Users/jawadsaeed/Downloads/boston_default_crawl_log/default_boston_config_1"
log_file_path = "/Users/jawadsaeed/Downloads/boston_default_crawl_log/default_boston_config_2"
urls_file_path = "/Users/jawadsaeed/Downloads/combined_unique_domains.txt"
output_folder_path = "/Users/jawadsaeed/Downloads/output_all"

# Define regex patterns to extract error messages, site processing, and attachment warnings/errors
error_pattern = re.compile(r"^(\S+): .*?Error: (.+?) at ")  # Updated pattern to handle extra text
site_processing_pattern = re.compile(r"Site (\d+) / \d+ \(.*?\)")  # Extract first number
# attachment_pattern = re.compile(r"^(\S+): Failed to .*? target")  # Match site-specific attachment errors
# Updated pattern to match errors from any collector type
# attachment_pattern = re.compile(r"^(\S+): (?:Failed to .*? target|.*? failed to attach to)")
attachment_pattern = re.compile(r"^(\S+): (Failed to .*? target.*|.*? failed to attach to.*)")  # Capture full attachment errors
timeout_pattern = re.compile(r"^(\S+): Crawl failed Operation timed out")  # Match site-specific timeout errors
postload_pattern = re.compile(r"^(\S+): (gpp|links|apis|requests|cookies) .*? Target closed.*", re.IGNORECASE)
collector_pattern = re.compile(r"^(\S+): (links|apis|requests|cookies) data failed .*? (TargetCloseError|Session closed).*", re.IGNORECASE)

# Dictionary to count error occurrences and track errors by site
error_counts = Counter()
attachment_counts = Counter()
postload_counts = Counter()
# Count unique sites per error
unique_sites_per_error = Counter()
unique_sites_per_timeout = 0
timeout_count = 0
site_errors = {}

# Variable to track the highest site number processed
max_site_processed = 0

total_errors = 0

# Read the log file and count errors, attachment warnings, and track site processing
with open(log_file_path, "r", encoding="utf-8") as file:
    for line in file:
        error_match = error_pattern.search(line)
        site_match = site_processing_pattern.search(line)
        attachment_match = attachment_pattern.search(line)
        timeout_match = timeout_pattern.search(line)
        postload_match = postload_pattern.search(line)

        if error_match:
            site, error_msg = error_match.groups()
            error_counts[error_msg] += 1
            total_errors += 1
            if site not in site_errors:
                site_errors[site] = []
            site_errors[site].append(error_msg)

        if site_match:
            site_number = int(site_match.group(1))
            max_site_processed = max(max_site_processed, site_number)

        if attachment_match:
            site, error_msg = attachment_match.groups()
            attachment_counts[error_msg] += 1
            if site not in site_errors:
                site_errors[site] = []
            site_errors[site].append(error_msg)

        if timeout_match:
            site = timeout_match.group(1)
            timeout_count += 1
            if site not in site_errors:
                site_errors[site] = []
            site_errors[site].append("Timeout Error")
        
        if postload_match:
            site, error_msg = postload_match.groups()
            postload_counts[error_msg] += 1
            if site not in site_errors:
                site_errors[site] = []
            site_errors[site].append(error_msg)
        

# Iterate over site errors to count unique sites for each error
for site, errors in site_errors.items():
    unique_errors = set(errors)  # Ensure unique errors per site
    for error in unique_errors:
        unique_sites_per_error[error] += 1  

    if "Timeout Error" in errors:
        unique_sites_per_timeout += 1      

# Extract domains from the provided URLs file
with open(urls_file_path, "r", encoding="utf-8") as f:
    provided_domains = set(line.strip().replace("https://", "").replace("http://", "") for line in f if line.strip())

# Extract domains from the output JSON files
output_files = [f for f in os.listdir(output_folder_path) if f.endswith(".json")]
processed_domains = set(f.split("_")[0] for f in output_files)

# Identify failed domains
failed_domains = provided_domains - processed_domains
failed_data = [[domain] for domain in failed_domains]

# Create dataframes for each category
# error_df = pd.DataFrame([[error, count, f"{(count / total_errors) * 100:.2f}%"] for error, count in error_counts.most_common()],
#                         columns=["Error Type", "Occurrences", "Percentage"])
error_df = pd.DataFrame([
    [error, count, f"{(count / total_errors) * 100:.2f}%", unique_sites_per_error[error]]
    for error, count in error_counts.most_common()
], columns=["Error Type", "Occurrences", "Percentage", "Unique Sites"])
attachment_df = pd.DataFrame([[error, count] for error, count in attachment_counts.most_common()],
                             columns=["Attachment Warning/Error", "Occurrences"])
timeout_df = pd.DataFrame([
    ["Timeout Errors", timeout_count, unique_sites_per_timeout]
], columns=["Error Type", "Occurrences", "Unique Sites"])
failed_df = pd.DataFrame([[domain] for domain in failed_domains],
                         columns=["Failed Domain"])
site_errors_df = pd.DataFrame([(site, errors) for site, errors in site_errors.items()],
                              columns=["Site", "Errors"])
postload_df = pd.DataFrame([[error, count] for error, count in postload_counts.most_common()],
                           columns=["Postload Error", "Occurrences"])

# Display dataframes
print("\nError Statistics:")
print(error_df)

print(f"\nTotal Sites Processed: {max_site_processed}")

print("\nAttachment Warnings/Errors:")
print(attachment_df)

print("\nTimeout Errors:")
print(timeout_df)

print("\nPostload Errors:")
print(postload_df)

print("\nFailed Domains:")
print(failed_df)
print("The number of failed domains is:", len(failed_domains))

print("\nErrors by Site:")
print(site_errors_df)

