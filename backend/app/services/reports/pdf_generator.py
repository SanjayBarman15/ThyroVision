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
        canvas.drawString(40, 810, "ThyroSight")
        
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
            topMargin=60, # Reduced from 80
            bottomMargin=40 # Reduced from 50
        )

        styles = getSampleStyleSheet()
        section_style = ParagraphStyle(
            "section",
            parent=styles["Heading2"],
            fontSize=10.5, # Slightly reduced from 11
            fontName="Helvetica-Bold",
            spaceBefore=10, # Reduced from 14
            spaceAfter=4,  # Reduced from 6
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
        pt_table = Table(patient_data, colWidths=[2 * inch, 4 * inch])
        pt_table.setStyle(TableStyle([
            ('LINEBELOW', (0, 0), (-1, -1), 0.25, colors.grey),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('LEFTPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4), # Reduced from 6
            ('TOPPADDING', (0, 0), (-1, -1), 4),
        ]))
        elements.append(pt_table)

        # --- Section 2: Clinical Summary ---
        elements.append(Paragraph("Section 2 – Clinical Summary", section_style))
        
        tirads_val = pred.get('tirads', 1)
        try:
            tirads_score = int(tirads_val)
        except (ValueError, TypeError):
            tirads_score = 1
            
        confidence = float(pred.get("confidence", 0)) * 100
        
        # Summary Table (Text)
        summary_data = [[
            f"TI-RADS Score: {tirads_score}",
            f"Confidence: {confidence:.1f}%"
        ]]
        summ_table = Table(summary_data, colWidths=[3 * inch, 3 * inch])
        summ_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.whitesmoke),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6), # Reduced from 10
            ('TOPPADDING', (0, 0), (-1, -1), 6),    # Reduced from 10
        ]))
        elements.append(summ_table)
        elements.append(Spacer(1, 4)) # Reduced from 8

        # --- TI-RADS Risk Scale (Color Bar) ---
        risk_colors = [
            colors.HexColor("#7AC27D"), # TR1: Benign (Lighter green)
            colors.HexColor("#C1E1C1"), # TR2: Not Suspicious
            colors.HexColor("#F9E2AF"), # TR3: Mildly Suspicious
            colors.HexColor("#FDAD4E"), # TR4: Moderately Suspicious
            colors.HexColor("#F94144")  # TR5: Highly Suspicious
        ]
        
        indicators = ["", "", "", "", ""]
        if 1 <= tirads_score <= 5:
            indicators[tirads_score - 1] = "▼"
            
        scale_data = [
            indicators,
            ["TR 1", "TR 2", "TR 3", "TR 4", "TR 5"],
            ["Benign", "Not Susp.", "Mildly Susp.", "Mod. Susp.", "Highly Susp."]
        ]
        
        scale_table = Table(scale_data, colWidths=[1.1 * inch] * 5)
        
        scale_styles = [
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTSIZE', (0, 0), (-1, 0), 8), # Reduced arrow size
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 1), (-1, 1), 8), # TR Labels
            ('FONTNAME', (0, 1), (-1, 1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 2), (-1, 2), 6), # Descriptions
            ('BOTTOMPADDING', (0, 0), (-1, -1), 1),
            ('TOPPADDING', (0, 0), (-1, -1), 1),
        ]
        
        for i in range(5):
            scale_styles.append(('BACKGROUND', (i, 1), (i, 1), risk_colors[i]))
            if i >= 3:
               scale_styles.append(('TEXTCOLOR', (i, 1), (i, 1), colors.white))
            
            if i == tirads_score - 1:
                scale_styles.append(('BOX', (i, 1), (i, 1), 1.5, colors.black))
                scale_styles.append(('FONTNAME', (i, 2), (i, 2), 'Helvetica-Bold'))

        scale_table.setStyle(TableStyle(scale_styles))
        elements.append(scale_table)
        
        elements.append(Spacer(1, 2)) # Reduced from 4
        elements.append(Paragraph(f"Model ID: {pred.get('model_version', 'v2.1')}", ParagraphStyle("small", fontSize=7, textColor=colors.grey)))

        # --- Section 3: Ultrasound Findings ---
        elements.append(Paragraph("Section 3 – Ultrasound Findings", section_style))
        feature_rows = [["Feature", "Observation"]]
        for k, v in features.items():
            feature_rows.append([k.capitalize(), str(v).capitalize()])
        
        f_table = Table(feature_rows, colWidths=[2.5 * inch, 3.5 * inch])
        f_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('BACKGROUND', (0, 0), (-1, 0), colors.whitesmoke),
            ('LINEBELOW', (0, 0), (-1, -1), 0.25, colors.grey),
            ('LEFTPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3), # Reduced padding
            ('TOPPADDING', (0, 0), (-1, -1), 3),
        ]))
        elements.append(f_table)

        # --- Section 4: AI Interpretation ---
        elements.append(Paragraph("Section 4 – AI Interpretation", section_style))
        explanation = pred.get("ai_explanation") or pred.get("explanation", "No detailed interpretation generated.")
        
        exp_table = Table([[Paragraph(explanation, normal_style)]], colWidths=[6 * inch])
        exp_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.whitesmoke),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),  # Reduced from 10
            ('RIGHTPADDING', (0, 0), (-1, -1), 8), # Reduced from 10
            ('TOPPADDING', (0, 0), (-1, -1), 6),    # Reduced from 10
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6), # Reduced from 10
        ]))
        elements.append(exp_table)

        # --- Section 5: Imaging ---
        elements.append(Paragraph("Section 5 – Imaging", section_style))

        img_w, img_h = 2.7 * inch, 2.7 * inch # Slightly reduced for a safer single-page fit
        img1 = Image(io.BytesIO(raw_image_bytes), width=img_w, height=img_h)
        
        if bbox:
            boxed_buf = cls.draw_bounding_box(raw_image_bytes, bbox)
            img2 = Image(boxed_buf, width=img_w, height=img_h)
        else:
            img2 = Paragraph("Nodule localization not available.", normal_style)

        # Professional Image Table with Borders
        img_table_data = [
            [img1, img2],
            ["[Original Ultrasound Scan]", "[AI-Annotated Scan]"]
        ]
        
        img_table = Table(img_table_data, colWidths=[3.1 * inch, 3.1 * inch])
        img_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            # Adding box around images to look more "medical monitor" like
            ('BOX', (0, 0), (0, 0), 1, colors.black),
            ('BOX', (1, 0), (1, 0), 1, colors.black),
            ('FONTNAME', (0, 1), (-1, 1), 'Helvetica-Oblique'),
            ('FONTSIZE', (0, 1), (-1, 1), 7.5),
            ('TOPPADDING', (0, 1), (-1, 1), 5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4), # Reduced from 8
        ]))
        elements.append(img_table)

        def on_page(canvas, doc):
            cls._header_footer(canvas, doc, report_id)

        doc.build(elements, onFirstPage=on_page, onLaterPages=on_page)
        
        buffer.seek(0)
        return buffer.getvalue()
