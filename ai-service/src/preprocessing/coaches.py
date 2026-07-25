import os
import pandas as pd
import numpy as np

# Paths
RAW_DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "data", "raw")
PROCESSED_DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "data", "processed")

MALE_COACHES_PATH = os.path.join(RAW_DATA_DIR, "male_coaches.csv")
FEMALE_COACHES_PATH = os.path.join(RAW_DATA_DIR, "female_coaches.csv")
OUTPUT_PATH = os.path.join(PROCESSED_DATA_DIR, "coaches.parquet")

CANONICAL_COLUMNS = [
    'coach_id', 'short_name', 'long_name', 'dob', 'nationality_name', 'gender'
]

def process_coaches_data():
    print(f"Reading {MALE_COACHES_PATH}...")
    df_male = pd.read_csv(MALE_COACHES_PATH, low_memory=False)
    df_male['gender'] = 'male'
    
    print(f"Reading {FEMALE_COACHES_PATH}...")
    df_female = pd.read_csv(FEMALE_COACHES_PATH, low_memory=False)
    df_female['gender'] = 'female'
    
    print("Concatenating datasets...")
    df = pd.concat([df_male, df_female], ignore_index=True)
    
    # Ensure canonical columns exist
    for col in CANONICAL_COLUMNS:
        if col not in df.columns:
            df[col] = np.nan
            
    df_canonical = df[CANONICAL_COLUMNS].copy()
    
    print("Trimming strings...")
    string_cols = ['short_name', 'long_name', 'nationality_name']
    for col in string_cols:
        if col in df_canonical.columns:
            df_canonical[col] = df_canonical[col].astype(str).str.strip().replace({'nan': None, 'None': None, '<NA>': None})
            
    print("Parsing dates...")
    df_canonical['dob'] = pd.to_datetime(df_canonical['dob']).dt.date
    
    # Snapshot ID for coaches is just coach_id as they are not versioned
    df_canonical['snapshot_id'] = df_canonical['coach_id'].astype(str)
    
    print("Validating unique constraint on snapshot_id...")
    duplicates = df_canonical['snapshot_id'].duplicated().sum()
    if duplicates > 0:
        print(f"WARNING: Found {duplicates} duplicate snapshot_ids in coaches!")
    else:
        print("Validation Passed: snapshot_id is strictly unique for coaches.")
        
    print(f"Writing to {OUTPUT_PATH}...")
    os.makedirs(PROCESSED_DATA_DIR, exist_ok=True)
    df_canonical.to_parquet(OUTPUT_PATH, index=False)
    print(f"Success! Processed {len(df_canonical)} coach rows.")

if __name__ == "__main__":
    process_coaches_data()
