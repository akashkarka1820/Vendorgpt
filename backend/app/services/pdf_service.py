import io
from datetime import datetime
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

def generate_invoice_pdf(transaction_data: dict, shop_data: dict = None) -> bytes:
    """
    Generates a clean PDF invoice using ReportLab and returns raw bytes.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    story = []
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        'TitleStyle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=22,
        textColor=colors.HexColor('#0f766e'),
        alignment=1,  # Center
        spaceAfter=4
    )

    subtitle_style = ParagraphStyle(
        'SubTitleStyle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        textColor=colors.HexColor('#4b5563'),
        alignment=1,
        spaceAfter=12
    )

    body_style = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.HexColor('#1f2937')
    )

    bold_body = ParagraphStyle(
        'BoldBody',
        parent=body_style,
        fontName='Helvetica-Bold'
    )

    shop_name = shop_data.get("shop_name", "VendorGPT Store") if shop_data else "VendorGPT Kirana Store"
    shop_owner = shop_data.get("shop_owner_name", "Retail Vendor") if shop_data else "Retail Vendor"
    gst_num = shop_data.get("gst_number", "") if shop_data else ""

    story.append(Paragraph(f"<b>{shop_name.upper()}</b>", title_style))
    subtitle_text = f"Owner: {shop_owner}" + (f" | GSTIN: {gst_num}" if gst_num else "")
    story.append(Paragraph(subtitle_text, subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#cbd5e1'), spaceAfter=15))

    # Invoice Metadata Info Table
    inv_num = transaction_data.get("invoice_number", "INV-2026-0000")
    created_at = transaction_data.get("created_at")
    if isinstance(created_at, datetime):
        date_str = created_at.strftime("%d-%m-%Y %H:%M")
    else:
        date_str = str(created_at)[:16] if created_at else datetime.now().strftime("%d-%m-%Y %H:%M")

    cust_name = transaction_data.get("customer_name") or "Walk-in Customer"
    cust_phone = transaction_data.get("customer_phone") or "-"
    pay_method = transaction_data.get("payment_method") or "Cash"

    meta_data = [
        [
            Paragraph(f"<b>Invoice #:</b> {inv_num}", body_style),
            Paragraph(f"<b>Customer:</b> {cust_name}", body_style)
        ],
        [
            Paragraph(f"<b>Date:</b> {date_str}", body_style),
            Paragraph(f"<b>Phone:</b> {cust_phone}", body_style)
        ],
        [
            Paragraph(f"<b>Payment Method:</b> {pay_method}", body_style),
            Paragraph(f"<b>Status:</b> Completed", body_style)
        ]
    ]

    meta_table = Table(meta_data, colWidths=[250, 270])
    meta_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 15))

    # Line Items Table Header
    items_data = [
        [
            Paragraph("<b>#</b>", bold_body),
            Paragraph("<b>Product</b>", bold_body),
            Paragraph("<b>Qty</b>", bold_body),
            Paragraph("<b>Unit Price</b>", bold_body),
            Paragraph("<b>GST %</b>", bold_body),
            Paragraph("<b>Total (INR)</b>", bold_body)
        ]
    ]

    items = transaction_data.get("items", [])
    for idx, item in enumerate(items, 1):
        p_name = item.get("product_name", "Item")
        qty = item.get("quantity", 1)
        unit = item.get("unit", "")
        u_price = item.get("unit_price", 0.0)
        gst = item.get("gst_percentage", 0.0)
        l_total = item.get("line_total", 0.0)

        items_data.append([
            Paragraph(str(idx), body_style),
            Paragraph(p_name, body_style),
            Paragraph(f"{qty} {unit}", body_style),
            Paragraph(f"Rs. {u_price:.2f}", body_style),
            Paragraph(f"{gst}%", body_style),
            Paragraph(f"Rs. {l_total:.2f}", body_style)
        ])

    items_table = Table(items_data, colWidths=[30, 190, 80, 80, 60, 80])
    items_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f1f5f9')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#0f172a')),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
    ]))
    story.append(items_table)
    story.append(Spacer(1, 15))

    # Summary Totals Table
    subtotal = transaction_data.get("subtotal", 0.0)
    tax = transaction_data.get("tax", 0.0)
    discount = transaction_data.get("discount", 0.0)
    grand_total = transaction_data.get("grand_total", 0.0)

    totals_data = [
        [Paragraph("Subtotal:", body_style), Paragraph(f"Rs. {subtotal:.2f}", body_style)],
        [Paragraph("Tax / GST:", body_style), Paragraph(f"Rs. {tax:.2f}", body_style)],
        [Paragraph("Discount:", body_style), Paragraph(f"- Rs. {discount:.2f}", body_style)],
        [Paragraph("<b>Grand Total:</b>", bold_body), Paragraph(f"<b>Rs. {grand_total:.2f}</b>", bold_body)]
    ]

    totals_table = Table(totals_data, colWidths=[400, 120])
    totals_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'RIGHT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(totals_table)
    story.append(Spacer(1, 20))

    # Footer note
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#cbd5e1'), spaceAfter=10))
    story.append(Paragraph("Thank you for shopping with us! Built with VendorGPT AI Billing.", subtitle_style))

    doc.build(story)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes
