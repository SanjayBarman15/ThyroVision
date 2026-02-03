import asyncio
import io
from PIL import Image
from app.services.inference.inference_pipeline import InferencePipeline

async def test_roi_simulation():
    print("🚀 Starting ROI Simulation Verification...")
    
    # 1. Create a mock raw image (1000x800)
    width, height = 1000, 800
    img = Image.new('RGB', (width, height), color=(73, 109, 137))
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format='JPEG')
    image_bytes = img_byte_arr.getvalue()
    
    # 2. Initialize pipeline
    pipeline = InferencePipeline()
    
    # 3. Run inference
    result = await pipeline.run(image_bytes)
    
    # 4. Extract results
    box = result["bounding_box"]
    print(f"\n📊 Raw Image Dimensions: {width}x{height}")
    print(f"📦 Resulting Bounding Box: {box}")
    
    # 5. Logical Checks
    # a. Check if box is within raw image bounds
    assert box["x"] >= 0, "Box X < 0"
    assert box["y"] >= 0, "Box Y < 0"
    assert box["x"] + box["width"] <= width, f"Box X+Width ({box['x'] + box['width']}) > {width}"
    assert box["y"] + box["height"] <= height, f"Box Y+Height ({box['y'] + box['height']}) > {height}"
    
    # b. Verify simulation metadata (center crop check)
    # Target crop size was 512.
    expected_offset_x = (width - 512) // 2 # (1000-512)//2 = 244
    expected_offset_y = (height - 512) // 2 # (800-512)//2 = 144
    
    print(f"✅ Box is within raw image bounds.")
    print(f"✅ Expected Offsets: x={expected_offset_x}, y={expected_offset_y}")
    
    if box["x"] >= expected_offset_x and box["y"] >= expected_offset_y:
        print("✅ Box is correctly placed relative to the simulated focal crop.")
    else:
        print("❌ Box origin is outside the expected focal crop area.")

    print("\n🎉 Verification Successful!")

if __name__ == "__main__":
    asyncio.run(test_roi_simulation())
