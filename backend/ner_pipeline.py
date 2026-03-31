import google.generativeai as genai
import os
import json
import re
from datetime import datetime, timedelta
from typing import Dict, List
from schemas import BidAnalysis, ExtractedEntity

# Configure Gemini API
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

# Model configuration
model = genai.GenerativeModel(
    model_name="gemini-2.5-flash",
    generation_config=genai.GenerationConfig(
        response_mime_type="application/json",
        temperature=0.0,
    )
)

def parse_money_value(money_str: str) -> float:
    """
    Parse money string to float value.
    Handles various formats like "$10,000,000.00", "10 million", etc.
    """
    # Remove currency symbols and convert to lowercase
    cleaned = money_str.lower().replace('$', '').replace(',', '').strip()
    
    # Handle written numbers
    if 'million' in cleaned:
        num = float(re.findall(r'[\d.]+', cleaned)[0]) * 1000000
    elif 'billion' in cleaned:
        num = float(re.findall(r'[\d.]+', cleaned)[0]) * 1000000000
    elif 'thousand' in cleaned:
        num = float(re.findall(r'[\d.]+', cleaned)[0]) * 1000
    else:
        # Direct number
        try:
            num = float(cleaned)
        except ValueError:
            return 0.0
    
    return num

def normalize_money(money_str: str) -> str:
    """
    Normalize money string to $X,XXX,XXX.XX format.
    """
    value = parse_money_value(money_str)
    return f"${value:,.2f}"

def parse_date_string(date_str: str) -> datetime:
    """
    Parse date string to datetime object.
    Handles various formats.
    """
    # Common date formats to try
    date_formats = [
        "%m/%d/%Y",
        "%m-%d-%Y",
        "%B %d, %Y",
        "%b %d, %Y",
        "%Y-%m-%d",
        "%d/%m/%Y",
        "%d-%m-%Y",
    ]
    
    for fmt in date_formats:
        try:
            return datetime.strptime(date_str, fmt)
        except ValueError:
            continue
    
    # Try to extract date components with regex
    # Handle formats like "March 15, 2025"
    month_names = {
        'january': 1, 'february': 2, 'march': 3, 'april': 4,
        'may': 5, 'june': 6, 'july': 7, 'august': 8,
        'september': 9, 'october': 10, 'november': 11, 'december': 12
    }
    
    # Try regex patterns
    patterns = [
        r'(\w+)\s+(\d+),?\s*(\d{4})',  # March 15, 2025
        r'(\d+)/(\d+)/(\d{4})',        # 03/15/2025
        r'(\d+)-(\d+)-(\d{4})',        # 03-15-2025
    ]
    
    for pattern in patterns:
        match = re.search(pattern, date_str.lower())
        if match:
            groups = match.groups()
            if len(groups) == 3:
                if groups[0].isalpha():
                    # Month name format
                    month = month_names.get(groups[0][:3], 1)
                    day = int(groups[1])
                    year = int(groups[2])
                else:
                    # Numeric format
                    month = int(groups[0])
                    day = int(groups[1])
                    year = int(groups[2])
                
                try:
                    return datetime(year, month, day)
                except ValueError:
                    continue
    
    # Default to today if parsing fails
    return datetime.now()

def normalize_date(date_str: str) -> str:
    """
    Normalize date string to MM/DD/YYYY format.
    """
    try:
        date_obj = parse_date_string(date_str)
        return date_obj.strftime("%m/%d/%Y")
    except:
        return date_str  # Return original if parsing fails

def calculate_date_risk(date_str: str) -> str:
    """
    Calculate risk level for a date based on proximity to today.
    """
    try:
        date_obj = parse_date_string(date_str)
        today = datetime.now()
        delta = date_obj - today
        
        if delta.days <= 30:
            return "HIGH"
        elif delta.days <= 90:
            return "MEDIUM"
        else:
            return "LOW"
    except:
        return "MEDIUM"  # Default to medium if parsing fails

def calculate_money_risk(money_str: str) -> str:
    """
    Calculate risk level for money based on value.
    """
    value = parse_money_value(money_str)
    
    if value > 5000000:
        return "HIGH"
    elif value >= 1000000:
        return "MEDIUM"
    else:
        return "LOW"

def calculate_law_risk(law_clause: str) -> str:
    """
    Calculate risk level for legal clauses.
    """
    high_risk_clauses = [
        "force majeure",
        "termination for convenience",
        "indemnification",
        "liquidated damages"
    ]
    
    law_lower = law_clause.lower()
    for clause in high_risk_clauses:
        if clause in law_lower:
            return "HIGH"
    
    return "MEDIUM"

def extract_page_number(context: str) -> int:
    """
    Extract page number from context string.
    Looks for [PAGE N] markers.
    """
    match = re.search(r'\[PAGE (\d+)\]', context)
    if match:
        return int(match.group(1))
    return 1  # Default to page 1 if not found

def run_ner_pipeline(text: str) -> Dict:
    """
    Run Named Entity Recognition pipeline using Gemini API.
    
    Args:
        text: Extracted PDF text with page markers
        
    Returns:
        Dict containing project_name and entities list
        
    Raises:
        Exception: If Gemini API call fails or returns invalid data
    """
    
    prompt = f"""ROLE:
You are a specialist construction bid risk analyst.
Extract named entities from the bid document text below.
Return ONLY a valid JSON object. No explanation. No markdown.

ENTITY TYPES:
MONEY — bid bonds, insurance limits, contract values,
        liquidated damages amounts, performance bond amounts
DATE  — submission deadlines, site visit dates, RFI closure
        dates, completion milestones, notice-to-proceed dates
LAW   — Force Majeure, Termination for Convenience,
        Indemnification, Liquidated Damages clauses,
        Differing Site Conditions, No Damage for Delay,
        Dispute Resolution clauses

NORMALIZATION RULES:
- Money: always normalize to "$X,XXX,XXX.XX" format
  e.g. "Ten Million Dollars" → "$10,000,000.00"
- Dates: normalize to MM/DD/YYYY
- Context: always include the full verbatim sentence
  where the entity was found, word for word
- Page number: extract from [PAGE N] markers in the text

RISK SCORING — apply these rules deterministically:
MONEY:
  value > $5,000,000              → HIGH
  $1,000,000 ≤ value ≤ $5,000,000 → MEDIUM
  value < $1,000,000              → LOW

DATE:
  date is within 30 days          → HIGH
  date is 31–90 days away         → MEDIUM
  date is more than 90 days away  → LOW
  (calculate relative to today's date)

LAW:
  "Force Majeure"                 → HIGH
  "Termination for Convenience"   → HIGH
  "Indemnification"               → HIGH
  "Liquidated Damages"            → HIGH
  all other legal clauses         → MEDIUM

REQUIRED JSON OUTPUT FORMAT:
{{
  "project_name": "name extracted or inferred from document",
  "entities": [
    {{
      "entity_type": "MONEY",
      "value": "$10,000,000.00",
      "context": "The total contract value shall not exceed Ten Million Dollars ($10,000,000).",
      "risk_level": "HIGH",
      "page_number": 4
    }},
    {{
      "entity_type": "DATE",
      "value": "03/15/2025",
      "context": "All bids must be submitted no later than March 15, 2025 at 2:00 PM.",
      "risk_level": "HIGH",
      "page_number": 7
    }},
    {{
      "entity_type": "LAW",
      "value": "Termination for Convenience",
      "context": "Owner reserves the right to terminate this contract for convenience at any time.",
      "risk_level": "HIGH",
      "page_number": 22
    }}
  ]
}}

DOCUMENT TEXT:
{text}"""
    
    try:
        # Call Gemini API
        response = model.generate_content(prompt)
        response_text = response.text
        
        # Parse JSON response
        try:
            data = json.loads(response_text)
        except json.JSONDecodeError:
            # Remove any potential markdown formatting
            cleaned = response_text.replace('```json', '').replace('```', '').strip()
            data = json.loads(cleaned)
        
        # Post-process entities to ensure proper risk levels and normalization
        processed_entities = []
        for entity in data.get('entities', []):
            processed_entity = entity.copy()
            
            # Extract page number from context
            if 'page_number' not in processed_entity:
                processed_entity['page_number'] = extract_page_number(processed_entity.get('context', ''))
            
            # Apply risk scoring rules
            if processed_entity['entity_type'] == 'MONEY':
                processed_entity['risk_level'] = calculate_money_risk(processed_entity['value'])
                processed_entity['value'] = normalize_money(processed_entity['value'])
            elif processed_entity['entity_type'] == 'DATE':
                processed_entity['risk_level'] = calculate_date_risk(processed_entity['value'])
                processed_entity['value'] = normalize_date(processed_entity['value'])
            elif processed_entity['entity_type'] == 'LAW':
                processed_entity['risk_level'] = calculate_law_risk(processed_entity['value'])
            
            processed_entities.append(processed_entity)
        
        # Validate with Pydantic
        validated_data = BidAnalysis(
            project_name=data.get('project_name', 'Unknown Project'),
            total_pages=0,  # Will be set in main.py
            raw_text='',    # Will be set in main.py
            entities=processed_entities
        )
        
        return validated_data.dict()
        
    except Exception as e:
        raise Exception(f"Gemini API error: {str(e)}")
