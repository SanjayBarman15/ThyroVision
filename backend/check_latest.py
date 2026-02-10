
import os
from dotenv import load_dotenv
load_dotenv(dotenv_path="d:/project/ThyroVision/backend/.env")

from app.db.supabase import supabase_admin
import json

def get_latest():
    try:
        response = supabase_admin.table("predictions").select("id, created_at, model_metadata, bounding_box").order("created_at", desc=True).limit(1).execute()
        
        if not response.data:
            print("No predictions found.")
            return

        pred = response.data[0]
        metadata = pred.get('model_metadata', {})
        detector = metadata.get('roi_detector', {})
        print(f"LATEST_ID: {pred.get('id')}")
        print(f"LATEST_TIMESTAMP: {pred.get('created_at')}")
        print(f"LATEST_DETECTOR_VERSION: {detector.get('version')}")
        print(f"LATEST_BBOX: {json.dumps(pred.get('bounding_box'))}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    get_latest()
