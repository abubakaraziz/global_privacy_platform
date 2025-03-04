from collections import Counter
import re
from tabulate import tabulate
import os
import tldextract 

# Path to the log file
# log_file_path = "/Users/jawadsaeed/Downloads/big_crawl_log" // Boston crawl
log_file_path = "/Users/jawadsaeed/Documents/v20_crawl_log.txt"
urls_file_path = "../configs/URLS/test_URLS_v20.txt"
output_folder_path = "../Crawls/v20_crawl"

# Define regex patterns to extract error messages, site processing, and attachment warnings/errors
error_pattern = re.compile(r"Error: (.+?) at ")
site_processing_pattern = re.compile(r"Site (\d+) / \d+ \(.*?\)")  # Extract first number
attachment_pattern = re.compile(r"Failed to .*? target")  # Match attachment errors
timeout_pattern = re.compile(r"Crawl failed Operation timed out")  # Match crawl timeout errors

# Dictionary to count error occurrences
error_counts = Counter()
attachment_counts = Counter()
timeout_count = 0

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

        if error_match:
            error_msg = error_match.group(1)
            error_counts[error_msg] += 1
            total_errors += 1

        if site_match:
            site_number = int(site_match.group(1))
            max_site_processed = max(max_site_processed, site_number)

        if attachment_match:
            attachment_msg = attachment_match.group(0)
            attachment_counts[attachment_msg] += 1

        if timeout_match:
            timeout_count += 1

with open(urls_file_path, "r", encoding="utf-8") as f:
    provided_domains = set(line.strip().replace("https://", "").replace("http://", "") for line in f if line.strip())

# Extract domains from the output JSON files
output_files = [f for f in os.listdir(output_folder_path) if f.endswith(".json")]
processed_domains = set(f.split("_")[0] for f in output_files)

# Identify failed domains
failed_domains = provided_domains - processed_domains
failed_data = [[domain] for domain in failed_domains]

# Prepare the data for tabulation
error_data = [[error, count, f"{(count / total_errors) * 100:.2f}%"] for error, count in error_counts.most_common()]
attachment_data = [[attachment, count] for attachment, count in attachment_counts.most_common()]

# Display the error statistics in a tabulated format
print("\nError Statistics:")
print(tabulate(error_data, headers=["Error Type", "Occurrences", "Percentage"], tablefmt="grid"))

# Display the highest site number processed
print(f"\nTotal Sites Processed: {max_site_processed}")

# Display the attachment warnings/errors in a tabulated format
print("\nAttachment Warnings/Errors:")
print(tabulate(attachment_data, headers=["Attachment Warning/Error", "Occurrences"], tablefmt="grid"))

# Display the timeout error count in a table format
timeout_data = [["Timeout Errors", timeout_count]]
print("\nTimeout Errors:")
print(tabulate(timeout_data, headers=["Error Type", "Occurrences"], tablefmt="grid"))

# Display the failed domains in a table format
print("\nFailed Domains:")
print(tabulate(failed_data, headers=["Failed Domain"], tablefmt="grid"))