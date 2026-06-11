# Cambodian Student Career Finder Backend

## Project Overview

This backend powers a Cambodian student career path finder. Students submit their school profile, the system predicts suitable majors using an ML pipeline, Gemini explains the result in plain language, and a chatbot answers follow-up questions using the student-specific recommendation context.

## ML System Explained

The ML system supports two modes from day one:

1. Rule-based cold start
2. Trained classifier mode

Rule-based mode works immediately if real survey data is not yet sufficient. Once at least `ML_RETRAIN_THRESHOLD` survey responses are available, the backend can retrain a classifier and switch to model-based predictions.

Training uses:

1. Synthetic seed data in `ml/data/seed_dataset.csv`
2. Real student survey data in `ml/data/survey_data.csv`
3. `RandomForestClassifier` and `GradientBoostingClassifier`
4. Metadata stored in `ml/models/model_metadata.json`

## Run Locally

1. Create and activate a virtual environment.
2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Copy `.env.example` to `.env` and fill in values.
4. Start the API:

```bash
uvicorn app.main:app --reload
```

## Free Supabase Database Setup

1. Create a Supabase project.
2. Open Project Settings.
3. Copy the PostgreSQL connection string.
4. Convert it to async SQLAlchemy format:

```env
DATABASE_URL=postgresql+asyncpg://...
```

## Gemini API Key

1. Open `https://aistudio.google.com`
2. Create an API key.
3. Add it to `.env` as `GEMINI_API_KEY`.

## Deploy to Render Free Tier

1. Push this backend directory to GitHub.
2. Create a new Render Web Service.
3. Use `render.yaml` or configure manually.
4. Add required environment variables in Render.

## Admin Endpoints

Admin routes require header:

```text
X-API-Key: <ADMIN_API_KEY>
```

Main admin endpoints:

1. `POST /api/v1/ml/retrain`
2. `GET /api/v1/ml/status`
3. `GET /api/v1/contact/all`
4. `PATCH /api/v1/contact/{id}/read`
5. `POST /api/v1/survey/manual`
6. `GET /api/v1/survey/all`
7. `GET /api/v1/survey/stats`
8. `POST /api/v1/survey/sync-google-sheet`

## Google Form Setup

Create a Google Form for university students and map fields like this:

1. `Your current major?` -> `respondent_current_major`
2. `Your university?` -> `respondent_university`
3. `Year of study?` -> `respondent_year`
4. `Satisfaction with your choice (1-5)?` -> `respondent_satisfaction`
5. `Your high school Math score?` -> `hs_math_score`
6. `Your interests in high school?` -> `hs_interests`
7. `Would you recommend this major to a similar student?` -> `would_recommend`

Apps Script example:

```javascript
function onFormSubmit(e) {
  var payload = { token: "YOUR_WEBHOOK_TOKEN", form_data: e.namedValues };
  UrlFetchApp.fetch("https://your-api.render.com/api/v1/survey/webhook", {
    method: "POST",
    contentType: "application/json",
    payload: JSON.stringify(payload)
  });
}
```

## Manual Retraining

Call:

```bash
curl -X POST https://your-api/api/v1/ml/retrain -H "X-API-Key: your_key"
```

## How the ML Gets Smarter Over Time

1. Students submit recommendation requests.
2. University students fill the survey form.
3. Survey responses become labeled training examples.
4. The backend retrains and updates saved model files.
5. Future students receive better predictions.

## Notes

1. Seed data is generated automatically on startup if missing.
2. The backend currently creates tables directly with SQLAlchemy metadata.
3. `alembic` is included as a dependency, but migration scripts are not scaffolded yet.
