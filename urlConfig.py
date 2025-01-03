import json

# Specify the input files and the output JSON file
input_file = "10k.txt"
config_file = "./Configs/10k_config.json"

# Read URLs from the file
with open(input_file, 'r') as f:
    urls = [line.strip() for line in f if line.strip()]  # Remove empty lines and whitespace

# Load the existing config JSON
with open(config_file, 'r') as f:
    config = json.load(f)

# Update the `urls` field in the config
config["urls"] = urls

# Write the updated config back to the file
with open(config_file, 'w') as f:
    json.dump(config, f, indent=4)

print(f"Successfully added {len(urls)} URLs to the config file.")
