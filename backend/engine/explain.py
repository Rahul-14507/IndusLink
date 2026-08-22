import os
import json
import logging
from dotenv import load_dotenv

# Load env variables
load_dotenv()

logger = logging.getLogger(__name__)

EXPLAIN_SYSTEM_PROMPT = """
You are writing a short, plain-language explanation for an industrial
safety inspector, based ONLY on the structured risk data provided below.
Do not invent numbers, trends, or causes that are not present in the
data. Do not soften or exaggerate the risk. Write 2-4 sentences, in the
tone of an experienced plant safety engineer, not a marketing summary.
If a scenario is matched, name it naturally in the explanation.
"""

def build_explanation_prompt(
    asset: dict,
    sub_scores: dict,
    matched_scenarios: list,
    bucket: str,
    action: str
) -> str:
    return f"""
Asset: {asset.get('name')} ({asset.get('asset_id')}), type {asset.get('type')}, at {asset.get('location')}
Risk bucket: {bucket}
Sub-scores (0-100, higher = worse): {json.dumps(sub_scores)}
Matched risk scenarios: {matched_scenarios or "none"}
Recommended action: {action}

Write the explanation now.
"""

def get_explanation(
    asset: dict,
    sub_scores: dict,
    matched_scenarios: list,
    bucket: str,
    action: str
) -> str | None:
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        logger.warning("GROQ_API_KEY environment variable not found. Skipping LLM explanation.")
        return None

    try:
        from groq import Groq
        client = Groq(api_key=api_key)
        
        prompt = build_explanation_prompt(asset, sub_scores, matched_scenarios, bucket, action)
        
        model = os.environ.get("GROQ_MODEL", "groq/compound-mini")
        
        completion = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": EXPLAIN_SYSTEM_PROMPT.strip()},
                {"role": "user", "content": prompt.strip()}
            ],
            max_tokens=300,
            temperature=0.2
        )
        return completion.choices[0].message.content.strip()
    except Exception as e:
        logger.error(f"Error calling Groq API: {e}", exc_info=True)
        return None
