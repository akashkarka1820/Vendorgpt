from datetime import datetime

from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    Boolean,
    DateTime,
    ForeignKey,
    Text
)
from sqlalchemy.orm import relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    shop_owner_name = Column(String(100), nullable=False)
    shop_name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    phone = Column(String(20), nullable=False)
    hashed_password = Column(String(200), nullable=False)
    gst_number = Column(String(50), nullable=True)
    shop_address = Column(Text, nullable=True)
    upi_id = Column(String(100), nullable=True, default="akashkarka@ybl")
    upi_phone = Column(String(20), nullable=True, default="9346009164")
    created_at = Column(DateTime, default=datetime.utcnow)


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)

    # Vendor ownership
    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True
    )

    product_name = Column(String(100), nullable=False, index=True)
    telugu_name = Column(String(100), nullable=True, index=True)
    category = Column(String(50), default="General", index=True)
    barcode = Column(String(50), nullable=True, index=True)
    unit = Column(String(20), default="kg")
    selling_price = Column(Float, nullable=False)
    purchase_price = Column(Float, default=0.0)
    gst_percentage = Column(Float, default=0.0)
    stock_quantity = Column(Float, default=0.0)
    minimum_stock = Column(Float, default=10.0)
    active = Column(Boolean, default=True)

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )

    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    user = relationship("User")


class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)

    # Vendor ownership
    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True
    )

    name = Column(String(100), nullable=False, index=True)
    phone = Column(String(20), nullable=False, index=True)
    email = Column(String(100), nullable=True)
    address = Column(Text, nullable=True)
    khata_balance = Column(Float, default=0.0)

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )

    user = relationship("User")

    transactions = relationship(
        "Transaction",
        back_populates="customer"
    )

    khata_entries = relationship(
        "KhataTransaction",
        back_populates="customer"
    )


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)

    # Vendor ownership
    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True
    )

    invoice_number = Column(
        String(50),
        unique=True,
        index=True,
        nullable=False
    )

    customer_id = Column(
        Integer,
        ForeignKey("customers.id"),
        nullable=True
    )

    subtotal = Column(
        Float,
        nullable=False,
        default=0.0
    )

    tax = Column(
        Float,
        nullable=False,
        default=0.0
    )

    discount = Column(
        Float,
        default=0.0
    )

    grand_total = Column(
        Float,
        nullable=False,
        default=0.0
    )

    payment_method = Column(
        String(50),
        nullable=False,
        default="Cash"
    )

    payment_status = Column(
        String(50),
        nullable=False,
        default="Completed"
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        index=True
    )

    user = relationship("User")

    customer = relationship(
        "Customer",
        back_populates="transactions"
    )

    items = relationship(
        "TransactionItem",
        back_populates="transaction",
        cascade="all, delete-orphan"
    )


class TransactionItem(Base):
    __tablename__ = "transaction_items"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    transaction_id = Column(
        Integer,
        ForeignKey("transactions.id"),
        nullable=False
    )

    product_id = Column(
        Integer,
        ForeignKey("products.id"),
        nullable=False
    )

    product_name = Column(
        String(100),
        nullable=False
    )

    quantity = Column(
        Float,
        nullable=False
    )

    unit = Column(
        String(20),
        nullable=False
    )

    unit_price = Column(
        Float,
        nullable=False
    )

    gst_percentage = Column(
        Float,
        default=0.0
    )

    line_total = Column(
        Float,
        nullable=False
    )

    transaction = relationship(
        "Transaction",
        back_populates="items"
    )

    product = relationship("Product")


class KhataTransaction(Base):
    __tablename__ = "khata_transactions"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    # Vendor ownership
    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True
    )

    customer_id = Column(
        Integer,
        ForeignKey("customers.id"),
        nullable=False
    )

    transaction_type = Column(
        String(20),
        nullable=False
    )

    amount = Column(
        Float,
        nullable=False
    )

    reference_invoice_id = Column(
        Integer,
        ForeignKey("transactions.id"),
        nullable=True
    )

    description = Column(
        Text,
        nullable=True
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        index=True
    )

    user = relationship("User")

    customer = relationship(
        "Customer",
        back_populates="khata_entries"
    )

    transaction = relationship("Transaction")


class InventoryMovement(Base):
    __tablename__ = "inventory_movements"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    # Vendor ownership
    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True
    )

    product_id = Column(
        Integer,
        ForeignKey("products.id"),
        nullable=False
    )

    change_type = Column(
        String(20),
        nullable=False
    )

    quantity = Column(
        Float,
        nullable=False
    )

    reference_id = Column(
        String(50),
        nullable=True
    )

    note = Column(
        String(255),
        nullable=True
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        index=True
    )

    user = relationship("User")

    product = relationship("Product")