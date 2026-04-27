import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useParams } from 'react-router-dom';
import { FiCamera, FiEdit2, FiSave, FiX, FiTrendingUp, FiDollarSign, FiClock, FiCheckCircle, FiCopy, FiShare2, FiStar, FiMail, FiMessageCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';
import { userAPI, referralsAPI, reviewsAPI, authAPI, SERVER_BASE } from '../services/api';

const Profile = () => {
    const { userId } = useParams(); // For viewing other users
    const { user: currentUser, isAuthenticated, updateUser } = useAuthStore();

    // Determine if viewing own profile or another user's
    const isOwnProfile = !userId || (currentUser && parseInt(userId) === currentUser.id);
    const viewingUserId = isOwnProfile ? currentUser?.id : parseInt(userId);

    const [profileUser, setProfileUser] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [bio, setBio] = useState('');
    const [profileImage, setProfileImage] = useState(null);
    const [investments, setInvestments] = useState([]);
    const [referral, setReferral] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('investments');
    const [verificationSent, setVerificationSent] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        // For own profile when logged in, use currentUser
        if (isOwnProfile && currentUser) {
            setProfileUser(currentUser);
            setBio(currentUser.about || '');
            // Build avatar URL from backend avatar field
            if (currentUser.avatar && currentUser.avatar !== 'default_avatar.png') {
                setProfileImage(`${SERVER_BASE}/uploads/avatars/${currentUser.avatar}`);
            } else {
                setProfileImage(null);
            }
        }
    }, [isOwnProfile, currentUser]);

    useEffect(() => {
        if (viewingUserId) {
            fetchAllData();
        } else if (!isOwnProfile && userId) {
            // If viewing another user but the ID is valid
            fetchAllData();
        } else {
            setLoading(false);
        }
    }, [viewingUserId, userId]);

    const fetchAllData = async () => {
        const targetUserId = viewingUserId || parseInt(userId);
        if (!targetUserId) {
            setLoading(false);
            return;
        }

        try {
            // If viewing another user, fetch their profile
            if (!isOwnProfile) {
                const profileData = await userAPI.getProfile(targetUserId);
                setProfileUser(profileData.user);
                // Set their avatar
                if (profileData.user?.avatar && profileData.user.avatar !== 'default_avatar.png') {
                    setProfileImage(`${SERVER_BASE}/uploads/avatars/${profileData.user.avatar}`);
                }
            } else if (currentUser) {
                setProfileUser(currentUser);
            }

            const [investData, referralData, reviewsData] = await Promise.all([
                userAPI.getInvestments(targetUserId).catch(() => ({ investments: [] })),
                isOwnProfile ? referralsAPI.get(targetUserId).catch(() => null) : Promise.resolve(null),
                reviewsAPI.getForUser(targetUserId).catch(() => ({ reviews: [] })),
            ]);
            setInvestments(investData.investments || []);
            setReferral(referralData);
            setReviews(reviewsData.reviews || []);
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file || !currentUser?.id) return;

        // Preview immediately
        const reader = new FileReader();
        reader.onload = (ev) => setProfileImage(ev.target.result);
        reader.readAsDataURL(file);

        // Upload to backend
        const formData = new FormData();
        formData.append('avatar', file);
        try {
            const res = await userAPI.uploadAvatar(currentUser.id, formData);
            const data = await res.json();
            if (data.avatar) {
                const avatarUrl = `${SERVER_BASE}/uploads/avatars/${data.avatar}`;
                setProfileImage(avatarUrl);
                // Update the zustand store with the new avatar filename
                updateUser({ avatar: data.avatar });
                toast.success('Profile picture updated! 📸');
            } else if (data.error) {
                toast.error(data.error);
            }
        } catch (error) {
            toast.error('Failed to upload avatar');
            console.error('Avatar upload error:', error);
        }
    };

    const handleSave = async () => {
        try {
            await userAPI.updateProfile(currentUser.id, { about: bio });
            updateUser({ about: bio });
            toast.success('Profile updated! ✨');
            setIsEditing(false);
        } catch (error) {
            toast.error('Failed to update profile');
        }
    };

    const handleCopyReferral = () => {
        if (referral?.code) {
            const url = `${window.location.origin}/signup?ref=${referral.code}`;
            navigator.clipboard.writeText(url);
            toast.success('Referral link copied!');
        }
    };

    const handleSendVerification = async () => {
        try {
            await authAPI.sendVerification(currentUser.email);
            setVerificationSent(true);
            toast.success('Verification email sent!');
        } catch (error) {
            toast.error('Failed to send verification email');
        }
    };

    // Only require login for viewing OWN profile
    if (isOwnProfile && !isAuthenticated) {
        return (
            <div className="min-h-screen pt-24 px-6 flex items-center justify-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center glass-card p-12"
                >
                    <div className="text-6xl mb-4">🔒</div>
                    <h2 className="text-2xl font-bold mb-4">Login Required</h2>
                    <p className="text-white/60 mb-4">Please log in to view your profile</p>
                    <Link to="/login">
                        <motion.button whileHover={{ scale: 1.05 }} className="btn-primary">
                            Log In
                        </motion.button>
                    </Link>
                </motion.div>
            </div>
        );
    }

    // Show loading spinner while fetching
    if (loading) {
        return (
            <div className="min-h-screen pt-24 px-6 flex items-center justify-center">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full"
                />
            </div>
        );
    }

    // Show error if no profile found
    if (!profileUser) {
        return (
            <div className="min-h-screen pt-24 px-6 flex items-center justify-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center glass-card p-12"
                >
                    <div className="text-6xl mb-4">😕</div>
                    <h2 className="text-2xl font-bold mb-4">User Not Found</h2>
                    <p className="text-white/60 mb-4">This profile doesn't exist or has been removed.</p>
                    <Link to="/campaigns">
                        <motion.button whileHover={{ scale: 1.05 }} className="btn-primary">
                            Browse Campaigns
                        </motion.button>
                    </Link>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-24 px-6 pb-12">
            <div className="max-w-4xl mx-auto">
                {/* Profile Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card p-8 mb-8"
                >
                    <div className="flex flex-col md:flex-row items-start gap-8">
                        {/* Profile Picture */}
                        <motion.div
                            className="relative group"
                            whileHover={{ scale: 1.02 }}
                        >
                            <div className="w-32 h-32 rounded-2xl overflow-hidden bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                                {profileImage ? (
                                    <img
                                        src={profileImage}
                                        alt="Profile"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <span className="text-5xl">{profileUser?.name?.[0]?.toUpperCase() || '👤'}</span>
                                )}
                            </div>

                            {isOwnProfile && (
                                <>
                                    <motion.button
                                        initial={{ opacity: 0 }}
                                        whileHover={{ opacity: 1 }}
                                        onClick={() => fileInputRef.current?.click()}
                                        className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center cursor-pointer"
                                    >
                                        <FiCamera className="text-2xl" />
                                    </motion.button>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        className="hidden"
                                    />
                                </>
                            )}
                        </motion.div>

                        {/* Profile Info */}
                        <div className="flex-1">
                            <div className="flex items-center justify-between gap-4 mb-2">
                                <div className="flex items-center gap-4 flex-wrap">
                                    <h1 className="text-3xl font-bold">{profileUser?.name}</h1>
                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${profileUser?.role === 'creator'
                                        ? 'bg-purple-500/20 text-purple-400'
                                        : profileUser?.role === 'admin'
                                            ? 'bg-red-500/20 text-red-400'
                                            : 'bg-blue-500/20 text-blue-400'
                                        }`}>
                                        {profileUser?.role === 'creator' ? '🎨 Creator' : profileUser?.role === 'admin' ? '👑 Admin' : '💼 Investor'}
                                    </span>
                                    {/* User ID with Copy Button */}
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => {
                                            navigator.clipboard.writeText(String(profileUser?.id));
                                            toast.success('User ID copied! 📋');
                                        }}
                                        className="px-3 py-1 rounded-full text-sm font-medium bg-white/10 text-white/80 hover:bg-white/20 flex items-center gap-2 transition-colors"
                                        title="Click to copy User ID"
                                    >
                                        <FiCopy size={12} />
                                        ID: {profileUser?.id}
                                    </motion.button>
                                </div>
                                {/* Message button for viewing other users */}
                                {!isOwnProfile && isAuthenticated && (
                                    <Link to={`/messages?to=${viewingUserId}&subject=Hi ${profileUser?.name}`}>
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            className="btn-primary flex items-center gap-2"
                                        >
                                            <FiMessageCircle /> Message
                                        </motion.button>
                                    </Link>
                                )}
                            </div>

                            <div className="flex items-center gap-2 text-white/60 mb-4">
                                <FiMail size={14} />
                                <span>{profileUser?.email}</span>
                                {profileUser?.email_verified ? (
                                    <span className="px-2 py-0.5 rounded-full text-xs bg-green-500/20 text-green-400 flex items-center gap-1">
                                        <FiCheckCircle size={10} /> Verified
                                    </span>
                                ) : isOwnProfile && (
                                    <button
                                        onClick={handleSendVerification}
                                        disabled={verificationSent}
                                        className="px-2 py-0.5 rounded-full text-xs bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30"
                                    >
                                        {verificationSent ? 'Email Sent' : 'Verify Email'}
                                    </button>
                                )}
                            </div>

                            {/* Bio Section */}
                            <div className="mb-4">
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-sm font-medium text-white/80">About Me</label>
                                    {!isEditing && isOwnProfile && (
                                        <motion.button
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => setIsEditing(true)}
                                            className="text-primary hover:text-primary-light"
                                        >
                                            <FiEdit2 />
                                        </motion.button>
                                    )}
                                </div>

                                <AnimatePresence mode="wait">
                                    {isEditing ? (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                        >
                                            <textarea
                                                value={bio}
                                                onChange={(e) => setBio(e.target.value)}
                                                placeholder="Tell others about yourself..."
                                                className="input-field resize-none mb-3"
                                                rows={3}
                                            />
                                            <div className="flex gap-2">
                                                <motion.button
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={handleSave}
                                                    className="btn-primary flex items-center gap-2 text-sm"
                                                >
                                                    <FiSave /> Save
                                                </motion.button>
                                                <motion.button
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => {
                                                        setIsEditing(false);
                                                        setBio(currentUser?.about || '');
                                                    }}
                                                    className="btn-secondary flex items-center gap-2 text-sm"
                                                >
                                                    <FiX /> Cancel
                                                </motion.button>
                                            </div>
                                        </motion.div>
                                    ) : (
                                        <motion.p
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="text-white/70"
                                        >
                                            {bio || 'No bio added yet. Click edit to add one!'}
                                        </motion.p>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Referral Section */}
                {referral && (
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="glass-card p-6 mb-8"
                    >
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <FiShare2 className="text-primary" /> Referral Program
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div className="p-4 bg-white/5 rounded-xl text-center">
                                <div className="text-3xl font-bold text-primary">{referral.total_referrals || 0}</div>
                                <div className="text-sm text-white/60">Total Referrals</div>
                            </div>
                            <div className="p-4 bg-white/5 rounded-xl text-center">
                                <div className="text-3xl font-bold text-green-400">${referral.total_earnings || 0}</div>
                                <div className="text-sm text-white/60">Earnings</div>
                            </div>
                            <div className="p-4 bg-white/5 rounded-xl text-center">
                                <div className="text-3xl font-bold text-purple-400">{referral.pending_referrals || 0}</div>
                                <div className="text-sm text-white/60">Pending</div>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <div className="flex-1 p-3 bg-white/5 rounded-xl font-mono text-sm">
                                {window.location.origin}/signup?ref={referral.code}
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleCopyReferral}
                                className="btn-primary flex items-center gap-2"
                            >
                                <FiCopy /> Copy
                            </motion.button>
                        </div>
                    </motion.div>
                )}

                {/* Tabs */}
                <div className="flex gap-2 mb-6">
                    {['investments', 'reviews'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-xl font-medium capitalize transition-colors ${activeTab === tab ? 'bg-primary text-white' : 'bg-white/10 hover:bg-white/20'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                {activeTab === 'investments' && (
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                            <span className="text-3xl">💰</span>
                            Projects I've Supported
                        </h2>

                        {loading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[...Array(4)].map((_, i) => (
                                    <div key={i} className="glass-card h-32 animate-pulse" />
                                ))}
                            </div>
                        ) : investments.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="glass-card p-12 text-center"
                            >
                                <motion.div
                                    animate={{ y: [0, -10, 0] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="text-6xl mb-4"
                                >
                                    🎯
                                </motion.div>
                                <h3 className="text-xl font-bold mb-2">No investments yet</h3>
                                <p className="text-white/60 mb-6">
                                    Support a project and track its progress here!
                                </p>
                                <Link to="/campaigns">
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        className="btn-primary"
                                    >
                                        Discover Projects
                                    </motion.button>
                                </Link>
                            </motion.div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {investments.map((investment, index) => (
                                    <InvestmentCard key={investment.id} investment={investment} index={index} />
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}

                {activeTab === 'reviews' && (
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                            <FiStar className="text-yellow-400" />
                            Reviews
                        </h2>

                        {reviews.length === 0 ? (
                            <div className="glass-card p-12 text-center">
                                <div className="text-6xl mb-4">⭐</div>
                                <h3 className="text-xl font-bold mb-2">No reviews yet</h3>
                                <p className="text-white/60">Reviews from creators you've backed will appear here</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {reviews.map((review, index) => (
                                    <motion.div
                                        key={review.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="glass-card p-4"
                                    >
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                                                {review.reviewer_name?.[0] || '?'}
                                            </div>
                                            <div>
                                                <p className="font-bold">{review.reviewer_name}</p>
                                                <div className="flex gap-0.5">
                                                    {[...Array(5)].map((_, i) => (
                                                        <FiStar
                                                            key={i}
                                                            className={i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-white/20'}
                                                            size={14}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        <p className="text-white/70">{review.content}</p>
                                        <p className="text-xs text-white/40 mt-2">
                                            {new Date(review.created_at).toLocaleDateString()}
                                        </p>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}
            </div>
        </div>
    );
};

const InvestmentCard = ({ investment, index }) => {
    const campaign = investment.campaign || {};
    const progress = campaign.funding_percentage || 0;

    const getStatusIcon = () => {
        if (progress >= 100) return <FiCheckCircle className="text-green-400" />;
        if (campaign.days_remaining <= 0) return <FiClock className="text-red-400" />;
        return <FiTrendingUp className="text-primary" />;
    };

    const getStatusText = () => {
        if (progress >= 100) return 'Fully Funded! 🎉';
        if (campaign.days_remaining <= 0) return 'Campaign Ended';
        return `${progress.toFixed(0)}% Funded`;
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02, y: -5 }}
        >
            <Link to={`/campaign/${campaign.id}`}>
                <div className="glass-card p-5 cursor-pointer border border-transparent hover:border-primary/50 transition-all">
                    <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center flex-shrink-0">
                            <span className="text-2xl">🚀</span>
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-bold truncate">{campaign.name || 'Campaign'}</h3>
                                {getStatusIcon()}
                            </div>

                            <div className="flex items-center gap-2 text-sm text-white/60 mb-3">
                                <FiDollarSign />
                                <span>You invested <span className="text-primary font-bold">${investment.amount}</span></span>
                            </div>

                            <div className="relative">
                                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.min(progress, 100)}%` }}
                                        transition={{ delay: 0.3 + index * 0.1, duration: 1 }}
                                        className={`h-full rounded-full ${progress >= 100
                                            ? 'bg-green-500'
                                            : 'bg-gradient-to-r from-primary to-secondary'
                                            }`}
                                    />
                                </div>
                                <div className="flex justify-between mt-2 text-xs">
                                    <span className={progress >= 100 ? 'text-green-400' : 'text-white/60'}>
                                        {getStatusText()}
                                    </span>
                                    <span className="text-white/40">
                                        ${campaign.amount_raised?.toLocaleString() || 0} / ${campaign.usd_goal?.toLocaleString() || 0}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
};

export default Profile;
