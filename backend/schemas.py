from pydantic import BaseModel
from typing import List

class ExtractedEntity(BaseModel):
    entity_type: str    # "MONEY" | "DATE" | "LAW"
    value: str          # normalized e.g. "$10,000,000.00"
    context: str        # verbatim sentence where entity was found
    risk_level: str     # "HIGH" | "MEDIUM" | "LOW"
    page_number: int    # page number where entity was found

class BidAnalysis(BaseModel):
    project_name: str
    total_pages: int
    raw_text: str       # full extracted PDF text for frontend highlighting
    entities: List[ExtractedEntity]
