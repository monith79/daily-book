# Gold Market App

A full-stack application for tracking gold prices, managing user alerts, and viewing market data.

## Features

### Backend (FastAPI)
-   **User Authentication:** Registration, login, and JWT-based authentication.
-   **User Profile Management:** View and update user username and email.
-   **Gold Price Data:** Fetches current and historical gold prices from an external API (GoldAPI.io) with fallback to mock data if the API key is missing or calls fail.
-   **Gold Price Alerts:** Allows authenticated users to create, view, update, and delete personalized gold price alerts.
-   **MongoDB Integration:** Uses MongoDB for persistent storage of user and alert data.

### Frontend (React)
-   **Real-time Price Display:** Displays current gold prices (from backend API) and mock silver/platinum prices.
-   **Unit Conversion:** Toggle between Ounce (oz) and Tael (Hong Kong) units for price display.
-   **Interactive Gold Price Chart:** Visualizes historical gold price data using Recharts.
-   **Central Bank Data:** Displays estimated gold purchases by central banks (static data).
-   **User Interface:** Intuitive UI for navigation, authentication, and profile management.
-   **Protected Routes:** Ensures sensitive areas like the Dashboard and Profile are accessible only to authenticated users.

## Technologies Used

### Backend
-   Python 3.9+
-   FastAPI
-   Pydantic
-   PyMongo
-   python-dotenv
-   Passlib (for password hashing)
-   python-jose (for JWT)
-   httpx (for API calls)
-   Uvicorn (ASGI server)
-   MongoDB

### Frontend
-   React
-   React Router DOM
-   Axios
-   Tailwind CSS
-   Lucide React (icons)
-   Recharts (charting library)
-   npm (package manager)

## Project Structure

```
gold-market-app/
│
├── backend/                 # Python / FastAPI backend
│   ├── app/
│   │   ├── main.py          # Entry point (FastAPI app, CORS, lifespan)
│   │   ├── config.py        # Configuration (DB, API keys)
│   │   ├── models/          # Database models (Pydantic models for MongoDB)
│   │   │    └── user.py
│   │   │    └── gold_price.py
│   │   │    └── alert.py
│   │   ├── schemas/         # Pydantic models (validation for requests/responses)
│   │   │    └── user_schema.py
│   │   │    └── gold_schema.py
│   │   ├── routes/          # API routes
│   │   │    └── gold.py
│   │   │    └── user.py
│   │   │    └── alert.py
│   │   ├── services/        # Business logic (fetch API, alerts)
│   │   │    └── gold_service.py
│   │   │    └── alert_service.py
│   │   └── dependencies.py  # Shared dependencies (e.g., get_database)
│   │
│   ├── requirements.txt     # Python dependencies
│   └── Dockerfile           # Optional containerization
│
├── frontend/                # React frontend
│   ├── public/              # Static files (index.html)
│   ├── src/
│   │   ├── components/      # React components (Header, GoldCard, PriceChart, Button, Card, PrivateRoute)
│   │   │    └── Header.js
│   │   │    └── GoldCard.js
│   │   │    └── PriceChart.js
│   │   │    └── PrivateRoute.js
│   │   │    └── Button.js
│   │   │    └── Card.js
│   │   ├── pages/           # Main pages
│   │   │    └── Home.js
│   │   │    └── Dashboard.js
│   │   │    └── Login.js
│   │   │    └── Register.js
│   │   │    └── Profile.js
│   │   ├── services/        # API calls (axios setup)
│   │   │    └── api.js
│   │   ├── context/         # React context (user/auth)
│   │   │    └── AuthContext.js
│   │   ├── hooks/           # Custom hooks (e.g., useGoldPrice)
│   │   │    └── useGoldPrice.js
│   │   ├── styles/          # CSS / Tailwind
│   │   │    └── globals.css
│   │   └── App.js           # React app entry
│   │   └── index.js
│   │
│   ├── package.json
│   └── tailwind.config.js   # Tailwind CSS configuration
│
├── scripts/                 # Optional: DB seeding, cron jobs
│   └── seed_gold_data.py
│
├── .gitignore
└── README.md                # This file

## Setup Instructions

### Prerequisites
-   **Python 3.9+** (with `pip` and `venv` module)
-   **Node.js** (LTS version recommended, with `npm` or `yarn`)
-   **MongoDB:** A running MongoDB instance (local or cloud-hosted).

### 1. Backend Setup

1.  **Navigate to the backend directory:**
    ```bash
    cd backend
    ```
2.  **Create and activate a Python virtual environment:**
    ```bash
    python -m venv venv
    # On macOS/Linux:
    source venv/bin/activate
    # On Windows (Command Prompt):
    # venv\Scripts\activate.bat
    # On Windows (PowerShell):
    # venv\Scripts\Activate.ps1
    ```
3.  **Install Python dependencies:**
    ```bash
    pip install -r requirements.txt
    ```
4.  **Create a `.env` file:**
    In the `backend/` directory, create a file named `.env` and add your configuration:
    ```env
    MONGO_CONNECTION_STRING=mongodb://localhost:27017/ # Or your MongoDB URI
    MONGO_DB_NAME=gold_market_db
    SECRET_KEY=YOUR_SUPER_SECRET_RANDOM_KEY_AT_LEAST_32_CHARS # Crucial for JWT security
    GOLD_API_KEY=YOUR_GOLDAPI_IO_API_KEY # Get from goldapi.io (optional, will use mock if not set)
    ```
    *   Replace `YOUR_SUPER_SECRET_RANDOM_KEY_AT_LEAST_32_CHARS` with a strong, randomly generated key.
    *   If you don't provide a `GOLD_API_KEY`, the backend will serve mock gold price data.
5.  **Run the FastAPI server:**
    ```bash
    uvicorn app.main:app --reload
    ```
    The backend should start and be accessible at `http://127.0.0.1:8000`. You can verify by visiting `http://127.0.0.1:8000/docs` in your browser.

### 2. Frontend Setup

1.  **Open a new terminal window** (keep the backend terminal running).
2.  **Navigate to the frontend directory:**
    ```bash
    cd frontend
    ```
3.  **Install Node.js dependencies:**
    ```bash
    npm install
    ```
4.  **Run the React development server:**
    ```bash
    npm start
    ```
    The frontend application will usually open automatically in your browser at `http://localhost:3000`.

## Usage

1.  **Home Page (`/`)**: View current gold, silver (mock), and platinum (mock) prices. See the interactive gold price chart and the list of central bank gold purchases. Switch between Ounce and Tael units.
2.  **Register (`/register`)**: Create a new user account.
3.  **Login (`/login`)**: Log in to access personalized features.
4.  **Dashboard (`/dashboard`)**: (Requires login) Manage your gold price alerts: create, view, edit, and delete alerts.
5.  **Profile (`/profile`)**: (Requires login) View your user information and update your username or email.

## Recent Updates

-   **Profile Management:** Implemented user profile management, including a new `Profile.js` page in the frontend.
-   **API Service Updates:** Added `updateUserProfile` function to `frontend/src/services/api.js`.
-   **Frontend Routing:** Added a protected `/profile` route in `frontend/src/App.js` and a corresponding link in `frontend/src/components/Header.js`.
-   **Circular Import Resolution:** Addressed circular import issues in the backend by centralizing database dependency (`get_database`) in `backend/app/dependencies.py` and updating imports across routes.

## Current Limitations & Future Enhancements

-   **Silver & Platinum Prices:** Currently, silver and platinum prices are mocked in the frontend. Integrating real-time data for these metals would require extending the backend to fetch data from an external API.
-   **Tael Conversion:** The Tael conversion factor is based on the standard Hong Kong Tael. Further refinement or user choice for different Tael standards could be added.
-   **Percentage Change:** Displaying the % up/down for prices requires tracking previous values.
-   **Alert Notifications:** Implementing real-time notifications when an alert is triggered would be a significant enhancement.
-   **Advanced Charting:** Adding features like date range selection, comparison of multiple metals on a single chart, or different chart types.
-   **Portfolio Tracking:** Allow users to record their gold/silver/platinum holdings and track their value.
-   **News Feed:** Integrate a relevant news feed for precious metals.