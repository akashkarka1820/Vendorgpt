from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import NLPRequest, NLPResponse, NLPItem
from app.services.nlp_service import extract_items_from_text

router = APIRouter(prefix="/api/nlp", tags=["NLP"])

@router.post("/extract", response_model=NLPResponse)
def extract_nlp(payload: NLPRequest, db: Session = Depends(get_db)):
    """
    Receives billing command text (Telugu or English) and extracts structured items dynamically using DB.
    """
    items = extract_items_from_text(payload.text, payload.language, db=db)
    return NLPResponse(
        success=True,
        items=[NLPItem(**item) for item in items]
    )
