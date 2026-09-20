# Raksha

Raksha is an AI agent that detects phone/SMS scams targeting Indian users. It supports text, audio, and image inputs.

## Setup

1. `python -m venv .venv`
2. `.\.venv\Scripts\activate` (Windows) or `source .venv/bin/activate` (Mac/Linux)
3. `pip install -r src/requirements.txt`
4. `sam build`
5. `sam deploy --guided`

## Architecture

- AWS SAM (Lambda, DynamoDB, S3)
- Amazon Bedrock (Nova Pro)
- Amazon Transcribe (hi-IN)
- Amazon Textract
- Amazon Polly (Kajal, Hindi)
- Vite + React Frontend
