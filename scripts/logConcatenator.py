import os

def combine_logs(directory):
    combined_log = "combined_log.txt"
    with open(combined_log, "w") as outfile:
        for filename in os.listdir(directory):
                filepath = os.path.join(directory, filename)
                with open(filepath, "r") as infile:
                    outfile.write(infile.read())
                    outfile.write("\n")
    print(f"Combined logs written to {combined_log}")

directory = "/Users/jawadsaeed/Downloads/boston_default_crawl_log"
combine_logs(directory)