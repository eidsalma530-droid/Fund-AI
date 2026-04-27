import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, Link } from 'react-router-dom';
import { FiTrendingUp, FiEye, FiDollarSign, FiUsers, FiActivity, FiCalendar } from 'react-icons/fi';
import { analyticsAPI, campaignsAPI } from '../services/api';
import useAuthStore from '../store/authStore';

const Analytics = () => {
    const { id } = useParams();
    const { isAuthenticated } = useAuthStore();
    const [campaign, setCampaign] = useState(null);
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isAuthenticated) {
            fetchData();
        }
    }, [id, isAuthenticated]);

    const fetchData = async () => {
        try {
            const [campaignData, analyticsData] = await Promise.all([
                campaignsAPI.getOne(id),
                analyticsAPI.getDetailed(id),
            ]);
            setCampaign(campaignData.campaign);
            setAnalytics(analyticsData);
        } catch (error) {
            console.error('Failed to fetch analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen pt-24 px-6 flex items-center justify-center">
                <motion.div className="text-center glass-card p-12">
                    <div className="text-6xl mb-4">🔒</div>
                    <h2 className="text-2xl font-bold mb-4">Login Required</h2>
                    <Link to="/login">
                        <motion.button whileHover={{ scale: 1.05 }} className="btn-primary">Log In</motion.button>
                    </Link>
                </motion.div>
            </div>
        );
    }

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

    const stats = [
        { label: 'Total Views', value: analytics?.views || 0, icon: FiEye, color: 'from-blue-500 to-cyan-600' },
        { label: 'Amount Raised', value: `$${(campaign?.amount_raised || 0).toLocaleString()}`, icon: FiDollarSign, color: 'from-green-500 to-emerald-600' },
        { label: 'Backers', value: campaign?.backers_count || 0, icon: FiUsers, color: 'from-purple-500 to-pink-600' },
        { label: 'Conversion Rate', value: `${analytics?.conversion_rate?.toFixed(1) || 0}%`, icon: FiTrendingUp, color: 'from-orange-500 to-red-600' },
    ];

    const dailyData = analytics?.daily_data || [];

    return (
        <div className="min-h-screen pt-24 px-6 pb-12">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between mb-8"
                >
                    <div>
                        <h1 className="text-3xl font-bold">Campaign Analytics</h1>
                        <p className="text-white/60">{campaign?.name}</p>
                    </div>
                    <div className="flex gap-3">
                        <Link to={`/campaign/${id}`}>
                            <motion.button whileHover={{ scale: 1.05 }} className="btn-secondary">
                                View Campaign
                            </motion.button>
                        </Link>
                        <Link to={`/edit-campaign/${id}`}>
                            <motion.button whileHover={{ scale: 1.05 }} className="btn-primary">
                                Edit Campaign
                            </motion.button>
                        </Link>
                    </div>
                </motion.div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {stats.map((stat, index) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            whileHover={{ y: -5, scale: 1.02 }}
                            className="glass-card p-6 relative overflow-hidden"
                        >
                            <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-10`} />
                            <div className="relative z-10">
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-4`}>
                                    <stat.icon className="text-xl" />
                                </div>
                                <div className="text-3xl font-bold mb-1">{stat.value}</div>
                                <div className="text-white/60 text-sm">{stat.label}</div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Funding Progress */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="glass-card p-6"
                    >
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <FiActivity /> Funding Progress
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span>Progress</span>
                                    <span className="text-primary">{campaign?.funding_percentage?.toFixed(0) || 0}%</span>
                                </div>
                                <div className="h-4 bg-white/10 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.min(campaign?.funding_percentage || 0, 100)}%` }}
                                        transition={{ duration: 1, delay: 0.5 }}
                                        className={`h-full rounded-full ${(campaign?.funding_percentage || 0) >= 100
                                                ? 'bg-green-500'
                                                : 'bg-gradient-to-r from-primary to-secondary'
                                            }`}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 mt-4">
                                <div className="p-3 bg-white/5 rounded-xl text-center">
                                    <div className="text-2xl font-bold text-primary">${(campaign?.amount_raised || 0).toLocaleString()}</div>
                                    <div className="text-xs text-white/60">Raised</div>
                                </div>
                                <div className="p-3 bg-white/5 rounded-xl text-center">
                                    <div className="text-2xl font-bold">${(campaign?.usd_goal || 0).toLocaleString()}</div>
                                    <div className="text-xs text-white/60">Goal</div>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* AI Score Breakdown */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="glass-card p-6"
                    >
                        <h3 className="text-xl font-bold mb-4">🤖 AI Analysis</h3>
                        {campaign?.ai_score ? (
                            <div className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                                        <span className="text-2xl font-bold">{Math.round(campaign.ai_score * 100)}%</span>
                                    </div>
                                    <div>
                                        <p className="font-bold">Success Prediction</p>
                                        <p className="text-sm text-white/60">
                                            {campaign.ai_score > 0.7 ? 'High chance of success!' :
                                                campaign.ai_score > 0.4 ? 'Moderate potential' : 'Needs improvement'}
                                        </p>
                                    </div>
                                </div>
                                {analytics?.ai_factors && (
                                    <div className="space-y-2">
                                        {Object.entries(analytics.ai_factors).map(([factor, score]) => (
                                            <div key={factor}>
                                                <div className="flex justify-between text-sm">
                                                    <span className="capitalize">{factor.replace('_', ' ')}</span>
                                                    <span>{Math.round(score * 100)}%</span>
                                                </div>
                                                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-primary to-secondary rounded-full"
                                                        style={{ width: `${score * 100}%` }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <p className="text-white/60">Campaign not yet evaluated</p>
                                <Link to={`/campaign/${id}`}>
                                    <motion.button whileHover={{ scale: 1.05 }} className="btn-primary mt-4">
                                        Request AI Evaluation
                                    </motion.button>
                                </Link>
                            </div>
                        )}
                    </motion.div>
                </div>

                {/* Recent Activity */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="glass-card p-6"
                >
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <FiCalendar /> Recent Activity
                    </h3>
                    {dailyData.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="text-left text-white/60 text-sm border-b border-white/10">
                                        <th className="pb-3">Date</th>
                                        <th className="pb-3">Views</th>
                                        <th className="pb-3">Investments</th>
                                        <th className="pb-3">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {dailyData.slice(0, 7).map((day, index) => (
                                        <motion.tr
                                            key={day.date}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.7 + index * 0.05 }}
                                            className="border-b border-white/5"
                                        >
                                            <td className="py-3">{new Date(day.date).toLocaleDateString()}</td>
                                            <td className="py-3">{day.views || 0}</td>
                                            <td className="py-3">{day.investments || 0}</td>
                                            <td className="py-3 text-primary">${(day.amount || 0).toLocaleString()}</td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-white/60 text-center py-8">No activity data available yet</p>
                    )}
                </motion.div>
            </div>
        </div>
    );
};

export default Analytics;
