from collections import Counter, defaultdict
import re
from tabulate import tabulate
import os
import pandas as pd

# Paths to the log file, URLs file, and output JSON folder
# log_file_path = "/Users/jawadsaeed/Downloads/boston_default_crawl_log/default_boston_config_0"
# log_file_path = "/Users/jawadsaeed/Downloads/boston_default_crawl_log/default_boston_config_1"
# log_file_path = "/Users/jawadsaeed/Downloads/boston_default_crawl_log/default_boston_config_2"
# log_dir_apth = "/Users/jawadsaeed/Downloads/boston_default_crawl_log"
# urls_file_path = "/Users/jawadsaeed/Downloads/combined_unique_domains.txt"
# output_folder_path = "/Users/jawadsaeed/Downloads/output_all"
log_dir_path = "/Users/jawadsaeed/Documents/SPROJ/10k_logs"
urls_file_path = "/Users/jawadsaeed/Documents/SPROJ/global_privacy_platform/configs/URLS/5000_10k.txt"
output_folder_path = "/Users/jawadsaeed/Documents/SPROJ/10k_crawl"

# Define regex patterns to extract error messages, site processing, and attachment warnings/errors
error_pattern = re.compile(r"^(\S+): .*?Error: (.+?) at ")  # Updated pattern to handle extra text
site_processing_pattern = re.compile(r"Site (\d+) / \d+ \(.*?\)")  # Extract first number
# attachment_pattern = re.compile(r"^(\S+): (Failed to .*? target.*|.*? failed to attach to.*)")  # Capture full attachment errors
attachment_pattern_target = re.compile(r"^(\S+): (Failed to .*? target.*)")  # Match site-specific attachment errors
attachment_pattern_collectors = re.compile(r"^(\S+): (.*? failed to attach to.*)")  # Match collector-specific attachment errors
timeout_pattern = re.compile(r"^(\S+): Crawl failed Operation timed out")  # Match site-specific timeout errors
unknown_breakpoint_pattern = re.compile(r"^(\S+): (Unknown breakpoint detected\.)") # Match site-specific unknown breakpoint errors
postload_pattern = re.compile(r"^(\S+): ((gpp|links|apis|requests|cookies) .*? Target closed.*)", re.IGNORECASE)
collector_pattern = re.compile(r"^(\S+): (links|apis|requests|cookies) data failed .*? (TargetCloseError|Session closed).*", re.IGNORECASE)

# Variable to track the higher number of sites processed in the corresponding log file
max_site_processed = 0

# Defining the variables for storing statistics
error_counts = Counter() # Count the occurrences of each error type
unique_sites_per_error = Counter() # Count the unique sites for each error type
total_timeout_count = 0 # Count the occurrences of timeout errors
attachment_error_target = defaultdict(Counter) # Count the occurrences of attachment errors for target
attachment_error_collectors = defaultdict(Counter) # Count the occurrences of attachment errors for collectors
postload_error = defaultdict(Counter) # Count the occurrences of postload errors
unique_sites_per_timeout = 0 # Count the unique sites for timeout errors
unknown_breakpoint_error = defaultdict(Counter) # Count the occurrences of unknown breakpoint errors

site_errors = {} # Track the errors for each site

# Iterating over all the log files in the directory
for filename in os.listdir(log_dir_path):
    log_file_path = os.path.join(log_dir_path, filename)
    print(f"Processing log file: {log_file_path}")
    # Processing the log file by looping over each line and checking for regex matches
    with open(log_file_path, "r", encoding="utf-8") as file:
        for line in file:
            error_match = error_pattern.search(line)
            site_match = site_processing_pattern.search(line)
            attachment_match_target = attachment_pattern_target.search(line)
            attachment_match_collectors = attachment_pattern_collectors.search(line)
            timeout_match = timeout_pattern.search(line)
            postload_match = postload_pattern.search(line)
            collector_match = collector_pattern.search(line)
            unknown_breakpoint_match = unknown_breakpoint_pattern.search(line)

            # If the error regex matches, extract the site number and error message
            if error_match:
                site, error_msg = error_match.groups()
                error_counts[error_msg] += 1
                if site not in site_errors:
                    site_errors[site] = []
                site_errors[site].append(error_msg)
            
            # If the site processing regex matches, extract the site number
            if site_match:
                site_number = int(site_match.group(1))
                max_site_processed = max(max_site_processed, site_number)

            # If the attachment regex matches, extract the site number and error message
            if attachment_match_target:
                site, error_msg = attachment_match_target.groups()
                attachment_error_target[site][error_msg] += 1
                if site not in site_errors:
                    site_errors[site] = []
                site_errors[site].append(error_msg)
            
            # If the attachment regex matches, extract the site number and error message
            if attachment_match_collectors:
                site, error_msg = attachment_match_collectors.groups()
                attachment_error_collectors[site][error_msg] += 1
                if site not in site_errors:
                    site_errors[site] = []
                site_errors[site].append(error_msg)
            
            # If the timeout regex matches, extract the site number
            if timeout_match:
                site = timeout_match.group(1)
                total_timeout_count += 1
                if site not in site_errors:
                    site_errors[site] = []
                site_errors[site].append("Timeout Error")

            # If the postload regex matches, extract the site number and error message
            if postload_match:
                site, error_msg, _ = postload_match.groups()
                postload_error[site][error_msg] += 1
                if site not in site_errors:
                    site_errors[site] = []
                site_errors[site].append(error_msg)
            
            # If the breakpoint regex matches, extract the site number and error message
            if unknown_breakpoint_match:
                site, error_msg = unknown_breakpoint_match.groups()
                unknown_breakpoint_error[site][error_msg] += 1
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

# Extract domains from the output JSON files ignoring the metadata.json file
output_files = []
for f in os.listdir(output_folder_path):
    if f.endswith(".json") and f != "metadata.json":
        output_files.append(f)

# Processing the output file names to extract the domains by splitting the file name based on the _ character
processed_file_domains = []
for f in output_files:
    domain = f.split("_")[0]
    processed_file_domains.append(domain)

# Identifying the failed domains by comparing the provided domains with the processed domains
failed_domains = provided_domains - set(processed_file_domains)

# Getting the domains on which the crawler failed since their data is not present in the output files
failed_domains_data = [[domain] for domain in failed_domains]

# Creating dataframes for each cateogry
# Dataframe for error statistics
error_df = pd.DataFrame([
    [error, count, unique_sites_per_error[error]]
    for error, count in error_counts.most_common()
], columns=["Error Type", "Occurrences", "Unique Sites"])
# Adding a percentage column to the dataframe to show the percentage of unique sites for each error
error_df["Percentage"] = (error_df["Unique Sites"] / len(provided_domains)) * 100

# Dataframe for attachment errors
attachment_df_target = pd.DataFrame([
    [site, error, count]
    for site, errors in attachment_error_target.items() for error, count in errors.items()
], columns=["Site", "Attachment Error", "Occurrences"])

attachment_df_collectors = pd.DataFrame([
    [site, error, count]
    for site, errors in attachment_error_collectors.items() for error, count in errors.items()
], columns=["Site", "Attachment Error", "Occurrences"])

# Dataframe for timeout errors
timeout_df = pd.DataFrame([
    ["Timeout Errors", total_timeout_count, unique_sites_per_timeout]
], columns=["Error Type", "Occurrences", "Unique Sites"])

# Dataframe for postload errors
postload_df = pd.DataFrame([
    [site, error, count] for site, errors in postload_error.items() for error, count in errors.items()
], columns=["Site", "Error", "Occurrences"])

# Dataframe for failed domains
failed_df = pd.DataFrame(failed_domains_data, columns=["Failed Domain"])

# Dataframe for unknown breakpoint errors
unknown_breakpoint_df = pd.DataFrame([
    [site, error, count] for site, errors in unknown_breakpoint_error.items() for error, count in errors.items()
], columns=["Site", "Error", "Occurrences"])

# Displaying the dataframes
print("\nError Statistics:")
print(error_df)

print("\nFailed Domains:")
print(failed_df)
print("Total number of sites to crawl is:", len(provided_domains))
print("The number of failed domains is:", len(failed_domains), "which is", f"{(len(failed_domains) / len(provided_domains)) * 100:.2f}%", "of the total sites")
print("The number of successful domains is:", len(provided_domains) - len(failed_domains) , "which is", f"{((len(provided_domains) - len(failed_domains)) / len(provided_domains)) * 100:.2f}%", "of the total sites")

print("\nAttachment Errors for Target:")
print(attachment_df_target)
# Printing statistics using the dataframe

# Since one site can have multiple entries in the dataframe, we need to count the unique sites
unique_sites = set()
for site, errors in attachment_error_target.items():
    unique_sites.add(site)
print("The number of unique sites with attachment errors from target is:", len(unique_sites), "which is", f"{(len(unique_sites) / len(provided_domains)) * 100:.2f}%", "of the total sites")
# Checking how many of these sites contain errors with "blob:https://" in them by checking the error messages
blob_sites = 0
for site, errors in attachment_error_target.items():
    for error in errors:
        if "blob:https://" in error:
            blob_sites += 1
            break
print("The number of sites with attachment errors containing 'blob:https://' is:", blob_sites, "which is", f"{(blob_sites / len(unique_sites)) * 100:.2f}%", "of the sites with target attachment errors")

print("\nAttachment Errors for Collectors:")
print(attachment_df_collectors)
# Printing statistics using the dataframe
unique_sites = set()
for site, errors in attachment_error_collectors.items():
    unique_sites.add(site)
print("The number of unique sites with attachment errors from collectors is:", len(unique_sites), "which is", f"{(len(unique_sites) / len(provided_domains)) * 100:.2f}%", "of the total sites")
# Checking how many of these sites contain errors with "blob:https://" in them by checking the error messages
blob_sites = 0
for site, errors in attachment_error_collectors.items():
    for error in errors:
        if "blob:https://" in error:
            blob_sites += 1
            break
print("The number of sites with attachment errors containing 'blob:https://' is:", blob_sites, "which is", f"{(blob_sites / len(unique_sites)) * 100:.2f}%", "of the sites with collector attachment errors")

print("\nTimeout Errors:")
print(timeout_df)
# Printing statistics using the timeout dataframe
print("The number of unique sites with timeout errors is:", unique_sites_per_timeout, "which is", f"{(unique_sites_per_timeout / len(provided_domains)) * 100:.2f}%", "of the total sites")

print("\nBreakpoint Errors:")
print(unknown_breakpoint_df)
# Printing statistics using the dataframe
unique_sites = set()
for site, errors in unknown_breakpoint_error.items():
    unique_sites.add(site)
print("The number of unique sites with unknown breakpoint errors is:", len(unique_sites), "which is", f"{(len(unique_sites) / len(provided_domains)) * 100:.2f}%", "of the total sites")

# print("\nPostload Errors:")
# print(postload_df)