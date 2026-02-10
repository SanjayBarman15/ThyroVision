
import os
from dotenv import load_dotenv

# Load env before importing supabase client
load_dotenv(dotenv_path="d:/project/ThyroVision/backend/.env")

from app.db.supabase import supabase_admin
import json

def list_recent_predictions():
    try:
        response = supabase_admin.table("predictions").select("id, created_at, roi_score, model_metadata, predicted_class, bounding_box").order("created_at", desc=True).limit(3).execute()
        
        if not response.data:
            print("No predictions found.")
            return

        for i, pred in enumerate(response.data):
            print(f"--- Prediction {i+1} ---")
            print(f"ID: {pred.get('id')}")
            print(f"Timestamp: {pred.get('created_at')}")
            print(f"ROI Score: {pred.get('roi_score')}")
            print(f"BBox: {json.dumps(pred.get('bounding_box'))}")
            metadata = pred.get('model_metadata', {})
            detector = metadata.get('roi_detector', {})
            print(f"Detector Version: {detector.get('version')}")
            print("-" * 30)
            
    except Exception as e:
        print(f"Failed to query predictions: {e}")

if __name__ == "__main__":
    list_recent_predictions()
