import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FiBookmark, FiTrash2 } from 'react-icons/fi';
import useAuthStore from '../store/authStore';
import { bookmarksAPI } from '../services/api';
import CampaignCard from '../components/CampaignCard';
import toast from 'react-hot-toast';

const Bookmarks = () => {
    const { user, isAuthenticated } = useAuthStore();
    const [bookmarks, setBookmarks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isAuthenticated && user?.id) {
            fetchBookmarks();
        }
    }, [isAuthenticated, user]);

    const fetchBookmarks = async () => {
        try {
            const data = await bookmarksAPI.getAll(user.id);
            setBookmarks(data.bookmarks || []);
        } catch (error) {
            console.error('Failed to fetch bookmarks:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRemove = async (campaignId) => {
        try {
            await bookmarksAPI.toggle({ user_id: user.id, campaign_id: campaignId });
            setBookmarks(prev => prev.filter(b => b.campaign_id !== campaignId));
            toast.success('Removed from saved');
        } catch (error) {
            toast.error('Failed to remove bookmark');
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen pt-24 px-6 flex items-center justify-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center glass-card p-12"
                >
                    <div className="text-6xl mb-4">🔖</div>
                    <h2 className="text-2xl font-bold mb-4">Login to see saved campaigns</h2>
                    <Link to="/login">
                        <motion.button whileHover={{ scale: 1.05 }} className="btn-primary">
                            Log In
                        </motion.button>
                    </Link>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-24 px-6 pb-12">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-12"
                >
                    <h1 className="text-4xl font-bold mb-2">
                        <span className="gradient-text">Saved Campaigns</span> 🔖
                    </h1>
                    <p className="text-white/60">Campaigns you've bookmarked for later</p>
                </motion.div>

                {/* Content */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-80 glass-card animate-pulse" />
                        ))}
                    </div>
                ) : bookmarks.length === 0 ? (
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
                            📌
                        </motion.div>
                        <h3 className="text-xl font-bold mb-2">No saved campaigns yet</h3>
                        <p className="text-white/60 mb-6">
                            Browse campaigns and click the heart icon to save them here
                        </p>
                        <Link to="/campaigns">
                            <motion.button whileHover={{ scale: 1.05 }} className="btn-primary">
                                Browse Campaigns
                            </motion.button>
                        </Link>
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {bookmarks.map((bookmark, index) => (
                            <motion.div
                                key={bookmark.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="relative group"
                            >
                                <CampaignCard campaign={bookmark.campaign} index={index} />
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        handleRemove(bookmark.campaign_id);
                                    }}
                                    className="absolute top-4 right-4 p-2 rounded-full bg-red-500/80 text-white opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                >
                                    <FiTrash2 />
                                </motion.button>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Bookmarks;
