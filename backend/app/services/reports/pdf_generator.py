#app/services/reports/pdf_generator.py
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.cidfonts import UnicodeCIDFont
from reportlab.platypus import PageBreak

from PIL import Image as PILImage, ImageDraw
import io
import uuid
import datetime


pdfmetrics.registerFont(UnicodeCIDFont("HeiseiMin-W3"))


class PDFReportGenerator:

    @staticmethod
    def draw_bounding_box(raw_bytes, bbox):
        img = PILImage.open(io.BytesIO(raw_bytes)).convert("RGB")

        draw = ImageDraw.Draw(img)

        x = bbox["x"]
        y = bbox["y"]
        w = bbox["width"]
        h = bbox["height"]

        draw.rectangle([x, y, x+w, y+h], outline="red", width=4)

        buf = io.BytesIO()
        img.save(buf, format="PNG")
        buf.seek(0)
        return buf


    @staticmethod
    def generate_pdf(data: dict, raw_image_bytes: bytes) -> bytes:

        buffer = io.BytesIO()

        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=40,
            leftMargin=40,
            topMargin=40,
            bottomMargin=30
        )

        styles = getSampleStyleSheet()

        title = ParagraphStyle(
            'centered',
            parent=styles['Heading2'],
            alignment=TA_CENTER
        )

        elements = []

        # ---- HEADER ----
        elements.append(Paragraph("ThyroVision AI Diagnostic Report", title))
        elements.append(Spacer(1, 12))

        # ---- PATIENT INFO ----
        patient = data["patient"]

        table_data = [
            ["Patient Name", patient["name"]],
            ["Age", patient["age"]],
            ["Gender", patient["gender"]],
            ["Date", str(datetime.date.today())],
        ]

        t = Table(table_data, colWidths=[2.2*inch, 3.5*inch])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.whitesmoke),
            ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
        ]))

        elements.append(t)
        elements.append(Spacer(1, 20))

        # ---- PREDICTION ----

        pred = data["prediction"]

        pred_table = [
            ["TI-RADS Score", pred["tirads"]],
            ["Confidence", f"{float(pred['confidence'])*100:.2f}%"],
            ["Model Version", pred["model_version"]]
        ]

        t2 = Table(pred_table, colWidths=[2.2*inch, 3.5*inch])
        t2.setStyle(TableStyle([
            ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
        ]))

        elements.append(Paragraph("Prediction Summary", styles["Heading3"]))
        elements.append(t2)
        elements.append(Spacer(1, 20))

        # ---- AI EXPLANATION ----

        elements.append(Paragraph("AI Explanation", styles["Heading3"]))
        elements.append(Spacer(1, 6))
        elements.append(Paragraph(pred.get("ai_explanation", "Not generated"), styles["Normal"]))

        # ---- PAGE BREAK ----
        elements.append(PageBreak())

        # PAGE 2 - IMAGES

        elements.append(Paragraph("Original Ultrasound Image", styles["Heading3"]))

        img1 = Image(io.BytesIO(raw_image_bytes), width=4*inch, height=4*inch)
        elements.append(img1)

        elements.append(Spacer(1, 20))

        elements.append(Paragraph("Nodule Localization", styles["Heading3"]))

        overlay = PDFReportGenerator.draw_bounding_box(
            raw_image_bytes,
            data["prediction"]["bounding_box"]
        )

        img2 = Image(overlay, width=4*inch, height=4*inch)
        elements.append(img2)

        doc.build(elements)

        buffer.seek(0)
        return buffer.getvalue()
