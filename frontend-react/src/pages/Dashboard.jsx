import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import useAuthStore from '../store/authStore';
import { Link } from 'react-router-dom';
import { userAPI, campaignsAPI, notificationsAPI, SERVER_BASE } from '../services/api';
import { FiTrendingUp, FiUsers, FiDollarSign, FiZap, FiEdit, FiEye, FiBarChart2, FiTrash2, FiCheckCircle, FiPlus, FiArrowRight } from 'react-icons/fi';
import toast from 'react-hot-toast';

const Dashboard = () => {
    const { user, isAuthenticated } = useAuthStore();
    const [campaigns, setCampaigns] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isAuthenticated && user?.id) fetchDashboardData();
    }, [isAuthenticated, user]);

    const fetchDashboardData = async () => {
        try {
            const [campaignsData, notifData] = await Promise.all([
                campaignsAPI.getUserCampaigns(user.id),
                notificationsAPI.getAll(user.id),
            ]);
            setCampaigns(campaignsData.campaigns || []);
            setNotifications(notifData.notifications?.slice(0, 5) || []);
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteCampaign = async (campaignId) => {
        if (!window.confirm('Delete this campaign? All backers will be refunded.')) return;
        try {
            await campaignsAPI.delete(campaignId, user.id);
            toast.success('Campaign deleted.');
            setCampaigns(prev => prev.filter(c => c.id !== campaignId));
        } catch (error) {
            toast.error(error.message || 'Failed to delete');
        }
    };

    const handleEndEarly = async (campaignId) => {
        if (!window.confirm('End this campaign early?')) return;
        try {
            const result = await campaignsAPI.endEarly(campaignId, user.id);
            toast.success('Campaign ended!');
            setCampaigns(prev => prev.map(c => c.id === campaignId ? result.campaign : c));
        } catch (error) {
            toast.error(error.message || 'Failed');
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen pt-24 px-6 flex items-center justify-center">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center glass-card p-12">
                    <div className="text-6xl mb-4">🔒</div>
                    <h2 className="text-2xl font-bold mb-4">Login Required</h2>
                    <Link to="/login"><motion.button whileHover={{ scale: 1.05 }} className="btn-primary">Log In</motion.button></Link>
                </motion.div>
            </div>
        );
    }

    const totalRaised = campaigns.reduce((sum, c) => sum + (c.amount_raised || 0), 0);
    const activeCampaigns = campaigns.filter(c => c.status !== 'funded' && c.status !== 'expired').length;
    const totalBackers = campaigns.reduce((sum, c) => sum + (c.backers_count || 0), 0);
    const avgAiScore = campaigns.length > 0
        ? campaigns.filter(c => c.ai_score).reduce((sum, c) => sum + c.ai_score, 0) / (campaigns.filter(c => c.ai_score).length || 1)
        : 0;

    // Time-of-day greeting
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

    return (
        <div className="min-h-screen pt-24 px-6 pb-12">
            <div className="max-w-7xl mx-auto">
                {/* Welcome Banner */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card p-8 mb-8 relative overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-secondary/10" />
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px]" />
                    <div className="relative z-10">
                        <h1 className="text-3xl md:text-4xl font-bold mb-2">
                            {greeting}, <span className="gradient-text">{user?.name?.split(' ')[0] || 'Creator'}</span>! 👋
                        </h1>
                        <p className="text-white/50">Here's what's happening with your campaigns</p>
                    </div>
                </motion.div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {[
                        { title: 'Total Raised', value: `$${totalRaised.toLocaleString()}`, icon: <FiDollarSign />, color: 'from-green-500 to-emerald-600' },
                        { title: 'Active', value: activeCampaigns, icon: <FiTrendingUp />, color: 'from-blue-500 to-cyan-600' },
                        { title: 'Backers', value: totalBackers, icon: <FiUsers />, color: 'from-purple-500 to-pink-600' },
                        { title: 'Avg AI', value: avgAiScore > 0 ? `${Math.round(avgAiScore * 100)}%` : 'N/A', icon: <FiZap />, color: 'from-orange-500 to-red-600' },
                    ].map((stat, i) => (
                        <motion.div
                            key={stat.title}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 + i * 0.1 }}
                            whileHover={{ y: -4 }}
                            className="glass-card p-5 relative overflow-hidden group"
                        >
                            <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-lg mb-3`}>
                                {stat.icon}
                            </div>
                            {loading ? (
                                <div className="h-8 w-20 bg-white/10 rounded animate-pulse mb-1" />
                            ) : (
                                <div className="text-2xl font-bold mb-0.5">{stat.value}</div>
                            )}
                            <div className="text-white/50 text-sm">{stat.title}</div>
                        </motion.div>
                    ))}
                </div>

                {/* Funding Chart (simple bar) */}
                {campaigns.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="glass-card p-6 mb-8"
                    >
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <FiBarChart2 className="text-primary" /> Campaign Performance
                        </h2>
                        <div className="flex items-end gap-3 h-40">
                            {campaigns.slice(0, 8).map((c, i) => {
                                const pct = Math.min(c.funding_percentage || 0, 150);
                                const barH = Math.max((pct / 150) * 100, 5);
                                return (
                                    <motion.div
                                        key={c.id}
                                        className="flex-1 flex flex-col items-center gap-1"
                                        initial={{ height: 0 }}
                                        animate={{ height: 'auto' }}
                                        transition={{ delay: 0.5 + i * 0.1 }}
                                    >
                                        <span className="text-[10px] text-white/40">{pct.toFixed(0)}%</span>
                                        <motion.div
                                            className={`w-full rounded-t-lg ${pct >= 100 ? 'bg-gradient-to-t from-green-600 to-green-400' : 'bg-gradient-to-t from-primary to-secondary'}`}
                                            initial={{ height: 0 }}
                                            animate={{ height: `${barH}%` }}
                                            transition={{ delay: 0.6 + i * 0.1, duration: 0.8 }}
                                            style={{ minHeight: 8 }}
                                        />
                                        <span className="text-[9px] text-white/30 truncate w-full text-center">{c.name?.slice(0, 8)}</span>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Campaigns List */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="lg:col-span-2 glass-card p-6"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold">Your Campaigns</h2>
                            <Link to="/create">
                                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="btn-primary text-sm flex items-center gap-1.5">
                                    <FiPlus size={14} /> New Campaign
                                </motion.button>
                            </Link>
                        </div>

                        {loading ? (
                            <div className="space-y-4">
                                {[1, 2, 3].map(i => <div key={i} className="h-24 bg-white/5 rounded-xl animate-pulse" />)}
                            </div>
                        ) : campaigns.length === 0 ? (
                            <div className="text-center py-16">
                                <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 2, repeat: Infinity }} className="text-6xl mb-4">🚀</motion.div>
                                <p className="text-white/50 mb-4">No campaigns yet</p>
                                <Link to="/create">
                                    <motion.button whileHover={{ scale: 1.05 }} className="btn-primary flex items-center gap-2 mx-auto">
                                        Create Your First <FiArrowRight />
                                    </motion.button>
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {campaigns.map((campaign, index) => (
                                    <CampaignRow key={campaign.id} campaign={campaign} index={index} onDelete={handleDeleteCampaign} onEndEarly={handleEndEarly} />
                                ))}
                            </div>
                        )}
                    </motion.div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* AI Tips */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="glass-card p-6">
                            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <FiZap className="text-primary" /> AI Tips
                            </h2>
                            <div className="space-y-3">
                                {campaigns.filter(c => c.ai_score && c.ai_score < 0.5).length > 0 ? (
                                    <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20 text-sm">
                                        <p className="text-orange-400 font-medium mb-1">💡 Low AI scores detected</p>
                                        <p className="text-white/50 text-xs">Add a video and extend prep days to boost your score by up to 30%.</p>
                                    </div>
                                ) : (
                                    <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-sm">
                                        <p className="text-green-400 font-medium mb-1">✨ Great job!</p>
                                        <p className="text-white/50 text-xs">Your campaigns have strong AI scores. Keep it up!</p>
                                    </div>
                                )}
                                <div className="p-3 rounded-lg bg-white/5 text-sm">
                                    <p className="text-white/70 font-medium mb-1">📊 Quick tip</p>
                                    <p className="text-white/40 text-xs">Campaigns with updates every 3 days get 2x more backers.</p>
                                </div>
                            </div>
                        </motion.div>

                        {/* Quick Actions */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="glass-card p-6">
                            <h2 className="text-lg font-bold mb-4">Quick Actions</h2>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { to: '/create', icon: '➕', label: 'New Campaign' },
                                    { to: '/campaigns', icon: '📊', label: 'Browse' },
                                    { to: '/messages', icon: '💬', label: 'Messages' },
                                    { to: '/bookmarks', icon: '🔖', label: 'Saved' },
                                ].map(a => (
                                    <Link key={a.to} to={a.to}>
                                        <motion.div whileHover={{ scale: 1.05, y: -2 }} className="p-3 bg-white/5 rounded-xl text-center cursor-pointer hover:bg-white/10 transition-colors">
                                            <div className="text-xl mb-1">{a.icon}</div>
                                            <div className="text-xs font-medium text-white/70">{a.label}</div>
                                        </motion.div>
                                    </Link>
                                ))}
                            </div>
                        </motion.div>

                        {/* Recent Activity */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="glass-card p-6">
                            <h2 className="text-lg font-bold mb-4">Recent Activity</h2>
                            {notifications.length === 0 ? (
                                <p className="text-white/40 text-sm">No recent activity</p>
                            ) : (
                                <div className="space-y-2">
                                    {notifications.map((n, i) => (
                                        <motion.div
                                            key={n.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.9 + i * 0.05 }}
                                            className={`flex items-start gap-3 p-3 rounded-lg ${n.is_read ? 'bg-white/5' : 'bg-primary/10 border border-primary/20'}`}
                                        >
                                            <span className="text-base mt-0.5">
                                                {n.type === 'investment' ? '💰' : n.type === 'comment' ? '💬' : n.type === 'milestone' ? '🎉' : '📢'}
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">{n.title}</p>
                                                <p className="text-xs text-white/30">{new Date(n.created_at).toLocaleDateString()}</p>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Campaign Row with thumbnail + AI ring
const CampaignRow = ({ campaign, index, onDelete, onEndEarly }) => {
    const progress = campaign.funding_percentage || 0;
    const canEndEarly = progress >= 100 && campaign.status !== 'funded' && campaign.status !== 'expired';
    const aiPct = campaign.ai_score ? Math.round(campaign.ai_score * 100) : null;
    const scoreColor = aiPct >= 70 ? '#10b981' : aiPct >= 40 ? '#f59e0b' : '#ef4444';

    const statusColors = {
        'funded': 'bg-green-500', 'active': 'bg-blue-500', 'evaluated': 'bg-purple-500',
        'pending': 'bg-yellow-500', 'expired': 'bg-gray-500', 'published': 'bg-cyan-500',
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.08 }}
            whileHover={{ x: 4 }}
            className="p-4 bg-white/5 rounded-xl hover:bg-white/[0.08] transition-all border border-transparent hover:border-white/10"
        >
            <div className="flex items-center gap-4">
                {/* Thumbnail */}
                <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 relative">
                    {campaign.primary_image ? (
                        <img src={`${SERVER_BASE}/uploads/campaigns/${campaign.primary_image}`} alt="" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center">
                            <span className="text-xl">🚀</span>
                        </div>
                    )}
                    {/* Mini AI Ring overlay */}
                    {aiPct !== null && (
                        <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-[#0f0f23] rounded-full flex items-center justify-center">
                            <svg className="w-6 h-6 -rotate-90" viewBox="0 0 24 24">
                                <circle cx="12" cy="12" r="9" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
                                <circle cx="12" cy="12" r="9" fill="none" stroke={scoreColor} strokeWidth="2" strokeLinecap="round"
                                    strokeDasharray={`${2 * Math.PI * 9}`}
                                    strokeDashoffset={2 * Math.PI * 9 * (1 - aiPct / 100)}
                                />
                            </svg>
                            <span className="absolute text-[7px] font-bold" style={{ color: scoreColor }}>{aiPct}</span>
                        </div>
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold truncate">{campaign.name}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusColors[campaign.status] || 'bg-gray-500'}`}>
                            {campaign.status}
                        </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-white/50">
                        <span>${campaign.amount_raised?.toLocaleString() || 0} raised</span>
                        <span>{campaign.backers_count || 0} backers</span>
                    </div>
                </div>

                <div className="flex gap-1.5">
                    <Link to={`/campaign/${campaign.id}`}>
                        <motion.button whileHover={{ scale: 1.1 }} className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm" title="View"><FiEye size={14} /></motion.button>
                    </Link>
                    <Link to={`/edit-campaign/${campaign.id}`}>
                        <motion.button whileHover={{ scale: 1.1 }} className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm" title="Edit"><FiEdit size={14} /></motion.button>
                    </Link>
                    <Link to={`/analytics/${campaign.id}`}>
                        <motion.button whileHover={{ scale: 1.1 }} className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm" title="Analytics"><FiBarChart2 size={14} /></motion.button>
                    </Link>
                    {canEndEarly && (
                        <motion.button whileHover={{ scale: 1.1 }} onClick={() => onEndEarly(campaign.id)} className="p-2 rounded-lg bg-green-500/20 hover:bg-green-500/40 text-green-400 text-sm" title="End Early">
                            <FiCheckCircle size={14} />
                        </motion.button>
                    )}
                    <motion.button whileHover={{ scale: 1.1 }} onClick={() => onDelete(campaign.id)} className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/40 text-red-400 text-sm" title="Delete">
                        <FiTrash2 size={14} />
                    </motion.button>
                </div>
            </div>
            {/* Progress Bar */}
            <div className="mt-3">
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(progress, 100)}%` }}
                        transition={{ delay: 0.3, duration: 1 }}
                        className={`h-full rounded-full ${progress >= 100 ? 'bg-green-500' : 'bg-gradient-to-r from-primary to-secondary'}`}
                    />
                </div>
                <div className="flex justify-between mt-1 text-[10px] text-white/30">
                    <span>{progress.toFixed(0)}% funded</span>
                    <span>Goal: ${campaign.usd_goal?.toLocaleString()}</span>
                </div>
            </div>
        </motion.div>
    );
};

export default Dashboard;
