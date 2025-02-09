from fastapi import FastAPI, Request, Response
from fastapi.responses import HTMLResponse, JSONResponse, FileResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI
from tenacity import retry, wait_random_exponential, stop_after_attempt
from weasyprint import HTML
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
port = int(os.getenv("PORT", 8000))

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Setup static files - IMPORTANT: Create these directories if they don't exist
app.mount("/static", StaticFiles(directory="static"), name="static")

# Setup templates with custom directory configuration
templates = Jinja2Templates(directory="templates")
templates.env.globals['static_url'] = lambda path: f"/static/{path}"

# Initialize OpenAI client
openai_client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# Pydantic models for request validation
class UpdateValueRequest(BaseModel):
    document: Dict[str, Any]
    key: str
    current_value: str
    custom_prompt: Optional[str] = None


class DownloadRequest(BaseModel):
    document: Dict[str, Any]
    format: str


@retry(wait=wait_random_exponential(min=1, max=40), stop=stop_after_attempt(3))
def chat_completion_request(messages, model='gpt-4'):
    try:
        response = openai_client.chat.completions.create(
            messages=messages,
            max_tokens=1000,
            model=model,
            temperature=0
        )
        return response
    except Exception as e:
        logger.error(f"Chat completion request failed: {str(e)}")
        return 'Error processing request'


@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
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


@app.post("/update_value")
async def update_value(request: UpdateValueRequest):
    response = chat_completion_request([
        {"role": "system", "content": "You are a legal document assistant."},
        {"role": "user",
         "content": f"For this document: {json.dumps(request.document)}\nSuggest a value for '{request.key}' (current: {request.current_value}). Additional context: {request.custom_prompt}"}
    ])

    if isinstance(response, str):
        return JSONResponse(
            status_code=400,
            content={"error": response}
        )

    try:
        new_value = response.choices[0].message.content.strip()
        return {"value": new_value}
    except Exception as e:
        logger.error(f"Error parsing AI response: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"error": "Failed to process response"}
        )


@app.post("/download")
async def download(request: DownloadRequest):
    if request.format != "pdf":
        return JSONResponse(
            status_code=400,
            content={"error": "Format not supported"}
        )

    try:
        # Render the PDF HTML using template
        template = templates.get_template("pdf_template.html")
        rendered_html = template.render(document=request.document)

        # Convert HTML to PDF using WeasyPrint
        pdf = HTML(string=rendered_html).write_pdf()

        # Create response with PDF content
        return Response(
            content=pdf,
            media_type="application/pdf",
            headers={
                "Content-Disposition": "attachment; filename=document.pdf"
            }
        )
    except Exception as e:
        logger.error(f"Error generating PDF: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"error": "Failed to generate PDF"}
        )


if __name__ == "_main_":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=port)
