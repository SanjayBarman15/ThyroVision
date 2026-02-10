
import os
from dotenv import load_dotenv
load_dotenv(dotenv_path="d:/project/ThyroVision/backend/.env")

from app.db.supabase import supabase_admin
import json

def get_metadata():
    try:
        response = supabase_admin.table("predictions").select("id, model_metadata, bounding_box").order("created_at", desc=True).limit(3).execute()
        
        if not response.data:
            print("No predictions found.")
            return

        for pred in response.data:
            metadata = pred.get('model_metadata', {})
            detector = metadata.get('roi_detector', {})
            print(f"ID: {pred.get('id')}")
            print(f"Detector Name: {detector.get('name')}")
            print(f"Detector Version: {detector.get('version')}")
            print(f"BBox: {json.dumps(pred.get('bounding_box'))}")
            print("-" * 30)
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    get_metadata()
