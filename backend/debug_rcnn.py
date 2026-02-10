
import os
import torch
import numpy as np
from PIL import Image
from io import BytesIO
from dotenv import load_dotenv

# Load env - use absolute path to be sure
load_dotenv(dotenv_path="D:/project/ThyroVision/backend/.env")

from app.db.supabase import supabase_admin, STORAGE_BUCKET
from app.services.inference.roi_detector import FasterRCNNDetector
from app.services.preprocessing.bbox_preprocessing import detection_preprocess_from_array

async def debug_rcnn():
    print("🚀 Starting RCNN Debugging...")
    
    try:
        # 1. Fetch the latest raw image
        res = supabase_admin.table("raw_images").select("*").order("created_at", desc=True).limit(1).execute()
        if not res.data:
            print("❌ No raw images found in database.")
            return
        
        raw_image = res.data[0]
        print(f"📂 Processing Image ID: {raw_image['id']}")
        print(f"🖼️ File Path: {raw_image['file_path']}")
        
        # 2. Download from storage
        bucket = supabase_admin.storage.from_(STORAGE_BUCKET)
        raw_bytes = bucket.download(raw_image["file_path"])
        
        img = Image.open(BytesIO(raw_bytes)).convert("RGB")
        image_array = np.array(img)
        h_orig, w_orig = image_array.shape[:2]
        print(f"📏 Image Size: {w_orig}x{h_orig}")
        
        # 3. Initialize Detector
        detector = FasterRCNNDetector()
        device = detector.device
        model = detector._model
        
        # 4. Preprocess
        tensor = detection_preprocess_from_array(image_array).to(device).unsqueeze(0)
        
        # 5. Inference
        with torch.no_grad():
            outputs = model(tensor)[0]
        
        boxes = outputs["boxes"].cpu().numpy()
        scores = outputs["scores"].cpu().numpy()
        
        print("\n📊 --- RAW RCNN OUTPUT ---")
        print(f"Found {len(scores)} candidate boxes.")
        
        # Show top 10 detections
        for i in range(min(10, len(scores))):
            box = boxes[i]
            score = scores[i]
            print(f"Detection {i+1}:")
            print(f"  Confidence Score: {score:.6f}")
            print(f"  Box [xmin, ymin, xmax, ymax]: [{box[0]:.1f}, {box[1]:.1f}, {box[2]:.1f}, {box[3]:.1f}]")
            print("-" * 20)

        if len(scores) > 0:
            max_idx = scores.argmax()
            max_score = scores[max_idx]
            print(f"\n🎯 FINAL CHOICE (Max Score): {max_score:.4f}")
            if max_score < 0.1:
                 print("⚠️ Result: BELOW THRESHOLD (Fallback would be used)")
            else:
                 print("✅ Result: SUCCESS (Detection used)")
        else:
            print("\n❌ Result: NO DETECTIONS FOUND")
            
    except Exception as e:
        print(f"❌ Error during debugging: {e}")

if __name__ == "__main__":
    import asyncio
    asyncio.run(debug_rcnn())
