"""Python port of the Masar.ai notebook's "Document Compilation Microservice"
(generate_pdf_report), via bosla-services/src/career-discovery/pdfReport.ts. Uses
ReportLab directly, which is closer to the notebook's own implementation than the
TypeScript port's pdfkit substitution.
"""

from __future__ import annotations

import io
import re
from dataclasses import dataclass

from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import HRFlowable, Paragraph, SimpleDocTemplate, Spacer

COLOR_TITLE = HexColor("#1E3A8A")
COLOR_H1 = HexColor("#1E40AF")
COLOR_BODY = HexColor("#1F2937")


@dataclass
class ChatHistoryEntry:
    role: str  # "user" | "assistant"
    content: str


def _markdown_bold_to_html(text: str) -> str:
    escaped = text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    return re.sub(r"\*\*(.*?)\*\*", r"<b>\1</b>", escaped)


def _render_chat_history(history: list[ChatHistoryEntry]) -> str:
    if not history:
        return ""
    return "\n\n".join(f"{'Student' if h.role == 'user' else 'Mentor'}: {h.content}" for h in history)


def generate_pdf_report(student_name: str | None, assessment_text: str | None, chat_history: list[ChatHistoryEntry]) -> bytes:
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=LETTER, topMargin=40, bottomMargin=40, leftMargin=40, rightMargin=40)

    title_style = ParagraphStyle("Title", fontName="Helvetica-Bold", fontSize=22, textColor=COLOR_TITLE)
    meta_style = ParagraphStyle("Meta", fontName="Helvetica", fontSize=9.5, textColor=COLOR_BODY)
    h1_style = ParagraphStyle("H1", fontName="Helvetica-Bold", fontSize=14, textColor=COLOR_H1, spaceBefore=8, spaceAfter=6)
    body_style = ParagraphStyle("Body", fontName="Helvetica", fontSize=9.5, textColor=COLOR_BODY, leading=13, spaceAfter=6)
    italic_style = ParagraphStyle("Italic", fontName="Helvetica-Oblique", fontSize=9.5, textColor=COLOR_BODY)

    safe_name = (student_name or "").strip() or "Student"
    story = [
        Paragraph("Masar AI — Career &amp; Mentorship Report", title_style),
        Spacer(1, 6),
        Paragraph(f"<b>Candidate:</b> {safe_name}", meta_style),
        Spacer(1, 8),
        HRFlowable(width="100%", thickness=1.5, color=COLOR_TITLE),
        Spacer(1, 12),
        Paragraph("1. Career Assessment &amp; Skill Gap Roadmap", h1_style),
    ]

    if assessment_text and assessment_text.strip():
        for line in assessment_text.split("\n"):
            if line.strip():
                story.append(Paragraph(_markdown_bold_to_html(line), body_style))
            else:
                story.append(Spacer(1, 6))
    else:
        story.append(Paragraph("No assessment data recorded.", italic_style))

    story.append(Spacer(1, 10))
    story.append(Paragraph("2. Interactive Mentorship Q&amp;A Transcript", h1_style))

    chat_text = _render_chat_history(chat_history)
    if chat_text.strip():
        for line in chat_text.split("\n"):
            if line.strip():
                story.append(Paragraph(_markdown_bold_to_html(line), body_style))
            else:
                story.append(Spacer(1, 6))
    else:
        story.append(Paragraph("No Q&amp;A mentorship session was recorded for this report.", italic_style))

    doc.build(story)
    return buf.getvalue()
