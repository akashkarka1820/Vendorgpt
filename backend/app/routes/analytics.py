from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models import Transaction, TransactionItem, Product, Customer, KhataTransaction

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])

@router.get("/dashboard", response_model=dict)
def get_dashboard_data(db: Session = Depends(get_db)):
    today_start = datetime.combine(datetime.now().date(), datetime.min.time())

    # Today's Revenue & Bill Count
    today_txs = db.query(Transaction).filter(Transaction.created_at >= today_start).all()
    todays_revenue = sum(t.grand_total for t in today_txs)
    bills_today = len(today_txs)

    # Total Products Sold Today
    today_tx_ids = [t.id for t in today_txs]
    if today_tx_ids:
        products_sold_today = db.query(func.sum(TransactionItem.quantity)).filter(
            TransactionItem.transaction_id.in_(today_tx_ids)
        ).scalar() or 0.0
    else:
        products_sold_today = 0.0

    # Pending Khata Total
    pending_khata = db.query(func.sum(Customer.khata_balance)).scalar() or 0.0

    # Low Stock Products Count
    low_stock_count = db.query(Product).filter(
        Product.active == True,
        Product.stock_quantity <= Product.minimum_stock
    ).count()

    # Recent 5 transactions for dashboard
    recent_transactions = db.query(Transaction).order_by(Transaction.created_at.desc()).limit(5).all()
    recent_list = [
        {
            "id": t.id,
            "invoice_number": t.invoice_number,
            "customer_name": t.customer.name if t.customer else "Walk-in Customer",
            "grand_total": t.grand_total,
            "payment_method": t.payment_method,
            "created_at": t.created_at
        } for t in recent_transactions
    ]

    # Top selling products overall
    top_items_query = db.query(
        TransactionItem.product_name,
        func.sum(TransactionItem.quantity).label("total_qty"),
        func.sum(TransactionItem.line_total).label("total_revenue")
    ).group_by(TransactionItem.product_name).order_by(func.sum(TransactionItem.line_total).desc()).limit(5).all()

    top_products = [
        {
            "product_name": item[0],
            "quantity_sold": float(item[1]),
            "revenue": float(item[2])
        } for item in top_items_query
    ]

    return {
        "todays_revenue": round(todays_revenue, 2),
        "bills_today": bills_today,
        "products_sold_today": round(products_sold_today, 1),
        "pending_khata": round(pending_khata, 2),
        "low_stock_count": low_stock_count,
        "recent_transactions": recent_list,
        "top_products": top_products
    }

@router.get("/sales", response_model=dict)
def get_sales_analytics(
    timeframe: str = Query("7days"),  # today, 7days, 30days
    db: Session = Depends(get_db)
):
    now = datetime.now()
    if timeframe == "today":
        start_date = datetime.combine(now.date(), datetime.min.time())
        days_count = 1
    elif timeframe == "30days":
        start_date = now - timedelta(days=30)
        days_count = 30
    else:  # 7days default
        start_date = now - timedelta(days=7)
        days_count = 7

    transactions = db.query(Transaction).filter(Transaction.created_at >= start_date).all()

    # Aggregate by day
    sales_by_date = {}
    for i in range(days_count):
        day_key = (now - timedelta(days=days_count - 1 - i)).strftime("%Y-%m-%d")
        sales_by_date[day_key] = {"date": day_key, "revenue": 0.0, "bills": 0}

    for t in transactions:
        d_key = t.created_at.strftime("%Y-%m-%d")
        if d_key in sales_by_date:
            sales_by_date[d_key]["revenue"] += t.grand_total
            sales_by_date[d_key]["bills"] += 1

    chart_data = list(sales_by_date.values())
    total_period_revenue = sum(item["revenue"] for item in chart_data)
    total_period_bills = sum(item["bills"] for item in chart_data)
    avg_bill_value = (total_period_revenue / total_period_bills) if total_period_bills > 0 else 0.0

    return {
        "timeframe": timeframe,
        "total_revenue": round(total_period_revenue, 2),
        "total_bills": total_period_bills,
        "avg_bill_value": round(avg_bill_value, 2),
        "trend_data": chart_data
    }

@router.get("/products", response_model=dict)
def get_product_analytics(db: Session = Depends(get_db)):
    category_sales = db.query(
        Product.category,
        func.sum(TransactionItem.line_total).label("total_sales")
    ).join(TransactionItem, TransactionItem.product_id == Product.id)\
     .group_by(Product.category).all()

    cat_data = [
        {"category": cat[0] or "General", "sales": float(cat[1])} for cat in category_sales
    ]

    method_sales = db.query(
        Transaction.payment_method,
        func.sum(Transaction.grand_total).label("total_amount")
    ).group_by(Transaction.payment_method).all()

    payment_data = [
        {"method": m[0], "amount": float(m[1])} for m in method_sales
    ]

    return {
        "category_sales": cat_data,
        "payment_method_distribution": payment_data
    }
