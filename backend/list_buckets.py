
from app.db.supabase import supabase_admin

def list_buckets():
    try:
        response = supabase_admin.storage.list_buckets()
        print(f"DEBUG: Response type: {type(response)}")
        if not response:
            print("No buckets found.")
            return
        print(f"Found {len(response)} buckets:")
        for bucket in response:
            print(f"BUCKET_NAME: {bucket.name}")
            print(f"BUCKET_ID: {bucket.id}")
            print(f"BUCKET_PUBLIC: {bucket.public}")
    except Exception as e:
        print(f"Failed to list buckets: {e}")

if __name__ == "__main__":
    list_buckets()
