from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.schemas import NLPRequest, NLPResponse, NLPItem
from app.services.nlp_service import extract_items_from_text
from app.utils.security import get_current_user


router = APIRouter(
    prefix="/api/nlp",
    tags=["NLP"]
)


@router.post("/extract", response_model=NLPResponse)
def extract_nlp(
    payload: NLPRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Receives billing command text (Telugu or English)
    and extracts structured items dynamically using
    products belonging to the logged-in vendor.
    """

    items = extract_items_from_text(
        payload.text,
        payload.language,
        db=db,
        user_id=current_user.id
    )

    return NLPResponse(
        success=True,
        items=[
            NLPItem(**item)
            for item in items
        ]
    )