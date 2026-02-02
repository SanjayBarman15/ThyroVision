import sys
import os
import io

# Add the project root to path
import os
import sys
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../"))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from backend.app.services.reports.pdf_generator import PDFReportGenerator
from PIL import Image, ImageDraw

def generate_test_image():
    img = Image.new("L", (512, 512), color=20)
    draw = ImageDraw.Draw(img)
    draw.ellipse((100, 100, 400, 350), outline=180, width=5)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()

def test_generation():
    raw_img = generate_test_image()
    
    data = {
        "patient": {
            "name": "Verification Test",
            "age": 32,
            "gender": "Male"
        },
        "prediction": {
            "tirads": 2,
            "confidence": 0.985,
            "model_version": "verify-v1",
            "features": {
                "composition": "cystic",
                "echogenicity": "anechoic",
                "margins": "smooth",
                "calcifications": "none",
                "shape": "wider-than-tall"
            },
            "ai_explanation": "This is a verification test for the refactored PDF generator. All sections should be visible.",
            "bounding_box": {"x": 100, "y": 100, "width": 300, "height": 250}
        }
    }

    try:
        pdf_bytes = PDFReportGenerator.generate_pdf(data, raw_img)
        output_path = os.path.join(os.path.dirname(__file__), "verification_report.pdf")
        with open(output_path, "wb") as f:
            f.write(pdf_bytes)
        print(f"Success! PDF generated at: {output_path}")
    except Exception as e:
        print(f"Failed to generate PDF: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_generation()
