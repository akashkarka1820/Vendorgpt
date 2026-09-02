from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional
from datetime import datetime

# --- Auth & User Schemas ---
class UserRegister(BaseModel):
    shop_owner_name: str
    shop_name: str
    email: EmailStr
    phone: str
    password: str
    gst_number: Optional[str] = None
    shop_address: Optional[str] = None
    upi_id: Optional[str] = "akashkarka@ybl"
    upi_phone: Optional[str] = "9346009164"

class UserLogin(BaseModel):
    email_or_phone: str
    password: str

class UserUpdate(BaseModel):
    shop_owner_name: Optional[str] = None
    shop_name: Optional[str] = None
    phone: Optional[str] = None
    gst_number: Optional[str] = None
    shop_address: Optional[str] = None
    upi_id: Optional[str] = None
    upi_phone: Optional[str] = None

class UserOut(BaseModel):
    id: int
    shop_owner_name: str
    shop_name: str
    email: str
    phone: str
    gst_number: Optional[str] = None
    shop_address: Optional[str] = None
    upi_id: Optional[str] = "akashkarka@ybl"
    upi_phone: Optional[str] = "9346009164"
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut

# --- Product Schemas ---
class ProductCreate(BaseModel):
    product_name: Optional[str] = None
    telugu_name: Optional[str] = None
    category: str = "General"
    barcode: Optional[str] = None
    unit: str = "kg"
    selling_price: float
    purchase_price: float = 0.0
    gst_percentage: float = 0.0
    stock_quantity: float = 0.0
    minimum_stock: float = 10.0

class ProductUpdate(BaseModel):
    product_name: Optional[str] = None
    telugu_name: Optional[str] = None
    category: Optional[str] = None
    barcode: Optional[str] = None
    unit: Optional[str] = None
    selling_price: Optional[float] = None
    purchase_price: Optional[float] = None
    gst_percentage: Optional[float] = None
    stock_quantity: Optional[float] = None
    minimum_stock: Optional[float] = None
    active: Optional[bool] = None

class ProductOut(BaseModel):
    id: int
    product_name: str
    telugu_name: Optional[str] = None
    category: str
    barcode: Optional[str] = None
    unit: str
    selling_price: float
    purchase_price: float
    gst_percentage: float
    stock_quantity: float
    minimum_stock: float
    active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# --- Customer Schemas ---
class CustomerCreate(BaseModel):
    name: str
    phone: str
    email: Optional[str] = None
    address: Optional[str] = None

class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None

class CustomerOut(BaseModel):
    id: int
    name: str
    phone: str
    email: Optional[str] = None
    address: Optional[str] = None
    khata_balance: float
    created_at: datetime

    class Config:
        from_attributes = True

# --- Voice & NLP Schemas ---
class VoiceTranscribeRequest(BaseModel):
    language: str = "te"

class VoiceTranscribeResponse(BaseModel):
    success: bool
    language: str
    transcription: str

class NLPRequest(BaseModel):
    text: str
    language: str = "te"

class NLPItem(BaseModel):
    raw_product: str
    normalized_product: str
    quantity: float
    unit: str

class NLPResponse(BaseModel):
    success: bool
    items: List[NLPItem]

class ValidateItemRequest(BaseModel):
    raw_product: str
    quantity: float
    unit: str

class ValidationItemOut(BaseModel):
    raw_product: str
    quantity: float
    unit: str
    matched_product_id: Optional[int] = None
    matched_product_name: Optional[str] = None
    matched_telugu_name: Optional[str] = None
    matched_unit: Optional[str] = None
    matched_price: Optional[float] = None
    matched_gst_percentage: Optional[float] = None
    confidence: float
    status: str  # "confirmed", "suggestion", "not_found"
    suggested_products: List[dict] = Field(default_factory=list)

class ValidationResponse(BaseModel):
    items: List[ValidationItemOut]

# --- Billing Schemas ---
class CartItem(BaseModel):
    product_id: int
    quantity: float
    unit: str
    unit_price: float
    gst_percentage: float = 0.0
    discount: float = 0.0

class BillingPreviewRequest(BaseModel):
    items: List[CartItem]
    overall_discount: float = 0.0

class LineItemPreview(BaseModel):
    product_id: int
    product_name: str
    quantity: float
    unit: str
    unit_price: float
    gst_percentage: float
    gst_amount: float
    line_total: float
    stock_available: float
    stock_sufficient: bool

class BillingPreviewResponse(BaseModel):
    line_items: List[LineItemPreview]
    subtotal: float
    total_tax: float
    discount: float
    grand_total: float
    can_checkout: bool
    warnings: List[str]

class CheckoutRequest(BaseModel):
    customer_id: Optional[int] = None
    items: List[CartItem]
    payment_method: str = "Cash"  # Cash, UPI, Card, Khata
    discount: float = 0.0
    notes: Optional[str] = None

class TransactionItemOut(BaseModel):
    id: int
    product_id: int
    product_name: str
    quantity: float
    unit: str
    unit_price: float
    gst_percentage: float
    line_total: float

    class Config:
        from_attributes = True

class TransactionOut(BaseModel):
    id: int
    invoice_number: str
    customer_id: Optional[int] = None
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    subtotal: float
    tax: float
    discount: float
    grand_total: float
    payment_method: str
    payment_status: str
    created_at: datetime
    items: List[TransactionItemOut]

    class Config:
        from_attributes = True

# --- Khata Schemas ---
class KhataPaymentRequest(BaseModel):
    customer_id: int
    amount: float
    description: Optional[str] = "Payment received"

class KhataTransactionOut(BaseModel):
    id: int
    customer_id: int
    transaction_type: str
    amount: float
    reference_invoice_id: Optional[int] = None
    description: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# --- Inventory Schemas ---
class StockAdjustmentRequest(BaseModel):
    product_id: int
    change_type: str  # ADDITION, DEDUCTION, ADJUSTMENT
    quantity: float
    note: Optional[str] = None

class InventoryMovementOut(BaseModel):
    id: int
    product_id: int
    product_name: str
    change_type: str
    quantity: float
    reference_id: Optional[str] = None
    note: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
