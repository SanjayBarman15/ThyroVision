from PIL import Image, ImageDraw
import io

def draw_bounding_box_on_image(image_bytes: bytes, bbox: dict) -> bytes:
    """
    Draws a bounding box on the image bytes.
    bbox format: {"xmin": int, "ymin": int, "xmax": int, "ymax": int} or xywh
    """
    try:
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        draw = ImageDraw.Draw(img)
        
        # Check if we have voc format (xmin, ymin, xmax, ymax)
        if all(k in bbox for k in ["xmin", "ymin", "xmax", "ymax"]):
            coords = [bbox["xmin"], bbox["ymin"], bbox["xmax"], bbox["ymax"]]
        # Or xywh format
        elif all(k in bbox for k in ["x", "y", "width", "height"]):
            coords = [bbox["x"], bbox["y"], bbox["x"] + bbox["width"], bbox["y"] + bbox["height"]]
        else:
            return image_bytes # Return original if bbox format is unknown

        # Draw red rectangle with 3px width
        draw.rectangle(coords, outline="red", width=3)
        
        # Save back to bytes
        img_out = io.BytesIO()
        img.save(img_out, format="JPEG")
        return img_out.getvalue()
    except Exception as e:
        print(f"Error drawing bounding box: {e}")
        return image_bytes
