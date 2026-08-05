from app.database.database import SessionLocal
from sqlalchemy import text

db = SessionLocal()

tables = ["watchlists", "users", "squads", "squad_players", "transfer_history", "players"]

print("Syncing PostgreSQL primary key sequence counters...")
for table in tables:
    try:
        seq = db.execute(text(f"SELECT pg_get_serial_sequence('{table}', 'id');")).scalar()
        if seq:
            max_id = db.execute(text(f"SELECT COALESCE(MAX(id), 0) FROM {table};")).scalar()
            target_val = max(max_id, 1)
            is_called = True if max_id > 0 else False
            db.execute(text(f"SELECT setval('{seq}', {target_val}, {str(is_called).lower()});"))
            db.commit()
            new_val = db.execute(text(f"SELECT last_value FROM {seq};")).scalar()
            print(f"Table '{table}' (seq: {seq}): max_id = {max_id}, sequence reset to = {new_val}")
        else:
            print(f"No sequence found for table '{table}'")
    except Exception as e:
        db.rollback()
        print(f"Error resetting sequence for {table}: {e}")

db.close()
print("Sequence sync complete!")
