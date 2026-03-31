import pdfplumber
from typing import Dict

def extract_text_from_pdf(path: str) -> Dict[str, any]:
    """
    Extract text from PDF file with page markers.
    
    Args:
        path: Path to the PDF file
        
    Returns:
        Dict containing:
        - text: Full extracted text with page markers
        - total_pages: Total number of pages in the PDF
        
    Raises:
        ValueError: If PDF has zero extractable pages
    """
    full_text = ""
    total_pages = 0
    pages_with_text = 0
    
    try:
        with pdfplumber.open(path) as pdf:
            total_pages = len(pdf.pages)
            
            for page_num, page in enumerate(pdf.pages, 1):
                page_marker = f"\n[PAGE {page_num}]\n"
                
                # Extract text from the page
                page_text = page.extract_text()
                
                if page_text and page_text.strip():
                    # Add page marker and text
                    full_text += page_marker + page_text + "\n"
                    pages_with_text += 1
                else:
                    # Handle pages with no extractable text (scanned images)
                    full_text += page_marker + "[IMAGE ONLY, NO TEXT]\n"
        
        # Validate that we got some text
        if pages_with_text == 0:
            raise ValueError("PDF has zero extractable pages. The document may be scanned images only.")
            
        return {
            "text": full_text,
            "total_pages": total_pages
        }
        
    except Exception as e:
        if "zero extractable pages" in str(e):
            raise
        raise ValueError(f"Failed to extract text from PDF: {str(e)}")
