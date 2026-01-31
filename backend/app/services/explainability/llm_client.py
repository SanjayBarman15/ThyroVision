# LLM client

import os
import google.generativeai as genai

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))


model = genai.GenerativeModel("gemini-2.0-flash-exp")


async def generate_explanation(structured_data: dict) -> str:
    """
    Generate explanation using Gemini
    """
    system_prompt = """
    You are a medical explanation generator.
    You do not diagnose, predict, or modify findings.
    You ONLY explain the provided structured data.
    Do NOT introduce new features, risks, or recommendations.
    """

    user_prompt = f"""
    Using only the provided JSON:
    - Explain why the TI-RADS score was assigned
    - Mention only features listed
    - Reflect confidence values qualitatively (e.g., "high confidence", "moderate confidence")
    - Do not add clinical advice
    - Maximum 120 words
    - Neutral, factual tone suitable for doctors

    JSON:
    {structured_data}
    """

    response = model.generate_content([system_prompt, user_prompt])
    return response.text
