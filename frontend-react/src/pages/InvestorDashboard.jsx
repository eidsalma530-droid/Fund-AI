import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';
import { userAPI, notificationsAPI, SERVER_BASE } from '../services/api';
import {
    FiDollarSign, FiTrendingUp, FiBookmark, FiEye, FiArrowRight,
    FiCompass, FiMessageSquare, FiBell,
} from 'react-icons/fi';

const InvestorDashboard = () => {
    const { user, isAuthenticated } = useAuthStore();
    const [stats, setStats] = useState(null);
    const [investments, setInvestments] = useState([]);
    const [bookmarks, setBookmarks] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isAuthenticated && user?.id) fetchDashboardData();
    }, [isAuthenticated, user]);

    const fetchDashboardData = async () => {
        try {
            const [dashboardData, notifData] = await Promise.all([
                userAPI.getDashboard(user.id),
                notificationsAPI.getAll(user.id),
            ]);
            setStats(dashboardData.stats || {});
            setInvestments(dashboardData.investments || []);
            setBookmarks(dashboardData.bookmarks || []);
            setNotifications(notifData.notifications?.slice(0, 5) || []);
        } catch (error) {
            console.error('Failed to fetch investor dashboard:', error);
            toast.error('Failed to load dashboard');
        } finally {
            setLoading(false);
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

    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

    return (
        <div className="min-h-screen pt-24 px-6 pb-12">
            <div className="max-w-7xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card p-8 mb-8 relative overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-transparent to-cyan-500/10" />
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-bold mb-2">
                                {greeting}, <span className="gradient-text">{user?.name?.split(' ')[0] || 'Investor'}</span>! 👋
                            </h1>
                            <p className="text-white/50">Track your portfolio and discover campaigns worth backing</p>
                        </div>
                        <Link to="/campaigns">
                            <motion.button whileHover={{ scale: 1.05 }} className="btn-primary flex items-center gap-2">
                                Discover Campaigns <FiArrowRight />
                            </motion.button>
                        </Link>
                    </div>
                </motion.div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {[
                        { title: 'Total Invested', value: `$${(stats?.total_invested || 0).toLocaleString()}`, icon: <FiDollarSign />, color: 'from-green-500 to-emerald-600' },
                        { title: 'Campaigns Backed', value: stats?.campaigns_backed || 0, icon: <FiTrendingUp />, color: 'from-blue-500 to-cyan-600' },
                        { title: 'Investments', value: stats?.investments_count || 0, icon: <FiEye />, color: 'from-purple-500 to-pink-600' },
                        { title: 'Saved', value: bookmarks.length, icon: <FiBookmark />, color: 'from-orange-500 to-red-600' },
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

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="lg:col-span-2 glass-card p-6"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold">Your Investments</h2>
                            <Link to="/profile" className="text-sm text-primary hover:underline">View profile</Link>
                        </div>

                        {loading ? (
                            <div className="space-y-4">
                                {[1, 2, 3].map(i => <div key={i} className="h-20 bg-white/5 rounded-xl animate-pulse" />)}
                            </div>
                        ) : investments.length === 0 ? (
                            <div className="text-center py-16">
                                <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 2, repeat: Infinity }} className="text-6xl mb-4">💼</motion.div>
                                <p className="text-white/50 mb-4">You haven&apos;t backed any campaigns yet</p>
                                <Link to="/campaigns">
                                    <motion.button whileHover={{ scale: 1.05 }} className="btn-primary flex items-center gap-2 mx-auto">
                                        Explore Campaigns <FiArrowRight />
                                    </motion.button>
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {investments.map((investment, index) => (
                                    <motion.div
                                        key={investment.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.06 }}
                                        className="p-4 bg-white/5 rounded-xl hover:bg-white/[0.08] transition-all border border-transparent hover:border-white/10"
                                    >
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="min-w-0">
                                                <h3 className="font-bold truncate">{investment.campaign_name || 'Campaign'}</h3>
                                                <p className="text-sm text-white/50">
                                                    ${investment.amount?.toLocaleString()} · {new Date(investment.created_at).toLocaleDateString()}
                                                </p>
                                                {investment.reward_title && (
                                                    <p className="text-xs text-primary mt-1">Reward: {investment.reward_title}</p>
                                                )}
                                            </div>
                                            <Link to={`/campaign/${investment.campaign_id}`}>
                                                <motion.button whileHover={{ scale: 1.05 }} className="btn-secondary text-sm">
                                                    View
                                                </motion.button>
                                            </Link>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </motion.div>

                    <div className="space-y-6">
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass-card p-6">
                            <h2 className="text-lg font-bold mb-4">Quick Actions</h2>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { to: '/campaigns', icon: <FiCompass />, label: 'Browse' },
                                    { to: '/bookmarks', icon: <FiBookmark />, label: 'Saved' },
                                    { to: '/messages', icon: <FiMessageSquare />, label: 'Messages' },
                                    { to: '/profile', icon: <FiEye />, label: 'Profile' },
                                ].map(action => (
                                    <Link key={action.to} to={action.to}>
                                        <motion.div whileHover={{ scale: 1.05, y: -2 }} className="p-3 bg-white/5 rounded-xl text-center cursor-pointer hover:bg-white/10 transition-colors">
                                            <div className="text-xl mb-1 flex justify-center text-primary">{action.icon}</div>
                                            <div className="text-xs font-medium text-white/70">{action.label}</div>
                                        </motion.div>
                                    </Link>
                                ))}
                            </div>
                        </motion.div>

                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="glass-card p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-bold">Saved Campaigns</h2>
                                <Link to="/bookmarks" className="text-xs text-primary hover:underline">See all</Link>
                            </div>
                            {loading ? (
                                <div className="space-y-3">
                                    {[1, 2].map(i => <div key={i} className="h-14 bg-white/5 rounded-lg animate-pulse" />)}
                                </div>
                            ) : bookmarks.length === 0 ? (
                                <p className="text-white/40 text-sm">No saved campaigns yet.</p>
                            ) : (
                                <div className="space-y-3">
                                    {bookmarks.map(bookmark => {
                                        const campaign = bookmark.campaign;
                                        if (!campaign) return null;
                                        return (
                                            <Link key={bookmark.id} to={`/campaign/${campaign.id}`} className="block p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-white/10 flex-shrink-0">
                                                        {campaign.primary_image ? (
                                                            <img src={`${SERVER_BASE}/uploads/campaigns/${campaign.primary_image}`} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center">🔖</div>
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-medium truncate">{campaign.name}</p>
                                                        <p className="text-xs text-white/40">{campaign.funding_percentage?.toFixed(0) || 0}% funded</p>
                                                    </div>
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </div>
                            )}
                        </motion.div>

                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="glass-card p-6">
                            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <FiBell className="text-primary" /> Recent Activity
                            </h2>
                            {notifications.length === 0 ? (
                                <p className="text-white/40 text-sm">No recent activity</p>
                            ) : (
                                <div className="space-y-2">
                                    {notifications.map((n, i) => (
                                        <motion.div
                                            key={n.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.8 + i * 0.05 }}
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

export default InvestorDashboard;
