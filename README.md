# ReanEy — AI Study Advisor for Cambodian Students

**ReanEy** means *"Learn What?"* in Khmer. It is a web app that helps Cambodian high school students choose a university major. Students enter their BAC II exam grades, interests, budget, and location. The app uses machine learning to recommend the best majors for them.

**Live site:** [https://reaney.vercel.app/](https://reaney.vercel.app/)

---

## What It Does

1. A student goes through a step-by-step wizard:
   - Pick their BAC II strand (Science or Social Science)
   - Enter their BAC II grades (or strong subjects if they haven't taken the exam yet)
   - Select their interests (up to 5)
   - Choose their preferred location and tuition budget
2. The backend predicts the top university majors using an ML model.
3. An AI chatbot ("Sok") can answer follow-up questions.
4. Students can read real-world experience stories from graduates.
5. Admins can review experience submissions, manage university data, and monitor ML model health.

The app is fully bilingual (Khmer and English).

---

## Tech Stack

| Part | Technology |
|------|-----------|
| Frontend | React + Vite |
| Backend | Python + FastAPI |
| ML | scikit-learn (Random Forest, Gradient Boosting) |
| Database | PostgreSQL (via Supabase) |
| AI | Google Gemini for explanations + chatbot |
| Deploy | Frontend on Vercel, Backend on Render |

---

## How the ML System Works

The ML pipeline recommends the best major for a student based on:

- **Grades:** BAC II scores in subjects like Math, Khmer, English, Science, History, etc.
- **Interests:** Technology, Medicine, Business, Law, Arts, and 5 more categories
- **Budget & Location:** Public/private/scholarship preference, Phnom Penh or province
- **Personality traits:** Analytical, creative, people-oriented, detail-oriented

The system has two modes:

1. **Rule-based mode (cold start):** If there is not enough real student data yet, the system uses hand-crafted rules to rank majors. This works immediately with no training data.

2. **ML mode:** Once enough survey responses are collected, the backend trains a Random Forest or Gradient Boosting model to make smarter predictions. The model gets better over time as more students use the app and fill out surveys.

The app supports **15 majors** including Computer Science, Business, Medicine, Law, Engineering, Education, Tourism, Agriculture, and more.

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
└── README.md
```

---

## Run Locally

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Copy `.env.example` to `.env` and fill in:

- `DATABASE_URL` — PostgreSQL connection string (Supabase or local)
- `GEMINI_API_KEY` — From [Google AI Studio](https://aistudio.google.com)
- `ADMIN_API_KEY` — Your own secret key for admin routes
- `SURVEY_WEBHOOK_TOKEN` — Secret token for Google Form webhook
- `FRONTEND_URL` — `http://localhost:5173` for development

Start the API:

```bash
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

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

## How the System Gets Smarter Over Time

1. Students use the wizard and get recommendations.
2. University students fill out a survey about their own major choice.
3. Survey responses become labeled training examples for the ML model.
4. An admin triggers retraining, or the server retrains automatically when enough new data arrives.
5. Future students receive better, data-driven predictions.

---

## Team

Built as a college project by students.
