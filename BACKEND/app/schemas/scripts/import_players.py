# backend/app/scripts/import_players.py

import pandas as pd
from sqlalchemy.orm import Session

from app.database.database import SessionLocal
from app.models.player import Player


CSV_FILE = "app/data/players.csv"
BATCH_SIZE = 1000


def safe_int(value, default=0):
    if pd.isna(value):
        return default
    try:
        return int(float(value))
    except Exception:
        return default


def safe_float(value, default=0.0):
    if pd.isna(value):
        return default
    try:
        return float(value)
    except Exception:
        return default


def safe_str(value):
    if pd.isna(value):
        return None
    return str(value)


def get_position_group(position_string):
    if not position_string:
        return "Unknown"

    first = position_string.split(",")[0].strip()

    if first == "GK":
        return "Goalkeeper"

    defenders = {"LB", "RB", "CB", "LWB", "RWB"}
    midfielders = {
        "CDM", "CM", "CAM",
        "LM", "RM",
        "LDM", "RDM",
        "LCM", "RCM",
        "LAM", "RAM"
    }
    forwards = {
        "LW", "RW",
        "LF", "RF",
        "CF",
        "ST",
        "LS", "RS"
    }

    if first in defenders:
        return "Defender"

    if first in midfielders:
        return "Midfielder"

    if first in forwards:
        return "Forward"

    return "Unknown"


def import_players():
    db: Session = SessionLocal()

    try:
        print("Reading CSV...")

        df = pd.read_csv(
            CSV_FILE,
            low_memory=False
        )

        print(f"Original rows : {len(df)}")

        # -------------------------------------------------
        # Keep only the latest FIFA update for each player
        # -------------------------------------------------

        df = (
            df.sort_values(
                by=["player_id", "fifa_version", "fifa_update"]
            )
            .drop_duplicates(
                subset="player_id",
                keep="last"
            )
            .reset_index(drop=True)
        )

        print(f"Unique players: {len(df)}")

        # -------------------------------------------------
        # Existing FIFA IDs already in database
        # -------------------------------------------------

        existing_ids = {
            fifa_id
            for (fifa_id,) in db.query(Player.fifa_id).all()
        }

        imported = 0
        skipped = 0

        # -------------------------------------------------
        # Import
        # -------------------------------------------------

        for _, row in df.iterrows():

            fifa_id = safe_int(row["player_id"])

            if fifa_id in existing_ids:
                skipped += 1
                continue

            player = Player(

                # Identity

                fifa_id=fifa_id,
                name=safe_str(row["short_name"]),
                full_name=safe_str(row["long_name"]),
                age=safe_int(row["age"]),
                nationality=safe_str(row["nationality_name"]),
                club=safe_str(row["club_name"]),
                league=safe_str(row["league_name"]),

                # Position

                position=safe_str(row["player_positions"]),
                position_group=get_position_group(
                    safe_str(row["player_positions"])
                ),
                preferred_foot=safe_str(row["preferred_foot"]),
                jersey_number=safe_int(row["club_jersey_number"]),
                height_cm=safe_int(row["height_cm"]),
                weight_kg=safe_int(row["weight_kg"]),

                # Ratings

                overall=safe_int(row["overall"]),
                potential=safe_int(row["potential"]),
                value_eur=safe_float(row["value_eur"]),
                wage_eur=safe_float(row["wage_eur"]),
                release_clause=safe_float(
                    row["release_clause_eur"]
                ),

                # Face Stats

                pace=safe_int(row["pace"]),
                shooting=safe_int(row["shooting"]),
                passing=safe_int(row["passing"]),
                dribbling=safe_int(row["dribbling"]),
                defending=safe_int(row["defending"]),
                physical=safe_int(row["physic"]),

                # Goalkeeping

                gk_diving=safe_int(row["goalkeeping_diving"]),
                gk_handling=safe_int(row["goalkeeping_handling"]),
                gk_kicking=safe_int(row["goalkeeping_kicking"]),
                gk_reflexes=safe_int(row["goalkeeping_reflexes"]),
                gk_positioning=safe_int(row["goalkeeping_positioning"]),

                # Season Statistics
                # (Not available in FIFA dataset)

                appearances=0,
                minutes=0,
                goals=0,
                assists=0,
                xg=0.0,
                xa=0.0,
                tackles=0.0,
                interceptions=0.0,
                progressive_passes=0.0,
                progressive_carries=0.0,
                clean_sheets=0,

                # Images
                # (Can be filled later)

                face_url=None,
                club_logo=None,
                nation_flag=None,

                is_active=True
            )

            db.add(player)

            # Prevent duplicates within the same import
            existing_ids.add(fifa_id)

            imported += 1

            if imported % BATCH_SIZE == 0:
                db.commit()
                print(f"Imported {imported} players...")

        db.commit()

        print("\n========== IMPORT COMPLETE ==========")
        print(f"Imported : {imported}")
        print(f"Skipped  : {skipped}")
        print("=====================================")

    except Exception as e:
        db.rollback()
        print(f"\nError: {e}")

    finally:
        db.close()


if __name__ == "__main__":
    import_players()