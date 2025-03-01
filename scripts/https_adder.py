input_file = "../configs/URLS/combined_unique_domains.txt"  # Replace with your actual file name
output_file = "../configs/URLS/combined_unique_domains_updated.txt"

with open(input_file, "r") as infile, open(output_file, "w") as outfile:
    for line in infile:
        url = line.strip()  # Remove any leading/trailing spaces or newlines
        if url:  # Ensure it's not an empty line
            outfile.write(f"https://{url}\n")

print(f"Updated URLs saved to {output_file}")
