# Generator
import time
from typing import Dict, Any
from app.services.explainability.llm_client import generate_explanation

class ResponseGenerator:
    """
    Orchestrates the LLM explanation generation process.
    """

    @staticmethod
    async def generate(features: Dict[str, Any], tirads: int, confidence: float) -> Dict[str, Any]:
        """
        Takes vision model output and returns AI explanation + metadata.
        """
        start_time = time.time()
        
        # Prepare structured data for the LLM
        structured_data = {
            "tirads": tirads,
            "overall_confidence": f"{confidence:.2f}",
            "features": features
        }

        # Call LLM
        explanation = await generate_explanation(structured_data)
        
        generation_time_ms = int((time.time() - start_time) * 1000)
        
        # Determine if it was a fallback response
        is_fallback = "Clinical Summary (Rule-Based)" in explanation
        engine_name = "Rule-Based Fallback" if is_fallback else "gemini-2.0-flash-lite"

        return {
            "ai_explanation": explanation,
            "explanation_metadata": {
                "engine": engine_name,
                "generation_time_ms": generation_time_ms,
                "input_snapshot": structured_data,
                "is_fallback": is_fallback
            }
        }