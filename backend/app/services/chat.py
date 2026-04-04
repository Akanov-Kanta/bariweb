import logging
from typing import Any, Dict, List, Optional
import requests

from app.core.config import settings
from app.core.langfuse import langfuse_manager

logger = logging.getLogger(__name__)

QWEN_ENDPOINT = "https://llm.alem.ai/v1/chat/completions"

SYSTEM_PROMPT = """You are Bariweb — an AI accessibility assistant embedded in a website.
You help users navigate the page and answer questions using the provided knowledge base.

You MUST respond with ONLY a valid JSON object, no markdown, no extra text.

If the user wants to navigate, click something, or perform an action, use:
{"text": "Выполняю...", "action": {"type": "click_element", "element_id": "<id from elements list>"}}

If the user just has a question, use:
{"text": "<your answer here>", "action": null}

If you need to redirect to a URL, use:
{"text": "Перехожу...", "action": {"type": "navigate", "url": "<url>"}}

CRITICAL RULES:
- Always respond in the same language the user used.
- Only click elements that exist in the provided elements list.
- If you're unsure what element to click, just answer with text.
- Never fabricate element IDs."""


class ChatService:
    """
    Handles the Bariweb chat pipeline:
    1. Search Milvus for relevant context
    2. Build prompt with live DOM context
    3. Call Qwen3 LLM
    4. Parse and return structured response with Langfuse tracing
    """

    def call_llm(
        self,
        messages: List[Dict[str, str]],
        trace_name: str = "bariweb-chat",
        metadata: Optional[Dict] = None,
    ) -> str:
        """Call Qwen3 via Alem AI and trace with Langfuse."""
        langfuse = langfuse_manager.client
        trace = None

        if langfuse:
            trace = langfuse.trace(
                name=trace_name,
                metadata=metadata or {},
            )

        api_key = settings.QWEN3_API_KEY
        if not api_key:
            logger.error("QWEN3_API_KEY is not configured.")
            return '{"text": "Ошибка: AI не настроен.", "action": null}'

        payload = {
            "model": "qwen3",
            "messages": messages,
            "temperature": 0.3,
        }

        generation = None
        if trace:
            generation = trace.generation(
                name="qwen3-call",
                model="qwen3",
                input=messages,
            )

        try:
            resp = requests.post(
                QWEN_ENDPOINT,
                json=payload,
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                timeout=30,
            )
            resp.raise_for_status()
            content = resp.json()["choices"][0]["message"]["content"]

            if generation:
                generation.end(output=content)

            return content

        except Exception as e:
            logger.error(f"LLM call failed: {e}")
            if generation:
                generation.end(output=None, level="ERROR", status_message=str(e))
            return '{"text": "Извините, произошла ошибка при обработке запроса.", "action": null}'

    def chat(
        self,
        query: str,
        page_text: str,
        elements: List[Dict[str, str]],
        page_url: str = "",
    ) -> Dict[str, Any]:
        """
        Main chat pipeline:
        1. Retrieve from Milvus
        2. Build context prompt
        3. Call LLM
        4. Parse structured response
        """
        from app.services.search import search_service

        # 1. Static retrieval from Milvus (top 3 is enough for FAQ)
        milvus_context = ""
        try:
            results = search_service.search(query=query, top_k=3)
            if results.get("matches"):
                snippets = [
                    m.get("semantic_text") or m.get("retrieval_text", "")
                    for m in results["matches"]
                    if m.get("semantic_text") or m.get("retrieval_text")
                ]
                milvus_context = "\n".join(snippets)
        except Exception as e:
            logger.warning(f"Milvus search skipped: {e}")

        # 2. Build context block
        elements_json = "\n".join(
            f'  {{"id": "{el["id"]}", "label": "{el["label"]}"}}'
            for el in elements[:20]  # cap at 20 to keep prompt size reasonable
        )
        live_dom_summary = (page_text or "")[:1500]  # truncate to avoid huge prompts

        user_message = f"""Knowledge base:
{milvus_context or "(empty)"}

Current page URL: {page_url}
Current page content (excerpt): {live_dom_summary}

Interactive elements on page:
[
{elements_json}
]

User question: {query}"""

        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_message},
        ]

        # 3. Call LLM with Langfuse tracing
        raw = self.call_llm(
            messages=messages,
            trace_name="bariweb-chat",
            metadata={"page_url": page_url, "query": query},
        )

        # 4. Parse response — strip <think> blocks if present (Qwen3 chain-of-thought)
        import re, json
        cleaned = re.sub(r"<think>.*?</think>", "", raw, flags=re.DOTALL).strip()
        # Extract the first JSON object found
        json_match = re.search(r"\{.*\}", cleaned, re.DOTALL)

        if json_match:
            try:
                parsed = json.loads(json_match.group())
                return {
                    "text": parsed.get("text", ""),
                    "action": parsed.get("action", None),
                }
            except json.JSONDecodeError:
                pass

        # Fallback: return raw text
        return {"text": cleaned or "Не удалось обработать ответ.", "action": None}


# Singleton
chat_service = ChatService()
