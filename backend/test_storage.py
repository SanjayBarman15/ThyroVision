
from app.db.supabase import supabase_admin
import os

def test_upload():
    bucket_name = "ThyroSight-images"
    test_content = b"\xFF\xD8\xFF\xE0\x00\x10JFIF\x00\x01\x01\x01\x00H\x00H\x00\x00\xFF\xDB\x00C\x00\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\t\t\x08\n\x0c\x14\r\x0c\x0b\x0b\x0c\x19\x12\x13\x0f\x14\x1d\x1a\x1f\x1e\x1d\x1a\x1c\x1c $.' \",#\x1c\x1c(7),01444\x1f'9=82<.342\xFF\xC0\x00\x0b\x08\x00\x01\x00\x01\x01\x01\x11\x00\xFF\xC4\x00\x14\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\xFF\xC4\x00\x14\x10\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\xFF\xDA\x00\x08\x01\x01\x00\x00\x3F\x00\xCC\x00\xFF\xD9"
    
    # Target path in storage
    storage_path = "test/verification.jpg"
    
    try:
        print(f"Attempting to upload to bucket: {bucket_name}...")
        response = supabase_admin.storage.from_(bucket_name).upload(
            storage_path,
            test_content,
            {"content-type": "image/jpeg"}
        )
        print(f"Upload successful: {response}")
        
        # Test download
        print("Attempting to download back...")
        downloaded = supabase_admin.storage.from_(bucket_name).download(storage_path)
        if downloaded == test_content:
            print("Download verification successful!")
        else:
            print("Download verification failed: Content mismatch.")
            
        # Clean up
        print("Cleaning up...")
        supabase_admin.storage.from_(bucket_name).remove([storage_path])
        print("Cleanup successful.")
        
    except Exception as e:
        print(f"Test failed: {e}")

if __name__ == "__main__":
    test_upload()
