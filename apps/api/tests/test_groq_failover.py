import json
import time
import unittest
from unittest.mock import patch

import httpx

from app.ai import groq_client
from app.ai.base import AiError
from app.ai.groq_client import BUSY_MESSAGE, GroqAiClient


def _ok(text: str) -> httpx.Response:
    return httpx.Response(200, json={"choices": [{"message": {"content": text}, "finish_reason": "stop"}]})


class GroqFailoverTest(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        groq_client._UNAVAILABLE_MODELS.clear()
        self.calls: list[str] = []

    def client(self, handler, **kwargs) -> GroqAiClient:
        ai = GroqAiClient(api_keys=["key-a"], model="openai/gpt-oss-120b", **kwargs)
        ai._http = httpx.AsyncClient(transport=httpx.MockTransport(handler))
        return ai

    def record(self, request: httpx.Request) -> str:
        model = json.loads(request.content)["model"]
        self.calls.append(model)
        return model

    async def test_rate_limit_moves_to_next_model_without_sleeping(self):
        def handler(request):
            model = self.record(request)
            if model == "openai/gpt-oss-120b":
                return httpx.Response(429, headers={"retry-after": "20"}, json={"error": {"message": "TPM"}})
            return _ok(f"answered by {model}")

        ai = self.client(handler, fallback_models=["openai/gpt-oss-20b", "qwen/qwen3.8-27b"])
        started = time.monotonic()
        text = await ai._chat({"model": ai.model, "messages": []})
        self.assertEqual(text, "answered by openai/gpt-oss-20b")
        self.assertEqual(self.calls, ["openai/gpt-oss-120b", "openai/gpt-oss-20b"])
        self.assertLess(time.monotonic() - started, 1.0)

    async def test_missing_model_is_skipped_and_remembered(self):
        def handler(request):
            model = self.record(request)
            if model == "llama-3.3-70b-versatile":
                return httpx.Response(404, json={"error": {"message": "does not exist"}})
            if model == "openai/gpt-oss-120b":
                return httpx.Response(429, json={"error": {"message": "TPM"}})
            return _ok("fallback ok")

        ai = self.client(handler, fallback_models=["llama-3.3-70b-versatile", "qwen/qwen3.8-27b"])
        self.assertEqual(await ai._chat({"model": ai.model, "messages": []}), "fallback ok")
        self.calls.clear()
        self.assertEqual(await ai._chat({"model": ai.model, "messages": []}), "fallback ok")
        self.assertNotIn("llama-3.3-70b-versatile", self.calls)

    async def test_waits_once_only_for_a_short_retry_after(self):
        attempts = {"n": 0}

        def handler(request):
            self.record(request)
            attempts["n"] += 1
            if attempts["n"] <= 2:
                return httpx.Response(429, headers={"retry-after": "0.05"}, json={"error": {"message": "TPM"}})
            return _ok("after short wait")

        ai = self.client(handler, fallback_models=["qwen/qwen3.8-27b"])
        self.assertEqual(await ai._chat({"model": ai.model, "messages": []}), "after short wait")

    async def test_long_retry_after_fails_fast_with_busy_message(self):
        def handler(request):
            self.record(request)
            return httpx.Response(429, headers={"retry-after": "45"}, json={"error": {"message": "TPM"}})

        ai = self.client(handler, fallback_models=["qwen/qwen3.8-27b"])
        with patch("app.ai.groq_client.asyncio.sleep") as sleep:
            with self.assertRaises(AiError) as caught:
                await ai._chat({"model": ai.model, "messages": []})
        sleep.assert_not_called()
        self.assertEqual(caught.exception.kind, "rate_limit")
        self.assertEqual(str(caught.exception), BUSY_MESSAGE)
        self.assertEqual(self.calls, ["openai/gpt-oss-120b", "qwen/qwen3.8-27b"])

    async def test_research_skips_unavailable_search_model(self):
        def handler(request):
            model = self.record(request)
            if model == "groq/compound":
                return httpx.Response(404, json={"error": {"message": "does not exist"}})
            return _ok("findings")

        ai = self.client(handler, fallback_models=["qwen/qwen3.8-27b"], research_model="groq/compound")
        self.assertIn("findings", await ai.research("system", "topic"))
        self.calls.clear()
        self.assertIn("findings", await ai.research("system", "topic"))
        self.assertEqual(self.calls, ["openai/gpt-oss-120b"])

    async def test_each_model_gets_its_own_reasoning_settings(self):
        bodies = {}

        def handler(request):
            body = json.loads(request.content)
            bodies[body["model"]] = body
            if body["model"] == "openai/gpt-oss-120b":
                return httpx.Response(429, json={"error": {"message": "TPM"}})
            return _ok("ok")

        ai = self.client(handler, fallback_models=["qwen/qwen3.8-27b"])
        await ai._chat({"model": ai.model, "messages": []})
        self.assertEqual(bodies["openai/gpt-oss-120b"]["reasoning_effort"], "low")
        self.assertEqual(bodies["qwen/qwen3.8-27b"]["reasoning_effort"], "none")
        self.assertNotIn("include_reasoning", bodies["qwen/qwen3.8-27b"])


if __name__ == "__main__":
    unittest.main()
