"""
FundAI - Main Flask Application
Crowdfunding platform with AI-powered campaign evaluation
"""

import os
import uuid
import re
import jwt as pyjwt
from datetime import datetime, timedelta
from functools import wraps
from flask import Flask, request, jsonify, send_from_directory, abort
from flask_cors import CORS
from werkzeug.utils import secure_filename
from werkzeug.security import generate_password_hash, check_password_hash
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Ensure Python can verify HTTPS certs (fixes Firebase login on Windows)
try:
    import certifi
    os.environ.setdefault('SSL_CERT_FILE', certifi.where())
    os.environ.setdefault('REQUESTS_CA_BUNDLE', certifi.where())
except ImportError:
    pass

FIREBASE_PROJECT_ID = os.environ.get('FIREBASE_PROJECT_ID', 'fund-ai-5f3ed')

from models import (
    db,
    User, Campaign, Investment, CampaignImage,
    CampaignUpdate, Comment, Bookmark, Review,
    Milestone, Reward, Notification, Payment,
    FAQ, Message, ScheduledUpdate, AnalyticsEvent,
    TeamMember, Referral, ReferralUse,
    user_to_dict, campaign_to_dict, investment_to_dict, campaign_image_to_dict,
    campaign_update_to_dict, comment_to_dict, bookmark_to_dict, review_to_dict,
    milestone_to_dict, reward_to_dict, notification_to_dict, payment_to_dict,
    faq_to_dict, message_to_dict, scheduled_update_to_dict, analytics_event_to_dict,
    team_member_to_dict, referral_to_dict, referral_use_to_dict,
    campaign_funding_percentage, campaign_days_remaining,
    set_password, check_password
)
from ai_evaluator import evaluator
import firebase_admin
from firebase_admin import credentials, auth

# Configuration
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads', 'avatars')
CAMPAIGN_UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads', 'campaigns')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

# Create Flask app
app = Flask(__name__, static_folder='../frontend', static_url_path='')
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'fundai-dev-key-change-me-in-production')
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///' + os.path.join(BASE_DIR, 'fundai.db'))
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['CAMPAIGN_UPLOAD_FOLDER'] = CAMPAIGN_UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max upload size

# Initialize SQLAlchemy
db.init_app(app)

# Initialize extensions
CORS(app, origins=[
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:5176',
    'http://localhost:5177',
    'http://localhost:5178',
    'http://localhost:5179',
    'http://localhost:5180',
    'http://localhost:5000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
    'http://127.0.0.1:5175',
    'http://127.0.0.1:5176',
    'http://127.0.0.1:5177',
    'http://127.0.0.1:5178',
    'http://127.0.0.1:5179',
    'http://127.0.0.1:5180',
    'http://127.0.0.1:5000',
    # Production URLs
    'https://eidsalma530-droid.github.io',
    'https://eidzzzzzzzzzzz-fundai-backend.hf.space',
    os.environ.get('FRONTEND_URL', 'http://localhost:5173'),
], supports_credentials=True, methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], allow_headers=['Content-Type', 'Authorization'])

def _run_schema_migrations():
    """Apply lightweight SQLite migrations for new columns."""
    from sqlalchemy import inspect, text
    inspector = inspect(db.engine)
    if 'users' not in inspector.get_table_names():
        return
    columns = {col['name'] for col in inspector.get_columns('users')}
    if 'creator_downgraded' not in columns:
        db.session.execute(text('ALTER TABLE users ADD COLUMN creator_downgraded BOOLEAN DEFAULT 0'))
        db.session.commit()
        print('✅ Added users.creator_downgraded column')


# Initialize SQLite database
with app.app_context():
    db.create_all()
    _run_schema_migrations()
    print("✅ SQLite database initialized")
# Ensure upload directories exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(CAMPAIGN_UPLOAD_FOLDER, exist_ok=True)


# ============== SECURITY MIDDLEWARE ==============

@app.after_request
def add_security_headers(response):
    """Add security headers to every response"""
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'SAMEORIGIN'  # SAMEORIGIN allows Firebase popup flow
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    response.headers['Permissions-Policy'] = 'camera=(), microphone=(), geolocation=()'
    # Allow Firebase Auth popups to communicate back
    response.headers['Cross-Origin-Opener-Policy'] = 'same-origin-allow-popups'
    # Only add HSTS in production (when not localhost)
    if not request.host.startswith('localhost') and not request.host.startswith('127.'):
        response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    return response


@app.errorhandler(413)
def too_large(e):
    """Handle file too large errors"""
    return jsonify({'error': 'File too large. Maximum size is 16MB.'}), 413


# Simple in-memory rate limiter for auth endpoints
_rate_limit_store = {}

def rate_limit(max_requests=5, window_seconds=60):
    """Simple rate limiter decorator for sensitive endpoints"""
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            ip = request.remote_addr
            key = f'{f.__name__}:{ip}'
            now = datetime.utcnow()
            
            if key not in _rate_limit_store:
                _rate_limit_store[key] = []
            
            # Clean old entries
            _rate_limit_store[key] = [
                t for t in _rate_limit_store[key]
                if (now - t).total_seconds() < window_seconds
            ]
            
            if len(_rate_limit_store[key]) >= max_requests:
                return jsonify({
                    'error': 'Too many requests. Please try again later.'
                }), 429
            
            _rate_limit_store[key].append(now)
            return f(*args, **kwargs)
        return decorated
    return decorator


def sanitize_input(text, max_length=10000):
    """Sanitize user text input to prevent XSS and injection"""
    if not text:
        return text
    if not isinstance(text, str):
        return text
    # Truncate to max length
    text = text[:max_length]
    # Strip dangerous HTML tags (keep basic text)
    text = re.sub(r'<script[^>]*>.*?</script>', '', text, flags=re.DOTALL | re.IGNORECASE)
    text = re.sub(r'<iframe[^>]*>.*?</iframe>', '', text, flags=re.DOTALL | re.IGNORECASE)
    text = re.sub(r'on\w+\s*=', '', text, flags=re.IGNORECASE)
    text = re.sub(r'javascript:', '', text, flags=re.IGNORECASE)
    return text.strip()

# Initialize Firebase Admin
import json as _json

SERVICE_ACCOUNT_PATH = os.path.join(BASE_DIR, 'fund-ai-5f3ed-firebase-adminsdk-fbsvc-3b27ddb860.json')
FIREBASE_CONFIG_JSON = os.environ.get('FIREBASE_CONFIG_JSON')

try:
    if FIREBASE_CONFIG_JSON:
        # Option 1: Read credentials from environment variable (Render / cloud deployment)
        service_info = _json.loads(FIREBASE_CONFIG_JSON)
        cred = credentials.Certificate(service_info)
        firebase_admin.initialize_app(cred)
        print("✅ Firebase Admin initialized from FIREBASE_CONFIG_JSON env var")
    elif os.path.exists(SERVICE_ACCOUNT_PATH):
        # Option 2: Read credentials from local JSON file (local development)
        cred = credentials.Certificate(SERVICE_ACCOUNT_PATH)
        firebase_admin.initialize_app(cred)
        print("✅ Firebase Admin initialized with service account key file")
    else:
        # Option 3: Fallback — initialize with just the project ID
        cred = credentials.ApplicationDefault() if os.environ.get('GOOGLE_APPLICATION_CREDENTIALS') else None
        firebase_admin.initialize_app(cred, {'projectId': 'fund-ai-5f3ed'}) if cred else firebase_admin.initialize_app(options={'projectId': 'fund-ai-5f3ed'})
        print("⚠️ Firebase Admin initialized with project ID only. Set FIREBASE_CONFIG_JSON env var for full functionality.")
except Exception as e:
    print(f"⚠️ Firebase Admin init warning: {e}. Google Sign-In token verification may not work.")


# ============== JWT HELPERS ==============

def _is_firebase_token_retriable_error(error_msg):
    """Whether Firebase token verification can fall back to local decode."""
    lowered = error_msg.lower()
    return any(marker in lowered for marker in (
        'token used too early',
        'iat',
        'clock',
        'ssl',
        'certificate',
        'certIFICATE_VERIFY_FAILED'.lower(),
        'connection',
        'retries exceeded',
    ))


def _decode_firebase_id_token(id_token):
    """Verify Firebase ID token, with fallbacks for clock skew and SSL issues."""
    try:
        return auth.verify_id_token(id_token, clock_skew_seconds=60)
    except Exception as primary_error:
        error_msg = str(primary_error)
        if not _is_firebase_token_retriable_error(error_msg):
            raise

        print(f"⚠️ Firebase token verification fallback: {error_msg}")

        try:
            import google.auth.transport.requests
            import google.oauth2.id_token

            request_adapter = google.auth.transport.requests.Request()
            return google.oauth2.id_token.verify_firebase_token(
                id_token,
                request_adapter,
                audience=FIREBASE_PROJECT_ID,
                clock_skew_in_seconds=600,
            )
        except Exception as fallback_error:
            print(f"⚠️ OAuth fallback failed: {fallback_error}")

        payload = pyjwt.decode(id_token, options={'verify_signature': False})
        now = datetime.utcnow().timestamp()

        if payload.get('exp', 0) < now - 60:
            raise ValueError('Token expired') from primary_error

        iss = payload.get('iss', '')
        if not iss.startswith('https://securetoken.google.com/'):
            raise ValueError('Invalid token issuer') from primary_error

        aud = payload.get('aud', '')
        if aud != FIREBASE_PROJECT_ID:
            raise ValueError('Invalid token audience') from primary_error

        return payload


def generate_token(user_id):
    """Generate a JWT token for a user"""
    payload = {
        'user_id': user_id,
        'exp': datetime.utcnow() + timedelta(days=7),
        'iat': datetime.utcnow()
    }
    return pyjwt.encode(payload, app.config['SECRET_KEY'], algorithm='HS256')


def token_required(f):
    """Decorator to protect routes with JWT"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
        
        if not token:
            return jsonify({'error': 'Authentication required'}), 401
        
        try:
            data = pyjwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            current_user = User.query.get(data['user_id'])
            if not current_user:
                return jsonify({'error': 'Invalid token'}), 401
        except pyjwt.ExpiredSignatureError:
            return jsonify({'error': 'Token expired'}), 401
        except pyjwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token'}), 401
        
        return f(current_user, *args, **kwargs)
    return decorated


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def validate_investment_eligibility(user_id, campaign):
    """Return (ok, error_message, status_code) for backing a campaign."""
    user = User.query.get(user_id)
    if not user:
        return False, 'User not found', 404

    if user.role == 'creator':
        return False, 'Creator accounts cannot back campaigns. Switch to investor mode to support other projects.', 403

    if campaign.creator_id == user_id:
        return False, 'You cannot back your own campaigns', 403

    return True, None, None


def update_campaign_status(campaign):
    """Update campaign status based on funding progress"""
    old_status = campaign.status
    goal = campaign.usd_goal or 0
    raised = campaign.amount_raised or 0
    
    # Calculate funding percentage
    funding_pct = (raised / goal * 100) if goal > 0 else 0
    
    # Determine new status
    new_status = old_status
    if funding_pct >= 100:
        new_status = 'funded'
    elif funding_pct >= 75:
        new_status = 'almost_funded'
    elif funding_pct >= 50:
        new_status = 'halfway'
    elif funding_pct > 0:
        new_status = 'active'
    
    # Update in DB
    campaign.status = new_status
    db.session.commit()
    
    # If status changed, notify creator
    if new_status != old_status:
        status_messages = {
            'funded': f'Your campaign "{campaign.name}" has reached its funding goal!',
            'almost_funded': f'Your campaign "{campaign.name}" is 75% funded!',
            'halfway': f'Your campaign "{campaign.name}" is 50% funded!'
        }
        
        if new_status in status_messages:
            status_title = new_status.replace("_", " ").title()
            notif = Notification(
                user_id=campaign.creator_id,
                type='milestone',
                title=f'Campaign Status: {status_title}',
                message=status_messages[new_status],
                link=f'/campaign/{campaign.id}',
                is_read=False,
            )
            db.session.add(notif)
            db.session.commit()
    
    return new_status


# ============== STATIC FILE ROUTES ==============

@app.route('/')
def serve_index():
    return send_from_directory(app.static_folder, 'index.html')


@app.route('/<path:path>')
def serve_static(path):
    if os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, 'index.html')


@app.route('/uploads/avatars/<path:filename>')
def serve_avatar(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)


# ============== AUTH ROUTES ==============

@app.route('/api/auth/signup', methods=['POST'])
@rate_limit(max_requests=5, window_seconds=300)
def signup():
    """Register a new user"""
    data = request.get_json()
    
    required = ['email', 'password', 'name', 'role']
    for field in required:
        if not data.get(field):
            return jsonify({'error': f'Missing required field: {field}'}), 400
    
    password = data['password']
    if len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400
    if not any(c.isdigit() for c in password):
        return jsonify({'error': 'Password must contain at least one number'}), 400
    
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already registered'}), 409
    
    if data['role'] not in ['creator', 'investor']:
        return jsonify({'error': 'Role must be creator or investor'}), 400
    
    user = User(
        email=data['email'],
        password_hash=set_password(data['password']),
        role=data['role'],
        name=data['name'],
        age=data.get('age'),
        nationality=data.get('nationality'),
        about=data.get('about', '')
    )
    db.session.add(user)
    db.session.commit()
    token = generate_token(user.id)
    
    return jsonify({
        'message': 'User registered successfully',
        'user': user_to_dict(user),
        'token': token
    }), 201


@app.route('/api/auth/login', methods=['POST'])
@rate_limit(max_requests=10, window_seconds=60)
def login():
    """Authenticate user"""
    data = request.get_json()
    
    if not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Email and password required'}), 400
    
    user = User.query.filter_by(email=data['email']).first()
    
    if not user or not user.password_hash or not check_password(user.password_hash, data['password']):
        return jsonify({'error': 'Invalid email or password'}), 401
    
    token = generate_token(user.id)
    
    return jsonify({
        'message': 'Login successful',
        'user': user_to_dict(user),
        'token': token
    })


@app.route('/api/auth/verify-token', methods=['POST'])
def verify_token():
    """Verify JWT token and return user data"""
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'error': 'No token provided'}), 401
    
    token = auth_header.split(' ')[1]
    try:
        data = pyjwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
        user = User.query.get(data['user_id'])
        if not user:
            return jsonify({'error': 'User not found'}), 401
        return jsonify({'user': user_to_dict(user), 'valid': True})
    except pyjwt.ExpiredSignatureError:
        return jsonify({'error': 'Token expired'}), 401
    except pyjwt.InvalidTokenError:
        return jsonify({'error': 'Invalid token'}), 401


@app.route('/api/auth/change-password', methods=['POST'])
@token_required
def change_password(current_user):
    """Change user password"""
    data = request.get_json()
    
    if not data.get('current_password') or not data.get('new_password'):
        return jsonify({'error': 'Current and new password required'}), 400
    
    if not check_password(current_user.password_hash or '', data['current_password']):
        return jsonify({'error': 'Current password is incorrect'}), 401
    
    new_password = data['new_password']
    if len(new_password) < 6:
        return jsonify({'error': 'New password must be at least 6 characters'}), 400
    if not any(c.isdigit() for c in new_password):
        return jsonify({'error': 'New password must contain at least one number'}), 400
    
    current_user.password_hash = set_password(new_password)
    db.session.commit()
    
    return jsonify({'message': 'Password changed successfully'})


@app.route('/api/auth/firebase-login', methods=['POST'])
@rate_limit(max_requests=10, window_seconds=60)
def firebase_login():
    """Authenticate user with Firebase idToken - with clock skew tolerance"""
    data = request.get_json()
    id_token = data.get('idToken')
    
    if not id_token:
        return jsonify({'error': 'No token provided'}), 400
        
    try:
        decoded_token = _decode_firebase_id_token(id_token)
    except Exception as e:
        return jsonify({'error': f'Token verification failed: {str(e)}'}), 401
    
    uid = decoded_token.get('uid') or decoded_token.get('sub') or decoded_token.get('user_id')
    email = decoded_token.get('email')
    name = decoded_token.get('name', '')
    avatar = decoded_token.get('picture', 'default_avatar.png')
    
    # Get role from request body (sent by Signup page), default to 'investor'
    requested_role = data.get('role')
    if requested_role not in ('creator', 'investor'):
        requested_role = 'investor'
    
    if not uid or not email:
        return jsonify({'error': 'Invalid token payload'}), 401
    
    try:
        user = User.query.filter((User.firebase_uid == uid) | (User.email == email)).first()
        
        if not user:
            user = User(
                email=email,
                firebase_uid=uid,
                role=requested_role,
                name=name,
                avatar=avatar
            )
            db.session.add(user)
            db.session.commit()
            
        elif not user.firebase_uid:
            user.firebase_uid = uid
            db.session.commit()
            
        token = generate_token(user.id)
        profile_complete = bool(user.age and user.nationality)
        
        return jsonify({
            'message': 'Login successful',
            'user': user_to_dict(user),
            'token': token,
            'profile_complete': profile_complete
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/auth/complete-profile', methods=['POST'])
@token_required
def complete_profile(current_user):
    """Complete profile for social auth users"""
    data = request.get_json()
    
    if not data.get('age') or not data.get('nationality'):
        return jsonify({'error': 'Age and nationality are required'}), 400
    
    update_fields = {}
    if 'name' in data and data['name']:
        current_user.name = data['name']
    if 'role' in data and data['role'] in ['creator', 'investor']:
        current_user.role = data['role']
    current_user.age = data['age']
    current_user.nationality = data['nationality']
    db.session.commit()
    
    return jsonify({
        'message': 'Profile completed successfully',
        'user': user_to_dict(current_user)
    })


@app.route('/api/auth/switch-role', methods=['POST'])
@token_required
def switch_role(current_user):
    """Switch between investor and creator accounts."""
    data = request.get_json() or {}
    new_role = data.get('role')

    if new_role not in ('creator', 'investor'):
        return jsonify({'error': 'Invalid role'}), 400

    if new_role == current_user.role:
        return jsonify({
            'message': 'Already using this account type',
            'user': user_to_dict(current_user),
        })

    current_user.role = new_role
    db.session.commit()

    return jsonify({
        'message': f'Switched to {new_role} account',
        'user': user_to_dict(current_user),
    })


# ============== PROFILE ROUTES ==============

@app.route('/api/profile/<int:user_id>', methods=['GET'])
def get_profile(user_id):
    """Get user profile"""
    user = User.query.get(user_id)
    if not user:
        abort(404)
    return jsonify({'user': user_to_dict(user)})


@app.route('/api/profile/<int:user_id>', methods=['PUT'])
def update_profile(user_id):
    """Update user profile"""
    user = User.query.get(user_id)
    if not user:
        abort(404)
    data = request.get_json()
    
    if data.get('name'):
        user.name = data['name']
    if 'about' in data:
        user.about = data['about']
    db.session.commit()
    
    return jsonify({'user': user_to_dict(user)})


@app.route('/api/profile/<int:user_id>/avatar', methods=['POST'])
def upload_avatar(user_id):
    """Upload user avatar"""
    user = User.query.get(user_id)
    if not user:
        abort(404)
    
    if 'avatar' not in request.files:
        return jsonify({'error': 'No avatar file provided'}), 400
    
    file = request.files['avatar']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    if file and allowed_file(file.filename):
        ext = file.filename.rsplit('.', 1)[1].lower()
        filename = f"{uuid.uuid4().hex}.{ext}"
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        user.avatar = filename
        db.session.commit()
        
        return jsonify({
            'message': 'Avatar uploaded successfully',
            'avatar': filename
        })
    
    return jsonify({'error': 'Invalid file type'}), 400


# ============== CAMPAIGN ROUTES ==============

@app.route('/api/campaigns', methods=['GET'])
def get_campaigns():
    """Get all campaigns with optional filtering"""
    category = request.args.get('category')
    status = request.args.get('status')
    min_score = request.args.get('min_score', type=float)
    creator_id = request.args.get('creator_id', type=int)
    
    query = Campaign.query
    if creator_id:
        query = query.filter_by(creator_id=creator_id)
    else:
        query = query.filter(Campaign.status.in_(['published', 'active', 'halfway', 'almost_funded', 'funded']))
    
    if category:
        query = query.filter_by(main_category=category)
    if status:
        query = query.filter_by(status=status)
    if min_score is not None:
        query = query.filter(Campaign.ai_score >= min_score)
    
    campaigns = query.order_by(Campaign.created_at.desc()).all()
    return jsonify({'campaigns': [campaign_to_dict(c) for c in campaigns]})


@app.route('/api/campaigns/<int:campaign_id>', methods=['GET'])
def get_campaign(campaign_id):
    """Get single campaign details"""
    campaign = Campaign.query.get(campaign_id)
    if not campaign:
        abort(404)
    return jsonify({'campaign': campaign_to_dict(campaign)})


@app.route('/api/campaigns', methods=['POST'])
def create_campaign():
    """Create a new campaign as draft"""
    data = request.get_json()
    
    required = ['creator_id', 'name', 'blurb', 'usd_goal', 'duration_days', 'main_category', 'country']
    for field in required:
        if field not in data:
            return jsonify({'error': f'Missing required field: {field}'}), 400

    creator = User.query.get(data['creator_id'])
    if not creator or creator.role != 'creator':
        return jsonify({'error': 'Only creator accounts can create campaigns'}), 403
    
    campaign = Campaign(
        creator_id=data['creator_id'],
        name=data['name'],
        blurb=data['blurb'],
        description=data.get('description', ''),
        usd_goal=float(data['usd_goal']),
        duration_days=int(data['duration_days']),
        prep_days=int(data.get('prep_days', 30)),
        main_category=data['main_category'],
        country=data['country'],
        has_video=bool(data.get('has_video', False)),
        status='draft'
    )
    db.session.add(campaign)
    db.session.commit()
    
    return jsonify({
        'message': 'Campaign created as draft',
        'campaign': campaign_to_dict(campaign)
    }), 201


@app.route('/api/campaigns/<int:campaign_id>/evaluate', methods=['POST'])
def evaluate_campaign(campaign_id):
    """Evaluate campaign with AI models"""
    campaign = Campaign.query.get(campaign_id)
    if not campaign:
        abort(404)
    
    campaign_data = {
        'name': campaign.name,
        'blurb': campaign.blurb or '',
        'description': (campaign.description or campaign.blurb or ''),
        'usd_goal': campaign.usd_goal,
        'duration_days': campaign.duration_days,
        'prep_days': (campaign.prep_days or 30),
        'main_category': campaign.main_category,
        'country': campaign.country,
        'has_video': (campaign.has_video or False)
    }
    
    ai_score, dl_score, xgb_score = evaluator.predict(campaign_data)
    
    if ai_score is None:
        return jsonify({'error': 'AI evaluation failed. Please try again.'}), 500
    
    gemini_advice = evaluator.get_gemini_advice(campaign_data, ai_score, dl_score, xgb_score)
    
    campaign.ai_score = ai_score; campaign.dl_score = dl_score; campaign.xgb_score = xgb_score
    campaign.gemini_advice = gemini_advice; campaign.status = 'evaluated'
    db.session.commit()
    
    score_pct = int(ai_score * 100)
    dl_pct = int(dl_score * 100) if dl_score else 0
    xgb_pct = int(xgb_score * 100) if xgb_score else 0
    notif = Notification( user_id= campaign.creator_id,
        type= 'ai_evaluation',
        title= f'AI Evaluation Complete: {score_pct}/100',
        message= f'Your campaign "{campaign.name}" scored {score_pct}/100 (DL: {dl_pct}%, XGB: {xgb_pct}%).',
        link= f'/edit-campaign/{campaign_id}', is_read=False, 
    )
    db.session.add(notif)
    db.session.commit()
    
    updated = Campaign.query.get(campaign_id)
    return jsonify({
        'message': 'Campaign evaluated successfully',
        'campaign': campaign_to_dict(updated),
        'score': score_pct,
        'dl_score': round(dl_score * 100, 1) if dl_score else 0,
        'xgb_score': round(xgb_score * 100, 1) if xgb_score else 0,
        'advice': gemini_advice
    })


@app.route('/api/campaigns/<int:campaign_id>/publish', methods=['POST'])
def publish_campaign(campaign_id):
    """Publish a campaign"""
    campaign = Campaign.query.get(campaign_id)
    if not campaign:
        abort(404)
    
    if campaign.status in ['published', 'active', 'funded']:
        return jsonify({'error': 'Campaign is already published'}), 400
    if campaign.ai_score is None:
        return jsonify({'error': 'Campaign must be evaluated before publishing'}), 400
    
    campaign.status = 'published'; db.session.commit()
    
    notif = Notification( user_id= campaign.creator_id,
        type= 'campaign_published', title= 'Campaign Published! 🚀',
        message= f'Your campaign "{campaign.name}" is now live.',
        link= f'/campaign/{campaign_id}', is_read=False, 
    )
    db.session.add(notif)
    db.session.commit()
    
    updated = Campaign.query.get(campaign_id)
    return jsonify({'message': 'Campaign published successfully!', 'campaign': campaign_to_dict(updated)})


@app.route('/api/campaigns/user/<int:user_id>', methods=['GET'])
def get_user_campaigns(user_id):
    """Get campaigns by creator"""
    campaigns = Campaign.query.filter_by(creator_id=user_id).order_by(Campaign.created_at.desc()).all()
    return jsonify({'campaigns': [campaign_to_dict(c) for c in campaigns]})


@app.route('/api/campaigns/<int:campaign_id>', methods=['DELETE'])
def delete_campaign(campaign_id):
    """Delete a campaign"""
    data = request.get_json() or {}
    user_id = data.get('user_id')
    campaign = Campaign.query.get(campaign_id)
    if not campaign:
        abort(404)
    if campaign.creator_id != user_id:
        return jsonify({'error': 'Only the campaign creator can delete this campaign'}), 403
    
    investments = Investment.query.filter_by(campaign_id=campaign_id).all()
    for inv in investments:
        notif = Notification( user_id= inv.investor_id,
            type= 'refund', title= 'Campaign Cancelled - Refund Issued',
            message= f'The campaign "{campaign.name}" has been cancelled. Your pledge of ${inv.amount:.2f} has been refunded.',
            link= '/dashboard', is_read=False, 
        )
        db.session.add(notif)
        db.session.commit()
    
    Investment.query.filter_by(campaign_id=campaign_id).delete()
    Reward.query.filter_by(campaign_id=campaign_id).delete()
    Comment.query.filter_by(campaign_id=campaign_id).delete()
    CampaignUpdate.query.filter_by(campaign_id=campaign_id).delete()
    CampaignImage.query.filter_by(campaign_id=campaign_id).delete()
    Milestone.query.filter_by(campaign_id=campaign_id).delete()
    FAQ.query.filter_by(campaign_id=campaign_id).delete()
    Bookmark.query.filter_by(campaign_id=campaign_id).delete()
    db.session.delete(Campaign.query.get(campaign_id)); db.session.commit()
    
    return jsonify({'message': 'Campaign deleted and all backers have been refunded and notified'})


@app.route('/api/campaigns/<int:campaign_id>/end', methods=['POST'])
def end_campaign_early(campaign_id):
    """End a campaign early - only if 100% funded"""
    data = request.get_json() or {}
    user_id = data.get('user_id')
    campaign = Campaign.query.get(campaign_id)
    if not campaign:
        abort(404)
    if campaign.creator_id != user_id:
        return jsonify({'error': 'Only the campaign creator can end this campaign'}), 403
    if campaign_funding_percentage(campaign) < 100:
        return jsonify({'error': 'Campaign must be 100% funded to end early'}), 400
    if campaign.status in ['ended', 'funded']:
        return jsonify({'error': 'Campaign has already ended'}), 400
    
    campaign.status = 'funded'; campaign.duration_days = 0; db.session.commit()
    
    investments = Investment.query.filter_by(campaign_id=campaign_id).all()
    for inv in investments:
        notif = Notification( user_id= inv.investor_id,
            type= 'campaign_funded', title= 'Campaign Successfully Funded! 🎉',
            message= f'The campaign "{campaign.name}" has reached its goal!',
            link= f'/campaign/{campaign_id}', is_read=False, 
        )
        db.session.add(notif)
        db.session.commit()
    
    notif = Notification( user_id= campaign.creator_id,
        type= 'campaign_ended', title= 'Campaign Ended Successfully! 🎉',
        message= f'Your campaign "{campaign.name}" has ended successfully.',
        link= f'/campaign/{campaign_id}', is_read=False, 
    )
    db.session.add(notif)
    db.session.commit()
    
    updated = Campaign.query.get(campaign_id)
    return jsonify({'message': 'Campaign ended successfully!', 'campaign': campaign_to_dict(updated)})


# ============== INVESTMENT ROUTES ==============

@app.route('/api/campaigns/<int:campaign_id>/invest', methods=['POST'])
def invest_in_campaign(campaign_id):
    """Invest in a campaign"""
    campaign = Campaign.query.get(campaign_id)
    if not campaign:
        abort(404)
    data = request.get_json()
    
    if not data.get('investor_id'):
        return jsonify({'error': 'Investor ID required'}), 400
    if not data.get('amount') or float(data['amount']) <= 0:
        return jsonify({'error': 'Valid investment amount required'}), 400

    ok, error, status = validate_investment_eligibility(data['investor_id'], campaign)
    if not ok:
        return jsonify({'error': error}), status
    
    amount = float(data['amount'])
    inv = Investment(
investor_id=data['investor_id'],
        campaign_id=campaign_id, amount=amount,
        message=data.get('message', ''), reward_id=None)
    db.session.add(inv); db.session.commit()
    campaign.amount_raised = (campaign.amount_raised or 0) + amount; campaign.backers_count = (campaign.backers_count or 0) + 1; db.session.commit()
    
    updated = Campaign.query.get(campaign_id)
    return jsonify({
        'message': 'Investment successful!',
        'investment': investment_to_dict(inv),
        'campaign': campaign_to_dict(updated)
    }), 201


@app.route('/api/campaigns/<int:campaign_id>/investments', methods=['GET'])
def get_campaign_investments(campaign_id):
    """Get all investments for a campaign"""
    campaign = Campaign.query.get(campaign_id)
    if not campaign:
        abort(404)
    invs = Investment.query.filter_by(campaign_id=campaign_id).order_by(Investment.created_at.desc()).all()
    return jsonify({
        'investments': [investment_to_dict(i) for i in invs],
        'total_raised': (campaign.amount_raised or 0),
        'backers_count': (campaign.backers_count or 0)
    })


@app.route('/api/user/<int:user_id>/investments', methods=['GET'])
def get_user_investments(user_id):
    """Get all investments made by a user"""
    invs = Investment.query.filter_by(investor_id=user_id).order_by(Investment.created_at.desc()).all()
    return jsonify({'investments': [investment_to_dict(i) for i in invs]})


# ============== UTILITY ROUTES ==============

@app.route('/api/categories', methods=['GET'])
def get_categories():
    """Get available categories"""
    categories = [
        'Technology', 'Design', 'Games', 'Film & Video',
        'Music', 'Food', 'Publishing', 'Art', 'Fashion',
        'Photography', 'Comics', 'Crafts', 'Dance', 'Theater',
        'Journalism', 'Documentary', 'Shorts', 'Web',
        'Tabletop Games', 'Product Design', 'Apparel',
        'Accessories', 'Illustration', 'Comedy'
    ]
    return jsonify({'categories': categories})


@app.route('/api/countries', methods=['GET'])
def get_countries():
    """Get supported countries"""
    countries = [
        {'code': 'AU', 'name': 'Australia'},
        {'code': 'BR', 'name': 'Brazil'},
        {'code': 'CA', 'name': 'Canada'},
        {'code': 'DK', 'name': 'Denmark'},
        {'code': 'EG', 'name': 'Egypt'},
        {'code': 'FR', 'name': 'France'},
        {'code': 'DE', 'name': 'Germany'},
        {'code': 'HK', 'name': 'Hong Kong'},
        {'code': 'IN', 'name': 'India'},
        {'code': 'IT', 'name': 'Italy'},
        {'code': 'JP', 'name': 'Japan'},
        {'code': 'MX', 'name': 'Mexico'},
        {'code': 'NL', 'name': 'Netherlands'},
        {'code': 'SA', 'name': 'Saudi Arabia'},
        {'code': 'SG', 'name': 'Singapore'},
        {'code': 'ZA', 'name': 'South Africa'},
        {'code': 'ES', 'name': 'Spain'},
        {'code': 'SE', 'name': 'Sweden'},
        {'code': 'CH', 'name': 'Switzerland'},
        {'code': 'TR', 'name': 'Turkey'},
        {'code': 'AE', 'name': 'United Arab Emirates'},
        {'code': 'GB', 'name': 'United Kingdom'},
        {'code': 'US', 'name': 'United States'}
    ]
    return jsonify({'countries': countries})



@app.route('/api/health', methods=['GET'])
def health_check():
    """API health check"""
    return jsonify({
        'status': 'healthy',
        'ai_loaded': evaluator.loaded
    })


# ============== CAMPAIGN IMAGES ROUTES ==============

@app.route('/api/campaigns/<int:campaign_id>/images', methods=['GET'])
def get_campaign_images(campaign_id):
    """Get all images for a campaign"""
    images = CampaignImage.query.filter_by(campaign_id=campaign_id).all()
    return jsonify({'images': [campaign_image_to_dict(img) for img in images]})


@app.route('/api/campaigns/<int:campaign_id>/images', methods=['POST'])
def upload_campaign_image(campaign_id):
    """Upload image to campaign"""
    campaign = Campaign.query.get(campaign_id)
    if not campaign:
        abort(404)
    
    if 'image' not in request.files:
        return jsonify({'error': 'No image file provided'}), 400
    file = request.files['image']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    if file and allowed_file(file.filename):
        ext = file.filename.rsplit('.', 1)[1].lower()
        filename = f"{uuid.uuid4().hex}.{ext}"
        filepath = os.path.join(app.config['CAMPAIGN_UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        is_primary = request.form.get('is_primary', 'false').lower() == 'true'
        caption = request.form.get('caption', '')
        if is_primary:
            CampaignImage.query.filter_by(campaign_id=campaign_id, is_primary=True).update({'is_primary': False}); db.session.commit()
        
        img = CampaignImage(
campaign_id=campaign_id,
            image_url=filename, is_primary=is_primary, caption=caption)
        db.session.add(img); db.session.commit()
        return jsonify({'message': 'Image uploaded', 'image': campaign_image_to_dict(img)}), 201
    
    return jsonify({'error': 'Invalid file type'}), 400


@app.route('/uploads/campaigns/<path:filename>')
def serve_campaign_image(filename):
    return send_from_directory(CAMPAIGN_UPLOAD_FOLDER, filename)


# ============== CAMPAIGN UPDATES ROUTES ==============

@app.route('/api/campaigns/<int:campaign_id>/updates', methods=['GET'])
def get_campaign_updates(campaign_id):
    """Get all updates for a campaign"""
    updates = CampaignUpdate.query.filter_by(campaign_id=campaign_id).order_by(CampaignUpdate.created_at.desc()).all()
    return jsonify({'updates': [campaign_update_to_dict(u) for u in updates]})


@app.route('/api/campaigns/<int:campaign_id>/updates', methods=['POST'])
def create_campaign_update(campaign_id):
    """Create a campaign update"""
    campaign = Campaign.query.get(campaign_id)
    if not campaign:
        abort(404)
    data = request.get_json()
    
    if not data.get('title') or not data.get('content'):
        return jsonify({'error': 'Title and content required'}), 400
    
    upd = CampaignUpdate(
campaign_id=campaign_id,
        title=data['title'], content=data['content'])
    db.session.add(upd); db.session.commit()
    
    invs = Investment.query.filter_by(campaign_id=campaign_id).all()
    for inv in invs:
        notif = Notification( user_id= inv.investor_id,
            type= 'update', title= f'New update from {campaign.name}',
            message= data['title'], link= f'/campaign/{campaign_id}',
            is_read=False, 
        )
        db.session.add(notif)
        db.session.commit()
    
    return jsonify({'message': 'Update posted', 'update': campaign_update_to_dict(upd)}), 201


@app.route('/api/campaigns/<int:campaign_id>/updates/<int:update_id>', methods=['DELETE'])
def delete_campaign_update(campaign_id, update_id):
    """Delete a campaign update"""
    upd_obj = CampaignUpdate.query.filter_by(id=update_id, campaign_id=campaign_id).first()
    if not upd_obj:
        abort(404)
    db.session.delete(upd_obj)
    db.session.commit()
    return jsonify({'message': 'Update deleted'})


# ============== COMMENTS ROUTES ==============

@app.route('/api/campaigns/<int:campaign_id>/comments', methods=['GET'])
def get_campaign_comments(campaign_id):
    """Get all comments for a campaign"""
    comments = Comment.query.filter_by(campaign_id=campaign_id, parent_id=None).order_by(Comment.created_at.desc()).all()
    return jsonify({'comments': [comment_to_dict(c) for c in comments]})


@app.route('/api/campaigns/<int:campaign_id>/comments', methods=['POST'])
def create_comment(campaign_id):
    """Add a comment to a campaign"""
    campaign = Campaign.query.get(campaign_id)
    if not campaign:
        abort(404)
    data = request.get_json()
    
    if not data.get('user_id') or not data.get('content'):
        return jsonify({'error': 'User ID and content required'}), 400
    
    cmt = Comment(
campaign_id=campaign_id,
        user_id=data['user_id'], content=data['content'],
        parent_id=data.get('parent_id'))
    db.session.add(cmt); db.session.commit()
    
    if campaign.creator_id != data['user_id']:
        user = User.query.get(data['user_id'])
        notif = Notification( user_id= campaign.creator_id,
            type= 'comment', title= f'New comment on {campaign.name}',
            message= f'{user.name if user else "Someone"} commented on your campaign',
            link= f'/campaign/{campaign_id}', is_read=False, 
        )
        db.session.add(notif)
        db.session.commit()
    
    return jsonify({'message': 'Comment added', 'comment': comment_to_dict(cmt)}), 201


@app.route('/api/comments/<int:comment_id>', methods=['DELETE'])
def delete_comment(comment_id):
    """Delete a comment"""
    cmt_obj = Comment.query.get(comment_id)
    if not cmt_obj:
        abort(404)
    db.session.delete(cmt_obj)
    db.session.commit()
    return jsonify({'message': 'Comment deleted'})


# ============== BOOKMARKS ROUTES ==============

@app.route('/api/user/<int:user_id>/bookmarks', methods=['GET'])
def get_user_bookmarks(user_id):
    """Get all bookmarks for a user"""
    bookmarks = Bookmark.query.filter_by(user_id=user_id).order_by(Bookmark.created_at.desc()).all()
    return jsonify({'bookmarks': [bookmark_to_dict(b) for b in bookmarks]})


@app.route('/api/bookmarks', methods=['POST'])
def toggle_bookmark():
    """Toggle bookmark on a campaign"""
    data = request.get_json()
    
    if not data.get('user_id') or not data.get('campaign_id'):
        return jsonify({'error': 'User ID and campaign ID required'}), 400
    
    existing = Bookmark.query.filter_by(user_id=data['user_id'], campaign_id=data['campaign_id']).first()
    
    if existing:
        db.session.delete(existing)
        db.session.commit()
        return jsonify({'message': 'Bookmark removed', 'bookmarked': False})
    else:
        bm = Bookmark(user_id=data['user_id'], campaign_id=data['campaign_id'])
        db.session.add(bm); db.session.commit()
        return jsonify({'message': 'Bookmark added', 'bookmarked': True, 'bookmark': bookmark_to_dict(bm)})


@app.route('/api/user/<int:user_id>/bookmarks/<int:campaign_id>', methods=['GET'])
def check_bookmark(user_id, campaign_id):
    """Check if a campaign is bookmarked"""
    bookmark = Bookmark.query.filter_by(user_id=user_id, campaign_id=campaign_id).first()
    return jsonify({'bookmarked': bookmark is not None})


# ============== REVIEWS ROUTES ==============

@app.route('/api/user/<int:user_id>/reviews', methods=['GET'])
def get_user_reviews(user_id):
    """Get reviews for a user"""
    reviews = Review.query.filter_by(reviewed_id=user_id).order_by(Review.created_at.desc()).all()
    return jsonify({'reviews': [review_to_dict(r) for r in reviews]})


@app.route('/api/reviews', methods=['POST'])
def create_review():
    """Create a review for a creator"""
    data = request.get_json()
    
    required = ['reviewer_id', 'reviewed_id', 'campaign_id', 'rating']
    for field in required:
        if field not in data:
            return jsonify({'error': f'Missing required field: {field}'}), 400
    
    if not 1 <= data['rating'] <= 5:
        return jsonify({'error': 'Rating must be between 1 and 5'}), 400
    
    existing = Review.query.filter_by(reviewer_id=data['reviewer_id'], campaign_id=data['campaign_id']).first()
    if existing:
        return jsonify({'error': 'You have already reviewed this campaign'}), 409
    
    rev = Review(
reviewer_id=data['reviewer_id'],
        reviewed_id=data['reviewed_id'], campaign_id=data['campaign_id'],
        rating=data['rating'], content=data.get('content', ''))
    db.session.add(rev); db.session.commit()
    
    all_revs = Review.query.filter_by(reviewed_id=data['reviewed_id']).all()
    total_rating = sum(r.rating for r in all_revs)
    count = len(all_revs)
    reviewed_user = User.query.get(data['reviewed_id']); reviewed_user.total_reviews = count; reviewed_user.avg_rating = total_rating / count if count else 0; db.session.commit()
    
    return jsonify({'message': 'Review added', 'review': review_to_dict(rev)}), 201


# ============== MILESTONES ROUTES ==============

@app.route('/api/campaigns/<int:campaign_id>/milestones', methods=['GET'])
def get_milestones(campaign_id):
    """Get all milestones for a campaign"""
    milestones = Milestone.query.filter_by(campaign_id=campaign_id).order_by(Milestone.target_amount.asc()).all()
    return jsonify({'milestones': [milestone_to_dict(m) for m in milestones]})


@app.route('/api/campaigns/<int:campaign_id>/milestones', methods=['POST'])
def create_milestone(campaign_id):
    """Create a milestone for a campaign"""
    data = request.get_json()
    
    if not data.get('title') or not data.get('target_amount'):
        return jsonify({'error': 'Title and target amount required'}), 400
    
    ms = Milestone(
campaign_id=campaign_id,
        title=data['title'], description=data.get('description', ''),
        target_amount=float(data['target_amount']), is_reached=False)
    db.session.add(ms); db.session.commit()
    return jsonify({'message': 'Milestone created', 'milestone': milestone_to_dict(ms)}), 201


# ============== REWARDS ROUTES ==============

@app.route('/api/campaigns/<int:campaign_id>/rewards', methods=['GET'])
def get_rewards(campaign_id):
    """Get all rewards for a campaign"""
    rewards = Reward.query.filter_by(campaign_id=campaign_id).order_by(Reward.min_amount.asc()).all()
    return jsonify({'rewards': [reward_to_dict(r) for r in rewards]})


@app.route('/api/campaigns/<int:campaign_id>/rewards', methods=['POST'])
def create_reward(campaign_id):
    """Create a reward tier for a campaign"""
    data = request.get_json()
    
    # Accept both 'amount' (frontend) and 'min_amount' (legacy)
    min_amount = data.get('min_amount') or data.get('amount')
    if not data.get('title') or not min_amount:
        return jsonify({'error': 'Title and amount required'}), 400
    
    rwd = Reward(
campaign_id=campaign_id,
        title=data['title'], description=data.get('description', ''),
        min_amount=float(min_amount), max_backers=data.get('max_backers'),
        backers_count=0, estimated_delivery=data.get('estimated_delivery', ''))
    db.session.add(rwd); db.session.commit()
    return jsonify({'message': 'Reward created', 'reward': reward_to_dict(rwd)}), 201


@app.route('/api/campaigns/<int:campaign_id>/rewards/<int:reward_id>', methods=['DELETE'])
def delete_reward(campaign_id, reward_id):
    """Delete a reward tier from a campaign"""
    reward = Reward.query.filter_by(id=reward_id, campaign_id=campaign_id).first()
    if not reward:
        abort(404)
    if Investment.query.filter_by(reward_id=reward_id).count() > 0:
        return jsonify({'error': 'Cannot delete reward with existing backers'}), 400
    db.session.delete(reward); db.session.commit()
    return jsonify({'message': 'Reward deleted'})


# ============== NOTIFICATIONS ROUTES ==============

@app.route('/api/user/<int:user_id>/notifications', methods=['GET'])
def get_notifications(user_id):
    """Get all notifications for a user"""
    notifications = Notification.query.filter_by(user_id=user_id).order_by(Notification.created_at.desc()).limit(50).all()
    unread_count = Notification.query.filter_by(user_id=user_id, is_read=False).count()
    return jsonify({
        'notifications': [notification_to_dict(n) for n in notifications],
        'unread_count': unread_count
    })


@app.route('/api/notifications/<int:notification_id>/read', methods=['POST'])
def mark_notification_read(notification_id):
    """Mark a notification as read"""
    notification = Notification.query.get(notification_id)
    if not notification:
        abort(404)
    notification.is_read = True; db.session.commit()
    return jsonify({'message': 'Notification marked as read'})


@app.route('/api/user/<int:user_id>/notifications/read-all', methods=['POST'])
def mark_all_notifications_read(user_id):
    """Mark all notifications as read"""
    Notification.query.filter_by(user_id=user_id, is_read=False).update({'is_read': True}); db.session.commit()
    return jsonify({'message': 'All notifications marked as read'})


# ============== PAYMENTS ROUTES ==============

@app.route('/api/payments/process', methods=['POST'])
def process_payment():
    """Process a mock payment"""
    data = request.get_json()
    
    required = ['user_id', 'campaign_id', 'amount']
    for field in required:
        if field not in data:
            return jsonify({'error': f'Missing required field: {field}'}), 400
    
    campaign = Campaign.query.get(data['campaign_id'])
    if not campaign:
        abort(404)

    ok, error, status = validate_investment_eligibility(data['user_id'], campaign)
    if not ok:
        return jsonify({'error': error}), status

    amount = float(data['amount'])
    
    inv = Investment(
investor_id=data['user_id'],
        campaign_id=data['campaign_id'], amount=amount,
        message=data.get('message', ''), reward_id=data.get('reward_id'))
    db.session.add(inv); db.session.commit()
    
    pmt = Payment(
investment_id=inv.id,
        user_id=data['user_id'], amount=amount,
        payment_method=data.get('payment_method', 'card'),
        status='completed', transaction_id=f"TXN-{uuid.uuid4().hex[:12].upper()}")
    db.session.add(pmt); db.session.commit()
    
    new_raised = (campaign.amount_raised or 0) + amount
    campaign.amount_raised = (campaign.amount_raised or 0) + amount; campaign.backers_count = (campaign.backers_count or 0) + 1; db.session.commit()
    
    if data.get('reward_id'):
        rwd = Reward.query.get(data['reward_id']); rwd.backers_count = (rwd.backers_count or 0) + 1; db.session.commit()
    
    ms_list = Milestone.query.filter_by(campaign_id=campaign.id, is_reached=False).all()
    for ms in ms_list:
        if new_raised >= ms.target_amount:
            ms.is_reached = True; db.session.commit()
            notif = Notification( user_id= campaign.creator_id,
                type= 'milestone', title= f'Milestone reached: {ms.title}',
                message= f'Your campaign {campaign.name} has reached a funding milestone!',
                link= f'/campaign/{campaign.id}', is_read=False, 
            )
            db.session.add(notif)
            db.session.commit()
    
    user = User.query.get(data['user_id'])
    notif = Notification( user_id= campaign.creator_id,
        type= 'investment', title= f'New investment on {campaign.name}',
        message= f'{user.name if user else "Someone"} invested ${amount:.2f}',
        link= f'/campaign/{campaign.id}', is_read=False, 
    )
    db.session.add(notif)
    db.session.commit()
    
    updated_campaign = Campaign.query.get(data['campaign_id'])
    return jsonify({
        'message': 'Payment successful!',
        'payment': payment_to_dict(pmt),
        'investment': investment_to_dict(inv),
        'campaign': campaign_to_dict(updated_campaign)
    }), 201


# ============== SEARCH ROUTES ==============

@app.route('/api/search', methods=['GET'])
def search_campaigns():
    """Advanced search for campaigns"""
    query = request.args.get('q', '')
    category = request.args.get('category')
    min_goal = request.args.get('min_goal', type=float)
    max_goal = request.args.get('max_goal', type=float)
    min_score = request.args.get('min_score', type=float)
    status = request.args.get('status')
    sort_by = request.args.get('sort', 'newest')  # newest, trending, ending, funded
    
    query_obj = Campaign.query
    if query:
        query_obj = query_obj.filter(db.or_(Campaign.name.ilike(f'%{query}%'), Campaign.blurb.ilike(f'%{query}%')))
    if category:
        query_obj = query_obj.filter_by(main_category=category)
    if status:
        query_obj = query_obj.filter_by(status=status)
    if min_goal is not None:
        query_obj = query_obj.filter(Campaign.usd_goal >= min_goal)
    if max_goal is not None:
        query_obj = query_obj.filter(Campaign.usd_goal <= max_goal)
    if min_score is not None:
        query_obj = query_obj.filter(Campaign.ai_score >= min_score)
    
    sort_map = {
        'newest': Campaign.created_at.desc(), 'trending': Campaign.views_count.desc(),
        'funded': Campaign.amount_raised.desc(), 'ending': Campaign.duration_days.asc(),
        'score': Campaign.ai_score.desc(),
    }
    sort_col = sort_map.get(sort_by, Campaign.created_at.desc())
    campaigns = query_obj.order_by(sort_col).limit(50).all()
    
    users = []
    if query:
        user_results = User.query.filter(User.name.ilike(f'%{query}%')).limit(10).all() if query else []
        users = [{'id': u.id, 'name': u.name or '', 'email': u.email or '', 'role': u.role or '', 'avatar': u.avatar or ''} for u in user_results]
    
    return jsonify({
        'campaigns': [campaign_to_dict(c) for c in campaigns],
        'users': users,
        'count': len(campaigns)
    })


# ============== DASHBOARD / STATS ROUTES ==============

@app.route('/api/user/<int:user_id>/dashboard', methods=['GET'])
def get_user_dashboard(user_id):
    """Get dashboard data for a user"""
    user = User.query.get(user_id)
    if not user:
        abort(404)
    
    if user.role == 'creator':
        campaigns = Campaign.query.filter_by(creator_id=user_id).all()
        total_raised = sum((c.amount_raised or 0) for c in campaigns)
        total_backers = sum((c.backers_count or 0) for c in campaigns)
        
        recent_invs = []
        for c in campaigns:
            invs = Investment.query.filter_by(campaign_id=c.id).order_by(Investment.created_at.desc()).limit(3).all()
            recent_invs.extend([investment_to_dict(i) for i in invs])
        
        return jsonify({
            'user': user_to_dict(user),
            'stats': {
                'campaigns_count': len(campaigns),
                'total_raised': total_raised,
                'total_backers': total_backers,
                'avg_score': sum((c.ai_score or 0) for c in campaigns) / len(campaigns) if campaigns else 0
            },
            'campaigns': [campaign_to_dict(c) for c in campaigns[:5]],
            'recent_investments': recent_invs[:10]
        })
    else:
        investments = Investment.query.filter_by(investor_id=user_id).all()
        total_invested = sum((i.amount or 0) for i in investments)
        bms = Bookmark.query.filter_by(user_id=user_id).limit(5).all()
        
        return jsonify({
            'user': user_to_dict(user),
            'stats': {
                'investments_count': len(investments),
                'total_invested': total_invested,
                'campaigns_backed': len(set(i.campaign_id for i in investments))
            },
            'investments': [investment_to_dict(i) for i in investments[:10]],
            'bookmarks': [bookmark_to_dict(b) for b in bms]
        })


@app.route('/api/campaigns/<int:campaign_id>/analytics', methods=['GET'])
def get_campaign_analytics(campaign_id):
    """Get analytics for a campaign"""
    campaign = Campaign.query.get(campaign_id)
    if not campaign:
        abort(404)
    
    campaign.views_count = (campaign.views_count or 0) + 1; db.session.commit()
    campaign = Campaign.query.get(campaign_id)
    
    investments = Investment.query.filter_by(campaign_id=campaign_id).order_by(Investment.created_at.asc()).all()
    
    from collections import defaultdict
    daily_funding = defaultdict(float)
    for inv in investments:
        day = inv.created_at.strftime('%Y-%m-%d') if hasattr(inv.created_at, 'strftime') else str(inv.created_at or '')[:10]
        daily_funding[day] += (inv.amount or 0)
    
    bc = (campaign.backers_count or 0)
    ar = (campaign.amount_raised or 0)
    return jsonify({
        'campaign': campaign_to_dict(campaign),
        'analytics': {
            'views_count': (campaign.views_count or 0),
            'backers_count': bc,
            'amount_raised': ar,
            'funding_percentage': campaign_funding_percentage(campaign),
            'daily_funding': dict(daily_funding),
            'avg_investment': ar / bc if bc > 0 else 0
        }
    })


# ============== ADMIN ROUTES ==============

@app.route('/api/admin/stats', methods=['GET'])
def get_admin_stats():
    """Get platform statistics for admin"""

    total_raised = db.session.query(db.func.sum(Campaign.amount_raised)).scalar() or 0

    return jsonify({
        'stats': {
            'total_users': User.query.count(),
            'total_creators': User.query.filter_by(role='creator').count(),
            'total_investors': User.query.filter_by(role='investor').count(),
            'total_campaigns': Campaign.query.count(),
            'active_campaigns': Campaign.query.filter(Campaign.status.in_(['evaluated', 'active'])).count(),
            'total_raised': total_raised,
            'total_investments': Investment.query.count()
        }
    })


@app.route('/api/admin/users', methods=['GET'])
def get_all_users():
    """Get all users for admin"""
    users = User.query.order_by(User.created_at.desc()).all()
    return jsonify({'users': [user_to_dict(u) for u in users]})


@app.route('/api/admin/campaigns', methods=['GET'])
def get_all_campaigns():
    """Get all campaigns for admin"""
    campaigns = Campaign.query.order_by(Campaign.created_at.desc()).all()
    return jsonify({'campaigns': [campaign_to_dict(c) for c in campaigns]})


@app.route('/api/admin/campaigns/<int:campaign_id>/feature', methods=['POST'])
def toggle_featured(campaign_id):
    """Toggle featured status of a campaign"""
    campaign = Campaign.query.get(campaign_id)
    if not campaign:
        abort(404)
    new_val = not (campaign.is_featured or False)
    campaign.is_featured = new_val; db.session.commit()
    updated = Campaign.query.get(campaign_id)
    return jsonify({'message': f'Campaign {"featured" if new_val else "unfeatured"}', 'campaign': campaign_to_dict(updated)})


@app.route('/api/admin/campaigns/<int:campaign_id>/verify', methods=['POST'])
def verify_campaign(campaign_id):
    """Mark campaign as AI verified"""
    campaign = Campaign.query.get(campaign_id)
    if not campaign:
        abort(404)
    campaign.is_ai_verified = True; db.session.commit()
    updated = Campaign.query.get(campaign_id)
    return jsonify({'message': 'Campaign verified', 'campaign': campaign_to_dict(updated)})


# ============== PHASE 2: EDIT CAMPAIGN ==============

@app.route('/api/campaigns/<int:campaign_id>', methods=['PUT'])
def update_campaign(campaign_id):
    """Update campaign details"""
    campaign = Campaign.query.get(campaign_id)
    if not campaign:
        abort(404)
    data = request.json
    
    update_fields = {}
    for f in ['name', 'blurb', 'description', 'has_video', 'video_url']:
        if f in data:
            update_fields[f] = data[f]
    
    if (campaign.backers_count or 0) == 0:
        if 'usd_goal' in data:
            update_fields['usd_goal'] = data['usd_goal']
        if 'duration_days' in data:
            update_fields['duration_days'] = data['duration_days']
    
    if 'status' in data:
        update_fields['status'] = data['status']
    
    if update_fields:
        for k, v in update_fields.items(): setattr(campaign, k, v)
        db.session.commit()
    updated = Campaign.query.get(campaign_id)
    return jsonify({'message': 'Campaign updated', 'campaign': campaign_to_dict(updated)})


# ============== PHASE 2: DRAFT CAMPAIGNS ==============
# Note: publish_campaign is defined earlier in the file


@app.route('/api/user/<int:user_id>/drafts', methods=['GET'])
def get_user_drafts(user_id):
    """Get user's draft campaigns"""
    drafts = Campaign.query.filter_by(creator_id=user_id, status='draft').all()
    return jsonify({'drafts': [campaign_to_dict(c) for c in drafts]})


# ============== PHASE 2: EMAIL VERIFICATION ==============

@app.route('/api/auth/send-verification', methods=['POST'])
def send_verification():
    """Send email verification (mock for school project)"""
    data = request.json
    user = User.query.filter_by(email=data.get('email')).first()
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    token = str(uuid.uuid4())[:8].upper()
    user.verification_token = token; db.session.commit()
    
    # In production, would send actual email
    # For school project, just return the token for demo
    return jsonify({
        'message': 'Verification email sent',
        'demo_token': token  # Remove in production
    })


@app.route('/api/auth/verify-email', methods=['POST'])
def verify_email():
    """Verify email with token"""
    data = request.json
    user = User.query.filter_by(email=data.get('email')).first()
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    if user.verification_token == data.get('token'):
        user.is_email_verified = True
        user.verification_token = None
        db.session.commit()
        return jsonify({'message': 'Email verified!', 'user': user_to_dict(user)})
    else:
        return jsonify({'error': 'Invalid verification code'}), 400


# ============== PHASE 2: FAQ ROUTES ==============

@app.route('/api/campaigns/<int:campaign_id>/faqs', methods=['GET'])
def get_campaign_faqs(campaign_id):
    """Get FAQs for a campaign"""
    faqs = FAQ.query.filter_by(campaign_id=campaign_id).order_by(FAQ.order.asc()).all()
    return jsonify({'faqs': [faq_to_dict(f) for f in faqs]})


@app.route('/api/campaigns/<int:campaign_id>/faqs', methods=['POST'])
def add_campaign_faq(campaign_id):
    """Add FAQ to campaign"""
    data = request.json
    faq_doc = FAQ(
campaign_id=campaign_id,
        question=data['question'], answer=data['answer'],
        order=data.get('order', 0))
    db.session.add(faq_doc); db.session.commit()
    return jsonify({'message': 'FAQ added', 'faq': faq_to_dict(faq_doc)}), 201


@app.route('/api/faqs/<int:faq_id>', methods=['PUT'])
def update_faq(faq_id):
    """Update a FAQ"""
    faq = FAQ.query.get(faq_id)
    if not faq:
        abort(404)
    data = request.json
    update_fields = {}
    if 'question' in data: update_fields['question'] = data['question']
    if 'answer' in data: update_fields['answer'] = data['answer']
    if 'order' in data: update_fields['order'] = data['order']
    if update_fields:
        for k, v in update_fields.items():
            setattr(faq, k, v)
        db.session.commit()
    return jsonify({'message': 'FAQ updated', 'faq': faq_to_dict(faq)})


@app.route('/api/faqs/<int:faq_id>', methods=['DELETE'])
def delete_faq(faq_id):
    """Delete a FAQ"""
    faq = FAQ.query.get(faq_id)
    if not faq:
        abort(404)
    db.session.delete(faq); db.session.commit()
    return jsonify({'message': 'FAQ deleted'})


# ============== PHASE 2: MESSAGE ROUTES ==============

@app.route('/api/messages', methods=['POST'])
def send_message():
    """Send a message"""
    data = request.json
    msg = Message(
sender_id=data['sender_id'],
        recipient_id=data['recipient_id'], campaign_id=data.get('campaign_id'),
        subject=data['subject'], content=data['content'],
        is_read=False)
    db.session.add(msg); db.session.commit()
    
    sender = User.query.get(data['sender_id'])
    notif = Notification( user_id= data['recipient_id'],
        type= 'message', title= f'New message from {sender.name if sender else "someone"}',
        message= f"{data['subject'][:50]}", link= '/messages',
        is_read=False, 
    )
    db.session.add(notif)
    db.session.commit()
    return jsonify({'message': 'Message sent', 'data': message_to_dict(msg)}), 201


@app.route('/api/user/<int:user_id>/messages', methods=['GET'])
def get_user_messages(user_id):
    """Get user's messages (inbox)"""
    inbox = Message.query.filter_by(recipient_id=user_id).order_by(Message.created_at.desc()).all()
    sent = Message.query.filter_by(sender_id=user_id).order_by(Message.created_at.desc()).all()
    unread_count = Message.query.filter_by(recipient_id=user_id, is_read=False).count()
    
    return jsonify({
        'inbox': [message_to_dict(m) for m in inbox],
        'sent': [message_to_dict(m) for m in sent],
        'unread_count': unread_count
    })


@app.route('/api/messages/<int:message_id>/read', methods=['POST'])
def mark_message_read(message_id):
    """Mark message as read"""
    message = Message.query.get(message_id)
    if not message:
        abort(404)
    message.is_read = True; db.session.commit()
    return jsonify({'message': 'Marked as read'})


# ============== PHASE 2: CATEGORIES ROUTE ==============

@app.route('/api/campaigns/category/<category>', methods=['GET'])
def get_campaigns_by_category(category):
    """Get campaigns in a specific category"""
    campaigns = Campaign.query.filter(Campaign.main_category == category, Campaign.status != 'draft').order_by(Campaign.created_at.desc()).all()
    return jsonify({'campaigns': [campaign_to_dict(c) for c in campaigns], 'category': category})


# ============== PHASE 2: SIMILAR CAMPAIGNS ==============

@app.route('/api/campaigns/<int:campaign_id>/similar', methods=['GET'])
def get_similar_campaigns(campaign_id):
    """Get similar campaigns based on category and AI score"""
    campaign = Campaign.query.get(campaign_id)
    if not campaign:
        abort(404)
    
    similar = Campaign.query.filter(
        Campaign.id != campaign_id,
        Campaign.main_category == campaign.main_category,
        Campaign.status != 'draft'
    ).order_by(Campaign.ai_score.desc()).limit(4).all()
    
    if len(similar) < 4:
        more = Campaign.query.filter(
            Campaign.id != campaign_id,
            Campaign.main_category != campaign.main_category,
            Campaign.status != 'draft'
        ).order_by(Campaign.ai_score.desc()).limit(4 - len(similar)).all()
        similar.extend(more)
    
    return jsonify({'campaigns': [campaign_to_dict(c) for c in similar]})


# ============== PHASE 2: SCHEDULED UPDATES ==============

@app.route('/api/campaigns/<int:campaign_id>/updates/schedule', methods=['POST'])
def schedule_update(campaign_id):
    """Schedule an update for future publishing"""
    data = request.json
    from datetime import datetime as dt
    
    su = ScheduledUpdate(
campaign_id=campaign_id,
        title=data['title'], content=data['content'],
        scheduled_for=dt.fromisoformat(data['scheduled_for']),
        is_published=False)
    db.session.add(su); db.session.commit()
    return jsonify({'message': 'Update scheduled', 'scheduled_update': scheduled_update_to_dict(su)}), 201


@app.route('/api/campaigns/<int:campaign_id>/updates/scheduled', methods=['GET'])
def get_scheduled_updates(campaign_id):
    """Get scheduled updates for a campaign"""
    updates = ScheduledUpdate.query.filter_by(campaign_id=campaign_id, is_published=False).order_by(ScheduledUpdate.scheduled_for).all()
    return jsonify({'scheduled_updates': [campaign_update_to_dict(u) for u in updates]})


# ============== PHASE 2: ENHANCED ANALYTICS ==============

@app.route('/api/campaigns/<int:campaign_id>/analytics/detailed', methods=['GET'])
def get_detailed_analytics(campaign_id):
    """Get detailed analytics with chart data"""
    campaign = Campaign.query.get(campaign_id)
    if not campaign:
        abort(404)
    
    # Get investments over time for chart
    investments = Investment.query.filter_by(campaign_id=campaign_id).order_by(Investment.created_at.asc()).all()
    
    from datetime import datetime, timedelta
    daily_data = {}
    running_total = 0
    for inv in investments:
        dt = inv.created_at
        date_key = dt.strftime('%Y-%m-%d') if hasattr(dt, 'strftime') else str(dt)[:10]
        running_total += (inv.amount or 0)
        daily_data[date_key] = running_total
    
    events = AnalyticsEvent.query.filter_by(campaign_id=campaign_id).all()
    view_count = len([e for e in events if e.event_type == 'view'])
    share_count = len([e for e in events if e.event_type == 'share'])
    
    bc = (campaign.backers_count or 0)
    vc = (campaign.views_count or 0)
    ar = (campaign.amount_raised or 0)
    conversion_rate = (bc / max(vc, 1)) * 100
    
    return jsonify({
        'campaign': campaign_to_dict(campaign),
        'chart_data': {
            'labels': list(daily_data.keys()),
            'values': list(daily_data.values())
        },
        'stats': {
            'views': vc,
            'shares': share_count,
            'backers': bc,
            'conversion_rate': round(conversion_rate, 2),
            'avg_investment': round(ar / max(bc, 1), 2)
        }
    })


@app.route('/api/campaigns/<int:campaign_id>/track', methods=['POST'])
def track_analytics_event(campaign_id):
    """Track an analytics event"""
    data = request.json
    evt = AnalyticsEvent(
campaign_id=campaign_id,
        event_type=data.get('event_type', 'view'), user_id=data.get('user_id'),
        amount=data.get('amount'))
    db.session.add(evt); db.session.commit()
    if data.get('event_type') == 'view':
        c = Campaign.query.get(campaign_id)
        if c:
            c.views_count = (c.views_count or 0) + 1; db.session.commit()
    return jsonify({'message': 'Event tracked'})


# ============== TEAM MEMBERS ROUTES ==============

@app.route('/api/campaigns/<int:campaign_id>/team', methods=['GET'])
def get_campaign_team(campaign_id):
    """Get all team members for a campaign"""
    team = TeamMember.query.filter_by(campaign_id=campaign_id).all()
    return jsonify({'team_members': [team_member_to_dict(t) for t in team]})


@app.route('/api/campaigns/<int:campaign_id>/team', methods=['POST'])
def add_team_member(campaign_id):
    """Add a team member to a campaign"""
    data = request.get_json()
    
    if not data.get('name') or not data.get('role'):
        return jsonify({'error': 'Name and role required'}), 400
    
    mem = TeamMember(
campaign_id=campaign_id,
        name=data['name'], role=data['role'],
        avatar=data.get('avatar', ''), bio=data.get('bio', ''),
        linkedin_url=data.get('linkedin_url', ''))
    db.session.add(mem); db.session.commit()
    return jsonify({'message': 'Team member added', 'member': team_member_to_dict(mem)}), 201


@app.route('/api/team/<int:member_id>', methods=['DELETE'])
def remove_team_member(member_id):
    """Remove a team member"""
    member = TeamMember.query.get(member_id)
    if not member:
        abort(404)
    db.session.delete(member); db.session.commit()
    return jsonify({'message': 'Team member removed'})


# ============== REFERRAL ROUTES ==============

@app.route('/api/user/<int:user_id>/referral', methods=['GET'])
def get_user_referral(user_id):
    """Get or create referral code for user"""
    referral = Referral.query.filter_by(user_id=user_id).first()
    
    if not referral:
        code = f"FUND{user_id}{uuid.uuid4().hex[:6].upper()}"
        referral = Referral(user_id=user_id, code=code, uses_count=0, reward_amount=0.0, is_active=True)
        db.session.add(referral); db.session.commit()
    
    return jsonify({'referral': referral_to_dict(referral)})


@app.route('/api/referral/<code>/validate', methods=['GET'])
def validate_referral(code):
    """Validate a referral code"""
    referral = Referral.query.filter_by(code=code, is_active=True).first()
    
    if not referral:
        return jsonify({'valid': False, 'error': 'Invalid or inactive referral code'}), 404
    
    user = User.query.get(referral.user_id)
    return jsonify({
        'valid': True,
        'referrer_name': user.name if user else None
    })


@app.route('/api/referral/<code>/use', methods=['POST'])
def use_referral(code):
    """Record use of a referral code"""
    data = request.get_json()
    
    referral = Referral.query.filter_by(code=code, is_active=True).first()
    if not referral:
        return jsonify({'error': 'Invalid referral code'}), 404
    
    use = ReferralUse(
referral_id=referral.id,
        referred_user_id=data.get('user_id'), campaign_id=data.get('campaign_id'),
        investment_amount=data.get('amount', 0))
    db.session.add(use); db.session.commit()
    reward_add = data.get('amount', 0) * 0.05
    referral.uses_count = (referral.uses_count or 0) + 1; referral.reward_amount = (referral.reward_amount or 0) + reward_add; db.session.commit()
    
    updated = Referral.query.get(referral.id)
    return jsonify({'message': 'Referral recorded', 'referral': referral_to_dict(updated)})



# ============== INITIALIZATION ==============

def init_db():
    """Initialize SQLite database"""
    with app.app_context():
        db.create_all()
        _run_schema_migrations()
    print("✅ SQLite database initialized")


if __name__ == '__main__':
    init_db()
    
    # Preload AI models
    print("\n🤖 Initializing AI Evaluator...")
    evaluator.load_models()
    
    print("\n🚀 Starting FundAI Server...")
    print("   Frontend: http://localhost:5000")
    print("   API: http://localhost:5000/api")
    
    is_debug = os.environ.get('FLASK_DEBUG', 'true').lower() == 'true'
    app.run(debug=is_debug, host='0.0.0.0', port=5000)
