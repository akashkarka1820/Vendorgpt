from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User
from app.schemas import UserRegister, UserLogin, UserOut, Token, UserUpdate
from app.utils.security import (
    get_password_hash, verify_password, create_access_token, get_current_user
)

router = APIRouter(prefix="/api/auth", tags=["Auth"])

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register_vendor(payload: UserRegister, db: Session = Depends(get_db)):
    # Check existing email
    existing_user = db.query(User).filter(User.email == payload.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vendor account with this email already exists"
        )

    hashed_pwd = get_password_hash(payload.password)
    user = User(
        shop_owner_name=payload.shop_owner_name,
        shop_name=payload.shop_name,
        email=payload.email,
        phone=payload.phone,
        hashed_password=hashed_pwd,
        gst_number=payload.gst_number,
        shop_address=payload.shop_address,
        upi_id=payload.upi_id or "akashkarka@ybl",
        upi_phone=payload.upi_phone or "9346009164"
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(data={"sub": user.email})
    return Token(access_token=token, token_type="bearer", user=UserOut.model_validate(user))

@router.post("/login", response_model=Token)
def login_vendor(payload: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(
        (User.email == payload.email_or_phone) | (User.phone == payload.email_or_phone)
    ).first()

    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email/phone or password"
        )

    token = create_access_token(data={"sub": user.email})
    return Token(access_token=token, token_type="bearer", user=UserOut.model_validate(user))

@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return UserOut.model_validate(current_user)

@router.put("/me", response_model=UserOut)
def update_me(payload: UserUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if payload.shop_owner_name is not None:
        current_user.shop_owner_name = payload.shop_owner_name
    if payload.shop_name is not None:
        current_user.shop_name = payload.shop_name
    if payload.phone is not None:
        current_user.phone = payload.phone
    if payload.gst_number is not None:
        current_user.gst_number = payload.gst_number
    if payload.shop_address is not None:
        current_user.shop_address = payload.shop_address
    if payload.upi_id is not None:
        current_user.upi_id = payload.upi_id
    if payload.upi_phone is not None:
        current_user.upi_phone = payload.upi_phone

    db.commit()
    db.refresh(current_user)
    return UserOut.model_validate(current_user)
