import os
import pandas as pd
from app.database.database import engine

CSV_PATH = "app/data/fifa_players.csv"

def run():
    print("Reading CSV...")
    if not os.path.exists(CSV_PATH):
        print(f"CSV not found at: {CSV_PATH}")
        return
    
    df = pd.read_csv(CSV_PATH)
    print(f"Loaded {len(df)} rows. Writing to database...")
    
    # Save to SQLite table 'fifa_players'
    df.to_sql("fifa_players", con=engine, if_exists="replace", index=False)
    print("Successfully written to database table 'fifa_players'!")

if __name__ == "__main__":
    run()
