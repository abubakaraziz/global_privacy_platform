import json
import os
import shutil
import argparse
import subprocess

# Setting up the base port for the proxies
base_port = 11000
# Defining the IP list for the proxies
ip_list = [
    '3.101.106.174',
]

def split_list(lst, n):
    """Splits a list into n approximately equal parts."""
    k, m = divmod(len(lst), n)
    return [lst[i * k + min(i, m):(i + 1) * k + min(i + 1, m)] for i in range(n)]

def setup_proxies(ip_list, base_port, ssh_key_path):
    """Set up SSH SOCKS5 proxies and return a list of proxy URLs."""
    proxies = []
    
    for i, ip in enumerate(ip_list):
        port = base_port + i
        ssh_command = f"ssh -D {port} -i {ssh_key_path} -f -N ubuntu@{ip}"
        auto_ssh_command = f"autossh -M 0 -o \"ServerAliveInterval 30\" -o \"ServerAliveCountMax 3\" -o \"StrictHostKeyChecking=no\" -D {port} -qfNT -i {ssh_key_path} ubuntu@{ip}"
        try:
            subprocess.run(auto_ssh_command, shell=True, check=True)
            print(f"Started autossh SOCKS5 proxy at {ip} on port {port}")
            proxies.append(f"socks5://localhost:{port}")
        except subprocess.CalledProcessError:
            print(f"Failed to start proxy for {ip}")
    
    return proxies

def kill_proxies():
    """Finds and kills SSH SOCKS5 proxy processes."""
    try:
        # result = subprocess.run("pgrep -f 'ssh -D'", shell=True, capture_output=True, text=True)
        result = subprocess.run("pgrep -f 'autossh -M 0'", shell=True, capture_output=True, text=True)
        pids = result.stdout.strip().split("\n")

        if not pids or pids == ['']:
            print("No running proxy processes found.")
            return

        for pid in pids:
            print(f"Killing proxy process {pid}")
            subprocess.run(f"kill {pid}", shell=True)
        
        print("All proxies terminated.")
    except Exception as e:
        print(f"Error while killing proxies: {e}")


def create_splits(config_path, urls_path, num_splits, ssh_key, output_dir="Splits"):
    # Load config file
    with open(config_path, "r") as f:
        config = json.load(f)
    
    # Load URLs
    with open(urls_path, "r") as f:
        urls = [line.strip() for line in f if line.strip()]
    
    # Split URLs
    url_splits = split_list(urls, num_splits)
    os.makedirs(output_dir, exist_ok=True)

    # Set up SSH proxies and generate proxy URLs
    proxies = setup_proxies(ip_list, base_port, ssh_key)

    # Kill the proxies when done (Testing only!!!!)
    kill_proxies()
    
    # Create split config and URL files
    split_configs = []
    for i, url_split in enumerate(url_splits):
        split_urls_path = os.path.join(output_dir, f"urls_split_{i}.txt")
        with open(split_urls_path, "w") as f:
            f.write("\n".join(url_split))
        
        # Modify config for each split
        split_config = config.copy()
        split_config["urls"] = split_urls_path
        split_config["output"] = os.path.join(output_dir, f"output_split_{i}")
        split_config["proxies"] = proxies

        split_config_path = os.path.join(output_dir, f"config_split_{i}.json")
        
        with open(split_config_path, "w") as f:
            json.dump(split_config, f, indent=4)
        
        split_configs.append(split_config_path)
    
    print(f"Created {num_splits} config and URL split files in {output_dir}.")
    return split_configs

# Example usage
if __name__ == "__main__":
    # config_file = "../configs/onetrust_groups_test.json"  # Path to sample config file
    # urls_file = "../configs/URLS/onetrust_urls.txt"  # Path to URLs file
    # num_splits = 4  # Number of splits to create
    # create_splits(config_file, urls_file, num_splits, "splits")

    parser = argparse.ArgumentParser(description="Split a URL list and generate config files.")
    parser.add_argument("--config", required=True, help="Path to the sample config file")
    parser.add_argument("--urls", required=True, help="Path to the URLs file")
    parser.add_argument("--splits", type=int, required=True, help="Number of splits to create")
    parser.add_argument("--ssh-key", required=True, help="Path to SSH private key for proxy setup")
    parser.add_argument("--output", default="splits", help="Directory to store split files")
    
    args = parser.parse_args()
    create_splits(args.config, args.urls, args.splits, args.ssh_key, args.output)
