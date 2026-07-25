import os
import pandas as pd
import numpy as np

# Paths
RAW_DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "data", "raw")
PROCESSED_DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "data", "processed")

MALE_TEAMS_PATH = os.path.join(RAW_DATA_DIR, "male_teams.csv")
FEMALE_TEAMS_PATH = os.path.join(RAW_DATA_DIR, "female_teams.csv")
OUTPUT_PATH = os.path.join(PROCESSED_DATA_DIR, "teams.parquet")

CANONICAL_COLUMNS = [
    'team_id', 'fifa_version', 'fifa_update', 'update_as_of', 'gender',
    'team_name', 'league_id', 'league_name', 'league_level',
    'nationality_id', 'nationality_name', 'coach_id',
    
    # Core strength
    'overall', 'attack', 'midfield', 'defence',
    
    # Club context
    'international_prestige', 'domestic_prestige', 'transfer_budget_eur',
    'club_worth_eur', 'starting_xi_average_age', 'whole_team_average_age',
    
    # Defensive tactics
    'def_style', 'def_team_width', 'def_team_depth', 'def_defence_pressure',
    'def_defence_aggression', 'def_defence_width', 'def_defence_defender_line',
    
    # Offensive tactics
    'off_style', 'off_build_up_play', 'off_chance_creation', 'off_team_width',
    'off_players_in_box', 'off_corners', 'off_free_kicks',
    
    # Legacy detailed tactics
    'build_up_play_speed', 'build_up_play_dribbling', 'build_up_play_passing',
    'build_up_play_positioning', 'chance_creation_passing', 'chance_creation_crossing',
    'chance_creation_shooting', 'chance_creation_positioning',
    
    # Set pieces (optional relationships)
    'captain', 'short_free_kick', 'long_free_kick', 'left_short_free_kick',
    'right_short_free_kick', 'penalties', 'left_corner', 'right_corner'
]

def process_teams_data():
    print(f"Reading {MALE_TEAMS_PATH}...")
    df_male = pd.read_csv(MALE_TEAMS_PATH, low_memory=False)
    df_male['gender'] = 'male'
    
    print(f"Reading {FEMALE_TEAMS_PATH}...")
    df_female = pd.read_csv(FEMALE_TEAMS_PATH, low_memory=False)
    df_female['gender'] = 'female'
    
    print("Concatenating datasets...")
    df = pd.concat([df_male, df_female], ignore_index=True)
    
    # Ensure all canonical columns exist
    for col in CANONICAL_COLUMNS:
        if col not in df.columns:
            df[col] = np.nan
            
    df_canonical = df[CANONICAL_COLUMNS].copy()
    
    print("Trimming strings...")
    string_cols = ['team_name', 'league_name', 'nationality_name', 'def_style', 'def_defence_defender_line', 'off_style', 'off_build_up_play', 'off_chance_creation', 'build_up_play_positioning', 'chance_creation_positioning']
    for col in string_cols:
        if col in df_canonical.columns:
            df_canonical[col] = df_canonical[col].astype(str).str.strip().replace({'nan': None, 'None': None, '<NA>': None})
            
    print("Parsing dates...")
    df_canonical['update_as_of'] = pd.to_datetime(df_canonical['update_as_of']).dt.date
    
    # Snapshot ID
    df_canonical['snapshot_id'] = (
        df_canonical['team_id'].astype(str) + "_" + 
        df_canonical['fifa_version'].astype(str) + "_" + 
        df_canonical['fifa_update'].astype(str)
    )
    
    print("Validating unique constraint on snapshot_id...")
    duplicates = df_canonical['snapshot_id'].duplicated().sum()
    if duplicates > 0:
        print(f"WARNING: Found {duplicates} duplicate snapshot_ids in teams!")
    else:
        print("Validation Passed: snapshot_id is strictly unique for teams.")
        
    print(f"Writing to {OUTPUT_PATH}...")
    os.makedirs(PROCESSED_DATA_DIR, exist_ok=True)
    df_canonical.to_parquet(OUTPUT_PATH, index=False)
    print(f"Success! Processed {len(df_canonical)} team rows.")

if __name__ == "__main__":
    process_teams_data()
