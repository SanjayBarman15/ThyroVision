# app/services/reports/pdf_generator.py
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, PageBreak
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_CENTER
from reportlab.lib import colors
from PIL import Image as PILImage, ImageDraw
import io
import datetime
import uuid

class PDFReportGenerator:
    """Service to generate professional AI diagnostic reports in PDF format."""

    @staticmethod
    def draw_bounding_box(raw_bytes: bytes, bbox: dict) -> io.BytesIO:
        """Draws a red bounding box over the ultrasound image."""
        img = PILImage.open(io.BytesIO(raw_bytes)).convert("RGB")
        draw = ImageDraw.Draw(img)

        x, y = bbox["x"], bbox["y"]
        w, h = bbox["width"], bbox["height"]
        
        draw.rectangle([x, y, x + w, y + h], outline="red", width=4)

        buf = io.BytesIO()
        img.save(buf, format="PNG")
        buf.seek(0)
        return buf

    @staticmethod
    def _header_footer(canvas, doc, report_id):
        """Draws the header and footer on each page."""
        canvas.saveState()
        
        # --- Header ---
        canvas.setFont("Helvetica-Bold", 14)
        canvas.drawString(40, 810, "ThyroVision")
        
        canvas.setFont("Helvetica-Oblique", 9)
        canvas.setFillColor(colors.HexColor("#4a5568")) # Darker grey
        canvas.drawString(40, 796, "Radiology Wingman")
        canvas.setFillColor(colors.black)

        canvas.setFont("Helvetica", 9)
        canvas.drawRightString(555, 810, "AI Diagnostic Report")
        canvas.drawRightString(555, 798, f"Report ID: {report_id}")
        canvas.drawRightString(555, 786, f"Data: {datetime.date.today().strftime('%d %b %Y')}")

        canvas.setStrokeColor(colors.grey)
        canvas.setLineWidth(0.5)
        canvas.line(40, 780, 555, 780)

        # --- Footer ---
        canvas.setFont("Helvetica", 7)
        canvas.setFillColor(colors.grey)
        disclaimer = (
            "IMPORTANT: This AI-generated report is intended for clinical decision support only. "
            "Final diagnosis rests with qualified healthcare professionals."
        )
        canvas.drawString(40, 30, disclaimer)
        canvas.drawRightString(555, 30, f"Page {doc.page}")
        
        canvas.restoreState()

    @classmethod
    def generate_pdf(cls, data: dict, raw_image_bytes: bytes) -> bytes:
        """Generates a complete PDF report from prediction data and image bytes."""
        buffer = io.BytesIO()
        report_id = f"THY-{uuid.uuid4().hex[:8].upper()}"

        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=40,
            leftMargin=40,
            topMargin=80,
            bottomMargin=50
        )

        styles = getSampleStyleSheet()
        section_style = ParagraphStyle(
            "section",
            parent=styles["Heading2"],
            fontSize=11,
            fontName="Helvetica-Bold",
            spaceBefore=14,
            spaceAfter=6,
            textColor=colors.HexColor("#1a365d") # Professional dark blue
        )
        
        normal_style = styles["Normal"]
        elements = []

        # --- Data Extraction ---
        patient = data.get("patient", {})
        pred = data.get("prediction", {})
        features = pred.get("features", {})
        bbox = pred.get("bounding_box") or pred.get("bbox")

        # --- Section 1: Patient Information ---
        elements.append(Paragraph("Section 1 – Patient Information", section_style))
        patient_data = [
            ["Patient Name", patient.get("name", "N/A")],
            ["Age / Gender", f"{patient.get('age', 'N/A')} / {patient.get('gender', 'N/A')}"],
            ["Examination Date", datetime.date.today().strftime("%d %b %Y")]
        ]
        pt_table = Table(patient_data, colWidths=[2.5 * inch, 3.5 * inch])
        pt_table.setStyle(TableStyle([
            ('LINEBELOW', (0, 0), (-1, -1), 0.25, colors.grey),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('LEFTPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))
        elements.append(pt_table)

        # --- Section 2: Clinical Summary ---
        elements.append(Paragraph("Section 2 – Clinical Summary", section_style))
        confidence = float(pred.get("confidence", 0)) * 100
        summary_data = [[
            f"TI-RADS Score: {pred.get('tirads', 'N/A')}",
            f"Confidence: {confidence:.1f}%"
        ]]
        summ_table = Table(summary_data, colWidths=[3 * inch, 3 * inch])
        summ_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.whitesmoke),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
            ('TOPPADDING', (0, 0), (-1, -1), 10),
        ]))
        elements.append(summ_table)
        elements.append(Spacer(1, 4))
        elements.append(Paragraph(f"Model ID: {pred.get('model_version', 'v2.1')}", ParagraphStyle("small", fontSize=8, textColor=colors.grey)))

        # --- Section 3: Ultrasound Findings ---
        elements.append(Paragraph("Section 3 – Ultrasound Findings", section_style))
        feature_rows = [["Feature", "Observation"]]
        for k, v in features.items():
            # Clean key names if they are lowercase from DB
            feature_rows.append([k.capitalize(), str(v).capitalize()])
        
        f_table = Table(feature_rows, colWidths=[3 * inch, 3 * inch])
        f_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('BACKGROUND', (0, 0), (-1, 0), colors.whitesmoke),
            ('LINEBELOW', (0, 0), (-1, -1), 0.25, colors.grey),
            ('LEFTPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))
        elements.append(f_table)

        # --- Section 4: AI Interpretation ---
        elements.append(Paragraph("Section 4 – AI Interpretation", section_style))
        explanation = pred.get("ai_explanation") or pred.get("explanation", "No detailed interpretation generated.")
        elements.append(Paragraph(explanation, normal_style))

        # --- Section 5: Imaging ---
        elements.append(Paragraph("Section 5 – Imaging", section_style))
        elements.append(Spacer(1, 10))

        # Prepare images
        img1 = Image(io.BytesIO(raw_image_bytes), width=2.8 * inch, height=2.8 * inch)
        
        if bbox:
            boxed_buf = cls.draw_bounding_box(raw_image_bytes, bbox)
            img2 = Image(boxed_buf, width=2.8 * inch, height=2.8 * inch)
        else:
            img2 = Paragraph("Nodule localization not available.", normal_style)

        img_table = Table(
            [[img1, img2],
             ["Original Ultrasound", "AI-Annotated Scan"]],
            colWidths=[3 * inch, 3 * inch]
        )
        img_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 1), (-1, 1), 'Helvetica-Oblique'),
            ('FONTSIZE', (0, 1), (-1, 1), 8),
            ('TOPPADDING', (0, 0), (-1, 0), 6),
        ]))
        elements.append(img_table)

        # Build with static header/footer wrapper
        def on_page(canvas, doc):
            cls._header_footer(canvas, doc, report_id)

        doc.build(elements, onFirstPage=on_page, onLaterPages=on_page)
        
        buffer.seek(0)
        return buffer.getvalue()
