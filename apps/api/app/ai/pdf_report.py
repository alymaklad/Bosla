"""Career & Mentorship Report PDF (port of the Masar.ai notebook's generate_pdf_report).

The assessment and mentor replies are model-written Markdown (headings, pipe tables,
bullets, `<br>` inside table cells, emphasis), so they are rendered into ReportLab
flowables rather than dumped line by line.
"""

from __future__ import annotations

import io
import re
import unicodedata
from dataclasses import dataclass
from datetime import date

from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import HRFlowable, KeepTogether, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

COLOR_TITLE = HexColor("#1E3A8A")
COLOR_H1 = HexColor("#1E40AF")
COLOR_BODY = HexColor("#1F2937")
COLOR_MUTED = HexColor("#6B7280")
COLOR_LINE = HexColor("#E6E7EA")
COLOR_HEAD_BG = HexColor("#EEF2FF")

MARGIN = 48
CONTENT_WIDTH = LETTER[0] - 2 * MARGIN

# Helvetica only covers WinAnsi (cp1252); anything else renders as a black box.
_CHAR_MAP = {
    "‐": "-", "‑": "-", "‒": "-", "−": "-", "⁃": "-",
    " ": " ", " ": " ", " ": " ", " ": " ", " ": " ",
    "​": "", "‌": "", "‍": "", "﻿": "", "️": "",
    "→": "->", "←": "<-", "⇒": "=>", "≤": "<=", "≥": ">=",
    "≈": "~", "×": "x", "✓": "", "✔": "", "✅": "", "●": "•",
    "▪": "•", "◦": "•", "‣": "•",
}


def _clean(text: str) -> str:
    text = unicodedata.normalize("NFKC", text)
    text = "".join(_CHAR_MAP.get(ch, ch) for ch in text)
    out = []
    for ch in text:
        try:
            ch.encode("cp1252")
            out.append(ch)
        except UnicodeEncodeError:
            continue  # emoji and other glyphs Helvetica can't draw
    return "".join(out)


def _inline(text: str) -> str:
    """Markdown inline syntax -> ReportLab paragraph markup."""
    parts = re.split(r"<br\s*/?>", _clean(text), flags=re.I)
    rendered = []
    for part in parts:
        s = part.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
        s = re.sub(r"\[([^\]]+)\]\((https?://[^)\s]+)\)", r'<link href="\2" color="#1E40AF">\1</link>', s)
        s = re.sub(r"`([^`]+)`", r'<font name="Courier">\1</font>', s)
        s = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", s)
        s = re.sub(r"__(.+?)__", r"<b>\1</b>", s)
        s = re.sub(r"(?<![\w*])\*(?!\s)(.+?)(?<!\s)\*(?![\w*])", r"<i>\1</i>", s)
        s = re.sub(r"(?<![\w_])_(?!\s)(.+?)(?<!\s)_(?![\w_])", r"<i>\1</i>", s)
        rendered.append(s.strip())
    return "<br/>".join(rendered)


class _Styles:
    def __init__(self) -> None:
        base = dict(fontName="Helvetica", fontSize=9.5, textColor=COLOR_BODY, leading=13.5)
        self.title = ParagraphStyle("Title", fontName="Helvetica-Bold", fontSize=22, leading=27, textColor=COLOR_TITLE)
        self.meta = ParagraphStyle("Meta", fontName="Helvetica", fontSize=9.5, leading=13, textColor=COLOR_MUTED)
        self.section = ParagraphStyle("Section", fontName="Helvetica-Bold", fontSize=15, leading=19, textColor=COLOR_H1, spaceBefore=6, spaceAfter=8)
        self.h = [
            ParagraphStyle("H2", fontName="Helvetica-Bold", fontSize=12.5, leading=16, textColor=COLOR_TITLE, spaceBefore=10, spaceAfter=5),
            ParagraphStyle("H3", fontName="Helvetica-Bold", fontSize=11, leading=14, textColor=COLOR_TITLE, spaceBefore=8, spaceAfter=4),
            ParagraphStyle("H4", fontName="Helvetica-Bold", fontSize=10, leading=13, textColor=COLOR_BODY, spaceBefore=6, spaceAfter=3),
        ]
        self.body = ParagraphStyle("Body", spaceAfter=6, **base)
        self.bullet = ParagraphStyle("Bullet", spaceAfter=3, leftIndent=14, bulletIndent=3, **base)
        self.quote = ParagraphStyle("Quote", spaceAfter=6, leftIndent=12, fontName="Helvetica-Oblique", fontSize=9.5, leading=13.5, textColor=COLOR_MUTED)
        self.cell = ParagraphStyle("Cell", fontName="Helvetica", fontSize=8.5, leading=11.5, textColor=COLOR_BODY)
        self.cell_head = ParagraphStyle("CellHead", fontName="Helvetica-Bold", fontSize=8.5, leading=11.5, textColor=COLOR_TITLE)
        self.italic = ParagraphStyle("Italic", fontName="Helvetica-Oblique", fontSize=9.5, leading=13, textColor=COLOR_MUTED)
        self.speaker = ParagraphStyle("Speaker", fontName="Helvetica-Bold", fontSize=9, leading=12, textColor=COLOR_H1, spaceBefore=6, spaceAfter=2)


_TABLE_ROW = re.compile(r"^\s*\|.*\|\s*$")
_TABLE_SEP = re.compile(r"^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$")
_HEADING = re.compile(r"^\s{0,3}(#{1,6})\s+(.*?)\s*#*\s*$")
_RULE = re.compile(r"^\s{0,3}([-*_])(\s*\1){2,}\s*$")
_BULLET = re.compile(r"^(\s*)[-*+•]\s+(.*)$")
_NUMBERED = re.compile(r"^(\s*)(\d+)[.)]\s+(.*)$")


def _split_row(line: str) -> list[str]:
    line = line.strip()
    if line.startswith("|"):
        line = line[1:]
    if line.endswith("|"):
        line = line[:-1]
    return [c.strip() for c in re.split(r"(?<!\\)\|", line)]


def _table(rows: list[list[str]], st: _Styles) -> Table:
    ncols = max(len(r) for r in rows)
    rows = [r + [""] * (ncols - len(r)) for r in rows]
    weights = [max(6, min(60, max(len(r[i]) for r in rows))) for i in range(ncols)]
    total = sum(weights)
    widths = [CONTENT_WIDTH * w / total for w in weights]
    data = [
        [Paragraph(_inline(cell), st.cell_head if ri == 0 else st.cell) for cell in row]
        for ri, row in enumerate(rows)
    ]
    table = Table(data, colWidths=widths, repeatRows=1, hAlign="LEFT")
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), COLOR_HEAD_BG),
        ("GRID", (0, 0), (-1, -1), 0.5, COLOR_LINE),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    return table


def _markdown_flowables(text: str, st: _Styles) -> list:
    lines = text.replace("\r\n", "\n").split("\n")
    out: list = []
    para: list[str] = []

    def flush() -> None:
        if para:
            out.append(Paragraph(_inline(" ".join(para)), st.body))
            para.clear()

    i = 0
    while i < len(lines):
        line = lines[i]
        stripped = line.strip()

        if not stripped:
            flush()
            i += 1
            continue

        if _TABLE_ROW.match(line):
            flush()
            rows: list[list[str]] = []
            while i < len(lines) and _TABLE_ROW.match(lines[i]):
                if not _TABLE_SEP.match(lines[i]):
                    rows.append(_split_row(lines[i]))
                i += 1
            if rows:
                out.append(_table(rows, st))
                out.append(Spacer(1, 8))
            continue

        if m := _HEADING.match(line):
            flush()
            level = min(len(m.group(1)), 3) - 1
            heading = _inline(m.group(2))
            if heading:
                out.append(Paragraph(heading, st.h[level]))
            i += 1
            continue

        if _RULE.match(line):
            flush()
            out.append(Spacer(1, 4))
            out.append(HRFlowable(width="100%", thickness=0.6, color=COLOR_LINE))
            out.append(Spacer(1, 4))
            i += 1
            continue

        if m := _BULLET.match(line):
            flush()
            depth = len(m.group(1).expandtabs(4)) // 2
            style = ParagraphStyle(f"Bullet{depth}", parent=st.bullet, leftIndent=14 + 12 * depth, bulletIndent=3 + 12 * depth)
            out.append(Paragraph(_inline(m.group(2)), style, bulletText="•"))
            i += 1
            continue

        if m := _NUMBERED.match(line):
            flush()
            depth = len(m.group(1).expandtabs(4)) // 2
            style = ParagraphStyle(f"Num{depth}", parent=st.bullet, leftIndent=18 + 12 * depth, bulletIndent=3 + 12 * depth)
            out.append(Paragraph(_inline(m.group(3)), style, bulletText=f"{m.group(2)}."))
            i += 1
            continue

        if stripped.startswith(">"):
            flush()
            out.append(Paragraph(_inline(stripped.lstrip("> ")), st.quote))
            i += 1
            continue

        para.append(stripped)
        i += 1

    flush()
    return out


@dataclass
class ChatHistoryEntry:
    role: str  # "user" | "assistant"
    content: str


def generate_pdf_report(student_name: str | None, assessment_text: str | None, chat_history: list[ChatHistoryEntry]) -> bytes:
    buf = io.BytesIO()
    safe_name = _clean((student_name or "").strip()) or "Student"
    doc = SimpleDocTemplate(
        buf, pagesize=LETTER, topMargin=MARGIN, bottomMargin=MARGIN, leftMargin=MARGIN, rightMargin=MARGIN,
        title="Bosla Career & Mentorship Report", author="Bosla",
    )
    st = _Styles()

    story: list = [
        Paragraph("Bosla — Career &amp; Mentorship Report", st.title),
        Spacer(1, 4),
        Paragraph(f"<b>Candidate:</b> {_inline(safe_name)} &nbsp;&nbsp;•&nbsp;&nbsp; {date.today():%B %d, %Y}", st.meta),
        Spacer(1, 10),
        HRFlowable(width="100%", thickness=1.5, color=COLOR_TITLE),
        Spacer(1, 14),
        Paragraph("1. Career Assessment &amp; Skill Gap Roadmap", st.section),
    ]

    if assessment_text and assessment_text.strip():
        story.extend(_markdown_flowables(assessment_text, st))
    else:
        story.append(Paragraph("No assessment data recorded.", st.italic))

    story.append(Spacer(1, 14))
    story.append(Paragraph("2. Mentorship Q&amp;A Transcript", st.section))

    turns = [h for h in chat_history if h.content and h.content.strip()]
    if turns:
        for h in turns:
            speaker = Paragraph("You" if h.role == "user" else "Bosla Mentor", st.speaker)
            body = _markdown_flowables(h.content, st)
            story.append(KeepTogether([speaker, *body[:1]]))
            story.extend(body[1:])
    else:
        story.append(Paragraph("No mentorship Q&amp;A was recorded for this report.", st.italic))

    doc.build(story)
    return buf.getvalue()
