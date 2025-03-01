from collections import Counter
import re
from tabulate import tabulate

# Path to the log file
log_file_path = "/Users/jawadsaeed/Downloads/big_crawl_log"

# Define regex patterns to extract error messages, site processing, and attachment warnings/errors
error_pattern = re.compile(r"Error: (.+?) at ")
site_processing_pattern = re.compile(r"Site (\d+) / \d+ \(.*?\)")  # Extract first number
attachment_pattern = re.compile(r"Failed to .*? target")  # Match attachment errors starting with 'Failed to' and containing 'target'

# Dictionary to count error occurrences
error_counts = Counter()
# Dictionary to count attachment warnings/errors
attachment_counts = Counter()
# Variable to track the highest site number processed
max_site_processed = 0

total_errors = 0

# Read the log file and count errors, attachment warnings, and track site processing
with open(log_file_path, "r", encoding="utf-8") as file:
    for line in file:
        error_match = error_pattern.search(line)
        site_match = site_processing_pattern.search(line)
        attachment_match = attachment_pattern.search(line)
        
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

# Format and print error statistics in a table
error_table = [[error, count, f"{(count / total_errors) * 100:.2f}%"] for error, count in error_counts.most_common()]
print("\nError Statistics:")
print(tabulate(error_table, headers=["Error Type", "Occurrences", "Percentage"], tablefmt="grid"))

# Print the highest site number processed
print(f"\nTotal Sites Processed: {max_site_processed}\n")

# Format and print attachment warning/error statistics in a table
attachment_table = [[attachment, count] for attachment, count in attachment_counts.most_common()]
print("Attachment Warning/Error Statistics:")
print(tabulate(attachment_table, headers=["Attachment Warning/Error", "Occurrences"], tablefmt="grid"))
