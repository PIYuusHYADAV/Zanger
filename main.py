from fastapi import FastAPI, Request, Response
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from azure.ai.inference import ChatCompletionsClient
from azure.core.credentials import AzureKeyCredential
from tenacity import retry, wait_random_exponential, stop_after_attempt
from pydantic import BaseModel
import logging
import os
import json
from dotenv import load_dotenv
from typing import Dict, Any, Optional

# Load environment variables
load_dotenv('.env')

# Initialize FastAPI app
app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Setup static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Setup templates
templates = Jinja2Templates(directory="templates")
templates.env.globals['static_url'] = lambda path: f"/static/{path}"

# Initialize Azure AI client
azure_client = ChatCompletionsClient(
    endpoint="https://ai-rohitmishramanit6459ai171081160941.services.ai.azure.com/models",
    credential=AzureKeyCredential(os.getenv('AZURE_API_KEY'))
)

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Pydantic models
class QuestionGenerationRequest(BaseModel):
    document: Dict[str, Any]

class AnswerMappingRequest(BaseModel):
    document: Dict[str, Any]
    questions: Dict[str, str]
    answers: Dict[str, str]

class UpdateValueRequest(BaseModel):
    document: Dict[str, Any]
    key: str
    current_value: str
    custom_prompt: Optional[str] = None

class DownloadRequest(BaseModel):
    document: Dict[str, Any]
    format: str

@retry(wait=wait_random_exponential(min=1, max=40), stop=stop_after_attempt(3))
async def azure_chat_completion(messages):
    """Make a chat completion request to Azure AI with retry logic."""
    try:
        response = azure_client.complete({
            "messages": messages,
            "model": "gpt-4o-mini",
            "max_tokens": 1000,
            "temperature": 0,
            "top_p": 1,
            "stop": []
            # Removed response_format to match your working version
        })
        return response
    except Exception as e:
        logger.error(f"Azure chat completion failed: {str(e)}")
        return 'Error processing request'
@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    """Render the main editor page."""
    try:
        with open('templates/document.json', 'r') as f:
            document = json.load(f)
        return templates.TemplateResponse(
            "index.html",
            {"request": request, "document": document}
        )
    except Exception as e:
        logger.error(f"Error loading document: {str(e)}")
        return templates.TemplateResponse(
            "index.html",
            {"request": request, "document": {"Assignment of copyright": {}}}
        )
        
@app.get("/consultancy_agreement", response_class=HTMLResponse)
async def consultancy_agreement(request: Request):
    try:
        # Load the JSON file with the new structure
        with open('templates/ConsultancyAgreement.json', 'r') as f:
            document = json.load(f)
        return templates.TemplateResponse(
            "main.html",
            {"request": request, "document": document}
        )
    except Exception as e:
        logger.error(f"Error loading consultancy agreement: {str(e)}")
        fallback = {
            "displayOrder": {
                "mainSections": ["DATE", "1. PARTIES", "AGREEMENT", "EXECUTION"],
                "agreementSections": []
            },
            "Consultancy Agreement": {}
        }
        return templates.TemplateResponse(
            "main.html",
            {"request": request, "document": fallback}
        )

@app.post("/generate-questions")
async def generate_questions(request: QuestionGenerationRequest):
    """Generate questions for document completion."""
    try:
        payload = {
            "messages": [
                {
                    "role": "system",
                    "content": "You are a helpful assistant specialized in legal document analysis."
                },
                {
                    "role": "user",
                    "content": f"Given this contract template, what minimum questions are required to fill this complete contract? Contract: {json.dumps(request.document)}. Output questions in json format with numeric keys (e.g., 'question1', 'question2') and string values."
                }
            ],
            "model": "gpt-4o-mini",
            "max_tokens": 4096,
            "temperature": 0,
            "top_p": 1,
            "stop": [],
            'response_format': {"type": "json_object"}
        }

        response = azure_client.complete(payload)
        questions = json.loads(response.choices[0].message.content)
        logger.info(f"Generated questions: {questions}")
        return questions
    except Exception as e:
        logger.error(f"Error generating questions: {str(e)}")
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.post("/update_value")
async def update_value(request: UpdateValueRequest):
    """Get AI suggestions for document values."""
    response = await azure_chat_completion([
        {"role": "system", "content": "You are a legal document assistant. Provide direct, concise responses without explanations."},
        {"role": "user", "content": f"Suggest a value for this field in the document. Field: '{request.key}', Current value: {request.current_value}. Context: {request.custom_prompt}"}
    ])

    if isinstance(response, str):
        return JSONResponse(
            status_code=400,
            content={"error": response}
        )

    try:
        new_value = response.choices[0].message.content.strip()
        logger.info(f"Generated new value for {request.key}: {new_value}")
        return {"value": new_value}
    except Exception as e:
        logger.error(f"Error parsing AI response: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"error": "Failed to process response"}
        )
@app.post("/fill-template")
async def fill_template(request: AnswerMappingRequest):
    """Fill template with user answers."""
    try:
        mapping_payload = {
            "messages": [
                {
                    "role": "system",
                    "content": "You are a helpful assistant specialized in legal document completion."
                },
                {
                    "role": "user",
                    "content": f"Given these questions and answers: {json.dumps(request.questions)}\n\nAnd these answers: {json.dumps(request.answers)}\n\nMap these answers to the correct places in this template: {json.dumps(request.document)}\n\nReturn only the filled template as a valid JSON object."
                }
            ],
            "model": "gpt-4o-mini",
            "max_tokens": 4096,
            "temperature": 0,
            "top_p": 1,
            "stop": [],
            'response_format': {"type": "json_object"}
        }

        mapping_response = azure_client.complete(mapping_payload)
        filled_template = json.loads(mapping_response.choices[0].message.content)
        logger.info(f"Filled template generated")
        return filled_template
    except Exception as e:
        logger.error(f"Error mapping answers: {str(e)}")
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.post("/download")
async def download(request: DownloadRequest):
    """Generate and download document."""
    if request.format != "pdf":
        return JSONResponse(status_code=400, content={"error": "Format not supported"})

    try:
        template = templates.get_template("pdf_template.html")
        rendered_html = template.render(document=request.document)
        return Response(
            content=rendered_html,
            media_type="text/html",
        )
    except Exception as e:
        logger.error(f"Error generating document: {str(e)}")
        return JSONResponse(status_code=500, content={"error": str(e)})

if __name__== "_main_":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
