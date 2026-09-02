# 🛒 VendorGPT
### AI-Powered Multilingual Voice Billing & Smart Retail Management System for Rural Kirana Stores

![Python](https://img.shields.io/badge/Python-3.11-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-Backend-green)
![React](https://img.shields.io/badge/React-Frontend-61DAFB)
![SQLite](https://img.shields.io/badge/SQLite-Database-blue)
![License](https://img.shields.io/badge/Academic-Project-orange)

---

# 📖 Project Overview

VendorGPT is an AI-powered multilingual voice billing and retail management system developed for small grocery (Kirana) stores. It enables shopkeepers to create bills using natural voice commands in **Telugu** and **English**, eliminating the need for typing or manual billing.

The system combines **Speech Recognition**, **Natural Language Processing (NLP)**, **Fuzzy Product Matching**, **Inventory Management**, **Digital Khata**, **UPI Payments**, **WhatsApp Invoice Sharing**, and **Business Analytics** into a single intelligent retail platform.

This project is especially designed for **rural and semi-urban shop owners** who may not be comfortable using English-based billing software.

---

# 🎯 Problem Statement

Many small retail shops still depend on:

- Manual billing
- Paper-based Khata books
- No digital inventory tracking
- Billing errors
- Slow checkout process
- Lack of business analytics

VendorGPT digitizes the complete billing process using Artificial Intelligence.

---

# ✨ Features

## 🎤 AI Voice Billing

- Telugu Voice Billing
- English Voice Billing
- Multilingual Speech Recognition
- Automatic Product Detection
- Automatic Quantity Detection
- Supports:
  - 250g
  - 500g
  - 750g
  - 1kg
  - 1.25kg
  - 1.5kg
  - 2kg
  - Custom quantities

Example:

```
రెండు కిలోల బియ్యం
అర కిలో చక్కెర
పావు కిలో పసుపు
```

or

```
2 kg Rice
Half kg Sugar
```

---

## 🤖 Smart NLP Engine

- Voice-to-Text Conversion
- Quantity Extraction
- Product Extraction
- Telugu Number Recognition
- English Number Recognition
- Automatic Quantity Parsing
- Fraction Detection

---

## 🧠 AI Product Matching

- Intelligent Product Matching
- Telugu Product Names
- English Product Names
- Transliteration Support
- Fuzzy Matching
- Alias Detection

---

## 📦 Inventory Management

- Add Products
- Voice Product Entry
- Update Stock
- Low Stock Alerts
- Category Management

---

## 👥 Customer Management

- Customer Database
- Mobile Number
- Purchase History
- Customer Search

---

## 📒 Digital Khata

- Customer Credit
- Outstanding Balance
- Payment History
- Due Amount Tracking

---

## 💳 Payment Methods

- Cash
- UPI
- Card
- Khata

---

## 📱 Dynamic UPI QR

Automatically generates QR code using vendor UPI ID.

Example:

```
Vendor UPI:
akashkarka@ybl
```

Customer scans QR and payment amount is filled automatically.

---

## 💬 WhatsApp Invoice

- PDF Invoice Generation
- Invoice Sharing
- WhatsApp Integration
- Automatic Customer Billing

---

## 📈 Analytics Dashboard

- Daily Sales
- Weekly Sales
- Monthly Sales
- Revenue
- Transactions
- Inventory Status
- Top Selling Products

---

## 🌐 Multilingual Support

- Telugu
- English

Future:

- Hindi
- Kannada
- Tamil

---

# 🛠 Technology Stack

## Frontend

- React.js
- Vite
- Tailwind CSS
- JavaScript

## Backend

- Python
- FastAPI
- Uvicorn

## Database

- SQLite

## AI & NLP

- OpenAI Whisper
- RapidFuzz
- NLP Pipeline
- Transliteration Engine

## PDF

- ReportLab

## QR

- QR Code Generator

## WhatsApp

- Meta WhatsApp Cloud API

---

# 🏗 System Architecture

```
                 Voice Input
                      │
                      ▼
             Speech-to-Text (Whisper)
                      │
                      ▼
              NLP & Quantity Parser
                      │
                      ▼
          Product Matching Engine
                      │
      ┌───────────────┼───────────────┐
      ▼               ▼               ▼
 Inventory      Billing Cart      Customer
                      │
                      ▼
             Invoice Generation
                      │
      ┌───────────────┼───────────────┐
      ▼               ▼               ▼
 UPI QR         WhatsApp PDF      Analytics
```

---

# 📂 Project Structure

```
VendorGPT/
│
├── backend/
│   ├── app/
│   ├── routes/
│   ├── models/
│   ├── services/
│   ├── schemas/
│   └── database.py
│
├── frontend/
│   ├── src/
│   ├── components/
│   ├── pages/
│   └── services/
│
├── README.md
└── requirements.txt
```

---

# 🚀 Installation

## Backend

```bash
cd backend

pip install -r requirements.txt

python seed_data.py

uvicorn app.main:app --reload
```

Backend:

```
https://vendorgpt-1.onrender.com
```

---

## Frontend

```bash
cd frontend

npm install

npm run dev
```

Frontend:

```
http://localhost:5173
```

---

# 📸 Screenshots

## Dashboard

(Add Dashboard Screenshot)

---

## Voice Billing

(Add Voice Billing Screenshot)

---

## Inventory

(Add Inventory Screenshot)

---

## Customer Management

(Add Screenshot)

---

## WhatsApp Invoice

(Add Screenshot)

---

## UPI QR Payment

(Add Screenshot)

---

## Analytics Dashboard

(Add Screenshot)

---

# 📄 Research Papers

### Base Paper 1

**Rural Retail Revolution: AIML Driven Voice-Based Billing System in Kannada**

2024 8th International Conference on Computational System and Information Technology for Sustainable Solutions (CSITSS)

---

### Base Paper 2

**Voice Based Billing System**

International Journal of Advanced Research in Science, Communication and Technology

Vol. 5, Issue 4, pp. 448–454, 2025

---

# 🚀 Future Scope

- Hindi Voice Billing
- Kannada Voice Billing
- Tamil Voice Billing
- Barcode Scanner Integration
- OCR Bill Scanning
- Offline Voice Recognition
- AI Sales Prediction
- AI Inventory Forecasting
- GST Reports
- Cloud Synchronization
- Multi-Shop Management
- Mobile Application
- Customer Loyalty Rewards

---

# 👨‍💻 Developed By

**Akash Karka**

B.Tech Major Project

---

# ⭐ If you like this project, consider giving it a star!
