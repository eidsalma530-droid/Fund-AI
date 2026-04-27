"""
FundAI - Database Models
SQLite database models using SQLAlchemy
"""

from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

db = SQLAlchemy()


class User(db.Model):
    """User model for creators and investors"""
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=True) # Nullable for Firebase auth
    firebase_uid = db.Column(db.String(128), unique=True, nullable=True)
    role = db.Column(db.String(20), nullable=False, default='investor')  # 'creator', 'investor', or 'admin'
    name = db.Column(db.String(100), nullable=False)
    age = db.Column(db.Integer, nullable=True)
    nationality = db.Column(db.String(100), nullable=True)
    avatar = db.Column(db.String(256), default='default_avatar.png')
    about = db.Column(db.Text, default='')
    
    # Verification
    is_verified = db.Column(db.Boolean, default=False)
    is_email_verified = db.Column(db.Boolean, default=False)
    verification_token = db.Column(db.String(100), nullable=True)
    
    # Settings
    is_admin = db.Column(db.Boolean, default=False)
    email_preferences = db.Column(db.Text, default='{"investments": true, "updates": true, "milestones": true, "messages": true}')
    avg_rating = db.Column(db.Float, default=0.0)
    total_reviews = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    campaigns = db.relationship('Campaign', backref='creator', lazy=True)
    bookmarks = db.relationship('Bookmark', backref='user', lazy=True)
    notifications = db.relationship('Notification', backref='user', lazy=True)
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'firebase_uid': self.firebase_uid,
            'role': self.role,
            'name': self.name,
            'age': self.age,
            'nationality': self.nationality,
            'avatar': self.avatar,
            'about': self.about,
            'is_verified': self.is_verified,
            'is_email_verified': self.is_email_verified,
            'is_admin': self.is_admin,
            'avg_rating': self.avg_rating,
            'total_reviews': self.total_reviews,
            'created_at': self.created_at.isoformat()
        }


class Campaign(db.Model):
    """Campaign model for crowdfunding projects"""
    __tablename__ = 'campaigns'
    
    id = db.Column(db.Integer, primary_key=True)
    creator_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Campaign details
    name = db.Column(db.String(200), nullable=False)
    blurb = db.Column(db.Text, nullable=False)
    description = db.Column(db.Text, default='')  # Full description
    usd_goal = db.Column(db.Float, nullable=False)
    duration_days = db.Column(db.Integer, nullable=False)
    prep_days = db.Column(db.Integer, default=30)
    main_category = db.Column(db.String(50), nullable=False)
    country = db.Column(db.String(10), nullable=False)
    has_video = db.Column(db.Boolean, default=False)
    video_url = db.Column(db.String(500), default='')
    
    # Funding progress
    amount_raised = db.Column(db.Float, default=0.0)
    backers_count = db.Column(db.Integer, default=0)
    views_count = db.Column(db.Integer, default=0)
    
    # AI Evaluation results
    ai_score = db.Column(db.Float, nullable=True)
    dl_score = db.Column(db.Float, nullable=True)
    xgb_score = db.Column(db.Float, nullable=True)
    gemini_advice = db.Column(db.Text, nullable=True)
    is_ai_verified = db.Column(db.Boolean, default=False)
    
    # Metadata
    status = db.Column(db.String(20), default='pending')
    is_featured = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    investments = db.relationship('Investment', backref='campaign', lazy=True)
    images = db.relationship('CampaignImage', backref='campaign', lazy=True)
    updates = db.relationship('CampaignUpdate', backref='campaign', lazy=True)
    comments = db.relationship('Comment', backref='campaign', lazy=True)
    milestones = db.relationship('Milestone', backref='campaign', lazy=True)
    rewards = db.relationship('Reward', backref='campaign', lazy=True)
    
    @property
    def funding_percentage(self):
        if self.usd_goal > 0:
            return (self.amount_raised / self.usd_goal) * 100
        return 0
    
    @property
    def days_remaining(self):
        """Calculate remaining days for the campaign"""
        if self.created_at:
            from datetime import datetime, timedelta
            end_date = self.created_at + timedelta(days=self.duration_days)
            remaining = (end_date - datetime.utcnow()).days
            return max(0, remaining)
        return self.duration_days
    
    @property
    def is_expired(self):
        """Check if campaign has expired"""
        return self.days_remaining <= 0
    
    @property
    def condition(self):
        """Return human-readable campaign condition"""
        if self.funding_percentage >= 100:
            return 'funded'
        elif self.is_expired:
            return 'expired'
        elif self.funding_percentage >= 75:
            return 'almost_funded'
        elif self.funding_percentage >= 50:
            return 'halfway'
        elif self.funding_percentage > 0:
            return 'active'
        else:
            return 'new'
    
    @property
    def primary_image(self):
        """Get the primary image URL for the campaign"""
        for img in self.images:
            if img.is_primary:
                return img.image_url
        # Return first image if no primary is set
        if self.images:
            return self.images[0].image_url
        return None
    
    def to_dict(self):
        return {
            'id': self.id,
            'creator_id': self.creator_id,
            'creator_name': self.creator.name if self.creator else None,
            'creator_avatar': self.creator.avatar if self.creator else None,
            'name': self.name,
            'blurb': self.blurb,
            'description': self.description,
            'usd_goal': self.usd_goal,
            'duration_days': self.duration_days,
            'prep_days': self.prep_days,
            'main_category': self.main_category,
            'country': self.country,
            'has_video': self.has_video,
            'video_url': self.video_url,
            'amount_raised': self.amount_raised,
            'backers_count': self.backers_count,
            'views_count': self.views_count,
            'funding_percentage': self.funding_percentage,
            'days_remaining': self.days_remaining,
            'is_expired': self.is_expired,
            'condition': self.condition,
            'ai_score': self.ai_score,
            'dl_score': self.dl_score,
            'xgb_score': self.xgb_score,
            'gemini_advice': self.gemini_advice,
            'is_ai_verified': self.is_ai_verified,
            'status': self.status,
            'is_featured': self.is_featured,
            'primary_image': self.primary_image,
            'images': [img.to_dict() for img in self.images],
            'milestones': [m.to_dict() for m in self.milestones],
            'rewards': [r.to_dict() for r in self.rewards],
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }


class Investment(db.Model):
    """Investment model for tracking investor contributions"""
    __tablename__ = 'investments'
    
    id = db.Column(db.Integer, primary_key=True)
    investor_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    campaign_id = db.Column(db.Integer, db.ForeignKey('campaigns.id'), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    message = db.Column(db.Text, default='')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationship to investor
    investor = db.relationship('User', backref='investments')
    reward_id = db.Column(db.Integer, db.ForeignKey('rewards.id'), nullable=True)
    reward = db.relationship('Reward', backref='investments')
    
    def to_dict(self):
        return {
            'id': self.id,
            'investor_id': self.investor_id,
            'investor_name': self.investor.name if self.investor else None,
            'investor_avatar': self.investor.avatar if self.investor else None,
            'campaign_id': self.campaign_id,
            'campaign_name': self.campaign.name if self.campaign else None,
            'amount': self.amount,
            'message': self.message,
            'reward_id': self.reward_id,
            'reward_title': self.reward.title if self.reward else None,
            'created_at': self.created_at.isoformat()
        }


class CampaignImage(db.Model):
    """Campaign images/gallery"""
    __tablename__ = 'campaign_images'
    
    id = db.Column(db.Integer, primary_key=True)
    campaign_id = db.Column(db.Integer, db.ForeignKey('campaigns.id'), nullable=False)
    image_url = db.Column(db.String(500), nullable=False)
    is_primary = db.Column(db.Boolean, default=False)
    caption = db.Column(db.String(200), default='')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'campaign_id': self.campaign_id,
            'image_url': self.image_url,
            'is_primary': self.is_primary,
            'caption': self.caption,
            'created_at': self.created_at.isoformat()
        }


class CampaignUpdate(db.Model):
    """Campaign updates posted by creators"""
    __tablename__ = 'campaign_updates'
    
    id = db.Column(db.Integer, primary_key=True)
    campaign_id = db.Column(db.Integer, db.ForeignKey('campaigns.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'campaign_id': self.campaign_id,
            'campaign_name': self.campaign.name if self.campaign else None,
            'title': self.title,
            'content': self.content,
            'created_at': self.created_at.isoformat()
        }


class Comment(db.Model):
    """Comments on campaigns"""
    __tablename__ = 'comments'
    
    id = db.Column(db.Integer, primary_key=True)
    campaign_id = db.Column(db.Integer, db.ForeignKey('campaigns.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    content = db.Column(db.Text, nullable=False)
    parent_id = db.Column(db.Integer, db.ForeignKey('comments.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    user = db.relationship('User', backref='comments')
    replies = db.relationship('Comment', backref=db.backref('parent', remote_side=[id]), lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'campaign_id': self.campaign_id,
            'user_id': self.user_id,
            'user_name': self.user.name if self.user else None,
            'user_avatar': self.user.avatar if self.user else None,
            'content': self.content,
            'parent_id': self.parent_id,
            'replies': [r.to_dict() for r in self.replies],
            'created_at': self.created_at.isoformat()
        }


class Bookmark(db.Model):
    """User bookmarks for saving campaigns"""
    __tablename__ = 'bookmarks'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    campaign_id = db.Column(db.Integer, db.ForeignKey('campaigns.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    campaign = db.relationship('Campaign', backref='bookmarks')
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'campaign_id': self.campaign_id,
            'campaign': self.campaign.to_dict() if self.campaign else None,
            'created_at': self.created_at.isoformat()
        }


class Review(db.Model):
    """User reviews for creators"""
    __tablename__ = 'reviews'
    
    id = db.Column(db.Integer, primary_key=True)
    reviewer_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    reviewed_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    campaign_id = db.Column(db.Integer, db.ForeignKey('campaigns.id'), nullable=False)
    rating = db.Column(db.Integer, nullable=False)  # 1-5 stars
    content = db.Column(db.Text, default='')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    reviewer = db.relationship('User', foreign_keys=[reviewer_id], backref='reviews_given')
    reviewed = db.relationship('User', foreign_keys=[reviewed_id], backref='reviews_received')
    campaign = db.relationship('Campaign', backref='reviews')
    
    def to_dict(self):
        return {
            'id': self.id,
            'reviewer_id': self.reviewer_id,
            'reviewer_name': self.reviewer.name if self.reviewer else None,
            'reviewer_avatar': self.reviewer.avatar if self.reviewer else None,
            'reviewed_id': self.reviewed_id,
            'campaign_id': self.campaign_id,
            'rating': self.rating,
            'content': self.content,
            'created_at': self.created_at.isoformat()
        }


class Milestone(db.Model):
    """Campaign funding milestones/stretch goals"""
    __tablename__ = 'milestones'
    
    id = db.Column(db.Integer, primary_key=True)
    campaign_id = db.Column(db.Integer, db.ForeignKey('campaigns.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, default='')
    target_amount = db.Column(db.Float, nullable=False)
    is_reached = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'campaign_id': self.campaign_id,
            'title': self.title,
            'description': self.description,
            'target_amount': self.target_amount,
            'is_reached': self.is_reached,
            'created_at': self.created_at.isoformat()
        }


class Reward(db.Model):
    """Campaign reward tiers"""
    __tablename__ = 'rewards'
    
    id = db.Column(db.Integer, primary_key=True)
    campaign_id = db.Column(db.Integer, db.ForeignKey('campaigns.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    min_amount = db.Column(db.Float, nullable=False)
    max_backers = db.Column(db.Integer, nullable=True)  # None = unlimited
    backers_count = db.Column(db.Integer, default=0)
    estimated_delivery = db.Column(db.String(50), default='')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'campaign_id': self.campaign_id,
            'title': self.title,
            'description': self.description,
            'min_amount': self.min_amount,
            'amount': self.min_amount,  # Alias for frontend compatibility
            'max_backers': self.max_backers,
            'backers_count': self.backers_count,
            'is_available': self.max_backers is None or self.backers_count < self.max_backers,
            'estimated_delivery': self.estimated_delivery,
            'created_at': self.created_at.isoformat()
        }


class Notification(db.Model):
    """User notifications"""
    __tablename__ = 'notifications'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    type = db.Column(db.String(50), nullable=False)  # investment, update, comment, milestone, etc.
    title = db.Column(db.String(200), nullable=False)
    message = db.Column(db.Text, nullable=False)
    link = db.Column(db.String(500), default='')
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'type': self.type,
            'title': self.title,
            'message': self.message,
            'link': self.link,
            'is_read': self.is_read,
            'created_at': self.created_at.isoformat()
        }


class Payment(db.Model):
    """Mock payment records"""
    __tablename__ = 'payments'
    
    id = db.Column(db.Integer, primary_key=True)
    investment_id = db.Column(db.Integer, db.ForeignKey('investments.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    payment_method = db.Column(db.String(50), default='card')  # card, paypal
    status = db.Column(db.String(20), default='completed')  # pending, completed, failed, refunded
    transaction_id = db.Column(db.String(100), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    investment = db.relationship('Investment', backref='payment')
    user = db.relationship('User', backref='payments')
    
    def to_dict(self):
        return {
            'id': self.id,
            'investment_id': self.investment_id,
            'user_id': self.user_id,
            'amount': self.amount,
            'payment_method': self.payment_method,
            'status': self.status,
            'transaction_id': self.transaction_id,
            'created_at': self.created_at.isoformat()
        }


class FAQ(db.Model):
    """FAQ model for campaign questions"""
    __tablename__ = 'faqs'
    
    id = db.Column(db.Integer, primary_key=True)
    campaign_id = db.Column(db.Integer, db.ForeignKey('campaigns.id'), nullable=False)
    question = db.Column(db.String(500), nullable=False)
    answer = db.Column(db.Text, nullable=False)
    order = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    campaign = db.relationship('Campaign', backref='faqs')
    
    def to_dict(self):
        return {
            'id': self.id,
            'campaign_id': self.campaign_id,
            'question': self.question,
            'answer': self.answer,
            'order': self.order,
            'created_at': self.created_at.isoformat()
        }


class Message(db.Model):
    """Message model for backer-creator communication"""
    __tablename__ = 'messages'
    
    id = db.Column(db.Integer, primary_key=True)
    sender_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    recipient_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    campaign_id = db.Column(db.Integer, db.ForeignKey('campaigns.id'), nullable=True)
    subject = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    sender = db.relationship('User', foreign_keys=[sender_id], backref='sent_messages')
    recipient = db.relationship('User', foreign_keys=[recipient_id], backref='received_messages')
    campaign = db.relationship('Campaign', backref='messages')
    
    def to_dict(self):
        return {
            'id': self.id,
            'sender_id': self.sender_id,
            'sender_name': self.sender.name if self.sender else None,
            'sender_avatar': self.sender.avatar if self.sender else None,
            'recipient_id': self.recipient_id,
            'recipient_name': self.recipient.name if self.recipient else None,
            'campaign_id': self.campaign_id,
            'campaign_name': self.campaign.name if self.campaign else None,
            'subject': self.subject,
            'content': self.content,
            'is_read': self.is_read,
            'created_at': self.created_at.isoformat()
        }


class ScheduledUpdate(db.Model):
    """Scheduled updates for campaigns"""
    __tablename__ = 'scheduled_updates'
    
    id = db.Column(db.Integer, primary_key=True)
    campaign_id = db.Column(db.Integer, db.ForeignKey('campaigns.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)
    scheduled_for = db.Column(db.DateTime, nullable=False)
    is_published = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    campaign = db.relationship('Campaign', backref='scheduled_updates')
    
    def to_dict(self):
        return {
            'id': self.id,
            'campaign_id': self.campaign_id,
            'title': self.title,
            'content': self.content,
            'scheduled_for': self.scheduled_for.isoformat(),
            'is_published': self.is_published,
            'created_at': self.created_at.isoformat()
        }


class AnalyticsEvent(db.Model):
    """Analytics events for detailed tracking"""
    __tablename__ = 'analytics_events'
    
    id = db.Column(db.Integer, primary_key=True)
    campaign_id = db.Column(db.Integer, db.ForeignKey('campaigns.id'), nullable=False)
    event_type = db.Column(db.String(50), nullable=False)  # view, investment, share, bookmark
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    amount = db.Column(db.Float, nullable=True)  # For investment events
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    campaign = db.relationship('Campaign', backref='analytics_events')
    
    def to_dict(self):
        return {
            'id': self.id,
            'campaign_id': self.campaign_id,
            'event_type': self.event_type,
            'user_id': self.user_id,
            'amount': self.amount,
            'created_at': self.created_at.isoformat()
        }


class TeamMember(db.Model):
    """Team members for a campaign"""
    __tablename__ = 'team_members'
    
    id = db.Column(db.Integer, primary_key=True)
    campaign_id = db.Column(db.Integer, db.ForeignKey('campaigns.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    role = db.Column(db.String(100), nullable=False)
    avatar = db.Column(db.String(500), default='')
    bio = db.Column(db.Text, default='')
    linkedin_url = db.Column(db.String(500), default='')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    campaign = db.relationship('Campaign', backref='team_members')
    
    def to_dict(self):
        return {
            'id': self.id,
            'campaign_id': self.campaign_id,
            'name': self.name,
            'role': self.role,
            'avatar': self.avatar,
            'bio': self.bio,
            'linkedin_url': self.linkedin_url,
            'created_at': self.created_at.isoformat()
        }


class Referral(db.Model):
    """Referral codes and tracking"""
    __tablename__ = 'referrals'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    code = db.Column(db.String(20), unique=True, nullable=False)
    uses_count = db.Column(db.Integer, default=0)
    reward_amount = db.Column(db.Float, default=0.0)  # Total rewards earned
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    user = db.relationship('User', backref='referrals')
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'code': self.code,
            'uses_count': self.uses_count,
            'reward_amount': self.reward_amount,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat()
        }


class ReferralUse(db.Model):
    """Track referral code uses"""
    __tablename__ = 'referral_uses'
    
    id = db.Column(db.Integer, primary_key=True)
    referral_id = db.Column(db.Integer, db.ForeignKey('referrals.id'), nullable=False)
    referred_user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    campaign_id = db.Column(db.Integer, db.ForeignKey('campaigns.id'), nullable=True)
    investment_amount = db.Column(db.Float, default=0.0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    referral = db.relationship('Referral', backref='uses')
    referred_user = db.relationship('User', backref='referred_by')
    
    def to_dict(self):
        return {
            'id': self.id,
            'referral_id': self.referral_id,
            'referred_user_id': self.referred_user_id,
            'campaign_id': self.campaign_id,
            'investment_amount': self.investment_amount,
            'created_at': self.created_at.isoformat()
        }
