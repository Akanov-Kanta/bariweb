import logging
from typing import List, Dict, Any
import requests
import json
from app.core.config import settings
from langfuse import get_client

logger = logging.getLogger(__name__)
langfuse = get_client()

QWEN_ENDPOINT = "https://llm.alem.ai/v1/chat/completions"

A11Y_FIX_PROMPT = """You are Bariweb Web Accessibility Enhancer.
Your job is to read snippets of broken HTML, analyze their purpose (from tag, classes, surrounding text, src names), and provide missing accessible names.
Respond ONLY with a JSON array where each object has:
- id: the text from the `data-bw-ai-id` attribute in the input
- attribute: "aria-label" (for buttons/links) OR "alt" (for images)
- value: The concise description/label in Russian.

For icons or buttons, use short actions like "Открыть меню", "Удалить".
For images, describe the image briefly based on its 'src' or clues.
If an image is purely decorative and you cannot guess it, return an empty string for alt.

ONLY RETURN VALID JSON ARRAY. No preamble, no markdown wrap.
"""

A11Y_SIMPLIFY_PROMPT = """You are a Plain Language writing assistant.
Rewrite the provided complex Russian text into simple, easy-to-read language (B1 level).
- Break long sentences.
- Avoid bureaucratic jargon.
- Keep the exact original meaning but make it accessible for people with cognitive disabilities or dyslexia.
Return ONLY the simplified text. No preamble, no markdown formatting.
"""

class A11yAiService:
    def _call_llm(self, messages: List[Dict[str, str]], trace_name: str) -> str:
        api_key = settings.QWEN3_API_KEY
        
        with langfuse.start_as_current_observation(
            as_type="generation",
            name=trace_name,
            model="qwen3",
            input=messages
        ) as generation:
            try:
                resp = requests.post(
                    QWEN_ENDPOINT,
                    json={
                        "model": "qwen3",
                        "messages": messages,
                        "temperature": 0.2,
                    },
                    headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                    timeout=30,
                )
                resp.raise_for_status()
                data = resp.json()
                content = data["choices"][0]["message"]["content"]
                
                usage = data.get("usage", {})
                generation.update(
                    output=content,
                    usage={
                        "input": usage.get("prompt_tokens", 0),
                        "output": usage.get("completion_tokens", 0),
                        "total": usage.get("total_tokens", 0)
                    }
                )
                return content
            except Exception as e:
                logger.error(f"A11y LLM call failed: {e}")
                generation.update(level="ERROR", status_message=str(e))
                raise e

    def fix_markup(self, elements: List[Dict[str, str]]) -> List[Dict[str, str]]:
        if not elements:
            return []
            
        snippets = []
        for el in elements:
            html = el.get("html", "")
            snippets.append(f"<!-- ID: {el.get('id')} -->\n{html}")
            
        user_message = "Fix the following elements:\n\n" + "\n\n".join(snippets)
        
        try:
            raw_content = self._call_llm([
                {"role": "system", "content": A11Y_FIX_PROMPT},
                {"role": "user", "content": user_message}
            ], "a11y-fix-markup")
            
            # Clean JSON
            raw_content = raw_content.replace("```json", "").replace("```", "").strip()
            patches = json.loads(raw_content)
            
            if isinstance(patches, list):
                return patches
            return []
        except Exception:
            return []

    def simplify_text(self, text: str) -> str:
        if not text:
            return ""
            
        try:
            simplified = self._call_llm([
                {"role": "system", "content": A11Y_SIMPLIFY_PROMPT},
                {"role": "user", "content": f"Оригинальный текст:\n{text}"}
            ], "a11y-simplify-text")
            return simplified.strip()
        except Exception:
            return "Произошла ошибка при упрощении текста."

a11y_ai_service = A11yAiService()
