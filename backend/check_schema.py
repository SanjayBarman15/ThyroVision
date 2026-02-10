
import os
from dotenv import load_dotenv
load_dotenv(dotenv_path="d:/project/ThyroVision/backend/.env")

from app.db.supabase import supabase_admin

def check_schema():
    try:
        # Querying a single row to see columns
        res = supabase_admin.table("predictions").select("*").limit(1).execute()
        if res.data:
            print("Columns found:", list(res.data[0].keys()))
        else:
            print("No data in predictions table.")
    except Exception as e:
        print(f"Error checking schema: {e}")

if __name__ == "__main__":
    check_schema()
