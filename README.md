# ReanEy — AI Study Advisor for Cambodian Students

## Project Description

**ReanEy** (រៀនអី — *"Learn What?"* in Khmer) is an AI-powered web application that helps Cambodian high school students choose the right university major. Students enter their BAC II exam grades, interests, budget, and preferred location, and the app uses machine learning to recommend the best-fit majors.

### Key Features

- **Step-by-Step Wizard** — Guides students through entering their BAC II strand, grades, interests, budget, and location
- **AI-Powered Recommendations** — Uses a Random Forest / Gradient Boosting ML model to predict the top university majors
- **AI Chatbot ("Sok")** — A Google Gemini-powered chatbot that answers follow-up questions about majors and careers
- **Bilingual Support** — Fully supports both Khmer (ខ្មែរ) and English
- **Experience Stories** — Real-world stories from university graduates to help students make informed decisions
- **Admin Dashboard** — For reviewing submissions, managing university data, and monitoring ML model health
- **Smart Learning** — The ML model improves over time as more students use the app and provide survey data

The system supports **15 majors** including Computer Science, Business, Medicine, Law, Engineering, Education, Tourism, Agriculture, and more.

---

## Technologies Used

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React 19 + Vite 8 | User interface and routing |
| Backend | Python + FastAPI | REST API server |
| Database | PostgreSQL (Supabase) | Data storage |
| Machine Learning | scikit-learn (Random Forest, Gradient Boosting) | Major prediction |
| AI / NLP | Google Gemini API | Chatbot and AI explanations |
| ORM | SQLAlchemy (async) + Alembic | Database models and migrations |
| Auth | JWT + Google OAuth | User authentication |
| Frontend Hosting | Vercel | Frontend deployment |
| Backend Hosting | Render | Backend deployment |
| Database Hosting | Supabase | Managed PostgreSQL |

### Frontend Dependencies
- React 19, React Router 7, Axios, Lucide React (icons), React Markdown

### Backend Dependencies
- FastAPI, Uvicorn, SQLAlchemy (async), asyncpg, Pydantic, scikit-learn, pandas, NumPy, google-generativeai, Alembic, python-jose (JWT)

---

## Installation and Setup Instructions

### Prerequisites

- Python 3.11 or higher
- Node.js 18+ and npm
- Git
- A Supabase account (free tier) for PostgreSQL database
- A Google Gemini API key from [Google AI Studio](https://aistudio.google.com)
- (Optional) Google OAuth Client ID from [Google Cloud Console](https://console.cloud.google.com)

### 1. Clone the Repository

```bash
git clone https://github.com/creslouis/reaney-ai-assignment.git
cd reaney-ai-assignment
```

### 2. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate        # Linux/Mac
# .venv\Scripts\activate         # Windows

# Install dependencies
pip install -r requirements.txt

# Create environment file
cp .env.example .env
```

Edit the `.env` file and fill in the required values:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Supabase PostgreSQL connection string (`postgresql+asyncpg://...`) |
| `GEMINI_API_KEY` | Google Gemini API key |
| `ADMIN_API_KEY` | Any secret string for admin routes |
| `JWT_SECRET_KEY` | Generate: `python -c "import secrets; print(secrets.token_hex(32))"` |
| `JWT_REFRESH_SECRET_KEY` | Generate: `python -c "import secrets; print(secrets.token_hex(32))"` |
| `FRONTEND_URL` | `http://localhost:5173` (for local dev) |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID (optional) |

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create environment file for local development
echo "VITE_API_BASE_URL=http://localhost:8000" > .env
```

---

## How to Run the Project

### Running Locally

**Terminal 1 — Start the Backend:**

```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload
```

The API server runs at `http://localhost:8000`
API documentation available at `http://localhost:8000/docs`

**Terminal 2 — Start the Frontend:**

```bash
cd frontend
npm run dev
```

The app runs at `http://localhost:5173`

### How It Works

1. A student opens the app and goes through a step-by-step wizard:
   - Picks their BAC II strand (Science or Social Science)
   - Enters their BAC II grades (or strong subjects if they haven't taken the exam yet)
   - Selects their interests (up to 5)
   - Chooses preferred location and tuition budget
2. The backend predicts the top university majors using the ML model
3. The AI chatbot ("Sok") can answer follow-up questions
4. Students can read real-world experience stories from graduates
5. Admins can review submissions, manage data, and monitor model health

---

## Project Structure

```
reaney-ai-assignment/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app entry point
│   │   ├── config.py            # Environment config
│   │   ├── database.py          # Database connection
│   │   ├── data/                # Static data (Cambodia universities)
│   │   ├── middleware/          # Auth middleware
│   │   ├── models/              # SQLAlchemy database models
│   │   ├── routers/             # API route handlers
│   │   ├── schemas/             # Pydantic request/response schemas
│   │   └── services/            # Business logic (auth, ML, CMS, etc.)
│   ├── ml/
│   │   ├── data/                # Training datasets (CSV)
│   │   ├── models/              # Saved ML model files (.pkl)
│   │   ├── predictor.py         # Prediction logic
│   │   └── training/            # Model training pipeline
│   ├── requirements.txt
│   └── render.yaml              # Render deployment config
├── frontend/
│   ├── src/
│   │   ├── pages/               # Wizard steps and admin pages
│   │   ├── components/          # Reusable UI components
│   │   ├── context/             # React app state
│   │   ├── data/                # Translations (Khmer/English)
│   │   ├── api.js               # HTTP client
│   │   └── index.css            # Global styles
│   ├── vite.config.js
│   └── vercel.json              # Vercel deployment config
├── Deployment_Link.txt
├── How_to_Run_Locally.txt
├── How_to_Deploy.txt
└── README.md
```

---

## Deployment Links

| Service | URL | Purpose |
|---------|-----|---------|
| **Frontend** (Vercel) | https://reaney-ai-assignment.vercel.app | User-facing web app |
| **Backend** (Render) | https://reaney.onrender.com | REST API server |
| **API Docs** (Swagger) | https://reaney.onrender.com/docs | Interactive API documentation |
| **Database** (Supabase) | Hosted on Supabase (private) | PostgreSQL database (not publicly accessible) |

> **Note:** The Render free tier sleeps after 15 minutes of inactivity. The first request after sleep may take 30–60 seconds.

---

## Team Member Contributions

| Member | Role | Contributions |
|--------|------|--------------|
| **rickyinnitdev** | Full-Stack Developer | Backend API development (FastAPI), ML pipeline and model training, database design (Supabase/PostgreSQL), AI chatbot integration (Google Gemini), authentication system, deployment configuration (Render) |
| **sinbad07** | Full-Stack Developer | Frontend development (React/Vite), UI/UX design, step-by-step wizard, bilingual support (Khmer/English), admin dashboard, frontend deployment (Vercel) |

---

## How the ML System Works

The ML pipeline recommends majors based on:

- **Grades:** BAC II scores in Math, Khmer, English, Science, History, etc.
- **Interests:** Technology, Medicine, Business, Law, Arts, and more
- **Budget & Location:** Public/private/scholarship preference, Phnom Penh or province
- **Personality traits:** Analytical, creative, people-oriented, detail-oriented

The system operates in two modes:

1. **Rule-based mode (cold start):** Uses hand-crafted rules to rank majors when insufficient training data exists
2. **ML mode:** Trains a Random Forest or Gradient Boosting model once enough survey data is collected

The model improves over time as more students use the app and fill out surveys.

---

## Admin Endpoints

Admin endpoints require the header `X-API-Key: <your_admin_api_key>`.

| Endpoint | Description |
|----------|-------------|
| `POST /api/v1/ml/retrain` | Retrain the ML model with new survey data |
| `GET /api/v1/ml/status` | View model accuracy and training info |
| `GET /api/v1/contact/all` | View all contact form submissions |
| `PATCH /api/v1/contact/{id}/read` | Mark a contact message as read |
| `POST /api/v1/survey/sync-google-sheet` | Import survey data from Google Sheets |

---

## License

Built as a college project by students at [Your University].
