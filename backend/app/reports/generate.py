"""Generate a downloadable PDF report of the ranked targets."""
from __future__ import annotations

import io
from datetime import datetime, timezone

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


def build_pdf(disease_label: str, modality: str, targets: list[dict]) -> bytes:
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, title="MentyTarget Report")
    styles = getSampleStyleSheet()
    story = []

    story.append(Paragraph("MentyTarget — Target Identification Report", styles["Title"]))
    ts = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    story.append(Paragraph(f"Disease: <b>{disease_label}</b>", styles["Normal"]))
    story.append(Paragraph(f"Modality: <b>{modality}</b>", styles["Normal"]))
    story.append(Paragraph(f"Generated: {ts}", styles["Normal"]))
    story.append(Spacer(1, 8 * mm))

    header = ["#", "Target", "Score", "Assoc.", "Tract.", "Rationale"]
    table_data = [header]
    for t in targets:
        table_data.append(
            [
                str(t.get("rank", "")),
                f"{t.get('symbol', '')}",
                f"{t.get('score', 0):.2f}",
                f"{t.get('overall_association', 0):.2f}",
                f"{t.get('tractability', 0):.2f}",
                Paragraph(t.get("explanation", ""), styles["BodyText"]),
            ]
        )

    table = Table(table_data, colWidths=[10 * mm, 28 * mm, 16 * mm, 16 * mm, 16 * mm, 78 * mm])
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1f2937")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTSIZE", (0, 0), (-1, -1), 8),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#d1d5db")),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f3f4f6")]),
            ]
        )
    )
    story.append(table)
    doc.build(story)
    return buf.getvalue()
