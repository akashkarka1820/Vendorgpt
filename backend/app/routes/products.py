from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.database import get_db
from app.models import Product
from app.schemas import (
    ProductCreate, ProductUpdate, ProductOut,
    ValidateItemRequest, ValidationItemOut, ValidationResponse
)
from app.services.fuzzy_service import validate_product_with_db
from app.services.transliteration_service import transliterate_to_telugu, reverse_transliterate_telugu

router = APIRouter(prefix="/api/products", tags=["Products"])

@router.get("/transliterate")
def transliterate_product_name(text: str = Query(...)):
    telugu_alias = transliterate_to_telugu(text)
    return {"english": text, "telugu": telugu_alias}

@router.get("/reverse-transliterate")
def reverse_transliterate_name(text: str = Query(...)):
    english_rep = reverse_transliterate_telugu(text)
    return {"telugu": text, "english": english_rep}

@router.get("", response_model=List[ProductOut])
def list_products(
    search: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Product).filter(Product.active == True)
    if category and category.lower() != "all":
        query = query.filter(Product.category == category)
    if search:
        search_term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Product.product_name.ilike(search_term),
                Product.telugu_name.ilike(search_term),
                Product.barcode.ilike(search_term),
                Product.category.ilike(search_term)
            )
        )
    return query.order_by(Product.product_name.asc()).all()

@router.get("/search", response_model=List[ProductOut])
def search_products(q: str = Query(...), db: Session = Depends(get_db)):
    term = f"%{q.strip()}%"
    return db.query(Product).filter(
        Product.active == True,
        or_(
            Product.product_name.ilike(term),
            Product.telugu_name.ilike(term),
            Product.barcode.ilike(term)
        )
    ).limit(10).all()

@router.get("/{product_id}", response_model=ProductOut)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id, Product.active == True).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@router.post("", response_model=ProductOut, status_code=status.HTTP_201_CREATED)
def create_product(payload: ProductCreate, db: Session = Depends(get_db)):
    prod_name = payload.product_name.strip() if payload.product_name else ""
    telugu_name = payload.telugu_name.strip() if payload.telugu_name else ""

    if not prod_name and not telugu_name:
        raise HTTPException(status_code=400, detail="Product Name or Telugu Name is required.")

    if not telugu_name:
        telugu_name = transliterate_to_telugu(prod_name)

    if not prod_name:
        prod_name = reverse_transliterate_telugu(telugu_name)

    product = Product(
        product_name=prod_name,
        telugu_name=telugu_name,
        category=payload.category,
        barcode=payload.barcode,
        unit=payload.unit,
        selling_price=payload.selling_price,
        purchase_price=payload.purchase_price,
        gst_percentage=payload.gst_percentage,
        stock_quantity=payload.stock_quantity,
        minimum_stock=payload.minimum_stock
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return product

@router.put("/{product_id}", response_model=ProductOut)
def update_product(product_id: int, payload: ProductUpdate, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(product, key, value)
    
    db.commit()
    db.refresh(product)
    return product

@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    product.active = False
    db.commit()
    return None

@router.post("/validate", response_model=ValidationResponse)
def validate_products(items: List[ValidateItemRequest], db: Session = Depends(get_db)):
    validated_list = []
    for item in items:
        val_result = validate_product_with_db(
            raw_product=item.raw_product,
            quantity=item.quantity,
            unit=item.unit,
            db=db
        )
        validated_list.append(ValidationItemOut(**val_result))
    return ValidationResponse(items=validated_list)
