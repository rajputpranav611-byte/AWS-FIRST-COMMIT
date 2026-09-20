import json
import os
import io
from PIL import Image
import google.generativeai as genai

genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))

SYSTEM_PROMPT = """You are a fraud triage analyst specializing in scams targeting Indian users.
Your task is to analyze a message transcript and determine if it is a scam.
You must NEVER state legal certainties.
You must NEVER invent police procedures or laws.
You must return ONLY a valid JSON object with the following schema, with no markdown formatting or extra text.

{
    "verdict": "scam" | "suspicious" | "legit",
    "confidence": float (0.0 to 1.0),
    "playbook_id": "id_from_playbooks_or_null",
    "reasoning_en": "short English reasoning",
    "explanation_hi": "Explanation of the verdict and advice in Hindi.",
    "complaint_draft": "NCRP-style formal complaint text in Hindi (if applicable, else null).",
    "red_flags": ["list", "of", "flags"],
    "next_steps": ["list", "of", "actions"]
}
"""

model = genai.GenerativeModel(
    model_name="gemini-3.6-flash",
    system_instruction=SYSTEM_PROMPT,
)

def analyse(transcript: str, rule_result: dict, playbooks: list) -> dict:
    prompt = f"""
Transcript: {transcript}
Rule Scores: {json.dumps(rule_result)}
Known Playbooks: {json.dumps(playbooks)}

Analyze the transcript and provide your JSON response.
"""

    response = model.generate_content(
        prompt,
        generation_config={
            "temperature": 0.1,
            "max_output_tokens": 2048,
            "response_mime_type": "application/json",
        },
    )

    output_text = response.text.strip()

    if output_text.startswith("```json"):
        output_text = output_text[7:]
    if output_text.startswith("```"):
        output_text = output_text[3:]
    if output_text.endswith("```"):
        output_text = output_text[:-3]

    return json.loads(output_text.strip())

def extract_text_from_image(image_bytes: bytes) -> str:
    image = Image.open(io.BytesIO(image_bytes))
    vision_model = genai.GenerativeModel(model_name="gemini-3.6-flash")
    response = vision_model.generate_content([
        "Extract and return ONLY the visible text from this image, "
        "exactly as written, no commentary or formatting. If it's a "
        "screenshot of a chat or message, transcribe the message text.",
        image
    ])
    return response.text.strip()
