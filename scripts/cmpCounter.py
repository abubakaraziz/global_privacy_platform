import os
import json
from collections import Counter

def extract_cmps(directory):
    cmp_counter = Counter()
    no_cmps = 0

    for filename in os.listdir(directory):      #iterates over the JSON files in our result directory
        if filename.endswith(".json"):
            filepath = os.path.join(directory, filename)
            try:
                with open(filepath, "r", encoding="utf-8") as file:
                    data = json.load(file)
                    cmps_present = data.get("data", {}).get("gpp", {}).get("cmpsPresent", [])
                    if cmps_present:
                        cmp_counter.update(cmps_present)
                    else:
                        no_cmps += 1
            except (json.JSONDecodeError, KeyError) as e:
                print(f"Skipping {filename}: {e}")

    print(f"No CMPs found in {no_cmps} files.")
    return cmp_counter

# directory_path = "/Users/raahemnabeel/Desktop/Sproj/global_privacy_platform/data_101-200"
directory_path = "/Users/jawadsaeed/Documents/SPROJ/global_privacy_platform/Crawls/v20_crawl"
cmp_stats = extract_cmps(directory_path)

print("CMP Count:")
for cmp, count in cmp_stats.items():
    print(f"{cmp}: {count}")
