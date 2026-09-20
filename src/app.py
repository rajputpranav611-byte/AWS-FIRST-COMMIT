import traceback
import json
import os
import time
import uuid
import boto3
from rules import score
from agent import analyse, extract_text_from_image

# Initialize clients
transcribe = boto3.client('transcribe', region_name='ap-south-1')
polly = boto3.client('polly', region_name='ap-south-1')
dynamodb = boto3.resource('dynamodb', region_name='ap-south-1')
s3 = boto3.client('s3', region_name='ap-south-1')

def load_playbooks():
    with open('playbooks.json', 'r') as f:
        return json.load(f)

def lambda_handler(event, context):
    try:
        body = json.loads(event.get('body', '{}'))
        trace = []
        text_input = ""
        bucket_name = os.environ.get('STORAGE_BUCKET')
        
        if body.get('action') == 'get_upload_url':
            file_type = body.get('file_type')
            file_name = body.get('file_name', 'unknown')
            if file_type not in ['audio', 'image']:
                return {"statusCode": 400, "body": json.dumps({"error": "Invalid file_type"})}
            
            key = f"uploads/{uuid.uuid4()}_{file_name}"
            upload_url = s3.generate_presigned_url(
                'put_object',
                Params={'Bucket': bucket_name, 'Key': key},
                ExpiresIn=300
            )
            return {
                "statusCode": 200,
                "headers": {"Content-Type": "application/json"},
                "body": json.dumps({"upload_url": upload_url, "key": key})
            }
            
        if 'text' in body:
            text_input = body['text']
            trace.append("Direct text input received.")
        elif 'audio_s3_key' in body:
            audio_key = body['audio_s3_key']
            trace.append(f"Audio file received: {audio_key}")
            job_name = f"raksha_{uuid.uuid4()}"
            s3_uri = f"s3://{bucket_name}/{audio_key}"
            
            trace.append("Starting Transcribe job.")
            transcribe.start_transcription_job(
                TranscriptionJobName=job_name,
                LanguageCode='hi-IN',
                Media={'MediaFileUri': s3_uri}
            )
            
            while True:
                status = transcribe.get_transcription_job(TranscriptionJobName=job_name)
                job_status = status['TranscriptionJob']['TranscriptionJobStatus']
                if job_status in ['COMPLETED', 'FAILED']:
                    break
                time.sleep(2)
            
            if job_status == 'COMPLETED':
                import urllib.request
                transcript_uri = status['TranscriptionJob']['Transcript']['TranscriptFileUri']
                with urllib.request.urlopen(transcript_uri) as response:
                    data = json.loads(response.read())
                    text_input = data['results']['transcripts'][0]['transcript']
                trace.append("Transcribe job completed successfully.")
            else:
                raise Exception("Transcription failed.")
                
        elif 'image_s3_key' in body:
            image_key = body['image_s3_key']
            trace.append(f"Image file received: {image_key}")
            
            trace.append("Downloading image and calling Gemini vision.")
            image_bytes = s3.get_object(Bucket=bucket_name, Key=image_key)['Body'].read()
            text_input = extract_text_from_image(image_bytes)
            trace.append("Gemini vision extracted text from screenshot.")
        else:
            return {
                "statusCode": 400,
                "body": json.dumps({"error": "Missing text, audio_s3_key, or image_s3_key"})
            }
            
        # Run rules
        trace.append("Running deterministic rules scoring.")
        rule_scores = score(text_input)
        
        # Load playbooks and run agent
        trace.append("Loading playbooks and calling AI agent.")
        playbooks = load_playbooks()
        try:
            agent_result = analyse(text_input, rule_scores, playbooks)
        except Exception as e:
            print("BEDROCK CALL FAILED:")
            print(traceback.format_exc())
            return {
                "statusCode": 500,
                "body": json.dumps({"error": str(e)})
            }
        trace.append("AI agent completed successfully.")
        
        # Synthesize speech
        trace.append("Synthesizing Hindi explanation via Polly.")
        explanation_hi = agent_result.get('explanation_hi', '')
        polly_response = polly.synthesize_speech(
            Text=explanation_hi,
            OutputFormat='mp3',
            VoiceId='Kajal',
            Engine='neural'
        )
        
        audio_out_key = f"output/{uuid.uuid4()}.mp3"
        s3.put_object(
            Bucket=bucket_name,
            Key=audio_out_key,
            Body=polly_response['AudioStream'].read(),
            ContentType='audio/mpeg'
        )
        
        audio_url = s3.generate_presigned_url(
            'get_object',
            Params={'Bucket': bucket_name, 'Key': audio_out_key},
            ExpiresIn=3600
        )
        trace.append(f"Audio synthesized and saved to {audio_out_key}.")
        
        # Save to DynamoDB
        case_id = str(uuid.uuid4())
        trace.append(f"Saving case {case_id} to DynamoDB.")
        table = dynamodb.Table(os.environ.get('CASES_TABLE'))
        table.put_item(
            Item={
                'caseId': case_id,
                'input': text_input,
                'rule_scores': str(rule_scores),
                'verdict': agent_result.get('verdict'),
                'timestamp': int(time.time()),
                'agent_result': json.dumps(agent_result)
            }
        )
        
        # Build response
        response_data = {
            "verdict": agent_result.get('verdict'),
            "confidence": agent_result.get('confidence'),
            "rule_scores": rule_scores,
            "reasoning_en": agent_result.get('reasoning_en'),
            "explanation_hi": explanation_hi,
            "audio_url": audio_url,
            "red_flags": agent_result.get('red_flags', []),
            "next_steps": agent_result.get('next_steps', []),
            "complaint_draft": agent_result.get('complaint_draft'),
            "trace": trace
        }
        
        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json"
            },
            "body": json.dumps(response_data)
        }
    except Exception as e:
        return {
            "statusCode": 500,
            "headers": {},
            "body": json.dumps({"error": str(e)})
        }
