from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
import uuid
import tempfile
from dotenv import load_dotenv
from pydantic import ValidationError

from schemas import BidAnalysis
from pdf_extractor import extract_text_from_pdf
from ner_pipeline import run_ner_pipeline

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="Construction Bid Risk Intelligence API",
    description="AI-powered construction bid document analysis using Gemini",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174"],  # Vite dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Construction Bid Risk Intelligence API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "ok",
        "model": "gemini-2.5-flash"
    }

@app.get("/favicon.ico")
async def favicon():
    """Favicon endpoint to prevent 404 errors"""
    return {"message": "No favicon"}

@app.post("/analyze")
async def analyze_bid_document(file: UploadFile = File(...)):
    """
    Analyze a construction bid document for risk entities.
    
    Args:
        file: PDF file to analyze
        
    Returns:
        BidAnalysis: Complete analysis with entities and risk levels
        
    Raises:
        HTTPException: Various error conditions with appropriate status codes
    """
    
    # Validate file type
    if not file.filename or not file.filename.lower().endswith('.pdf'):
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are allowed"
        )
    
    # Validate file size (50MB limit)
    if file.size and file.size > 50 * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail="File size must be less than 50MB"
        )
    
    # Create temporary file
    temp_id = str(uuid.uuid4())
    temp_path = os.path.join(tempfile.gettempdir(), f"{temp_id}.pdf")
    
    try:
        # Save uploaded file
        with open(temp_path, "wb") as temp_file:
            content = await file.read()
            temp_file.write(content)
        
        # Extract text from PDF
        try:
            pdf_data = extract_text_from_pdf(temp_path)
            raw_text = pdf_data["text"]
            total_pages = pdf_data["total_pages"]
        except ValueError as e:
            raise HTTPException(
                status_code=400,
                detail=f"PDF extraction failed: {str(e)}"
            )
        except Exception as e:
            raise HTTPException(
                status_code=400,
                detail=f"Could not parse PDF file: {str(e)}"
            )
        
        # Run NER pipeline
        try:
            ner_result = run_ner_pipeline(raw_text)
        except Exception as e:
            raise HTTPException(
                status_code=502,
                detail=f"Gemini API error: {str(e)}"
            )
        
        # Build complete response
        try:
            analysis = BidAnalysis(
                project_name=ner_result["project_name"],
                total_pages=total_pages,
                raw_text=raw_text,
                entities=ner_result["entities"]
            )
        except ValidationError as e:
            raise HTTPException(
                status_code=422,
                detail=f"AI returned unexpected data format: {str(e)}"
            )
        
        return analysis.dict()
        
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
        
    except Exception as e:
        # Catch-all for unexpected errors
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )
        
    finally:
        # Clean up temporary file
        if os.path.exists(temp_path):
            try:
                os.unlink(temp_path)
            except:
                pass  # Ignore cleanup errors

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    """Custom HTTP exception handler"""
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.detail}
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
