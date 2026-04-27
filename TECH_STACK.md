# Fund AI - Technology Stack

Based on the project configuration, the **Fund AI** platform is built using a modern decoupled architecture with a Python/Flask backend and a React frontend. 

## Frontend (User Interface)

*   **Core Framework**: React 19
*   **Build Tool**: Vite (for fast, optimized development and building)
*   **Styling**: Tailwind CSS (v4) for utility-first styling and responsiveness
*   **Routing**: React Router DOM (v7) for handling page navigation
*   **State Management**: Zustand (a lightweight state management library)
*   **Animations**: Framer Motion (for smooth, advanced UI animations)
*   **Data Visualization**: Chart.js with `react-chartjs-2` (for rendering analytics and graphs)
*   **API Client**: Axios (for making HTTP requests to the backend)
*   **UI Components**: `react-icons` for iconography and `react-hot-toast` for popup notifications

## Backend (API & Machine Learning)

*   **Core Framework**: Python with Flask (v3)
*   **Database ORM**: Flask-SQLAlchemy (for interacting with the SQL database)
*   **Server**: Gunicorn & Werkzeug (for production deployment)
*   **Cross-Origin**: Flask-CORS (to allow the React frontend to communicate with the API)
*   **Image Processing**: Pillow

## Artificial Intelligence & Machine Learning

The backend incorporates several AI technologies for evaluating and analyzing data:

*   **Google GenAI SDK**: For interacting with Google's generative models
*   **Deep Learning**: TensorFlow (v2.15) for neural networks
*   **Machine Learning**: XGBoost and Scikit-learn
*   **Data Processing**: Pandas and NumPy
*   **Saved Models**: The system utilizes pre-trained models such as a FastText deep learning model (`SOTA_DL_FastText_model.h5`), an XGBoost model (`SOTA_XGB_model.pkl`), and a Meta model (`SOTA_Meta_model.pkl`).
