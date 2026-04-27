"""
FundAI - AI Evaluator Module
Integrates TensorFlow, XGBoost, and Gemini for campaign evaluation
Falls back to mock predictions if ML libraries unavailable
"""

import os
import sys
import random

# Fix Windows console encoding
if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except:
        pass

# Try importing heavy ML libraries
NUMPY_AVAILABLE = False
TF_AVAILABLE = False
XGB_AVAILABLE = False
GENAI_AVAILABLE = False

# Allow skipping heavy ML libs via env var for low-memory environments
SKIP_ML = os.environ.get('SKIP_ML', '').lower() in ('1', 'true', 'yes')

try:
    import numpy as np
    import pandas as pd
    NUMPY_AVAILABLE = True
except ImportError:
    print("[INFO] NumPy/Pandas not available. Using mock predictions.")

try:
    import pickle
    TF_AVAILABLE = True
except ImportError:
    pass

if SKIP_ML:
    TF_AVAILABLE = False
    XGB_AVAILABLE = False
    print("[INFO] SKIP_ML=1: Skipping TensorFlow/XGBoost. Using mock predictions.")
else:
    try:
        os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
        import tensorflow as tf
        from tensorflow.keras.models import load_model
        from tensorflow.keras.preprocessing.sequence import pad_sequences
    except (ImportError, MemoryError):
        TF_AVAILABLE = False
        print("[INFO] TensorFlow not available. Using mock predictions.")

    try:
        import xgboost
        XGB_AVAILABLE = True
    except (ImportError, MemoryError):
        print("[INFO] XGBoost not available. Using mock predictions.")

# Gemini API - Match exact Colab implementation
try:
    from google import genai
    from google.genai import types
    GENAI_AVAILABLE = True
except ImportError:
    genai = None
    types = None
    print("[INFO] google-genai not installed. Gemini advice will be unavailable.")

# Configuration
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY', 'AIzaSyAprF2acxWXU5L3PSO6MtTXXFzJsaj-zsU')
MODEL_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # Parent directory
MAX_LEN = 30

# Initialize Gemini client - exactly like Colab
client = None
if GENAI_AVAILABLE and GEMINI_API_KEY:
    try:
        client = genai.Client(api_key=GEMINI_API_KEY)
        print("[OK] Gemini client initialized")
    except Exception as e:
        print(f"[WARN] Could not initialize Gemini client: {e}")


class AIEvaluator:
    """AI-powered campaign evaluator using ML models and Gemini"""
    
    def __init__(self):
        self.preps = None
        self.model_dl = None
        self.model_xgb = None
        self.model_meta = None
        self.loaded = False
        self.using_mock = True
        
    def load_models(self):
        """Load all ML models from disk"""
        if not TF_AVAILABLE or not XGB_AVAILABLE or not NUMPY_AVAILABLE:
            print("[INFO] ML libraries not fully available. Using mock predictions.")
            self.using_mock = True
            return False
            
        print(f"[INFO] Loading AI models from: {MODEL_DIR}")
        
        try:
            tf.get_logger().setLevel('ERROR')
        except:
            pass
        
        required_files = [
            "SOTA_Preprocessors.pkl",
            "SOTA_DL_FastText_model.h5",
            "SOTA_XGB_model.pkl",
            "SOTA_Meta_model.pkl"
        ]
        
        # Check all files exist
        for f in required_files:
            filepath = os.path.join(MODEL_DIR, f)
            if not os.path.exists(filepath):
                print(f"[WARN] Model file not found: '{f}'. Using mock predictions.")
                self.using_mock = True
                return False
        
        try:
            # Load preprocessors
            with open(os.path.join(MODEL_DIR, "SOTA_Preprocessors.pkl"), 'rb') as f:
                self.preps = pickle.load(f)
            
            # Load Deep Learning model
            self.model_dl = load_model(
                os.path.join(MODEL_DIR, "SOTA_DL_FastText_model.h5"),
                compile=False
            )
            
            # Load XGBoost model
            with open(os.path.join(MODEL_DIR, "SOTA_XGB_model.pkl"), 'rb') as f:
                self.model_xgb = pickle.load(f)
            
            # Load Meta model
            with open(os.path.join(MODEL_DIR, "SOTA_Meta_model.pkl"), 'rb') as f:
                self.model_meta = pickle.load(f)
            
            self.loaded = True
            self.using_mock = False
            print("[OK] All AI models loaded successfully!")
            return True
            
        except Exception as e:
            print(f"[WARN] Error loading models: {e}. Using mock predictions.")
            self.using_mock = True
            return False
    
    def preprocess_input(self, data_dict):
        """Preprocess input data for model prediction"""
        df = pd.DataFrame([data_dict])
        
        # Log transformations
        cols_to_log = ['usd_goal', 'duration_days', 'prep_days', 'name_length', 'blurb_length']
        for col in cols_to_log:
            df[f'log_{col}'] = np.log1p(df[col])
        
        df['has_video'] = df['has_video'].astype(int)
        df['blurb'] = df['blurb'].astype(str)
        
        # Text processing
        tokenizer = self.preps['tokenizer']
        seqs = tokenizer.texts_to_sequences(df['blurb'])
        X_text = pad_sequences(seqs, maxlen=MAX_LEN, padding='post', truncating='post')
        
        # Numerical and categorical processing
        scaler_dl = self.preps['scaler_dl']
        ohe_dl = self.preps['ohe_dl']
        
        num_cols = ['log_usd_goal', 'log_duration_days', 'log_prep_days',
                    'log_name_length', 'log_blurb_length', 'has_video']
        cat_cols = ['main_category', 'country']
        
        X_num = scaler_dl.transform(df[num_cols])
        X_cat = ohe_dl.transform(df[cat_cols])
        X_tab_dl = np.hstack((X_num, X_cat))
        
        X_xgb = self.preps['preprocessor_xgb'].transform(df)
        
        return X_text, X_tab_dl, X_xgb
    
    def _mock_predict(self, campaign_data):
        """Generate mock predictions based on campaign characteristics"""
        # Base score
        score = 0.5
        
        # Video bonus
        if campaign_data.get('has_video'):
            score += 0.1
        
        # Goal penalty (higher goals = lower probability)
        goal = campaign_data.get('usd_goal', 10000)
        if goal < 5000:
            score += 0.1
        elif goal > 50000:
            score -= 0.15
        elif goal > 100000:
            score -= 0.25
        
        # Duration adjustment
        duration = campaign_data.get('duration_days', 30)
        if 25 <= duration <= 35:
            score += 0.05  # Optimal duration
        elif duration > 50:
            score -= 0.08
        
        # Blurb length bonus
        blurb_len = len(campaign_data.get('blurb', ''))
        if blurb_len > 100:
            score += 0.05
        if blurb_len > 200:
            score += 0.05
        
        # Add some randomness
        score += random.uniform(-0.08, 0.08)
        
        # Clamp between 0.15 and 0.92
        score = max(0.15, min(0.92, score))
        
        # Generate component scores
        dl_score = score + random.uniform(-0.05, 0.05)
        xgb_score = score + random.uniform(-0.05, 0.05)
        
        dl_score = max(0.1, min(0.95, dl_score))
        xgb_score = max(0.1, min(0.95, xgb_score))
        
        return score, dl_score, xgb_score
    
    def predict(self, campaign_data):
        """Generate success probability prediction"""
        # Use mock predictions if real models unavailable
        if self.using_mock or not self.loaded:
            print("[INFO] Using mock prediction (ML libraries not available)")
            return self._mock_predict(campaign_data)
        
        # Prepare data
        data = {
            'usd_goal': campaign_data['usd_goal'],
            'duration_days': campaign_data['duration_days'],
            'prep_days': campaign_data.get('prep_days', 30),
            'name_length': len(campaign_data['name']),
            'blurb_length': len(campaign_data['blurb']),
            'main_category': campaign_data['main_category'],
            'country': campaign_data['country'],
            'blurb': campaign_data['blurb'],
            'has_video': 1 if campaign_data.get('has_video') else 0,
            'name': campaign_data['name']
        }
        
        try:
            X_text, X_tab_dl, X_xgb = self.preprocess_input(data)
            
            # Deep Learning prediction
            pred_dl = self.model_dl.predict([X_text, X_tab_dl], verbose=0).flatten()[0]
            
            # XGBoost prediction
            pred_xgb = self.model_xgb.predict_proba(X_xgb)[:, 1][0]
            
            # Meta model ensemble
            stack = np.column_stack((pred_dl, pred_xgb))
            final_prob = self.model_meta.predict_proba(stack)[:, 1][0]
            
            return float(final_prob), float(pred_dl), float(pred_xgb)
            
        except Exception as e:
            print(f"Prediction error: {e}. Falling back to mock.")
            return self._mock_predict(campaign_data)
    
    def get_gemini_advice(self, campaign_data, probability, dl_score=None, xgb_score=None):
        """Get strategic advice from Gemini AI acting as Kickstarter project valuator"""
        if not client:
            return self._mock_gemini_advice(campaign_data, probability)
        
        dl_pct = f"{dl_score:.1%}" if dl_score is not None else "N/A"
        xgb_pct = f"{xgb_score:.1%}" if xgb_score is not None else "N/A"
        
        tone = "brutally honest and critical" if probability < 0.4 else (
            "direct, constructive, and analytical" if probability < 0.7 else 
            "encouraging but still pushing for excellence"
        )
        
        prompt = f"""You are a **Senior Kickstarter Project Valuator** with 15+ years of experience evaluating crowdfunding campaigns. You have analyzed over 50,000 Kickstarter projects and helped raise $200M+ in crowdfunding.

You have two proprietary AI models that scored this project:

🧠 **Deep Learning Model (NLP + Text Analysis)** — This model analyzed the campaign's text quality, blurb persuasiveness, name appeal, and linguistic patterns from 200K+ historical Kickstarter campaigns. 
   → Confidence Score: **{dl_pct}**

📊 **XGBoost Numerical Model (Feature Engineering)** — This model evaluated the campaign's structural factors: funding goal realism, duration optimization, category competitiveness, country market size, video presence, and preparation time.
   → Confidence Score: **{xgb_pct}**

🎯 **Final Ensemble Prediction (Meta-Model)** — A Logistic Regression meta-learner that combines both models for the final success probability.
   → Final Score: **{probability:.1%}**

--- PROJECT BEING EVALUATED ---
📌 Title: "{campaign_data['name']}"
📝 Pitch/Blurb: "{campaign_data['blurb']}"
📄 Full Description: "{campaign_data.get('description', 'Not provided')}"
🏷️ Category: {campaign_data['main_category']}
💰 Funding Goal: ${campaign_data['usd_goal']:,.2f}
⏱️ Campaign Duration: {campaign_data['duration_days']} days
📅 Preparation Time: {campaign_data.get('prep_days', 30)} days
🌍 Country: {campaign_data['country']}
🎥 Has Video: {'Yes ✅' if campaign_data.get('has_video') else 'No ❌'}

--- YOUR TASK ---
Be {tone}. Give a **thorough, detailed valuation report** as if you were presenting to the project creator. This is their chance to improve before launch.

Structure your response EXACTLY like this:

## 🎯 AI Valuation Summary

Start with a powerful 2-3 sentence executive summary of the project's chances. Mention the final score and what it means in real Kickstarter terms (e.g., "Projects scoring above 70% historically have an 85% success rate on Kickstarter").

## 🧠 Deep Learning Model Analysis ({dl_pct})

Explain what the text-analysis AI detected. Analyze:
- How compelling is the campaign name? Does it grab attention?
- Is the blurb persuasive? Does it create urgency or curiosity?
- How does the text quality compare to successful campaigns in the {campaign_data['main_category']} category?
- What linguistic patterns helped or hurt the score?

## 📊 Numerical Model Analysis ({xgb_pct})

Explain what the structural/numerical AI found. Analyze:
- Is the ${campaign_data['usd_goal']:,.0f} goal realistic for {campaign_data['main_category']}? Compare to category averages.
- Is {campaign_data['duration_days']} days the right duration? What's optimal?
- How competitive is the {campaign_data['main_category']} category on Kickstarter?
- Impact of {'having' if campaign_data.get('has_video') else 'NOT having'} a video (cite the stat that video campaigns are 85% more successful).
- Country ({campaign_data['country']}) market analysis.

## 💪 Project Strengths

List 3-4 specific things this project is doing RIGHT. Be genuine and specific.

## ⚠️ Critical Weaknesses

List 3-4 specific issues that are HURTING this project's chances. Be direct and actionable.

## 🚀 5 High-Impact Improvements

Give exactly 5 specific, actionable recommendations ranked by impact. For each one:
- State the problem
- Give the specific fix
- Estimate how much it could improve the score

## ✍️ Rewritten Blurb

Write a completely new, optimized blurb (under 150 characters) that would score higher with our AI models. Explain why your version is better.

## 💰 Funding Strategy Recommendation

Based on the goal of ${campaign_data['usd_goal']:,.0f}, recommend:
- Day 1 funding target (ideally 30%)
- Whether to use stretch goals
- Optimal reward tier pricing strategy
- Pre-launch email list size needed

## 🏆 Final Verdict

Give a final GO / REVISE / RETHINK recommendation with a clear explanation.

IMPORTANT: Be specific, cite real Kickstarter data patterns where relevant, and make every sentence actionable. Do NOT be generic. This creator is counting on you."""
        
        try:
            print("[INFO] Calling Gemini 3-flash-preview for valuation report...")
            response = client.models.generate_content(
                model="gemini-3-flash-preview",
                contents=prompt
            )
            print(f"[OK] Gemini response received ({len(response.text)} chars)")
            return response.text
        except Exception as e:
            print(f"[WARN] Gemini 2.5-flash error: {e}")
            # Fallback to older model
            try:
                print(f"[INFO] Gemini 3 unavailable, trying 2.5-flash...")
                response = client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=prompt
                )
                print(f"[OK] Gemini 2.5 response received ({len(response.text)} chars)")
                return response.text
            except Exception as e2:
                print(f"[WARN] Gemini 2.0-flash error: {e2}")
                return self._mock_gemini_advice(campaign_data, probability)
    
    def _mock_gemini_advice(self, campaign_data, probability):
        """Generate mock strategic advice when Gemini unavailable"""
        has_video = campaign_data.get('has_video', False)
        goal = campaign_data.get('usd_goal', 10000)
        
        advice = f"""## AI Analysis Summary

### Score Interpretation
Your campaign received a **{probability:.0%} success probability**. """
        
        if probability >= 0.7:
            advice += "This is an excellent score indicating strong potential for success!\n\n"
        elif probability >= 0.5:
            advice += "This is a moderate score. With some improvements, you could significantly increase your chances.\n\n"
        else:
            advice += "This score suggests there's room for improvement. Focus on the recommendations below.\n\n"
        
        advice += """### Key Recommendations

**1. """
        
        if not has_video:
            advice += "Add a Campaign Video**\nCampaigns with videos have 85% higher success rates. Create a compelling 2-3 minute video explaining your project and your story.\n\n"
        else:
            advice += "Optimize Your Video**\nMake sure your video is under 3 minutes, starts strong, and clearly explains the value proposition within the first 30 seconds.\n\n"
        
        advice += "**2. "
        
        if goal > 50000:
            advice += "Consider Lowering Your Goal**\nHigh funding goals can be intimidating to backers. Consider starting with a smaller initial goal and using stretch goals.\n\n"
        else:
            advice += "Build Pre-Launch Momentum**\nStart building an email list and social media following before launch. Aim to fund 30% on day one.\n\n"
        
        advice += """**3. Strengthen Your Pitch**
Review your blurb and make sure it:
- Clearly states the problem you're solving
- Explains your unique solution
- Creates urgency for backers to act now

### Suggested Improved Blurb
"""
        
        advice += f'"{campaign_data["name"]} - the innovative solution that [key benefit]. Join {random.randint(50, 500)} early supporters who are already excited about [specific outcome]. Back us today and be part of something extraordinary."\n'
        
        advice += "\n*Note: This is AI-generated guidance. Full Gemini integration will provide more personalized advice.*"
        
        return advice


# Global evaluator instance
evaluator = AIEvaluator()
