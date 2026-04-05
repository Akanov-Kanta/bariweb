import hashlib
import json
import logging
import datetime
from sqlmodel import select, Session
from app.core.database import engine
from app.features.agent.models import PlanCache
from app.features.agent.schemas import ActionPlan
import requests
from app.core.config import settings

logger = logging.getLogger(__name__)

class PlanService:
    def _hash_goal(self, goal: str) -> str:
        return hashlib.sha256(goal.lower().encode()).hexdigest()

    def get_plan(self, url: str, goal: str, elements_context: str) -> ActionPlan:
        goal_hash = self._hash_goal(goal)
        
        with Session(engine) as session:
            # Check cache: 30 minutes TTL
            time_limit = datetime.datetime.utcnow() - datetime.timedelta(minutes=30)
            stmt = select(PlanCache).where(
                PlanCache.url == url, 
                PlanCache.goal_hash == goal_hash,
                PlanCache.created_at >= time_limit
            ).order_by(PlanCache.created_at.desc())
            
            cached_record = session.exec(stmt).first()
            if cached_record:
                logger.info(f"Plan Cache HIT for url={url} goal_hash={goal_hash}")
                try:
                    return ActionPlan(**cached_record.plan_json)
                except Exception as e:
                    logger.error(f"Failed to parse cached plan: {e}")
            
            logger.info("Plan Cache MISS. Generating via LLM.")
            plan_json = self._generate_plan(url, goal, elements_context)
            if not plan_json:
                raise ValueError("Failed to generate Action Plan from LLM")
            
            try:
                plan = ActionPlan(**plan_json)
            except Exception as e:
                # Fallback format checking
                logger.error(f"Invalid Plan format from LLM: {e}")
                raise ValueError(f"Invalid Plan format from LLM: {e}")

            # Save in cache
            new_cache = PlanCache(
                url=url,
                goal_hash=goal_hash,
                plan_json=plan_json
            )
            session.add(new_cache)
            session.commit()
            
            return plan

    def _generate_plan(self, url: str, goal: str, elements_context: str) -> dict | None:
        prompt = f"""You are an autonomous AI specialized in Web UI action planning.
Generate an Action Plan to achieve the user's goal step-by-step.

URL: {url}
Goal: {goal}
Available elements info (optional context):
{elements_context}

Return strictly a valid JSON object without markdown wrappers, matching this format exactly:
{{
  "url": "{url}",
  "goal": "{goal}",
  "steps": [
    {{
      "type": "read" | "click" | "input" | "submit" | "navigation",
      "selector": "css_selector_or_id",
      "value": "string (optional, only for input)",
      "description": "Short explanation of this step"
    }}
  ]
}}
"""
        try:
            resp = requests.post(
                "https://llm.alem.ai/v1/chat/completions",
                json={
                    "model": "qwen3",
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.2
                },
                headers={"Authorization": f"Bearer {settings.QWEN3_API_KEY}"},
                timeout=30
            )
            resp.raise_for_status()
            text = resp.json()["choices"][0]["message"]["content"]
            import re
            cleaned_text = re.sub(r'<think>.*?</think>', '', text, flags=re.DOTALL)
            cleaned_text = cleaned_text.replace("```json", "").replace("```", "").strip()
            
            # Simple fix if extra text was added after json string
            json_match = re.search(r"\{.*\}", cleaned_text, re.DOTALL)
            if json_match:
                cleaned_text = json_match.group()
            return json.loads(cleaned_text)
        except Exception as e:
            logger.error(f"Plan generation failed: {e}")
            return None

plan_service = PlanService()
