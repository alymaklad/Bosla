import io
import unittest

from docx import Document
from fastapi import UploadFile
import httpx
from reportlab.pdfgen.canvas import Canvas
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.db import Base
from app.models import User
from app.ai.personal_knowledge import _crawl_github_project, _eligible_github_path
from app.routers.career import _ingest_upload, list_documents


class CertificateUploadTest(unittest.IsolatedAsyncioTestCase):
    async def test_docx_and_pdf_certificates_are_indexed_and_listed(self):
        engine = create_async_engine("sqlite+aiosqlite:///:memory:")
        try:
            async with engine.begin() as connection:
                await connection.run_sync(Base.metadata.create_all)

            session_factory = async_sessionmaker(engine, expire_on_commit=False)
            async with session_factory() as db:
                user = User(id="certificate-test-user", email="certificate-test@example.com", name="Test User")
                db.add(user)
                await db.commit()

                document = Document()
                document.add_paragraph("Certificate of Completion")
                document.add_paragraph("Awarded for completing the data analysis course.")
                file_bytes = io.BytesIO()
                document.save(file_bytes)
                file_bytes.seek(0)

                upload = UploadFile(file=file_bytes, filename="certificate.docx")
                result = await _ingest_upload(file=upload, document_type="certificate", user=user, db=db)
                self.assertTrue(result["ok"])
                self.assertEqual(result["document"]["source_type"], "certificate")
                self.assertGreater(result["document"]["chunk_count"], 0)

                saved = await list_documents(user=user, db=db)
                self.assertEqual(len(saved), 1)
                self.assertEqual(saved[0]["id"], result["document"]["id"])
                self.assertEqual(saved[0]["status"], "ready")

                pdf_bytes = io.BytesIO()
                pdf = Canvas(pdf_bytes)
                pdf.drawString(72, 720, "Certificate of Completion")
                pdf.save()
                pdf_bytes.seek(0)
                pdf_upload = UploadFile(file=pdf_bytes, filename="certificate.pdf")
                pdf_result = await _ingest_upload(file=pdf_upload, document_type="certificate", user=user, db=db, original_filename="HCIA-AI V3.5 Course.pdf")
                self.assertTrue(pdf_result["ok"])
                self.assertGreater(pdf_result["document"]["chunk_count"], 0)
                self.assertEqual(pdf_result["document"]["filename"], "HCIA-AI V3.5 Course.pdf")
                self.assertEqual(len(await list_documents(user=user, db=db)), 2)

                md_upload = UploadFile(file=io.BytesIO(b"# My project\nDocumented results and lessons."), filename="project.md")
                md_result = await _ingest_upload(file=md_upload, document_type="project", user=user, db=db)
                self.assertTrue(md_result["ok"])
                self.assertEqual(md_result["document"]["mime_type"], "text/markdown")
                self.assertEqual(len(await list_documents(user=user, db=db)), 3)
        finally:
            await engine.dispose()

    async def test_github_import_reads_only_document_formats(self):
        self.assertFalse(_eligible_github_path("src/model.py"))
        self.assertFalse(_eligible_github_path("README"))
        for path in ("README.md", "docs/guide.pdf", "docs/letter.docx", "notes.txt"):
            self.assertTrue(_eligible_github_path(path))

        doc = Document()
        doc.add_paragraph("A documented recommendation letter.")
        docx_bytes = io.BytesIO()
        doc.save(docx_bytes)
        pdf_bytes = io.BytesIO()
        pdf = Canvas(pdf_bytes)
        pdf.drawString(72, 720, "A documented project course.")
        pdf.save()
        content = {
            "README.md": b"# Project\nThis is the project overview.",
            "docs/guide.pdf": pdf_bytes.getvalue(),
            "docs/letter.docx": docx_bytes.getvalue(),
            "notes.txt": b"Daily project notes.",
            "src/model.py": b"print('not a document')",
        }
        requested: list[str] = []

        def respond(request: httpx.Request) -> httpx.Response:
            if "/git/trees/" in str(request.url):
                return httpx.Response(200, json={"tree": [
                    {"type": "blob", "path": path, "size": len(data)}
                    for path, data in content.items()
                ]})
            path = str(request.url).split("/main/", 1)[-1]
            requested.append(path)
            return httpx.Response(200, content=content[path])

        async with httpx.AsyncClient(transport=httpx.MockTransport(respond)) as client:
            files, _ = await _crawl_github_project(
                client,
                owner="example",
                repository={"name": "project", "default_branch": "main"},
                headers={"User-Agent": "Bosla-test"},
                remaining_files=10,
                remaining_chars=100_000,
            )
        self.assertEqual(set(requested), set(content) - {"src/model.py"})
        self.assertEqual(len(files), 4)
        self.assertTrue(all(file.text for file in files))


if __name__ == "__main__":
    unittest.main()
