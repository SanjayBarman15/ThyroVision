# LLM client

import os
from google import genai
from google.genai import types
from app.services.explainability.prompt_templates import EXPLAINER_SYSTEM_PROMPT, EXPLAINER_USER_PROMPT_TEMPLATE

# Configure API Key
api_key = os.getenv("GEMINI_API_KEY")

# Initialize Client
client = None
if api_key:
    client = genai.Client(api_key=api_key)
else:
    print("Warning: GEMINI_API_KEY environment variable is not set")

MODEL_ID = "gemini-2.0-flash-lite"


def generate_fallback_explanation(structured_data: dict) -> str:
    """
    Rule-based clinical summary used when LLM is unavailable.
    Handles features as either simple strings or dictionaries with a 'value' key.
    """
    tirads = structured_data.get("tirads", "N/A")
    features = structured_data.get("features", {})
    
    def get_val(f_key):
        val = features.get(f_key)
        if isinstance(val, dict):
            return val.get("value", "")
        return str(val) if val else ""

    # Basic summary construction
    summary = f"Clinical Summary (Rule-Based): The thyroid nodule is classified as TI-RADS {tirads}. "
    
    findings = []
    comp = get_val("composition")
    echo = get_val("echogenicity")
    marg = get_val("margins") or get_val("margin")
    
    if comp: findings.append(f"composition is {comp.lower()}")
    if echo: findings.append(f"echogenicity is {echo.lower()}")
    if marg: findings.append(f"margins are {marg.lower()}")
    
    if findings:
        summary += "Key findings include: " + ", ".join(findings) + "."
    else:
        summary += "Analysis based on standard AC-TIRADS feature extraction."
        
    return summary


async def generate_explanation(structured_data: dict, use_llm: bool = True) -> str:
    """
    Generate explanation using Gemini based on structured vision data.
    If use_llm is False, skips LLM and returns rule-based summary.
    Falls back to a rule-based summary if the API fails (e.g., quota exceeded).
    """
    if not use_llm or not client:
        return generate_fallback_explanation(structured_data)

    try:
        tirads = structured_data.get("tirads", "Unknown")
        
        user_prompt = EXPLAINER_USER_PROMPT_TEMPLATE.format(
            tirads=tirads,
            structured_data=structured_data
        )

        response = client.models.generate_content(
            model=MODEL_ID,
            contents=[EXPLAINER_SYSTEM_PROMPT, user_prompt],
            config=types.GenerateContentConfig(
                temperature=0.2,
                max_output_tokens=256,
            )
        )
        
        if not response.text:
            return generate_fallback_explanation(structured_data)
            
        return response.text.strip()
        
    except Exception as e:
        # Check for Quota/Rate Limit (429) or other API issues
        print(f"Gemini API issue: {str(e)}")
        # Return fallback instead of error string to the user
        return generate_fallback_explanation(structured_data)
