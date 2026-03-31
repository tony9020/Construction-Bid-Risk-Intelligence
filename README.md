# Construction Bid Risk Dashboard — Gemini Edition

An AI-powered construction bid document analysis dashboard that uses Google Gemini to extract named entities, classify them by risk level, and display them in an executive-grade dashboard with full AI traceability.

## Features

- **PDF Upload & Analysis**: Upload construction bid documents (PDF) for AI-powered analysis
- **Entity Extraction**: Automatically extracts MONEY, DATE, and LAW entities using Google Gemini 2.5 Pro
- **Risk Classification**: Classifies entities as HIGH, MEDIUM, or LOW risk based on deterministic rules
- **Interactive Dashboard**: 
  - Risk heatmap with sortable entity cards
  - Source document highlighting with hover tooltips
  - Executive summary statistics
- **Full Traceability**: Every entity is linked back to its exact source in the original document

## Tech Stack

### Backend
- **Python 3.10+** with FastAPI
- **Google Gemini 2.5 Pro** via Generative AI SDK
- **pdfplumber** for PDF text extraction
- **Pydantic** for data validation

### Frontend
- **React 18** with TypeScript
- **Vite** for development and building
- **Tailwind CSS** for styling
- **Custom hooks** for state management

## Prerequisites

- Python 3.10+
- Node.js 18+
- A Gemini API key (free at https://aistudio.google.com/app/apikey)

## Setup

### 1. Clone and Navigate

```bash
git clone <repository-url>
cd construction-bid-dashboard
```

### 2. Backend Setup

```bash
cd backend
python -m venv venv

# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
```

**Important**: Edit `backend/.env` and add your Gemini API key:

```env
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

### 3. Frontend Setup

```bash
cd ../frontend
npm install
```

### 4. Root Setup (for concurrent development)

```bash
cd ..
npm install
```

## Running the Application

### Development Mode (Recommended)

Start both backend and frontend concurrently:

```bash
npm run dev
```

This will start:
- Backend: http://localhost:8000
- Frontend: http://localhost:5173

### Individual Services

If you prefer to run services separately:

```bash
# Backend only
npm run backend

# Frontend only (in a separate terminal)
npm run frontend
```

## Usage

1. **Upload a PDF**: Drag and drop or click to select a construction bid document (PDF only, max 50MB)
2. **AI Analysis**: Gemini automatically extracts and classifies entities (30-60 seconds for large documents)
3. **Review Results**: 
   - **Risk Heatmap**: View entities grouped by risk level (HIGH/MEDIUM/LOW)
   - **Entity Details**: Click on highlighted text in the source document to see details
   - **Statistics**: Overview of total entities and risk distribution

## Risk Classification Rules

### MONEY
- **HIGH**: > $5,000,000
- **MEDIUM**: $1,000,000 - $5,000,000  
- **LOW**: < $1,000,000

### DATES
- **HIGH**: Within 30 days
- **MEDIUM**: 31-90 days away
- **LOW**: More than 90 days away

### LEGAL CLAUSES
- **HIGH**: Force Majeure, Termination for Convenience, Indemnification, Liquidated Damages
- **MEDIUM**: All other legal clauses

## API Endpoints

### POST /analyze
Analyzes a PDF document for risk entities.

**Request**: `multipart/form-data` with file field named `file`
**Response**: `BidAnalysis` object with entities and metadata

### GET /health
Health check endpoint.

**Response**: `{"status": "ok", "model": "gemini-2.5-pro-preview-06-05"}`

## Troubleshooting

### CORS Error
- Ensure backend is running on port 8000
- Verify CORS is configured for http://localhost:5173

### GEMINI_API_KEY Not Found
- Confirm `backend/.env` exists and contains `GEMINI_API_KEY=...`
- Never commit `.env` to git

### PDF Has No Extractable Text
- Scanned PDFs need OCR preprocessing
- Use Adobe Acrobat or pytesseract to make them text-searchable first

### Gemini Returns Wrong Format
- Rare with `response_mime_type="application/json"`
- Check your GEMINI_API_KEY has access to `gemini-2.5-pro-preview-06-05`

### Large Document Processing Time
- Documents with 200+ pages may take 30-60 seconds
- This is normal due to comprehensive AI analysis

## Development Notes

### Project Structure
```
construction-bid-dashboard/
├── backend/                 # Python FastAPI server
│   ├── main.py             # FastAPI application
│   ├── schemas.py          # Pydantic models
│   ├── pdf_extractor.py    # PDF text extraction
│   ├── ner_pipeline.py    # Gemini AI integration
│   ├── requirements.txt    # Python dependencies
│   └── .env.example       # Environment variables template
├── frontend/               # React TypeScript application
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── types/         # TypeScript type definitions
│   │   └── App.tsx        # Main application component
│   ├── package.json        # Node.js dependencies
│   └── vite.config.ts     # Vite configuration
├── package.json           # Root package.json for development
└── README.md             # This file
```

### Key Components

- **UploadZone**: Drag-and-drop PDF upload with loading states
- **RiskHeatmap**: Three-column risk visualization with entity cards
- **EntityHighlight**: Scrollable document view with highlighted entities
- **Dashboard**: Main dashboard layout with statistics and components

### AI Integration

The application uses Gemini's `response_mime_type="application/json"` to ensure structured output, eliminating parsing hacks and providing reliable entity extraction with deterministic risk scoring.

## License

This project is for demonstration purposes. Please ensure compliance with Google Gemini API terms of service and applicable data privacy regulations when processing construction bid documents.

This project is licensed under the MIT License.
