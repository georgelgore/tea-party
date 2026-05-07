import csv
import os
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
CSV_PATH = os.path.join(SCRIPT_DIR, "..", "inventory", "teas.csv")
OUTPUT_DIR = os.path.join(SCRIPT_DIR, "output")
OUTPUT_PATH = os.path.join(OUTPUT_DIR, "doug_and_georges_tea_menu.pdf")

SECTION_ORDER = [
    ("White", "White"),
    ("Green", "Green"),
    ("Yellow", "Yellow"),
    ("Oolong", "Oolong"),
    ("Black", "Black"),
    ("Ripe Puerh", "Ripe Pu-erh (shou)"),
    ("Raw Puerh", "Raw Pu-erh (sheng)"),
]


def load_teas():
    teas_by_category = {key: [] for key, _ in SECTION_ORDER}
    with open(CSV_PATH, newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            cat = row["category"].strip()
            if cat in teas_by_category:
                teas_by_category[cat].append(row)
    return teas_by_category


def build_pdf():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    teas_by_category = load_teas()

    doc = SimpleDocTemplate(
        OUTPUT_PATH,
        pagesize=A4,
        leftMargin=20 * mm,
        rightMargin=20 * mm,
        topMargin=20 * mm,
        bottomMargin=20 * mm,
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "MenuTitle",
        parent=styles["Title"],
        fontSize=28,
        leading=34,
        textColor=colors.black,
        spaceAfter=4 * mm,
    )
    subtitle_style = ParagraphStyle(
        "MenuSubtitle",
        parent=styles["Normal"],
        fontSize=10,
        leading=14,
        textColor=colors.black,
        spaceAfter=6 * mm,
        alignment=1,  # centre
    )
    section_style = ParagraphStyle(
        "SectionHeading",
        parent=styles["Heading2"],
        fontSize=13,
        leading=16,
        textColor=colors.black,
        spaceBefore=6 * mm,
        spaceAfter=2 * mm,
    )
    tea_name_style = ParagraphStyle(
        "TeaName",
        parent=styles["Normal"],
        fontSize=9,
        leading=13,
        textColor=colors.black,
    )
    meta_style = ParagraphStyle(
        "TeaMeta",
        parent=styles["Normal"],
        fontSize=8,
        leading=12,
        textColor=colors.black,
    )

    story = []

    story.append(Paragraph("Doug &amp; George's Tea Shop", title_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.black, spaceAfter=4 * mm))
    story.append(Paragraph("A curated collection of quality teas", subtitle_style))

    for csv_key, display_name in SECTION_ORDER:
        teas = teas_by_category.get(csv_key, [])
        if not teas:
            continue

        story.append(Paragraph(display_name, section_style))
        story.append(HRFlowable(width="100%", thickness=0.5, color=colors.black, spaceAfter=1 * mm))

        table_data = []
        for tea in teas:
            name = tea["name"].strip()
            vendor = tea["vendor"].strip()
            subcategory = tea["subcategory"].strip()
            year = tea["year"].strip()

            meta_parts = []
            if vendor:
                meta_parts.append(vendor)
            if subcategory:
                meta_parts.append(subcategory)
            if year:
                meta_parts.append(year)
            meta_text = " · ".join(meta_parts) if meta_parts else ""

            name_para = Paragraph(name, tea_name_style)
            meta_para = Paragraph(meta_text, meta_style) if meta_text else Paragraph("", meta_style)
            table_data.append([name_para, meta_para])

        page_width = A4[0] - 40 * mm
        col_widths = [page_width * 0.62, page_width * 0.38]

        table = Table(table_data, colWidths=col_widths, hAlign="LEFT")
        table.setStyle(TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("TOPPADDING", (0, 0), (-1, -1), 2),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
            ("LEFTPADDING", (0, 0), (-1, -1), 0),
            ("RIGHTPADDING", (0, 0), (-1, -1), 4),
            ("LINEBELOW", (0, 0), (-1, -2), 0.25, colors.black),
        ]))
        story.append(table)
        story.append(Spacer(1, 3 * mm))

    doc.build(story)
    print(f"PDF written to: {OUTPUT_PATH}")


if __name__ == "__main__":
    build_pdf()
