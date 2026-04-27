# 🚀 FundAI — AI-Powered Crowdfunding Platform

<div align="center">

**FundAI** is a full-stack crowdfunding platform that uses **AI/ML models** to predict campaign success and provide intelligent recommendations to creators and investors.

Built with **React + Vite** (Frontend) and **Flask + SQLAlchemy** (Backend), featuring **Google Gemini AI** integration and **Firebase Authentication**.

</div>

---

## ✨ Features

### For Creators
- 📝 Create and manage crowdfunding campaigns
- 🤖 **AI Success Prediction** — ML model evaluates your campaign and predicts funding probability
- 💡 **Gemini AI Advice** — Get personalized improvement suggestions from Google Gemini
- 📊 Campaign analytics dashboard
- 👥 Team member management
- ❓ FAQ management
- 📰 Campaign updates & milestones

### For Investors
- 🔍 Browse and search campaigns by category/keyword
- 💰 Back projects with reward tiers
- 🔖 Bookmark favorite campaigns
- 💬 Comment and interact with creators
- ✉️ Direct messaging system
- 🔔 Real-time notifications

### Platform Features
- 🔐 JWT + Firebase Auth (Email/Password + Google Sign-In)
- 🛡️ Security headers, rate limiting, input sanitization
- 📱 Fully responsive design with dark theme
- 🎨 Premium UI with animations (Framer Motion)
- 🔍 Full-text search across campaigns and users
- 📈 AI scoring with XGBoost + Deep Learning ensemble

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, Vite, Zustand, Framer Motion, React Router |
| **Backend** | Flask, SQLAlchemy, Flask-CORS |
| **Database** | SQLite (dev) / PostgreSQL (prod) |
| **AI/ML** | TensorFlow, XGBoost, Google Gemini API |
| **Auth** | Firebase Auth + JWT tokens |
| **Styling** | TailwindCSS with custom design system |

---

## 📋 Prerequisites

- **Python 3.10+**
- **Node.js 18+** and npm
- **Firebase project** with Google Sign-In enabled
- **Google Gemini API key** (for AI advice feature)

---

## 🚀 Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/fund-ai.git
cd fund-ai
```

### 2. Backend Setup

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv

# Activate it
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create environment file
cp .env.example .env
# Edit .env and fill in your values (see Environment Variables section below)
```

### 3. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (or use existing)
3. Enable **Authentication** → **Google Sign-In**
4. Go to **Project Settings** → **Service Accounts**
5. Click **Generate New Private Key** → download the JSON file
6. Place it in the `backend/` directory
7. Update the filename reference in `backend/app.py` (search for `SERVICE_ACCOUNT_PATH`)

### 4. Frontend Setup

```bash
# Navigate to frontend
cd ../frontend-react

# Install dependencies
npm install

# Create environment file
cp .env.example .env
# Edit .env if needed (defaults work for local development)
```

### 5. Run the Application

**Terminal 1 — Backend:**
```bash
cd backend
python app.py
```
The API will start at `http://localhost:5000`

**Terminal 2 — Frontend:**
```bash
cd frontend-react
npm run dev
```
The app will start at `http://localhost:5173`

### 6. Open the app

Navigate to `http://localhost:5173` in your browser 🎉

---

## 🔑 Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Required |
|----------|-------------|----------|
| `SECRET_KEY` | JWT signing key (use a random string) | ✅ |
| `DATABASE_URL` | Database connection string | ❌ (defaults to SQLite) |
| `FLASK_DEBUG` | Enable debug mode (`true`/`false`) | ❌ (defaults to `true`) |
| `FRONTEND_URL` | Frontend URL for CORS | ❌ (defaults to `localhost:5173`) |

### Frontend (`frontend-react/.env`)

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_API_URL` | Backend API URL | ❌ (defaults to `http://localhost:5000/api`) |
| `VITE_SERVER_URL` | Backend server URL (for uploads) | ❌ (defaults to `http://localhost:5000`) |

---

## 📁 Project Structure

```
Fund Ai/
├── backend/
│   ├── app.py              # Main Flask application (all routes)
│   ├── models.py           # SQLAlchemy database models
│   ├── ai_evaluator.py     # AI/ML evaluation engine
│   ├── requirements.txt    # Python dependencies
│   ├── .env.example        # Environment variable template
│   └── uploads/            # User-uploaded files (gitignored)
│
├── frontend-react/
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── store/          # Zustand state management
│   │   ├── services/       # API service layer
│   │   └── config/         # Firebase config
│   ├── .env.example        # Environment variable template
│   └── vite.config.js      # Vite configuration
│
├── SOTA_Meta_model.pkl     # XGBoost meta-model
├── SOTA_Preprocessors.pkl  # Data preprocessors
├── SOTA_XGB_model.pkl      # XGBoost base model
└── .gitignore
```

---

## 🛡️ Security Features

- **JWT Authentication** with token expiry
- **Firebase Auth** integration (Google Sign-In)
- **Rate Limiting** on auth endpoints (brute-force protection)
- **Security Headers** (XSS, clickjacking, MIME sniffing protection)
- **Input Sanitization** (strips malicious scripts)
- **CORS Restriction** (only allows known origins)
- **File Upload Limits** (16MB max)
- **Password Strength Validation**

---

## 🤖 AI/ML Pipeline

The AI evaluation system uses an ensemble approach:

1. **Feature Engineering** — Extracts 20+ features from campaign data (goal, duration, category, description length, etc.)
2. **XGBoost Model** — Gradient boosted trees for tabular prediction
3. **Deep Learning Model** — Neural network with text embeddings (FastText)
4. **Meta-Model** — Stacks both models for final prediction
5. **Gemini AI** — Provides natural language advice based on campaign content

---

## 📄 License

This project is for educational purposes. Feel free to use and modify.

---

## 🙏 Acknowledgments

- [Firebase](https://firebase.google.com/) for authentication
- [Google Gemini](https://ai.google.dev/) for AI-powered advice
- [TensorFlow](https://www.tensorflow.org/) & [XGBoost](https://xgboost.ai/) for ML models
- [Framer Motion](https://www.framer.com/motion/) for animations
