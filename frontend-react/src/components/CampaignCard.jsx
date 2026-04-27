import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FiClock, FiUsers, FiTrendingUp, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { SERVER_BASE } from '../services/api';

const CampaignCard = ({ campaign, index = 0 }) => {
    const progress = campaign.funding_percentage || 0;
    const daysRemaining = campaign.days_remaining ?? campaign.duration_days ?? 30;
    const condition = campaign.condition || 'new';

    const categoryIcons = {
        'Technology': '💻',
        'Design': '🎨',
        'Games': '🎮',
        'Film & Video': '🎬',
        'Music': '🎵',
        'Food': '🍕',
        'Publishing': '📚',
        'Art': '🖼️',
        'Fashion': '👗',
        'Photography': '📸',
        'Comics': '💥',
        'Crafts': '🧶',
        'Dance': '💃',
        'Theater': '🎭',
        'Journalism': '📰',
        'Documentary': '🎥',
        'Shorts': '🎞️',
        'Web': '🌐',
        'Tabletop Games': '🎲',
        'Product Design': '📐',
        'Apparel': '👕',
        'Accessories': '⌚',
        'Illustration': '✏️',
        'Comedy': '😂',
    };

    // Status/Condition badge configuration
    const conditionConfig = {
        'funded': {
            label: '🎉 Funded',
            color: 'bg-green-500',
            textColor: 'text-white',
            icon: FiCheckCircle
        },
        'almost_funded': {
            label: '🔥 Almost There!',
            color: 'bg-orange-500',
            textColor: 'text-white',
            icon: FiTrendingUp
        },
        'halfway': {
            label: '💪 50% Funded',
            color: 'bg-blue-500',
            textColor: 'text-white',
            icon: FiTrendingUp
        },
        'active': {
            label: '🚀 Active',
            color: 'bg-primary',
            textColor: 'text-white',
            icon: FiTrendingUp
        },
        'expired': {
            label: '⏰ Ended',
            color: 'bg-gray-500',
            textColor: 'text-white',
            icon: FiAlertCircle
        },
        'new': {
            label: '✨ New',
            color: 'bg-purple-500',
            textColor: 'text-white',
            icon: FiClock
        },
    };

    const currentCondition = conditionConfig[condition] || conditionConfig['new'];
    const StatusIcon = currentCondition.icon;

    // Progress bar color based on condition
    const getProgressColor = () => {
        if (condition === 'funded') return 'from-green-400 to-green-600';
        if (condition === 'almost_funded') return 'from-orange-400 to-orange-600';
        if (condition === 'expired') return 'from-gray-400 to-gray-600';
        return 'from-primary to-secondary';
    };

    // AI Score ring
    const aiScorePercent = campaign.ai_score ? Math.round(campaign.ai_score * 100) : null;
    const getScoreColor = (score) => {
        if (score >= 70) return '#10b981';
        if (score >= 40) return '#f59e0b';
        return '#ef4444';
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
            whileHover={{ y: -10, scale: 1.02 }}
            className="group"
        >
            <Link to={`/campaign/${campaign.id}`}>
                <div className="glass-card overflow-hidden card-hover">
                    {/* Image */}
                    <div className="relative h-48 overflow-hidden">
                        {campaign.primary_image ? (
                            <motion.img
                                src={`${SERVER_BASE}/uploads/campaigns/${campaign.primary_image}`}
                                alt={campaign.name}
                                className="absolute inset-0 w-full h-full object-cover"
                                whileHover={{ scale: 1.1 }}
                                transition={{ duration: 0.5 }}
                            />
                        ) : (
                            <motion.div
                                className="absolute inset-0 flex items-center justify-center"
                                whileHover={{ scale: 1.05 }}
                                transition={{ duration: 0.5 }}
                                style={{
                                    background: `linear-gradient(135deg, rgba(102,126,234,0.25) 0%, rgba(240,147,251,0.18) 50%, rgba(102,126,234,0.12) 100%)`,
                                }}
                            >
                                {/* Abstract pattern */}
                                <div className="absolute inset-0 opacity-20">
                                    <div className="absolute top-6 right-8 w-24 h-24 rounded-full bg-primary/30 blur-xl" />
                                    <div className="absolute bottom-4 left-6 w-20 h-20 rounded-full bg-secondary/30 blur-xl" />
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full bg-white/5 blur-lg" />
                                </div>
                                <span className="text-6xl relative z-10 drop-shadow-lg">
                                    {categoryIcons[campaign.main_category] || '🚀'}
                                </span>
                            </motion.div>
                        )}

                        {/* Top Left Badges */}
                        <div className="absolute top-3 left-3 flex flex-col gap-2">
                            {/* Condition/Status Badge */}
                            <motion.span
                                initial={{ scale: 0, x: -20 }}
                                animate={{ scale: 1, x: 0 }}
                                transition={{ delay: 0.2 }}
                                className={`px-3 py-1 rounded-full ${currentCondition.color} ${currentCondition.textColor} text-xs font-bold flex items-center gap-1 shadow-lg`}
                            >
                                <StatusIcon size={12} />
                                {currentCondition.label}
                            </motion.span>

                            {campaign.is_featured && (
                                <motion.span
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="px-3 py-1 rounded-full bg-yellow-500/90 text-black text-xs font-bold"
                                >
                                    ⭐ Featured
                                </motion.span>
                            )}
                            {campaign.is_ai_verified && (
                                <span className="px-3 py-1 rounded-full bg-green-500/90 text-white text-xs font-bold">
                                    ✓ AI Verified
                                </span>
                            )}
                        </div>

                        {/* AI Score Ring - Top Right */}
                        {aiScorePercent !== null && (
                            <motion.div
                                initial={{ scale: 0, rotate: -90 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ delay: 0.3, type: 'spring' }}
                                className="absolute top-3 right-3"
                            >
                                <div className="relative w-12 h-12">
                                    <svg className="w-12 h-12 -rotate-90" viewBox="0 0 40 40">
                                        <circle cx="20" cy="20" r="16" fill="rgba(0,0,0,0.6)" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
                                        <motion.circle
                                            cx="20" cy="20" r="16"
                                            fill="none"
                                            stroke={getScoreColor(aiScorePercent)}
                                            strokeWidth="3"
                                            strokeLinecap="round"
                                            strokeDasharray={`${2 * Math.PI * 16}`}
                                            initial={{ strokeDashoffset: 2 * Math.PI * 16 }}
                                            animate={{ strokeDashoffset: 2 * Math.PI * 16 * (1 - aiScorePercent / 100) }}
                                            transition={{ delay: 0.5, duration: 1.2, ease: 'easeOut' }}
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-[11px] font-bold" style={{ color: getScoreColor(aiScorePercent) }}>
                                            {aiScorePercent}
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Category Badge - Bottom Left */}
                        <motion.div
                            initial={{ y: 30, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.25 }}
                            className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg bg-black/50 backdrop-blur-sm border border-white/10 text-xs font-medium flex items-center gap-1.5"
                        >
                            <span>{categoryIcons[campaign.main_category] || '📁'}</span>
                            <span className="text-white/80">{campaign.main_category}</span>
                        </motion.div>

                        {/* Days Remaining Badge - Bottom Right */}
                        <motion.div
                            initial={{ y: 50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className={`absolute bottom-3 right-3 px-3 py-1 rounded-full glass-card text-xs font-semibold flex items-center gap-1 ${daysRemaining <= 0 ? 'text-red-400' : daysRemaining <= 7 ? 'text-orange-400' : 'text-white/80'
                                }`}
                        >
                            <FiClock size={12} />
                            {daysRemaining <= 0 ? 'Ended' : `${daysRemaining}d left`}
                        </motion.div>
                    </div>

                    {/* Content */}
                    <div className="p-5">
                        <h3 className="text-lg font-bold mb-2 line-clamp-1 group-hover:text-primary transition-colors">
                            {campaign.name}
                        </h3>
                        <p className="text-white/60 text-sm mb-4 line-clamp-2">
                            {campaign.blurb}
                        </p>

                        {/* Progress Bar */}
                        <div className="mb-3">
                            <div className="flex justify-between text-xs mb-1">
                                <span className={`font-bold ${condition === 'funded' ? 'text-green-400' : 'text-primary'}`}>
                                    {progress.toFixed(0)}% funded
                                </span>
                                <span className="text-white/40 flex items-center gap-1">
                                    <FiUsers size={12} />
                                    {campaign.backers_count || 0} backers
                                </span>
                            </div>
                            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min(progress, 100)}%` }}
                                    transition={{ delay: 0.3 + index * 0.1, duration: 1, ease: 'easeOut' }}
                                    className={`h-full bg-gradient-to-r ${getProgressColor()} rounded-full`}
                                />
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="flex justify-between text-sm items-center">
                            <div>
                                <span className="text-primary font-bold">${campaign.amount_raised?.toLocaleString() || 0}</span>
                                <span className="text-white/40"> / ${campaign.usd_goal?.toLocaleString() || 0}</span>
                            </div>
                            {campaign.has_video && (
                                <span className="text-xs text-white/40 flex items-center gap-1">
                                    🎬 Video
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
};

export default CampaignCard;
