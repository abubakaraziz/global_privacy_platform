#!/usr/bin/env python3
import csv
import os
import sys
from pathlib import Path

def csv_to_tsv(csv_file_path):
    """
    Convert CSV file to TSV format, save in same directory, and delete original CSV.
    
    Args:
        csv_file_path (str): Path to the input CSV file
    """
    try:
        # Convert to Path object for easier manipulation
        csv_path = Path(csv_file_path)
        
        # Check if the file exists
        if not csv_path.exists():
            print(f"Error: File '{csv_file_path}' does not exist.")
            return False
        
        # Check if it's a CSV file
        if csv_path.suffix.lower() != '.csv':
            print(f"Error: File '{csv_file_path}' is not a CSV file.")
            return False
        
        # Create TSV file path (same directory, same name but .tsv extension)
        tsv_path = csv_path.with_suffix('.tsv')
        
        # Read CSV and write TSV
        with open(csv_path, 'r', encoding='utf-8', newline='') as csv_file:
            csv_reader = csv.reader(csv_file)
            
            with open(tsv_path, 'w', encoding='utf-8', newline='') as tsv_file:
                tsv_writer = csv.writer(tsv_file, delimiter='\t')
                
                # Copy all rows from CSV to TSV
                row_count = 0
                for row in csv_reader:
                    tsv_writer.writerow(row)
                    row_count += 1
        
        print(f"Successfully converted {row_count} rows from CSV to TSV.")
        print(f"TSV file saved as: {tsv_path}")
        
        # Delete the original CSV file
        csv_path.unlink()
        print(f"Original CSV file deleted: {csv_path}")
        
        return True
        
    except PermissionError:
        print(f"Error: Permission denied. Cannot access '{csv_file_path}'.")
        return False
    except Exception as e:
        print(f"Error: {str(e)}")
        return False

def main():
    # Check if file path is provided as command line argument
    if len(sys.argv) != 2:
        print("Usage: python csv_to_tsv.py <path_to_csv_file>")
        print("Example: python csv_to_tsv.py /Users/aziz/Research/Privacy/opt-out-gpp/global_privacy_platform/configs/URLS/cmp-validation-with-network-requests/cmp_request_analysis_cookiebot.csv")
        sys.exit(1)
    
    csv_file_path = sys.argv[1]
    
    # Convert CSV to TSV
    success = csv_to_tsv(csv_file_path)
    
    if success:
        print("Conversion completed successfully!")
    else:
        print("Conversion failed!")
        sys.exit(1)

if __name__ == "__main__":
    main()