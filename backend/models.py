"""
FundAI - Database Models (SQLAlchemy)
SQLAlchemy ORM models for local SQLite development
"""

import os
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash, check_password_hash
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

# ============== Helper Functions ==============

def set_password(password):
    return generate_password_hash(password)

def check_password(stored_hash, password):
    return check_password_hash(stored_hash, password)

def dt_to_iso(dt_val):
    """Safely convert datetime to ISO string"""
    if isinstance(dt_val, datetime):
        return dt_val.isoformat()
    return str(dt_val) if dt_val else datetime.utcnow().isoformat()


# ============== User Model ==============

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(256), nullable=True)
    firebase_uid = db.Column(db.String(128), unique=True, nullable=True, index=True)
    role = db.Column(db.String(20), default='investor')
    creator_downgraded = db.Column(db.Boolean, default=False)
    name = db.Column(db.String(100), default='')
    age = db.Column(db.Integer, nullable=True)
    nationality = db.Column(db.String(100), nullable=True)
    avatar = db.Column(db.String(256), default='default_avatar.png')
    about = db.Column(db.Text, default='')
    is_verified = db.Column(db.Boolean, default=False)
    is_email_verified = db.Column(db.Boolean, default=False)
    verification_token = db.Column(db.String(50), nullable=True)
    is_admin = db.Column(db.Boolean, default=False)
    email_preferences = db.Column(db.Text, default='{"investments": true, "updates": true, "milestones": true, "messages": true}')
    avg_rating = db.Column(db.Float, default=0.0)
    total_reviews = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'firebase_uid': self.firebase_uid,
            'role': self.role or 'investor',
            'creator_downgraded': bool(self.creator_downgraded),
            'name': self.name or '',
            'age': self.age,
            'nationality': self.nationality,
            'avatar': self.avatar or 'default_avatar.png',
            'about': self.about or '',
            'is_verified': self.is_verified or False,
            'is_email_verified': self.is_email_verified or False,
            'is_admin': self.is_admin or False,
            'avg_rating': self.avg_rating or 0.0,
            'total_reviews': self.total_reviews or 0,
            'created_at': dt_to_iso(self.created_at),
        }


# ============== Campaign Model ==============

class Campaign(db.Model):
    __tablename__ = 'campaigns'

    id = db.Column(db.Integer, primary_key=True)
    creator_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    name = db.Column(db.String(200), nullable=False)
    blurb = db.Column(db.Text, default='')
    description = db.Column(db.Text, default='')
    usd_goal = db.Column(db.Float, nullable=False)
    duration_days = db.Column(db.Integer, nullable=False)
    prep_days = db.Column(db.Integer, default=30)
    main_category = db.Column(db.String(100), nullable=False, index=True)
    country = db.Column(db.String(100), nullable=False)
    has_video = db.Column(db.Boolean, default=False)
    video_url = db.Column(db.String(500), default='')
    amount_raised = db.Column(db.Float, default=0.0)
    backers_count = db.Column(db.Integer, default=0)
    views_count = db.Column(db.Integer, default=0)
    ai_score = db.Column(db.Float, nullable=True)
    dl_score = db.Column(db.Float, nullable=True)
    xgb_score = db.Column(db.Float, nullable=True)
    gemini_advice = db.Column(db.Text, nullable=True)
    is_ai_verified = db.Column(db.Boolean, default=False)
    status = db.Column(db.String(30), default='pending', index=True)
    is_featured = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    creator_rel = db.relationship('User', backref='created_campaigns', foreign_keys=[creator_id])

    def funding_percentage(self):
        if self.usd_goal and self.usd_goal > 0:
            return ((self.amount_raised or 0) / self.usd_goal) * 100
        return 0

    def days_remaining(self):
        if self.created_at:
            end_date = self.created_at + timedelta(days=self.duration_days or 30)
            remaining = (end_date - datetime.utcnow()).days
            return max(0, remaining)
        return self.duration_days or 30

    def is_expired_check(self):
        return self.days_remaining() <= 0

    def condition(self):
        pct = self.funding_percentage()
        if pct >= 100:
            return 'funded'
        elif self.is_expired_check():
            return 'expired'
        elif pct >= 75:
            return 'almost_funded'
        elif pct >= 50:
            return 'halfway'
        elif pct > 0:
            return 'active'
        else:
            return 'new'

    def get_primary_image(self):
        img = CampaignImage.query.filter_by(campaign_id=self.id, is_primary=True).first()
        if not img:
            img = CampaignImage.query.filter_by(campaign_id=self.id).first()
        return img.image_url if img else None

    def to_dict(self):
        creator = User.query.get(self.creator_id)
        images_list = CampaignImage.query.filter_by(campaign_id=self.id).all()
        milestones_list = Milestone.query.filter_by(campaign_id=self.id).all()
        rewards_list = Reward.query.filter_by(campaign_id=self.id).all()
        return {
            'id': self.id,
            'creator_id': self.creator_id,
            'creator_name': creator.name if creator else None,
            'creator_avatar': creator.avatar if creator else None,
            'name': self.name,
            'blurb': self.blurb or '',
            'description': self.description or '',
            'usd_goal': self.usd_goal,
            'duration_days': self.duration_days,
            'prep_days': self.prep_days or 30,
            'main_category': self.main_category,
            'country': self.country,
            'has_video': self.has_video or False,
            'video_url': self.video_url or '',
            'amount_raised': self.amount_raised or 0,
            'backers_count': self.backers_count or 0,
            'views_count': self.views_count or 0,
            'funding_percentage': self.funding_percentage(),
            'days_remaining': self.days_remaining(),
            'is_expired': self.is_expired_check(),
            'condition': self.condition(),
            'ai_score': self.ai_score,
            'dl_score': self.dl_score,
            'xgb_score': self.xgb_score,
            'gemini_advice': self.gemini_advice,
            'is_ai_verified': self.is_ai_verified or False,
            'status': self.status or 'pending',
            'is_featured': self.is_featured or False,
            'primary_image': self.get_primary_image(),
            'images': [img.to_dict() for img in images_list],
            'milestones': [m.to_dict() for m in milestones_list],
            'rewards': [r.to_dict() for r in rewards_list],
            'created_at': dt_to_iso(self.created_at),
            'updated_at': dt_to_iso(self.updated_at),
        }


# ============== Supporting Models ==============

class Investment(db.Model):
    __tablename__ = 'investments'
    id = db.Column(db.Integer, primary_key=True)
    investor_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    campaign_id = db.Column(db.Integer, db.ForeignKey('campaigns.id'), nullable=False, index=True)
    amount = db.Column(db.Float, nullable=False)
    message = db.Column(db.Text, default='')
    reward_id = db.Column(db.Integer, db.ForeignKey('rewards.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        investor = User.query.get(self.investor_id)
        campaign = Campaign.query.get(self.campaign_id)
        reward = Reward.query.get(self.reward_id) if self.reward_id else None
        return {
            'id': self.id, 'investor_id': self.investor_id,
            'investor_name': investor.name if investor else None,
            'investor_avatar': investor.avatar if investor else None,
            'campaign_id': self.campaign_id,
            'campaign_name': campaign.name if campaign else None,
            'amount': self.amount, 'message': self.message or '',
            'reward_id': self.reward_id,
            'reward_title': reward.title if reward else None,
            'created_at': dt_to_iso(self.created_at),
        }


class CampaignImage(db.Model):
    __tablename__ = 'campaign_images'
    id = db.Column(db.Integer, primary_key=True)
    campaign_id = db.Column(db.Integer, db.ForeignKey('campaigns.id'), nullable=False, index=True)
    image_url = db.Column(db.String(500), nullable=False)
    is_primary = db.Column(db.Boolean, default=False)
    caption = db.Column(db.Text, default='')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id, 'campaign_id': self.campaign_id,
            'image_url': self.image_url, 'is_primary': self.is_primary or False,
            'caption': self.caption or '', 'created_at': dt_to_iso(self.created_at),
        }


class CampaignUpdate(db.Model):
    __tablename__ = 'campaign_updates'
    id = db.Column(db.Integer, primary_key=True)
    campaign_id = db.Column(db.Integer, db.ForeignKey('campaigns.id'), nullable=False, index=True)
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        campaign = Campaign.query.get(self.campaign_id)
        return {
            'id': self.id, 'campaign_id': self.campaign_id,
            'campaign_name': campaign.name if campaign else None,
            'title': self.title, 'content': self.content,
            'created_at': dt_to_iso(self.created_at),
        }


class Comment(db.Model):
    __tablename__ = 'comments'
    id = db.Column(db.Integer, primary_key=True)
    campaign_id = db.Column(db.Integer, db.ForeignKey('campaigns.id'), nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    content = db.Column(db.Text, nullable=False)
    parent_id = db.Column(db.Integer, db.ForeignKey('comments.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        user = User.query.get(self.user_id)
        replies = Comment.query.filter_by(parent_id=self.id).all()
        return {
            'id': self.id, 'campaign_id': self.campaign_id,
            'user_id': self.user_id,
            'user_name': user.name if user else None,
            'user_avatar': user.avatar if user else None,
            'content': self.content, 'parent_id': self.parent_id,
            'replies': [r.to_dict() for r in replies],
            'created_at': dt_to_iso(self.created_at),
        }


class Bookmark(db.Model):
    __tablename__ = 'bookmarks'
    __table_args__ = (db.UniqueConstraint('user_id', 'campaign_id'),)
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    campaign_id = db.Column(db.Integer, db.ForeignKey('campaigns.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        campaign = Campaign.query.get(self.campaign_id)
        return {
            'id': self.id, 'user_id': self.user_id,
            'campaign_id': self.campaign_id,
            'campaign': campaign.to_dict() if campaign else None,
            'created_at': dt_to_iso(self.created_at),
        }


class Review(db.Model):
    __tablename__ = 'reviews'
    id = db.Column(db.Integer, primary_key=True)
    reviewer_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    reviewed_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    campaign_id = db.Column(db.Integer, db.ForeignKey('campaigns.id'), nullable=False)
    rating = db.Column(db.Integer, nullable=False)
    content = db.Column(db.Text, default='')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        reviewer = User.query.get(self.reviewer_id)
        return {
            'id': self.id, 'reviewer_id': self.reviewer_id,
            'reviewer_name': reviewer.name if reviewer else None,
            'reviewer_avatar': reviewer.avatar if reviewer else None,
            'reviewed_id': self.reviewed_id, 'campaign_id': self.campaign_id,
            'rating': self.rating, 'content': self.content or '',
            'created_at': dt_to_iso(self.created_at),
        }


class Milestone(db.Model):
    __tablename__ = 'milestones'
    id = db.Column(db.Integer, primary_key=True)
    campaign_id = db.Column(db.Integer, db.ForeignKey('campaigns.id'), nullable=False, index=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, default='')
    target_amount = db.Column(db.Float, nullable=False)
    is_reached = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id, 'campaign_id': self.campaign_id,
            'title': self.title, 'description': self.description or '',
            'target_amount': self.target_amount, 'is_reached': self.is_reached or False,
            'created_at': dt_to_iso(self.created_at),
        }


class Reward(db.Model):
    __tablename__ = 'rewards'
    id = db.Column(db.Integer, primary_key=True)
    campaign_id = db.Column(db.Integer, db.ForeignKey('campaigns.id'), nullable=False, index=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, default='')
    min_amount = db.Column(db.Float, nullable=False)
    max_backers = db.Column(db.Integer, nullable=True)
    backers_count = db.Column(db.Integer, default=0)
    estimated_delivery = db.Column(db.String(100), default='')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id, 'campaign_id': self.campaign_id,
            'title': self.title, 'description': self.description,
            'min_amount': self.min_amount, 'amount': self.min_amount,
            'max_backers': self.max_backers,
            'backers_count': self.backers_count or 0,
            'is_available': self.max_backers is None or (self.backers_count or 0) < (self.max_backers or 999),
            'estimated_delivery': self.estimated_delivery or '',
            'created_at': dt_to_iso(self.created_at),
        }


class Notification(db.Model):
    __tablename__ = 'notifications'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    type = db.Column(db.String(50))
    title = db.Column(db.String(200))
    message = db.Column(db.Text)
    link = db.Column(db.String(500), default='')
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id, 'user_id': self.user_id,
            'type': self.type, 'title': self.title,
            'message': self.message, 'link': self.link or '',
            'is_read': self.is_read or False,
            'created_at': dt_to_iso(self.created_at),
        }


class Payment(db.Model):
    __tablename__ = 'payments'
    id = db.Column(db.Integer, primary_key=True)
    investment_id = db.Column(db.Integer, db.ForeignKey('investments.id'))
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    amount = db.Column(db.Float, nullable=False)
    payment_method = db.Column(db.String(50), default='card')
    status = db.Column(db.String(30), default='completed')
    transaction_id = db.Column(db.String(100))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id, 'investment_id': self.investment_id,
            'user_id': self.user_id, 'amount': self.amount,
            'payment_method': self.payment_method or 'card',
            'status': self.status or 'completed',
            'transaction_id': self.transaction_id,
            'created_at': dt_to_iso(self.created_at),
        }


class FAQ(db.Model):
    __tablename__ = 'faqs'
    id = db.Column(db.Integer, primary_key=True)
    campaign_id = db.Column(db.Integer, db.ForeignKey('campaigns.id'), nullable=False, index=True)
    question = db.Column(db.Text, nullable=False)
    answer = db.Column(db.Text, nullable=False)
    order = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id, 'campaign_id': self.campaign_id,
            'question': self.question, 'answer': self.answer,
            'order': self.order or 0, 'created_at': dt_to_iso(self.created_at),
        }


class Message(db.Model):
    __tablename__ = 'messages'
    id = db.Column(db.Integer, primary_key=True)
    sender_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    recipient_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    campaign_id = db.Column(db.Integer, db.ForeignKey('campaigns.id'), nullable=True)
    subject = db.Column(db.String(200))
    content = db.Column(db.Text)
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        sender = User.query.get(self.sender_id)
        recipient = User.query.get(self.recipient_id)
        campaign = Campaign.query.get(self.campaign_id) if self.campaign_id else None
        return {
            'id': self.id, 'sender_id': self.sender_id,
            'sender_name': sender.name if sender else None,
            'sender_avatar': sender.avatar if sender else None,
            'recipient_id': self.recipient_id,
            'recipient_name': recipient.name if recipient else None,
            'campaign_id': self.campaign_id,
            'campaign_name': campaign.name if campaign else None,
            'subject': self.subject, 'content': self.content,
            'is_read': self.is_read or False,
            'created_at': dt_to_iso(self.created_at),
        }


class ScheduledUpdate(db.Model):
    __tablename__ = 'scheduled_updates'
    id = db.Column(db.Integer, primary_key=True)
    campaign_id = db.Column(db.Integer, db.ForeignKey('campaigns.id'), nullable=False)
    title = db.Column(db.String(200))
    content = db.Column(db.Text)
    scheduled_for = db.Column(db.DateTime)
    is_published = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id, 'campaign_id': self.campaign_id,
            'title': self.title, 'content': self.content,
            'scheduled_for': dt_to_iso(self.scheduled_for),
            'is_published': self.is_published or False,
            'created_at': dt_to_iso(self.created_at),
        }


class AnalyticsEvent(db.Model):
    __tablename__ = 'analytics_events'
    id = db.Column(db.Integer, primary_key=True)
    campaign_id = db.Column(db.Integer, db.ForeignKey('campaigns.id'), nullable=False)
    event_type = db.Column(db.String(50))
    user_id = db.Column(db.Integer, nullable=True)
    amount = db.Column(db.Float, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id, 'campaign_id': self.campaign_id,
            'event_type': self.event_type, 'user_id': self.user_id,
            'amount': self.amount, 'created_at': dt_to_iso(self.created_at),
        }


class TeamMember(db.Model):
    __tablename__ = 'team_members'
    id = db.Column(db.Integer, primary_key=True)
    campaign_id = db.Column(db.Integer, db.ForeignKey('campaigns.id'), nullable=False, index=True)
    name = db.Column(db.String(100), nullable=False)
    role = db.Column(db.String(100), nullable=False)
    avatar = db.Column(db.String(256), default='')
    bio = db.Column(db.Text, default='')
    linkedin_url = db.Column(db.String(500), default='')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id, 'campaign_id': self.campaign_id,
            'name': self.name, 'role': self.role,
            'avatar': self.avatar or '', 'bio': self.bio or '',
            'linkedin_url': self.linkedin_url or '',
            'created_at': dt_to_iso(self.created_at),
        }


class Referral(db.Model):
    __tablename__ = 'referrals'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    code = db.Column(db.String(50), unique=True, nullable=False, index=True)
    uses_count = db.Column(db.Integer, default=0)
    reward_amount = db.Column(db.Float, default=0.0)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id, 'user_id': self.user_id,
            'code': self.code, 'uses_count': self.uses_count or 0,
            'reward_amount': self.reward_amount or 0.0,
            'is_active': self.is_active if self.is_active is not None else True,
            'created_at': dt_to_iso(self.created_at),
        }


class ReferralUse(db.Model):
    __tablename__ = 'referral_uses'
    id = db.Column(db.Integer, primary_key=True)
    referral_id = db.Column(db.Integer, db.ForeignKey('referrals.id'), nullable=False)
    referred_user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    campaign_id = db.Column(db.Integer, db.ForeignKey('campaigns.id'), nullable=True)
    investment_amount = db.Column(db.Float, default=0.0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id, 'referral_id': self.referral_id,
            'referred_user_id': self.referred_user_id,
            'campaign_id': self.campaign_id,
            'investment_amount': self.investment_amount or 0.0,
            'created_at': dt_to_iso(self.created_at),
        }


# ============== Standalone to_dict wrappers (backward compat with app.py) ==============

def user_to_dict(u):
    return u.to_dict() if u else None

def campaign_to_dict(c):
    return c.to_dict() if c else None

def investment_to_dict(inv):
    return inv.to_dict() if inv else None

def campaign_image_to_dict(img):
    return img.to_dict() if img else None

def campaign_update_to_dict(u):
    return u.to_dict() if u else None

def comment_to_dict(c):
    return c.to_dict() if c else None

def bookmark_to_dict(b):
    return b.to_dict() if b else None

def review_to_dict(r):
    return r.to_dict() if r else None

def milestone_to_dict(m):
    return m.to_dict() if m else None

def reward_to_dict(r):
    return r.to_dict() if r else None

def notification_to_dict(n):
    return n.to_dict() if n else None

def payment_to_dict(p):
    return p.to_dict() if p else None

def faq_to_dict(f):
    return f.to_dict() if f else None

def message_to_dict(m):
    return m.to_dict() if m else None

def scheduled_update_to_dict(s):
    return s.to_dict() if s else None

def analytics_event_to_dict(a):
    return a.to_dict() if a else None

def team_member_to_dict(t):
    return t.to_dict() if t else None

def referral_to_dict(r):
    return r.to_dict() if r else None

def referral_use_to_dict(ru):
    return ru.to_dict() if ru else None


# ============== Campaign helper wrappers ==============

def campaign_funding_percentage(c):
    if not c:
        return 0
    return c.funding_percentage()

def campaign_days_remaining(c):
    if not c:
        return 0
    return c.days_remaining()
