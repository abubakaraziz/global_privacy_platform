import json
import argparse

def main():
    # Set up argument parser
    parser = argparse.ArgumentParser(description="Load and process a JSON summary file.")
    parser.add_argument("--file", type=str, required=True, help="Path to the JSON file.")
    parser.add_argument("--decode", action="store_true", help="Flag to decode USP strings.")
    args = parser.parse_args()

    # Load the JSON file
    with open(args.file, 'r') as file:
        data = json.load(file)
    
    # Access the USP API entries
    usp_api_entries = data.get("uspApiEntries")

    print(f"Found {len(usp_api_entries)} USP API entries.")

    # Looping over the USP API entries and decoding the uspString
    for entry in usp_api_entries:
        # Get the uspObject first from the entry
        uspObject = entry.get("uspObject")
        # Get the uspString from the uspObject
        uspString = uspObject.get("uspString")

        # Deccode the string using the documentation specification
        if len(uspString) != 4 or uspString == "":
            print("Invalid USP string found in the USP object.")
            entry["decoded"] = None
            continue
        
        version = uspString[0]
        notice = uspString[1]
        opt_out_sale = uspString[2]
        lspa = uspString[3]

        components = {
        "Version": f"Version {version}",
        "Notice Provided": "Yes" if notice == "Y" else "No" if notice == "N" else "Not Applicable",
        "Opt-Out Sale": "Yes" if opt_out_sale == "Y" else "No",
        "LSPA Covered Transaction": "Yes" if lspa == "Y" else "No" if lspa == "N" else "Not Applicable",
        }

        entry["decoded"] = components

    # Save the updated JSON file
    with open(args.file, 'w') as file:
        json.dump(data, file, indent=4)
    
    print(f"Successfully decoded and updated {len(usp_api_entries)} USP API entries.")

if __name__ == "__main__":
    main()