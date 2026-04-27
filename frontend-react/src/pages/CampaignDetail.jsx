import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, Link } from 'react-router-dom';
import { FiHeart, FiShare2, FiClock, FiUsers, FiTarget, FiZap, FiMessageCircle, FiSend, FiCheck, FiX } from 'react-icons/fi';
import { campaignsAPI, rewardsAPI, commentsAPI, updatesAPI, faqsAPI, teamAPI, bookmarksAPI, paymentsAPI, milestonesAPI, SERVER_BASE } from '../services/api';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

const CampaignDetail = () => {
    const { id } = useParams();
    const { user, isAuthenticated } = useAuthStore();
    const [campaign, setCampaign] = useState(null);
    const [rewards, setRewards] = useState([]);
    const [comments, setComments] = useState([]);
    const [updates, setUpdates] = useState([]);
    const [faqs, setFaqs] = useState([]);
    const [team, setTeam] = useState([]);
    const [milestones, setMilestones] = useState([]);
    const [similarCampaigns, setSimilarCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('about');
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [showInvestModal, setShowInvestModal] = useState(false);
    const [investAmount, setInvestAmount] = useState('');
    const [selectedReward, setSelectedReward] = useState(null);
    const [newComment, setNewComment] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchAllData();
    }, [id]);

    const fetchAllData = async () => {
        try {
            const [campaignData, rewardsData, commentsData, updatesData, faqsData, teamData, milestonesData] = await Promise.all([
                campaignsAPI.getOne(id),
                rewardsAPI.getAll(id),
                commentsAPI.getAll(id),
                updatesAPI.getAll(id),
                faqsAPI.getAll(id),
                teamAPI.getAll(id),
                milestonesAPI.getAll(id),
            ]);
            setCampaign(campaignData.campaign);
            setRewards(rewardsData.rewards || []);
            setComments(commentsData.comments || []);
            setUpdates(updatesData.updates || []);
            setFaqs(faqsData.faqs || []);
            setTeam(teamData.team_members || []);
            setMilestones(milestonesData.milestones || []);

            // Fetch similar campaigns
            try {
                const similarData = await campaignsAPI.getSimilar(id);
                setSimilarCampaigns(similarData.campaigns || []);
            } catch (e) { /* Similar campaigns optional */ }

            // Check bookmark status
            if (user?.id) {
                try {
                    const bookmarkData = await bookmarksAPI.check(user.id, id);
                    setIsBookmarked(bookmarkData.bookmarked);
                } catch (e) { /* Bookmark check optional */ }
            }
        } catch (error) {
            console.error('Failed to fetch campaign:', error);
            toast.error('Failed to load campaign');
        } finally {
            setLoading(false);
        }
    };

    const handleBookmark = async () => {
        if (!isAuthenticated) {
            toast.error('Please login to save campaigns');
            return;
        }
        try {
            const result = await bookmarksAPI.toggle({ user_id: user.id, campaign_id: parseInt(id) });
            setIsBookmarked(result.bookmarked);
            toast.success(result.bookmarked ? 'Campaign saved!' : 'Removed from saved');
        } catch (error) {
            toast.error('Failed to update bookmark');
        }
    };

    const handleShare = async () => {
        const url = window.location.href;
        if (navigator.share) {
            try {
                await navigator.share({ title: campaign.name, text: campaign.blurb, url });
            } catch (err) { /* User cancelled */ }
        } else {
            navigator.clipboard.writeText(url);
            toast.success('Link copied to clipboard!');
        }
    };

    const handleInvest = async () => {
        if (!isAuthenticated) {
            toast.error('Please login to invest');
            return;
        }
        if (!investAmount || parseFloat(investAmount) <= 0) {
            toast.error('Please enter a valid amount');
            return;
        }
        setSubmitting(true);
        try {
            await paymentsAPI.process({
                user_id: user.id,
                campaign_id: parseInt(id),
                amount: parseFloat(investAmount),
                reward_id: selectedReward?.id || null,
                message: '',
            });
            toast.success('Investment successful! 🎉');
            setShowInvestModal(false);
            setInvestAmount('');
            setSelectedReward(null);
            fetchAllData(); // Refresh data
        } catch (error) {
            toast.error(error.message || 'Investment failed');
        } finally {
            setSubmitting(false);
        }
    };

    const handleComment = async (e) => {
        e.preventDefault();
        if (!isAuthenticated) {
            toast.error('Please login to comment');
            return;
        }
        if (!newComment.trim()) return;
        setSubmitting(true);
        try {
            await commentsAPI.create(id, { user_id: user.id, content: newComment });
            toast.success('Comment added!');
            setNewComment('');
            const commentsData = await commentsAPI.getAll(id);
            setComments(commentsData.comments || []);
        } catch (error) {
            toast.error('Failed to add comment');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen pt-24 px-6 flex items-center justify-center">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full"
                />
            </div>
        );
    }

    if (!campaign) {
        return (
            <div className="min-h-screen pt-24 px-6 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-6xl mb-4">😞</div>
                    <h2 className="text-2xl font-bold mb-2">Campaign not found</h2>
                    <Link to="/campaigns" className="text-primary hover:underline">Browse campaigns</Link>
                </div>
            </div>
        );
    }

    const progress = campaign.funding_percentage || 0;
    const daysRemaining = campaign.days_remaining ?? campaign.duration_days ?? 0;

    return (
        <div className="min-h-screen pt-24 px-6 pb-12">
            <div className="max-w-6xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2">
                        {/* Hero Image */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="glass-card overflow-hidden rounded-2xl mb-6"
                        >
                            <div className="h-64 md:h-80 relative bg-black/50">
                                {campaign.primary_image ? (
                                    <img
                                        src={`${SERVER_BASE}/uploads/campaigns/${campaign.primary_image}`}
                                        alt={campaign.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center">
                                        <span className="text-8xl">🚀</span>
                                    </div>
                                )}

                                {campaign.condition && (
                                    <span className={`absolute top-4 left-4 px-3 py-1 rounded-full text-sm font-bold z-10 ${campaign.condition === 'funded' ? 'bg-green-500' :
                                        campaign.condition === 'almost_funded' ? 'bg-orange-500' :
                                            campaign.condition === 'expired' ? 'bg-gray-500' : 'bg-primary'
                                        }`}>
                                        {campaign.condition === 'funded' ? '🎉 Funded' :
                                            campaign.condition === 'almost_funded' ? '🔥 Almost There' :
                                                campaign.condition === 'expired' ? '⏰ Ended' : '🚀 Active'}
                                    </span>
                                )}
                            </div>
                        </motion.div>

                        {/* Title & Creator */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="mb-6"
                        >
                            <h1 className="text-3xl md:text-4xl font-bold mb-2">{campaign.name}</h1>
                            <p className="text-white/60 mb-3">{campaign.blurb}</p>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center overflow-hidden">
                                    {campaign.creator_avatar && campaign.creator_avatar !== 'default_avatar.png' ? (
                                        <img src={`${SERVER_BASE}/uploads/avatars/${campaign.creator_avatar}`} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        campaign.creator_name?.[0] || '?'
                                    )}
                                </div>
                                <div>
                                    <p className="font-medium">{campaign.creator_name}</p>
                                    <p className="text-sm text-white/40">{campaign.main_category} • {campaign.country}</p>
                                </div>
                            </div>
                        </motion.div>

                        {/* AI Score Banner */}
                        {campaign.ai_score && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.2 }}
                                className="glass-card p-6 mb-6"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-20 h-20 rounded-xl flex items-center justify-center ${campaign.ai_score > 0.7 ? 'bg-green-500/20' :
                                        campaign.ai_score > 0.4 ? 'bg-yellow-500/20' : 'bg-red-500/20'
                                        }`}>
                                        <span className={`text-3xl font-bold ${campaign.ai_score > 0.7 ? 'text-green-400' :
                                            campaign.ai_score > 0.4 ? 'text-yellow-400' : 'text-red-400'
                                            }`}>
                                            {Math.round(campaign.ai_score * 100)}
                                        </span>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold mb-1 flex items-center gap-2">
                                            <FiZap className="text-primary" /> AI Success Score
                                        </h3>
                                        <div className="flex items-center gap-3">
                                            <div className="flex-1 h-3 bg-white/10 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${campaign.ai_score * 100}%` }}
                                                    transition={{ delay: 0.5, duration: 1 }}
                                                    className={`h-full rounded-full ${campaign.ai_score > 0.7 ? 'bg-green-500' : campaign.ai_score > 0.4 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                                />
                                            </div>
                                            <span className="text-white/40 text-sm">/100</span>
                                        </div>
                                        <p className="text-sm text-white/60 mt-1">
                                            {campaign.ai_score > 0.7 ? 'High chance of success!' :
                                                campaign.ai_score > 0.4 ? 'Moderate potential' : 'Needs improvement'}
                                        </p>
                                    </div>
                                </div>
                                {campaign.gemini_advice && (
                                    <div className="mt-4 p-4 bg-white/5 rounded-xl">
                                        <p className="text-sm text-white/70 whitespace-pre-line">{campaign.gemini_advice.substring(0, 500)}...</p>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {/* Tabs */}
                        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                            {['about', 'updates', 'comments', 'faq', 'team'].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-colors ${activeTab === tab ? 'bg-primary text-white' : 'bg-white/10 hover:bg-white/20'
                                        }`}
                                >
                                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                    {tab === 'comments' && comments.length > 0 && (
                                        <span className="ml-2 px-2 py-0.5 rounded-full bg-white/20 text-xs">{comments.length}</span>
                                    )}
                                    {tab === 'updates' && updates.length > 0 && (
                                        <span className="ml-2 px-2 py-0.5 rounded-full bg-white/20 text-xs">{updates.length}</span>
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Tab Content */}
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="glass-card p-6"
                        >
                            {activeTab === 'about' && (
                                <div>
                                    <h3 className="text-xl font-bold mb-4">About This Project</h3>
                                    <p className="text-white/70 leading-relaxed whitespace-pre-line">
                                        {campaign.description || campaign.blurb}
                                    </p>
                                    {milestones.length > 0 && (
                                        <div className="mt-6">
                                            <h4 className="font-bold mb-3">Stretch Goals</h4>
                                            <div className="space-y-3">
                                                {milestones.map(m => (
                                                    <div key={m.id} className={`p-3 rounded-xl ${m.is_reached ? 'bg-green-500/20 border border-green-500/50' : 'bg-white/5'}`}>
                                                        <div className="flex items-center justify-between">
                                                            <span className="font-medium">{m.title}</span>
                                                            <span className="text-sm">${m.target_amount.toLocaleString()}</span>
                                                        </div>
                                                        {m.description && <p className="text-sm text-white/60 mt-1">{m.description}</p>}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'updates' && (
                                <div>
                                    <h3 className="text-xl font-bold mb-4">Campaign Updates</h3>
                                    {updates.length === 0 ? (
                                        <p className="text-white/60">No updates yet</p>
                                    ) : (
                                        <div className="space-y-4">
                                            {updates.map(update => (
                                                <div key={update.id} className="p-4 bg-white/5 rounded-xl">
                                                    <h4 className="font-bold">{update.title}</h4>
                                                    <p className="text-sm text-white/40 mb-2">{new Date(update.created_at).toLocaleDateString()}</p>
                                                    <p className="text-white/70">{update.content}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'comments' && (
                                <div>
                                    <h3 className="text-xl font-bold mb-4">Comments ({comments.length})</h3>
                                    <form onSubmit={handleComment} className="mb-6">
                                        <div className="flex gap-3">
                                            <input
                                                type="text"
                                                value={newComment}
                                                onChange={(e) => setNewComment(e.target.value)}
                                                placeholder={isAuthenticated ? "Add a comment..." : "Login to comment"}
                                                className="input-field flex-1"
                                                disabled={!isAuthenticated || submitting}
                                            />
                                            <motion.button
                                                type="submit"
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                className="btn-primary"
                                                disabled={!isAuthenticated || submitting}
                                            >
                                                <FiSend />
                                            </motion.button>
                                        </div>
                                    </form>
                                    {comments.length === 0 ? (
                                        <p className="text-white/60">No comments yet. Be the first!</p>
                                    ) : (
                                        <div className="space-y-4">
                                            {comments.map(comment => (
                                                <div key={comment.id} className="p-4 bg-white/5 rounded-xl">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <Link to={`/profile/${comment.user_id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-sm">
                                                                {comment.user_name?.[0] || '?'}
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-sm hover:text-primary transition-colors">{comment.user_name}</p>
                                                                <p className="text-xs text-white/40">{new Date(comment.created_at).toLocaleDateString()}</p>
                                                            </div>
                                                        </Link>
                                                        {isAuthenticated && user?.id !== comment.user_id && (
                                                            <Link to={`/messages?to=${comment.user_id}&subject=Re: ${campaign.name}`}>
                                                                <motion.button
                                                                    whileHover={{ scale: 1.05 }}
                                                                    whileTap={{ scale: 0.95 }}
                                                                    className="p-2 rounded-lg bg-white/10 hover:bg-primary/20 transition-colors"
                                                                    title={`Message ${comment.user_name}`}
                                                                >
                                                                    <FiMessageCircle size={14} />
                                                                </motion.button>
                                                            </Link>
                                                        )}
                                                    </div>
                                                    <p className="text-white/70">{comment.content}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'faq' && (
                                <div>
                                    <h3 className="text-xl font-bold mb-4">FAQ</h3>

                                    {/* Creator: Add FAQ form */}
                                    {isAuthenticated && user?.id === campaign.creator_id && (
                                        <FaqForm campaignId={id} onAdded={async () => {
                                            const data = await faqsAPI.getAll(id);
                                            setFaqs(data.faqs || []);
                                        }} />
                                    )}

                                    {faqs.length === 0 ? (
                                        <p className="text-white/60">No FAQs added yet</p>
                                    ) : (
                                        <div className="space-y-4">
                                            {faqs.map(faq => (
                                                <div key={faq.id} className="p-4 bg-white/5 rounded-xl">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div className="flex-1">
                                                            <h4 className="font-bold mb-2">Q: {faq.question}</h4>
                                                            <p className="text-white/70">A: {faq.answer}</p>
                                                        </div>
                                                        {isAuthenticated && user?.id === campaign.creator_id && (
                                                            <motion.button
                                                                whileHover={{ scale: 1.1 }}
                                                                whileTap={{ scale: 0.9 }}
                                                                onClick={async () => {
                                                                    if (!window.confirm('Delete this FAQ?')) return;
                                                                    try {
                                                                        await faqsAPI.delete(faq.id);
                                                                        setFaqs(prev => prev.filter(f => f.id !== faq.id));
                                                                        toast.success('FAQ deleted');
                                                                    } catch { toast.error('Failed to delete FAQ'); }
                                                                }}
                                                                className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/40 text-red-400 flex-shrink-0"
                                                                title="Delete FAQ"
                                                            >
                                                                <FiX size={14} />
                                                            </motion.button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'team' && (
                                <div>
                                    <h3 className="text-xl font-bold mb-4">Team</h3>

                                    {/* Creator: Add Team Member form */}
                                    {isAuthenticated && user?.id === campaign.creator_id && (
                                        <TeamForm campaignId={id} onAdded={async () => {
                                            const data = await teamAPI.getAll(id);
                                            setTeam(data.team_members || []);
                                        }} />
                                    )}

                                    {/* Always show creator */}
                                    <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl mb-3">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-lg">
                                            {campaign.creator_avatar ? (
                                                <img src={`${SERVER_BASE}/uploads/avatars/${campaign.creator_avatar}`} alt="" className="w-full h-full rounded-xl object-cover" />
                                            ) : (
                                                campaign.creator_name?.[0] || '?'
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-bold">{campaign.creator_name}</p>
                                            <p className="text-sm text-white/60">Campaign Creator</p>
                                        </div>
                                        <span className="px-2 py-1 rounded-full bg-primary/20 text-primary text-xs font-semibold">Owner</span>
                                    </div>

                                    {team.length > 0 && (
                                        <div className="space-y-3">
                                            {team.map(member => (
                                                <div key={member.id} className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
                                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                                                        {member.name?.[0] || '?'}
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="font-bold">{member.name}</p>
                                                        <p className="text-sm text-white/60">{member.role}</p>
                                                        {member.bio && <p className="text-xs text-white/40 mt-1">{member.bio}</p>}
                                                    </div>
                                                    {isAuthenticated && user?.id === campaign.creator_id && (
                                                        <motion.button
                                                            whileHover={{ scale: 1.1 }}
                                                            whileTap={{ scale: 0.9 }}
                                                            onClick={async () => {
                                                                if (!window.confirm(`Remove ${member.name} from team?`)) return;
                                                                try {
                                                                    await teamAPI.remove(member.id);
                                                                    setTeam(prev => prev.filter(m => m.id !== member.id));
                                                                    toast.success('Team member removed');
                                                                } catch { toast.error('Failed to remove'); }
                                                            }}
                                                            className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/40 text-red-400"
                                                            title="Remove"
                                                        >
                                                            <FiX size={14} />
                                                        </motion.button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </motion.div>

                        {/* Similar Campaigns */}
                        {similarCampaigns.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="mt-8"
                            >
                                <h3 className="text-xl font-bold mb-4">Similar Projects</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {similarCampaigns.slice(0, 4).map(sc => (
                                        <Link key={sc.id} to={`/campaign/${sc.id}`}>
                                            <div className="glass-card p-4 hover:border-primary/50 border border-transparent transition-colors">
                                                <h4 className="font-bold truncate">{sc.name}</h4>
                                                <p className="text-sm text-white/60 truncate">{sc.blurb}</p>
                                                <div className="mt-2 text-sm">
                                                    <span className="text-primary">{sc.funding_percentage?.toFixed(0) || 0}% funded</span>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Funding Stats */}
                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className="glass-card p-6 sticky top-24"
                        >
                            <div className="text-3xl font-bold gradient-text mb-1">
                                ${campaign.amount_raised?.toLocaleString() || 0}
                            </div>
                            <p className="text-white/60 mb-4">
                                pledged of ${campaign.usd_goal?.toLocaleString()} goal
                            </p>

                            {/* Progress Bar */}
                            <div className="h-3 bg-white/10 rounded-full overflow-hidden mb-6">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min(progress, 100)}%` }}
                                    transition={{ delay: 0.5, duration: 1 }}
                                    className={`h-full rounded-full ${progress >= 100 ? 'bg-green-500' : 'bg-gradient-to-r from-primary to-secondary'}`}
                                />
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="text-center p-3 bg-white/5 rounded-xl">
                                    <FiUsers className="mx-auto mb-1 text-primary" />
                                    <div className="font-bold">{campaign.backers_count || 0}</div>
                                    <div className="text-xs text-white/60">Backers</div>
                                </div>
                                <div className="text-center p-3 bg-white/5 rounded-xl">
                                    <FiClock className="mx-auto mb-1 text-primary" />
                                    <div className="font-bold">{daysRemaining}</div>
                                    <div className="text-xs text-white/60">Days Left</div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setShowInvestModal(true)}
                                className="btn-primary w-full mb-3"
                                disabled={daysRemaining <= 0}
                            >
                                {daysRemaining <= 0 ? 'Campaign Ended' : 'Back This Project'}
                            </motion.button>

                            <div className="flex gap-3">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleBookmark}
                                    className={`flex-1 btn-secondary flex items-center justify-center gap-2 ${isBookmarked ? 'bg-red-500/20 border-red-500/50' : ''}`}
                                >
                                    <FiHeart className={isBookmarked ? 'fill-red-500 text-red-500' : ''} />
                                    {isBookmarked ? 'Saved' : 'Save'}
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleShare}
                                    className="flex-1 btn-secondary flex items-center justify-center gap-2"
                                >
                                    <FiShare2 /> Share
                                </motion.button>
                            </div>
                        </motion.div>

                        {/* Rewards */}
                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <h3 className="text-xl font-bold mb-4">🎁 Rewards</h3>
                            <div className="space-y-4">
                                {rewards.length === 0 ? (
                                    <p className="text-white/60">No rewards available</p>
                                ) : (
                                    rewards.map((reward, index) => (
                                        <motion.div
                                            key={reward.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.4 + index * 0.1 }}
                                            whileHover={{ scale: 1.02 }}
                                            onClick={() => {
                                                setSelectedReward(reward);
                                                setInvestAmount(reward.min_amount.toString());
                                                setShowInvestModal(true);
                                            }}
                                            className={`glass-card p-4 cursor-pointer border-2 transition-colors ${!reward.is_available ? 'opacity-50 cursor-not-allowed' : 'border-transparent hover:border-primary'
                                                }`}
                                        >
                                            <div className="font-bold text-primary mb-1">${reward.min_amount}+</div>
                                            <h4 className="font-semibold mb-2">{reward.title}</h4>
                                            <p className="text-sm text-white/60 mb-2">{reward.description}</p>
                                            <div className="flex justify-between text-xs text-white/40">
                                                <span>{reward.backers_count || 0} backers</span>
                                                {reward.max_backers && (
                                                    <span>{reward.max_backers - (reward.backers_count || 0)} left</span>
                                                )}
                                            </div>
                                        </motion.div>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* Investment Modal */}
            <AnimatePresence>
                {showInvestModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-6"
                        onClick={() => setShowInvestModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 50 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 50 }}
                            className="glass-card p-8 max-w-md w-full"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold">Back This Project</h2>
                                <button onClick={() => setShowInvestModal(false)} className="text-white/60 hover:text-white">
                                    <FiX size={24} />
                                </button>
                            </div>

                            {selectedReward && (
                                <div className="p-4 bg-primary/10 border border-primary/30 rounded-xl mb-6">
                                    <p className="text-sm text-primary font-medium">Selected Reward</p>
                                    <p className="font-bold">{selectedReward.title}</p>
                                    <p className="text-sm text-white/60">Minimum: ${selectedReward.min_amount}</p>
                                </div>
                            )}

                            <div className="mb-6">
                                <label className="block text-sm font-medium mb-2">Pledge Amount ($)</label>
                                <input
                                    type="number"
                                    value={investAmount}
                                    onChange={(e) => setInvestAmount(e.target.value)}
                                    min={selectedReward?.min_amount || 1}
                                    className="input-field text-xl font-bold"
                                    placeholder="Enter amount"
                                />
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleInvest}
                                disabled={submitting}
                                className="btn-primary w-full text-lg py-4"
                            >
                                {submitting ? 'Processing...' : `Pledge $${investAmount || 0}`}
                            </motion.button>

                            <p className="text-center text-xs text-white/40 mt-4">
                                This is a demo platform. No real payment will be processed.
                            </p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// FAQ Form component for creators
const FaqForm = ({ campaignId, onAdded }) => {
    const [question, setQuestion] = useState('');
    const [answer, setAnswer] = useState('');
    const [open, setOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!question.trim() || !answer.trim()) return;
        setSubmitting(true);
        try {
            await faqsAPI.create(campaignId, { question, answer });
            toast.success('FAQ added!');
            setQuestion('');
            setAnswer('');
            setOpen(false);
            onAdded();
        } catch (error) {
            toast.error(error.message || 'Failed to add FAQ');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="mb-6">
            {!open ? (
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setOpen(true)}
                    className="btn-secondary text-sm flex items-center gap-2"
                >
                    + Add FAQ
                </motion.button>
            ) : (
                <motion.form
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    onSubmit={handleSubmit}
                    className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-3"
                >
                    <input
                        type="text"
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        className="input-field"
                        placeholder="Question"
                        required
                    />
                    <textarea
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        className="input-field resize-none"
                        rows={3}
                        placeholder="Answer"
                        required
                    />
                    <div className="flex gap-2">
                        <motion.button
                            type="submit"
                            disabled={submitting}
                            whileHover={{ scale: 1.02 }}
                            className="btn-primary text-sm"
                        >
                            {submitting ? 'Adding...' : 'Add FAQ'}
                        </motion.button>
                        <button type="button" onClick={() => setOpen(false)} className="btn-secondary text-sm">
                            Cancel
                        </button>
                    </div>
                </motion.form>
            )}
        </div>
    );
};

// Team Form component for creators
const TeamForm = ({ campaignId, onAdded }) => {
    const [name, setName] = useState('');
    const [role, setRole] = useState('');
    const [bio, setBio] = useState('');
    const [open, setOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim() || !role.trim()) return;
        setSubmitting(true);
        try {
            await teamAPI.add(campaignId, { name, role, bio });
            toast.success('Team member added!');
            setName('');
            setRole('');
            setBio('');
            setOpen(false);
            onAdded();
        } catch (error) {
            toast.error(error.message || 'Failed to add team member');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="mb-6">
            {!open ? (
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setOpen(true)}
                    className="btn-secondary text-sm flex items-center gap-2"
                >
                    + Add Team Member
                </motion.button>
            ) : (
                <motion.form
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    onSubmit={handleSubmit}
                    className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-3"
                >
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="input-field"
                        placeholder="Member name"
                        required
                    />
                    <input
                        type="text"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        className="input-field"
                        placeholder="Role (e.g. Lead Designer, Marketing)"
                        required
                    />
                    <textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        className="input-field resize-none"
                        rows={2}
                        placeholder="Short bio (optional)"
                    />
                    <div className="flex gap-2">
                        <motion.button
                            type="submit"
                            disabled={submitting}
                            whileHover={{ scale: 1.02 }}
                            className="btn-primary text-sm"
                        >
                            {submitting ? 'Adding...' : 'Add Member'}
                        </motion.button>
                        <button type="button" onClick={() => setOpen(false)} className="btn-secondary text-sm">
                            Cancel
                        </button>
                    </div>
                </motion.form>
            )}
        </div>
    );
};

export default CampaignDetail;
