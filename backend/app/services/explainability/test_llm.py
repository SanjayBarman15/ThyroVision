import asyncio
import os
from dotenv import load_dotenv

# Load env before imports that might check it
load_dotenv()

from app.services.explainability.llm_client import generate_explanation

async def test_llm():
    mock_data = {
        "tirads": 4,
        "overall_confidence": "0.85",
        "features": {
            "composition": {"value": "solid", "points": 2},
            "echogenicity": {"value": "hypoechoic", "points": 2},
            "shape": {"value": "wider-than-tall", "points": 0},
            "margin": {"value": "smooth", "points": 0},
            "echogenic_foci": {"value": "none", "points": 0}
        }
    }
    
    print("Testing Gemini Explanation Generation...")
    print("-" * 30)
    
    explanation = await generate_explanation(mock_data)
    
    print(f"TI-RADS: {mock_data['tirads']}")
    print(f"Explanation:\n{explanation}")
    print("-" * 30)
    
    if "TI-RADS 4" in explanation or "solid" in explanation or "hypoechoic" in explanation:
        print("Success: Explanation contains relevant terms.")
    else:
        print("Warning: Explanation might be generic or failed.")

if __name__ == "__main__":
    asyncio.run(test_llm())
