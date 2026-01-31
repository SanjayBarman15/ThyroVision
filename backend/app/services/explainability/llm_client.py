# LLM client

import os
import google.generativeai as genai
from app.services.explainability.prompt_templates import EXPLAINER_SYSTEM_PROMPT, EXPLAINER_USER_PROMPT_TEMPLATE

# Configure API Key
api_key = os.getenv("GEMINI_API_KEY")

def _configure_genai():
    if not api_key:
        print("Warning: GEMINI_API_KEY environment variable is not set")
        return False
    genai.configure(api_key=api_key)
    return True

# Initialize Model (can be None if config fails)
model = None
if _configure_genai():
    # Reverting to a known stable model ID
    model = genai.GenerativeModel("gemini-2.0-flash-lite")


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


async def generate_explanation(structured_data: dict) -> str:
    """
    Generate explanation using Gemini based on structured vision data.
    Falls back to a rule-based summary if the API fails (e.g., quota exceeded).
    """
    try:
        tirads = structured_data.get("tirads", "Unknown")
        
        user_prompt = EXPLAINER_USER_PROMPT_TEMPLATE.format(
            tirads=tirads,
            structured_data=structured_data
        )

        response = model.generate_content(
            [EXPLAINER_SYSTEM_PROMPT, user_prompt],
            generation_config=genai.types.GenerationConfig(
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
