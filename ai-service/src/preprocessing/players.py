import os
import pandas as pd
import numpy as np
import json
import re

# Paths
RAW_DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "data", "raw")
PROCESSED_DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "data", "processed")

MALE_PLAYERS_PATH = os.path.join(RAW_DATA_DIR, "male_players.csv")
FEMALE_PLAYERS_PATH = os.path.join(RAW_DATA_DIR, "female_players.csv")
OUTPUT_PATH = os.path.join(PROCESSED_DATA_DIR, "players.parquet")

CANONICAL_COLUMNS = [
    'player_id', 'fifa_version', 'fifa_update', 'update_as_of', 'gender',
    'short_name', 'long_name', 'player_positions', 'overall', 'potential',
    'value_eur', 'wage_eur', 'age', 'dob', 'height_cm', 'weight_kg',
    'club_team_id', 'club_name', 'league_id', 'league_name', 'league_level',
    'club_position', 'club_loaned_from', 'club_contract_valid_until_year',
    'nationality_id', 'nationality_name', 'preferred_foot', 'weak_foot',
    'skill_moves', 'international_reputation', 'work_rate', 'body_type',
    'release_clause_eur', 'player_tags', 'player_traits',
    
    # Core ratings
    'pace', 'shooting', 'passing', 'dribbling', 'defending', 'physic',
    
    # Detailed attributes
    'attacking_crossing', 'attacking_finishing', 'attacking_heading_accuracy',
    'attacking_short_passing', 'attacking_volleys',
    'skill_dribbling', 'skill_curve', 'skill_fk_accuracy', 'skill_long_passing',
    'skill_ball_control',
    'movement_acceleration', 'movement_sprint_speed', 'movement_agility',
    'movement_reactions', 'movement_balance',
    'power_shot_power', 'power_jumping', 'power_stamina', 'power_strength',
    'power_long_shots',
    'mentality_aggression', 'mentality_interceptions', 'mentality_positioning',
    'mentality_vision', 'mentality_penalties', 'mentality_composure',
    'defending_marking_awareness', 'defending_standing_tackle', 'defending_sliding_tackle',
    
    # Goalkeeping
    'goalkeeping_diving', 'goalkeeping_handling', 'goalkeeping_kicking',
    'goalkeeping_positioning', 'goalkeeping_reflexes', 'goalkeeping_speed'
]

POSITIONAL_RATING_COLS = [
    'ls', 'st', 'rs', 'lw', 'lf', 'cf', 'rf', 'rw',
    'lam', 'cam', 'ram', 'lm', 'lcm', 'cm', 'rcm', 'rm',
    'lwb', 'ldm', 'cdm', 'rdm', 'rwb', 'lb', 'lcb', 'cb', 'rcb', 'rb', 'gk'
]

def parse_rating(val):
    if pd.isna(val) or val == "":
        return None
    val_str = str(val).strip()
    # Match pattern like "90", "90+3", "90-1"
    match = re.match(r'^(\d+)(?:([+-])(\d+))?$', val_str)
    if match:
        base = int(match.group(1))
        effective = base
        modifier = 0
        if match.group(2) and match.group(3):
            sign = 1 if match.group(2) == '+' else -1
            modifier = int(match.group(3)) * sign
            effective += modifier
        return {"base": base, "modifier": modifier, "effective": effective}
    return None

def extract_effective(rating_dict):
    if isinstance(rating_dict, dict) and 'effective' in rating_dict:
        return rating_dict['effective']
    return np.nan

def process_players_data():
    print(f"Reading {MALE_PLAYERS_PATH}...")
    df_male = pd.read_csv(MALE_PLAYERS_PATH, low_memory=False)
    df_male['gender'] = 'male'
    
    print(f"Reading {FEMALE_PLAYERS_PATH}...")
    df_female = pd.read_csv(FEMALE_PLAYERS_PATH, low_memory=False)
    df_female['gender'] = 'female'
    
    print("Concatenating datasets...")
    df = pd.concat([df_male, df_female], ignore_index=True)
    
    # Parse positional ratings first to get the derived flat numeric fields
    print("Parsing positional ratings...")
    parsed_ratings_all = {}
    for pos in POSITIONAL_RATING_COLS:
        if pos in df.columns:
            parsed_series = df[pos].apply(parse_rating)
            df[f'position_rating_{pos}'] = parsed_series.apply(extract_effective).astype('float32')
            parsed_ratings_all[pos] = parsed_series

    # Also build the nested dictionary field `effective_position_ratings`
    print("Building effective_position_ratings column...")
    dict_list = []
    # Create a dataframe of just the parsed dicts
    parsed_df = pd.DataFrame(parsed_ratings_all)
    # Convert row by row
    for row in parsed_df.itertuples(index=False):
        row_dict = {col: val for col, val in zip(parsed_df.columns, row) if val is not None}
        dict_list.append(json.dumps(row_dict) if row_dict else None)
    df['effective_position_ratings'] = dict_list

    # Keep only canonical + derived columns
    derived_cols = [f'position_rating_{pos}' for pos in POSITIONAL_RATING_COLS if pos in df.columns] + ['effective_position_ratings']
    
    # Ensure all CANONICAL_COLUMNS are present, if missing add them as empty (to prevent KeyError)
    for col in CANONICAL_COLUMNS:
        if col not in df.columns:
            df[col] = np.nan
            
    df_canonical = df[CANONICAL_COLUMNS + derived_cols].copy()
    
    print("Trimming strings...")
    string_cols_to_trim = ['short_name', 'long_name', 'club_name', 'league_name', 'nationality_name']
    for col in string_cols_to_trim:
        df_canonical[col] = df_canonical[col].astype(str).str.strip().replace({'nan': None, 'None': None, '<NA>': None})
        
    print("Parsing dates...")
    df_canonical['update_as_of'] = pd.to_datetime(df_canonical['update_as_of']).dt.date
    df_canonical['dob'] = pd.to_datetime(df_canonical['dob']).dt.date
    
    print("Splitting lists...")
    def split_string_to_list(val):
        if pd.isna(val) or val == "" or str(val).lower() == 'nan':
            return []
        return [x.strip() for x in str(val).split(',')]

    df_canonical['positions'] = df_canonical['player_positions'].apply(split_string_to_list)
    df_canonical['tags'] = df_canonical['player_tags'].apply(split_string_to_list)
    df_canonical['traits'] = df_canonical['player_traits'].apply(split_string_to_list)
    
    # Drop original comma separated columns that we renamed
    df_canonical = df_canonical.drop(columns=['player_positions', 'player_tags', 'player_traits'])
    
    print("Generating derived fields...")
    # Primary position
    df_canonical['primary_position'] = df_canonical['positions'].apply(lambda x: x[0] if len(x) > 0 else None)
    
    # Position group
    def get_position_group(pos):
        if not pos:
            return None
        pos = pos.upper()
        if pos == 'GK':
            return 'GK'
        elif pos in ['LB', 'LCB', 'CB', 'RCB', 'RB', 'LWB', 'RWB']:
            return 'DEF'
        elif pos in ['CDM', 'LDM', 'RDM', 'CM', 'LCM', 'RCM', 'LM', 'RM', 'CAM', 'LAM', 'RAM']:
            return 'MID'
        elif pos in ['LW', 'RW', 'LF', 'RF', 'CF', 'ST', 'LS', 'RS']:
            return 'ATT'
        return None

    df_canonical['position_group'] = df_canonical['primary_position'].apply(get_position_group)
    
    # Age group
    def get_age_group(age):
        if pd.isna(age):
            return None
        if age < 21:
            return 'U21'
        elif 21 <= age <= 25:
            return '21_25'
        elif 26 <= age <= 29:
            return '26_29'
        else:
            return '30_plus'

    df_canonical['age_group'] = df_canonical['age'].apply(get_age_group)
    
    # Growth potential
    df_canonical['growth_potential'] = df_canonical['potential'] - df_canonical['overall']
    
    # Value/Wage ratios
    df_canonical['value_per_overall'] = df_canonical['value_eur'] / df_canonical['overall']
    df_canonical['value_per_overall'] = df_canonical['value_per_overall'].replace([np.inf, -np.inf], np.nan)
    
    df_canonical['wage_to_value_ratio'] = df_canonical['wage_eur'] / df_canonical['value_eur']
    df_canonical['wage_to_value_ratio'] = df_canonical['wage_to_value_ratio'].replace([np.inf, -np.inf], np.nan)
    
    # Snapshot ID
    df_canonical['snapshot_id'] = (
        df_canonical['player_id'].astype(str) + "_" + 
        df_canonical['fifa_version'].astype(str) + "_" + 
        df_canonical['fifa_update'].astype(str)
    )
    
    # Rename mapped columns per requirements
    df_canonical = df_canonical.rename(columns={
        'club_contract_valid_until_year': 'contract_until'
    })
    
    print("Validating unique constraint on snapshot_id...")
    duplicates = df_canonical['snapshot_id'].duplicated().sum()
    if duplicates > 0:
        print(f"WARNING: Found {duplicates} duplicate snapshot_ids!")
    else:
        print("Validation Passed: snapshot_id is strictly unique.")
        
    print(f"Writing to {OUTPUT_PATH}...")
    os.makedirs(PROCESSED_DATA_DIR, exist_ok=True)
    
    df_canonical.to_parquet(OUTPUT_PATH, index=False)
    
    print(f"Success! Processed {len(df_canonical)} rows.")

if __name__ == "__main__":
    process_players_data()
