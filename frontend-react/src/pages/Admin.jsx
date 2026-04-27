import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FiUsers, FiGrid, FiTrendingUp, FiStar, FiCheck, FiDollarSign } from 'react-icons/fi';
import { adminAPI } from '../services/api';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

const Admin = () => {
    const { user, isAuthenticated } = useAuthStore();
    const [activeTab, setActiveTab] = useState('overview');
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isAuthenticated) {
            fetchData();
        }
    }, [isAuthenticated]);

    const fetchData = async () => {
        try {
            const [statsData, usersData, campaignsData] = await Promise.all([
                adminAPI.getStats(),
                adminAPI.getUsers(),
                adminAPI.getCampaigns(),
            ]);
            setStats(statsData);
            setUsers(usersData.users || []);
            setCampaigns(campaignsData.campaigns || []);
        } catch (error) {
            console.error('Failed to fetch admin data:', error);
            toast.error('Failed to load admin data');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleFeatured = async (campaignId) => {
        try {
            await adminAPI.toggleFeatured(campaignId);
            setCampaigns(prev => prev.map(c =>
                c.id === campaignId ? { ...c, is_featured: !c.is_featured } : c
            ));
            toast.success('Updated!');
        } catch (error) {
            toast.error('Failed to update');
        }
    };

    const handleVerify = async (campaignId) => {
        try {
            await adminAPI.verifyCampaign(campaignId);
            setCampaigns(prev => prev.map(c =>
                c.id === campaignId ? { ...c, is_verified: true } : c
            ));
            toast.success('Campaign verified!');
        } catch (error) {
            toast.error('Failed to verify');
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen pt-24 px-6 flex items-center justify-center">
                <motion.div className="text-center glass-card p-12">
                    <div className="text-6xl mb-4">🔒</div>
                    <h2 className="text-2xl font-bold mb-4">Admin Access Required</h2>
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

    const overviewStats = [
        { label: 'Total Users', value: stats?.total_users || users.length, icon: FiUsers, color: 'from-blue-500 to-cyan-600' },
        { label: 'Total Campaigns', value: stats?.total_campaigns || campaigns.length, icon: FiGrid, color: 'from-purple-500 to-pink-600' },
        { label: 'Total Raised', value: `$${(stats?.total_raised || 0).toLocaleString()}`, icon: FiDollarSign, color: 'from-green-500 to-emerald-600' },
        { label: 'Funded Campaigns', value: stats?.funded_campaigns || 0, icon: FiTrendingUp, color: 'from-orange-500 to-red-600' },
    ];

    return (
        <div className="min-h-screen pt-24 px-6 pb-12">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <h1 className="text-4xl font-bold">
                        <span className="gradient-text">Admin Panel</span> ⚙️
                    </h1>
                    <p className="text-white/60">Manage your platform</p>
                </motion.div>

                {/* Tabs */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-2 mb-8 overflow-x-auto pb-2"
                >
                    {['overview', 'users', 'campaigns'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-xl font-medium capitalize whitespace-nowrap transition-colors ${activeTab === tab ? 'bg-primary text-white' : 'bg-white/10 hover:bg-white/20'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </motion.div>

                {/* Content */}
                {activeTab === 'overview' && (
                    <div>
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            {overviewStats.map((stat, index) => (
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

                        {/* Recent Activity Summary */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="glass-card p-6"
                            >
                                <h3 className="text-xl font-bold mb-4">Recent Users</h3>
                                <div className="space-y-3">
                                    {users.slice(0, 5).map(user => (
                                        <div key={user.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                                                {user.name?.[0] || '?'}
                                            </div>
                                            <div>
                                                <p className="font-medium">{user.name}</p>
                                                <p className="text-sm text-white/60">{user.email}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                                className="glass-card p-6"
                            >
                                <h3 className="text-xl font-bold mb-4">Recent Campaigns</h3>
                                <div className="space-y-3">
                                    {campaigns.slice(0, 5).map(campaign => (
                                        <Link key={campaign.id} to={`/campaign/${campaign.id}`}>
                                            <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                                                <div>
                                                    <p className="font-medium">{campaign.name}</p>
                                                    <p className="text-sm text-white/60">{campaign.main_category}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-primary font-bold">${(campaign.amount_raised || 0).toLocaleString()}</p>
                                                    <p className="text-xs text-white/40">{campaign.status}</p>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </motion.div>
                        </div>
                    </div>
                )}

                {activeTab === 'users' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass-card p-6"
                    >
                        <h3 className="text-xl font-bold mb-4">All Users ({users.length})</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="text-left text-white/60 text-sm border-b border-white/10">
                                        <th className="pb-3">ID</th>
                                        <th className="pb-3">Name</th>
                                        <th className="pb-3">Email</th>
                                        <th className="pb-3">Role</th>
                                        <th className="pb-3">Joined</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((user, index) => (
                                        <motion.tr
                                            key={user.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.03 }}
                                            className="border-b border-white/5"
                                        >
                                            <td className="py-3">{user.id}</td>
                                            <td className="py-3 font-medium">{user.name}</td>
                                            <td className="py-3 text-white/60">{user.email}</td>
                                            <td className="py-3">
                                                <span className={`px-2 py-1 rounded text-xs ${user.role === 'admin' ? 'bg-red-500/20 text-red-400' :
                                                        user.role === 'creator' ? 'bg-purple-500/20 text-purple-400' :
                                                            'bg-blue-500/20 text-blue-400'
                                                    }`}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="py-3 text-white/40 text-sm">
                                                {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'campaigns' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass-card p-6"
                    >
                        <h3 className="text-xl font-bold mb-4">All Campaigns ({campaigns.length})</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="text-left text-white/60 text-sm border-b border-white/10">
                                        <th className="pb-3">Campaign</th>
                                        <th className="pb-3">Category</th>
                                        <th className="pb-3">Raised</th>
                                        <th className="pb-3">Status</th>
                                        <th className="pb-3">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {campaigns.map((campaign, index) => (
                                        <motion.tr
                                            key={campaign.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.03 }}
                                            className="border-b border-white/5"
                                        >
                                            <td className="py-3">
                                                <Link to={`/campaign/${campaign.id}`} className="hover:text-primary">
                                                    <p className="font-medium">{campaign.name}</p>
                                                    <p className="text-xs text-white/40">by {campaign.creator_name}</p>
                                                </Link>
                                            </td>
                                            <td className="py-3 text-white/60">{campaign.main_category}</td>
                                            <td className="py-3">
                                                <span className="text-primary font-bold">${(campaign.amount_raised || 0).toLocaleString()}</span>
                                                <span className="text-white/40 text-sm"> / ${(campaign.usd_goal || 0).toLocaleString()}</span>
                                            </td>
                                            <td className="py-3">
                                                <div className="flex gap-1">
                                                    {campaign.is_featured && (
                                                        <span className="px-2 py-0.5 rounded text-xs bg-yellow-500/20 text-yellow-400">Featured</span>
                                                    )}
                                                    {campaign.is_verified && (
                                                        <span className="px-2 py-0.5 rounded text-xs bg-green-500/20 text-green-400">Verified</span>
                                                    )}
                                                    <span className={`px-2 py-0.5 rounded text-xs ${campaign.status === 'funded' ? 'bg-green-500/20 text-green-400' :
                                                            campaign.status === 'active' ? 'bg-blue-500/20 text-blue-400' :
                                                                'bg-gray-500/20 text-gray-400'
                                                        }`}>
                                                        {campaign.status}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-3">
                                                <div className="flex gap-2">
                                                    <motion.button
                                                        whileHover={{ scale: 1.1 }}
                                                        whileTap={{ scale: 0.9 }}
                                                        onClick={() => handleToggleFeatured(campaign.id)}
                                                        className={`p-2 rounded ${campaign.is_featured ? 'bg-yellow-500/20 text-yellow-400' : 'bg-white/10 text-white/60'}`}
                                                        title="Toggle Featured"
                                                    >
                                                        <FiStar />
                                                    </motion.button>
                                                    {!campaign.is_verified && (
                                                        <motion.button
                                                            whileHover={{ scale: 1.1 }}
                                                            whileTap={{ scale: 0.9 }}
                                                            onClick={() => handleVerify(campaign.id)}
                                                            className="p-2 rounded bg-white/10 text-white/60 hover:bg-green-500/20 hover:text-green-400"
                                                            title="Verify Campaign"
                                                        >
                                                            <FiCheck />
                                                        </motion.button>
                                                    )}
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default Admin;
