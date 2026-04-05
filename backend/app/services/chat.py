import logging
from typing import Any, Dict, List, Optional
import requests
import re
import json
from urllib.parse import urlparse
from app.core.config import settings
from app.core.langfuse import langfuse_manager
from langfuse import get_client, propagate_attributes

logger = logging.getLogger(__name__)
langfuse = get_client()

QWEN_ENDPOINT = "https://llm.alem.ai/v1/chat/completions"

SYSTEM_PROMPT = """You are Bariweb — an autonomous AI agent embedded in a website.
You DO things for the user. You navigate pages, click buttons, read content, and find answers — step by step.

## CORE PRINCIPLE
NEVER tell the user "go to page X" or "click button Y yourself". YOU must do it.
If the answer isn't on the current page, navigate there. If you need to click something to reveal info, click it.
You are a hands-on agent, not a helpdesk chatbot.

## RESPONSE FORMAT
You MUST respond with ONLY a valid JSON object. No markdown blocks, no preamble, no "Here is your response", no extra text outside the JSON.
Failure to follow this format will break the system.

### Action types:

1. Click an element on the current page:
{"text": "Нажимаю кнопку.", "action": {"type": "click_element", "element_id": "<id>"}}

2. Navigate to a URL:
{"text": "Меняю страницу.", "action": {"type": "navigate", "url": "/profile"}}

3. Continue:
{"text": "Анализирую DOM.", "action": {"type": "continue"}}

4. Answer with text (ONLY when you have the final answer):
{"text": "Короткий ответ из DOM.", "action": null}

5. Fill text into a form input/textarea:
{"text": "Ввожу текст.", "action": {"type": "input_text", "element_id": "<id>", "value": "текст для ввода"}}

## ⚠️ EXTREME BREVITY RULE
The "text" field MUST be incredibly short. NEVER exceed 1 short sentence. NEVER explain your thoughts. If you write long texts, the system will timeout and crash.

## INTERACTIVE ELEMENTS FORMAT
The "Compressed Elements" list uses this exact 7-field pipe-separated format:
  [tag|type|id|name|placeholder|value|label]

Field meanings:
  - tag:         HTML tag name (input, button, a, select, textarea)
  - type:        input type attribute (email, password, text, submit, button, checkbox, etc.)
                 For <button> tags this is "button". For <a> tags this is "a".
  - id:          The element's DOM id — USE THIS as element_id in actions
  - name:        The form field's `name` attribute (e.g. "email", "password", "username")
  - placeholder: The hint text shown inside the field (e.g. "name@company.com", "••••••••")
  - value:       The CURRENT value already typed in the field (empty string if nothing typed yet)
  - label:       The human-readable label or button text

### HOW TO READ ELEMENTS — EXAMPLES:
  [input|email|email|email|name@company.com||Corporate Email]
    → Email input field, id="email", currently empty, use input_text to fill it

  [input|password|password|password|••••••••||Password]
    → Password field, id="password", currently empty, ONLY put the password here

  [button|button|bw-abc123|||| |Sign In to Dashboard]
    → Submit button, id="bw-abc123", click this to submit the form

  [a|a|bw-def456||| |Forgot?]
    → Link for password reset

## ⚠️ STRICT FORM-FILLING RULES — MUST FOLLOW OR SYSTEM BREAKS

### RULE 1: Use `type` to identify fields — NEVER use position or order
  - Email/login field: type=email OR (type=text AND placeholder/name contains "email"/"логин"/"user")
  - Password field: type=password — THIS IS THE ONLY RELIABLE SIGNAL. NEVER put a password into any other type.
  - Submit button: tag=button OR type=submit — NEVER click a field with tag=input to "submit" a form.

### RULE 2: Fill fields one at a time in separate steps
  - Step 1: input_text into the EMAIL field (check type=email or name="email")
  - Step 2: "continue" to verify DOM updated
  - Step 3: input_text into the PASSWORD field (check type=password, id matches the password field, NOT the email field)
  - Step 4: "continue" to verify DOM updated
  - Step 5: click_element on the BUTTON (tag=button, NOT tag=input)

### RULE 3: Before every action, verify the element_id matches the correct field
  - For input_text with a password: confirm the target element has type=password
  - For input_text with an email: confirm the target element has type=email or name="email"
  - For click_element to submit: confirm the target element has tag=button (NOT tag=input)

### RULE 4: After each input_text, use "continue" — NEVER immediately submit
  After filling ANY field, always use continue to let React/SPA process the input event before moving to the next step.

## SITE STRUCTURE KNOWLEDGE (Petrogram App)
The current app is "Petrogram" — a city complaint/community platform. Navigation is done via bottom tabs:
- **Карта** tab → Shows a city map. This is WHERE to submit complaints!
  - For EXTREME EMERGENCIES ONLY: Click the RED "SOS" button.
  - For REGULAR complaints (Trash, Potholes, etc): DO NOT click SOS! Click the specific + button or colored category markers like "Экология" (for trash), "Инфраструктура", etc., to open the correct form.
- **Рейтинг** tab → User scoring/leaderboards. Not related to filing complaints.  
- **Комьюнити** tab → Community discussions/posts feed. This is NOT for official complaints. DO NOT submit complaints here.
- **Профиль** tab → User profile, personal info, and history of submitted complaints.

**To submit a regular complaint (жалоба) like Trash:**
1. Click the "Карта" tab (bottom nav) → wait for DOM
2. Look for the correct category marker/button (e.g., "Экология") or a general "+" add button. DO NOT click SOS.
3. A form should appear — fill in the description → submit

## STEP-BY-STEP AGENT RULES
- You receive the current page DOM, URL, interactive elements, KB context, and conversation history.
- Look at the conversation history. DO NOT repeat the exact same action if it didn't work previously.
- If you find yourself stuck in a loop (e.g., clicking between tabs without finding the right form), STOP and answer with text explaining that you cannot find the requested functionality.
- If a previous message says "Страница загрузилась" — the user didn't type that, the system auto-sent it after a navigation YOU triggered. Continue the task from history.
- **SPA TAB NAVIGATION:** This app uses a tab-based dashboard WITHOUT URL routes. Clicking tabs (Карта, Рейтинг, Комьюнити, Профиль) does NOT change the URL. To switch tabs, use click_element on the tab button, then ALWAYS follow with {"type": "continue"} to re-read the updated DOM. NEVER use navigate("/map") — it won't work.
- If you click a link (type=click_element on an <a> tag), the page will reload and you'll be called again automatically with the new DOM. Just do the click.
- If you click a button that causes an SPA state change (not a full page reload), use "continue" to signal you need re-invocation with fresh DOM.
- After an input_text action, ALWAYS follow up with "continue" to verify data was entered, NEVER immediately give a final answer.
- MAXIMUM 8 steps per task to avoid infinite loops.
- FILE UPLOADS ARE IMPOSSIBLE: You do not have access to the user's OS file system. You CANNOT upload photos or attach files. If a user asks you to "attach a photo", or you see a button that opens a native file picker, DO NOT click it. Instead, reply with text stating you cannot upload files.

- **VERIFICATION RULE:** NEVER assume an action succeeded just because you see your input text on the screen! Feeds or old posts might contain similar text. A success is ONLY when a clear notification like "Успешно отправлено" appears, OR you navigated to a dedicated success screen. If you just see the text in a list of posts, but no success notification appeared, DO NOT assume it was your post!
- **AUTH WALL RULE:** If you are trying to perform a user action (like submit a complaint) and you hit a Login/Registration form, or see a Login modal overlay, DO NOT guess passwords. IMMEDIATELY STOP and tell the user: "Пожалуйста, авторизуйтесь для выполнения этого действия".
- **STRICT FORM RULE (NO GUESSING):** If you are asked to submit a form, complaint, or report, DO NOT type it into chat boxes, community feeds, or comments! A comment is NOT a form. If you do not see a dedicated button like "SOS", "Отправить жалобу", or a real form on the current page, navigate to the correct page or STOP and ask the user.
- Always respond in the same language the user used.
- EXACT ID MATCHING: When using click_element or input_text, the element_id MUST EXACTLY MATCH the id field (3rd pipe-separated field) from the Elements list. Double-check the tag and type fields BEFORE choosing an element_id.
- Read the DOM text carefully before deciding to navigate — the answer might already be there.
- If you truly cannot find the information or are stuck, return {"text": "Извините, не смог найти нужный раздел...", "action": null}."""


def _format_elements_table(elements: str) -> str:
    """
    Parses the compressed elements string [tag|type|id|name|placeholder|value|label]
    into a human-readable numbered list optimized for LLM consumption.

    Marks form inputs with type-specific emoji so the LLM cannot confuse
    an email field with a password field or a button.
    """
    if not elements:
        return "(no interactive elements found)"

    import re
    items = re.findall(r'\[([^\]]+)\]', elements)
    if not items:
        return elements  # fallback: return raw if parsing fails

    TYPE_EMOJI = {
        'email':    '📧 EMAIL INPUT',
        'password': '🔒 PASSWORD INPUT',
        'text':     '✏️ TEXT INPUT',
        'textarea': '📝 TEXTAREA',
        'submit':   '🚀 SUBMIT BUTTON',
        'button':   '🔘 BUTTON',
        'a':        '🔗 LINK',
        'select':   '📋 SELECT',
        'checkbox': '☑️ CHECKBOX',
        'radio':    '🔵 RADIO',
    }

    lines = []
    for i, item in enumerate(items, 1):
        parts = item.split('|')
        # Pad to 7 fields in case some are empty
        while len(parts) < 7:
            parts.append('')
        tag, typ, eid, name, placeholder, value, label = parts[:7]

        kind = TYPE_EMOJI.get(typ.lower(), f'[{tag}:{typ}]')
        value_hint = f' (current value: "{value}")' if value else ''
        placeholder_hint = f' placeholder="{placeholder}"' if placeholder else ''
        name_hint = f' name="{name}"' if name else ''

        lines.append(
            f'{i}. {kind} | id="{eid}"{name_hint}{placeholder_hint}{value_hint} | label="{label}"'
        )

    return '\n'.join(lines)


class ChatService:

    def call_llm(self, messages: List[Dict[str, str]]) -> str:
        """Внутренний метод вызова LLM (уже внутри контекста Langfuse)"""
        api_key = settings.QWEN3_API_KEY
        
        # Создаем вложенную генерацию
        with langfuse.start_as_current_observation(
            as_type="generation",
            name="qwen3-call",
            model="qwen3",
            input=messages
        ) as generation:
            try:
                resp = requests.post(
                    QWEN_ENDPOINT,
                    json={
                        "model": "qwen3",
                        "messages": messages,
                        "temperature": 0.3,
                        # No max_tokens — truncating JSON mid-way breaks parsing
                    },
                    headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                    timeout=45,
                )
                resp.raise_for_status()
                data = resp.json()
                
                content = data["choices"][0]["message"]["content"]
                usage = data.get("usage", {})

                # Обновляем генерацию: пишем ответ и реальный Usage для расчета Costs
                generation.update(
                    output=content,
                    usage={
                        "input": usage.get("prompt_tokens", 0),
                        "output": usage.get("completion_tokens", 0),
                        "total": usage.get("total_tokens", 0)
                    },
                    cost_details={
                        "input": 1,
                        "output": 1,
                        "total": 1
                    }
                )
                return content

            except requests.exceptions.Timeout:
                logger.error("LLM call timed out after 45s")
                generation.update(level="ERROR", status_message="timeout")
                return '{"text": "Произошла ошибка: сервер отвечает слишком долго. Попробуйте разбить задачу на более мелкие шаги.", "action": null}'
            except Exception as e:
                logger.error(f"LLM call failed: {e}")
                generation.update(level="ERROR", status_message=str(e))
                return '{"text": "Произошла ошибка. Попробуйте ещё раз.", "action": null}'

    def chat(
        self,
        client_id: str,
        query: str,
        history: List[Dict[str, str]],
        page_text: str,
        elements: str,  # Rich compressed string [tag|type|id|name|placeholder|value|label]
        page_url: str = "",
        screen_label: str | None = None,
        screen_fingerprint: str | None = None,
    ) -> Dict[str, Any]:
        """Основной пайплайн через Context Manager"""
        
        # 1. Создаем корневой Trace/Span
        with langfuse.start_as_current_observation(
            name="bariweb-chat-pipeline",
            input={"query": query, "url": page_url}
        ) as root_span:
            
            # 2. Прокидываем атрибуты (client_id -> session & user) на все вложенные вызовы
            with propagate_attributes(user_id=client_id, session_id=client_id):
                
                from app.services.search import search_service

                # Retrieval (Milvus) - filter by current domain
                domain_to_filter = urlparse(page_url).netloc if page_url else None
                milvus_context = ""
                try:
                    search_filters = {}
                    if domain_to_filter:
                        search_filters["domain"] = domain_to_filter
                        
                    results = search_service.search(query=query, top_k=3, filters=search_filters)
                    if results.get("matches"):
                        snippets = [m.get("semantic_text", "") or m.get("retrieval_text", "") for m in results["matches"]]
                        milvus_context = "\n".join(snippets)
                except Exception as e:
                    logger.warning(f"Milvus search skipped: {e}")

                # elements is already a compressed string from the widget [tag:id:label]
                
                # History — widget already compresses to last user + 2 assistant msgs
                history_text = ""
                if history:
                    history_lines = []
                    for msg in history:  # Trust widget's compression, no extra slicing
                        role_label = "User" if msg.get("role") == "user" else "Agent"
                        text = msg.get('text', '')[:200]  # Cap individual message length
                        history_lines.append(f"{role_label}: {text}")
                    history_text = "[Recent context]:\n" + "\n".join(history_lines) + "\n\n"

                # Admin-label context injection
                admin_context = ""
                if screen_label:
                    admin_context = f"[SCREEN] You are on: '{screen_label}'.\n"

                # Parse elements string into readable table
                elements_table = _format_elements_table(elements)

                user_message = (
                    f"{admin_context}"
                    f"URL: {page_url}\n\n"
                    f"{history_text}"
                    f"=== INTERACTIVE ELEMENTS ===\n"
                    f"{elements_table}\n\n"
                    f"=== PAGE TEXT (first 400 chars) ===\n"
                    f"{page_text[:400]}\n\n"
                    f"=== KB CONTEXT ===\n"
                    f"{milvus_context}\n\n"
                    f"=== USER REQUEST ===\n"
                    f"{query}"
                )

                # 3. Вызов LLM (уже подхватит session_id из propagate_attributes автоматически)
                raw_content = self.call_llm([
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": user_message}
                ])

                # 4. Парсинг JSON ответа
                cleaned = re.sub(r"<think>.*?</think>", "", raw_content, flags=re.DOTALL).strip()
                json_match = re.search(r"\{.*\}", cleaned, re.DOTALL)

                final_output = {"text": cleaned, "action": None}
                if json_match:
                    try:
                        final_output = json.loads(json_match.group())
                    except Exception as parse_err:
                        logger.warning(f"JSON parse failed, trying partial extraction: {parse_err}")
                        # Fallback: extract "text" field even from truncated/invalid JSON
                        text_match = re.search(r'"text"\s*:\s*"((?:[^\\"]|\\.)*)', json_match.group())
                        if text_match:
                            extracted = text_match.group(1).rstrip('"').strip()
                            final_output = {"text": extracted, "action": None}
                        else:
                            # Last resort: return a safe message (never show raw JSON to user)
                            final_output = {"text": "Произошла ошибка обработки. Попробуйте ещё раз.", "action": None}

                # 5. Semantic Cache Insertion
                if screen_fingerprint and final_output.get("action"):
                    semantic_cache.set_cached_action(query, screen_fingerprint, client_id, final_output)

                # Закрываем корневой спан финальным результатом
                root_span.update(output=final_output)
                return final_output

chat_service = ChatService()