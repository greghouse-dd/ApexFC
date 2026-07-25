import os
import pandas as pd
import numpy as np
import joblib
from sklearn.preprocessing import StandardScaler, MinMaxScaler
from sklearn.ensemble import RandomForestRegressor
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder
from sklearn.impute import SimpleImputer

# Paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
PROCESSED_DATA_DIR = os.path.join(BASE_DIR, "data", "processed")
ML_DATA_DIR = os.path.join(BASE_DIR, "data", "ml")
MODELS_DIR = os.path.join(BASE_DIR, "models")

PLAYERS_PATH = os.path.join(PROCESSED_DATA_DIR, "players.parquet")
SIMILARITY_OUTPUT = os.path.join(ML_DATA_DIR, "similarity_features.parquet")
HIDDEN_GEMS_OUTPUT = os.path.join(ML_DATA_DIR, "hidden_gem_features.parquet")

SIMILARITY_SCALER_PATH = os.path.join(MODELS_DIR, "similarity_scaler.pkl")
VALUE_PREDICTOR_PATH = os.path.join(MODELS_DIR, "value_predictor.pkl")

CORE_RATINGS = ['pace', 'shooting', 'passing', 'dribbling', 'defending', 'physic']
DETAILED_ATTRIBUTES = [
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
    'goalkeeping_diving', 'goalkeeping_handling', 'goalkeeping_kicking',
    'goalkeeping_positioning', 'goalkeeping_reflexes', 'goalkeeping_speed'
]

def impute_position_aware(df, features):
    print("Performing position-aware imputation...")
    df_imputed = df.copy()
    
    # Fill based on position group median
    for col in features:
        if col in df_imputed.columns and df_imputed[col].isnull().sum() > 0:
            df_imputed[col] = df_imputed.groupby('position_group')[col].transform(lambda x: x.fillna(x.median()))
            # If still null (e.g. all GKs are missing a stat), fill with global median or 0
            df_imputed[col] = df_imputed[col].fillna(df_imputed[col].median()).fillna(0)
            
    return df_imputed

def build_similarity_pipeline(df):
    print("Building Similarity Pipeline...")
    features = CORE_RATINGS + DETAILED_ATTRIBUTES
    
    # 1. Impute
    df_sim = impute_position_aware(df, features)
    
    # Extract only the feature matrix for scaling
    X = df_sim[features].values
    
    # 2. Scale
    print("Scaling similarity features...")
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    # Save Scaler
    os.makedirs(MODELS_DIR, exist_ok=True)
    joblib.dump(scaler, SIMILARITY_SCALER_PATH)
    
    # 3. Format output
    # Create a DataFrame with snapshot_id and the scaled features
    df_output = pd.DataFrame(X_scaled, columns=[f"{f}_scaled" for f in features])
    df_output.insert(0, 'snapshot_id', df['snapshot_id'].values)
    df_output.insert(1, 'player_id', df['player_id'].values)
    
    os.makedirs(ML_DATA_DIR, exist_ok=True)
    df_output.to_parquet(SIMILARITY_OUTPUT, index=False)
    print(f"Saved similarity features to {SIMILARITY_OUTPUT}")

def build_hidden_gems_pipeline(df):
    print("Building Hidden Gems Pipeline...")
    
    # Filter valid rows for training (need value, age, overall, potential)
    train_mask = (df['value_eur'].notnull()) & (df['age'].notnull()) & (df['overall'].notnull()) & (df['potential'].notnull())
    df_train = df[train_mask].copy()
    
    if len(df_train) == 0:
        print("No valid rows for Hidden Gems training!")
        return
        
    print(f"Training value predictor on {len(df_train)} records...")
    
    num_features = ['age', 'overall', 'potential', 'international_reputation']
    cat_features = ['position_group']
    
    # Impute missing numeric with median
    for f in num_features:
        if df_train[f].isnull().sum() > 0:
             df_train[f] = df_train[f].fillna(df_train[f].median())
             
    # Impute categorical with missing
    df_train['position_group'] = df_train['position_group'].fillna('Unknown')
    
    X = df_train[num_features + cat_features]
    y = df_train['value_eur']
    
    # Preprocessor
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', SimpleImputer(strategy='median'), num_features),
            ('cat', OneHotEncoder(handle_unknown='ignore'), cat_features)
        ])
        
    # Model - using a fast Regressor
    model = Pipeline(steps=[
        ('preprocessor', preprocessor),
        ('regressor', RandomForestRegressor(n_estimators=50, max_depth=10, random_state=42, n_jobs=-1))
    ])
    
    model.fit(X, y)
    joblib.dump(model, VALUE_PREDICTOR_PATH)
    
    # Now predict for ALL players (or at least those we want scores for)
    # Even if they don't have value_eur, we can predict expected value
    df_eval = df.copy()
    df_eval['position_group'] = df_eval['position_group'].fillna('Unknown')
    
    # Predict
    df_eval['predicted_value_eur'] = model.predict(df_eval[num_features + cat_features])
    
    # Calculate undervaluation gap (predicted - actual)
    # If actual is null, gap is 0 or NaN. We'll set it to 0 so they don't show up as gems.
    df_eval['undervaluation_gap'] = df_eval['predicted_value_eur'] - df_eval['value_eur'].fillna(df_eval['predicted_value_eur'])
    
    # Hidden Gem Score heuristic
    # Favour: High growth potential, High undervaluation gap, Young age
    # Base formula: gap (in millions) + (growth_potential * 1.5)
    gap_in_m = df_eval['undervaluation_gap'] / 1_000_000
    
    # Give a boost for being young (under 24)
    age_bonus = np.maximum(0, 24 - df_eval['age']) * 2
    
    raw_score = gap_in_m + (df_eval['growth_potential'] * 1.5) + age_bonus
    
    # Scale to 0-100
    scaler = MinMaxScaler((0, 100))
    df_eval['hidden_gem_score'] = scaler.fit_transform(raw_score.values.reshape(-1, 1))
    
    # Round scores
    df_eval['hidden_gem_score'] = np.round(df_eval['hidden_gem_score'], 1)
    df_eval['predicted_value_eur'] = np.round(df_eval['predicted_value_eur'], 2)
    df_eval['undervaluation_gap'] = np.round(df_eval['undervaluation_gap'], 2)
    
    out_cols = ['snapshot_id', 'player_id', 'predicted_value_eur', 'undervaluation_gap', 'hidden_gem_score']
    df_out = df_eval[out_cols]
    
    df_out.to_parquet(HIDDEN_GEMS_OUTPUT, index=False)
    print(f"Saved hidden gem features to {HIDDEN_GEMS_OUTPUT}")

def main():
    print(f"Loading canonical dataset: {PLAYERS_PATH}")
    if not os.path.exists(PLAYERS_PATH):
        raise FileNotFoundError(f"Cannot find {PLAYERS_PATH}. Run preprocessing first.")
        
    df = pd.read_parquet(PLAYERS_PATH)
    
    build_similarity_pipeline(df)
    build_hidden_gems_pipeline(df)
    
    print("ML Feature Pipeline completed successfully!")

if __name__ == "__main__":
    main()
