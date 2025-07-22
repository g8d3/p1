# Crypto Trading Assistant

This application helps crypto traders find good traders and tokens on Solana and EVMs, and identify trading ideas with statistical data.

## Project Structure

- `backend/`: FastAPI application with SQLModel for API and database interactions.
- `frontend/`: React application with React Admin for the administrative interface.
- `e2e-tests/`: Playwright tests for end-to-end verification.

## Setup and Running

### 1. Backend Setup

Navigate to the `backend` directory and install dependencies:

```bash
cd backend
pip install -r requirements.txt
```

Set the `DATABASE_URL` environment variable. For SQLite, you can use:

```bash
export DATABASE_URL="sqlite:///./database.db"
```

Run the backend server:

```bash
uvicorn main:app --reload --port 8000
```

### 2. Frontend Setup

Navigate to the `frontend` directory and install dependencies:

```bash
cd frontend
npm install
```

Start the frontend development server:

```bash
npm start
```

The frontend application will typically be available at `http://localhost:3000`.

### 3. Running End-to-End Tests

Ensure both the backend and frontend servers are running.

Navigate to the `e2e-tests` directory and run the Playwright tests:

```bash
cd e2e-tests
npx playwright test
```

## Database Customization (Backend)

The database schema is defined in `backend/main.py` using `SQLModel` classes. You can modify these classes to add, remove, or change fields for `Trader`, `Token`, and `TradingIdea`.

## Admin Interface Customization (Frontend)

The admin interface is configured in `frontend/src/App.tsx`. You can customize the list, edit, and show views for each resource (`Trader`, `Token`, `TradingIdea`) by replacing `ListGuesser`, `EditGuesser`, and `ShowGuesser` with custom components provided by React Admin.
