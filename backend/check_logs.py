
from app.db.supabase import supabase_admin
import json

def get_latest_errors():
    try:
        response = supabase_admin.table("system_logs").select("*").eq("level", "ERROR").order("created_at", desc=True).limit(5).execute()
        
        if not response.data:
            print("No error logs found.")
            return

        for log in response.data:
            print(f"Time: {log.get('created_at')}")
            print(f"Action: {log.get('action')}")
            print(f"Error Message: {log.get('error_message')}")
            print(f"Metadata: {json.dumps(log.get('metadata'), indent=2)}")
            print("-" * 30)
    except Exception as e:
        print(f"Failed to query system_logs: {e}")

if __name__ == "__main__":
    get_latest_errors()
