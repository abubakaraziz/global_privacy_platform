import json
import argparse
from cmp_api_python import cmpapi_test

def main():
    # Set up argument parser
    parser = argparse.ArgumentParser(description="Load and process a JSON summary file.")
    parser.add_argument("--file", type=str, required=True, help="Path to the JSON file.")
    parser.add_argument("--decode", action="store_true", help="Flag to decode GPP strings.")
    args = parser.parse_args()

    # Checking the arguments
    # print(f"File path: {args.file}")
    # print(f"Decode flag: {args.decode}")

    # Setting up the cmpAPI
    c = cmpapi_test.CmpApi()

    # Load the JSON file
    with open(args.file, 'r') as file:
        data = json.load(file)
    
    # Access the GPP API entries
    gpp_api_entries = data.get("gppApiEntries")

    print(f"Found {len(gpp_api_entries)} GPP API entries.")
    
    # Looping over the GPP API entries and decoding the gppString
    for entry in gpp_api_entries:
        # First getting the object inside the entry
        gppObject = entry.get("gppObject")
        # Now getting the gppString from the gppObject
        gppString = gppObject.get("gppString")
        if gppString is None:
            print("No GPP string found in the GPP object.")
            entry["decoded"] = None
            continue
        else:
            # print(f"Decoding GPP string: {gppString}")
            decoded = cmpapi_test.decode(gppString, c)
            entry["decoded"] = decoded
    
    # Save the updated JSON file
    with open(args.file, 'w') as file:
        json.dump(data, file, indent=4)
    
    print(f"Successfully decoded and updated {len(gpp_api_entries)} GPP API entries.")


if __name__ == "__main__":
    main()