import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { campaignsAPI } from '../services/api';

const categoriesMeta = [
    { name: 'Technology', icon: '💻', color: 'from-blue-500 to-cyan-500' },
    { name: 'Design', icon: '🎨', color: 'from-pink-500 to-rose-500' },
    { name: 'Games', icon: '🎮', color: 'from-purple-500 to-violet-500' },
    { name: 'Film & Video', icon: '🎬', color: 'from-red-500 to-orange-500' },
    { name: 'Music', icon: '🎵', color: 'from-green-500 to-emerald-500' },
    { name: 'Food', icon: '🍕', color: 'from-yellow-500 to-amber-500' },
    { name: 'Publishing', icon: '📚', color: 'from-indigo-500 to-blue-500' },
    { name: 'Art', icon: '🖼️', color: 'from-fuchsia-500 to-pink-500' },
    { name: 'Fashion', icon: '👗', color: 'from-teal-500 to-cyan-500' },
    { name: 'Photography', icon: '📸', color: 'from-amber-500 to-orange-500' },
    { name: 'Comics', icon: '💥', color: 'from-rose-500 to-red-500' },
    { name: 'Crafts', icon: '🧶', color: 'from-lime-500 to-green-500' },
    { name: 'Dance', icon: '💃', color: 'from-violet-500 to-purple-500' },
    { name: 'Theater', icon: '🎭', color: 'from-sky-500 to-blue-500' },
    { name: 'Journalism', icon: '📰', color: 'from-slate-500 to-gray-600' },
    { name: 'Documentary', icon: '🎥', color: 'from-orange-500 to-red-500' },
    { name: 'Shorts', icon: '🎞️', color: 'from-pink-500 to-fuchsia-500' },
    { name: 'Web', icon: '🌐', color: 'from-cyan-500 to-blue-500' },
    { name: 'Tabletop Games', icon: '🎲', color: 'from-emerald-500 to-teal-500' },
    { name: 'Product Design', icon: '📐', color: 'from-blue-500 to-indigo-500' },
    { name: 'Apparel', icon: '👕', color: 'from-purple-500 to-pink-500' },
    { name: 'Accessories', icon: '⌚', color: 'from-yellow-500 to-orange-500' },
    { name: 'Illustration', icon: '✏️', color: 'from-red-500 to-rose-500' },
    { name: 'Comedy', icon: '😂', color: 'from-green-500 to-lime-500' },
];

const Categories = () => {
    const [hoveredIndex, setHoveredIndex] = useState(null);
    const [categoryCounts, setCategoryCounts] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCounts = async () => {
            try {
                const data = await campaignsAPI.getAll();
                const campaigns = data.campaigns || [];
                const counts = {};
                categoriesMeta.forEach((cat) => {
                    counts[cat.name] = campaigns.filter((c) => c.main_category === cat.name).length;
                });
                setCategoryCounts(counts);
            } catch (error) {
                console.error('Failed to fetch category counts:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchCounts();
    }, []);

    const totalProjects = Object.values(categoryCounts).reduce((sum, c) => sum + c, 0);

    return (
        <div className="min-h-screen pt-24 px-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-16"
                >
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">
                        Browse by <span className="gradient-text">Category</span>
                    </h1>
                    <p className="text-white/60 max-w-2xl mx-auto mb-6">
                        Find projects that match your interests
                    </p>
                    {!loading && (
                        <motion.span
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-white/60"
                        >
                            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                            {totalProjects} total projects across {categoriesMeta.length} categories
                        </motion.span>
                    )}
                </motion.div>

                {/* Categories Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {categoriesMeta.map((category, index) => {
                        const count = categoryCounts[category.name] ?? '—';
                        return (
                            <motion.div
                                key={category.name}
                                initial={{ opacity: 0, y: 50 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                onHoverStart={() => setHoveredIndex(index)}
                                onHoverEnd={() => setHoveredIndex(null)}
                            >
                                <Link to={`/campaigns?category=${encodeURIComponent(category.name)}`}>
                                    <motion.div
                                        className={`relative overflow-hidden rounded-2xl p-8 h-48 cursor-pointer bg-gradient-to-br ${category.color}`}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        {/* Animated background circles */}
                                        <motion.div
                                            animate={{
                                                scale: hoveredIndex === index ? 1.5 : 1,
                                                opacity: hoveredIndex === index ? 0.3 : 0.1,
                                            }}
                                            className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white"
                                        />
                                        <motion.div
                                            animate={{
                                                scale: hoveredIndex === index ? 1.3 : 1,
                                                opacity: hoveredIndex === index ? 0.2 : 0.1,
                                            }}
                                            className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-white"
                                        />

                                        {/* Content */}
                                        <div className="relative z-10">
                                            <motion.div
                                                animate={{
                                                    scale: hoveredIndex === index ? 1.2 : 1,
                                                    rotate: hoveredIndex === index ? 10 : 0,
                                                }}
                                                className="text-5xl mb-4"
                                            >
                                                {category.icon}
                                            </motion.div>
                                            <h3 className="text-2xl font-bold text-white mb-1">{category.name}</h3>
                                            <p className="text-white/80">
                                                {loading ? (
                                                    <span className="inline-block w-12 h-4 bg-white/20 rounded animate-pulse" />
                                                ) : (
                                                    `${count} project${count !== 1 ? 's' : ''}`
                                                )}
                                            </p>
                                        </div>

                                        {/* Arrow */}
                                        <motion.div
                                            animate={{
                                                x: hoveredIndex === index ? 0 : -10,
                                                opacity: hoveredIndex === index ? 1 : 0,
                                            }}
                                            className="absolute bottom-6 right-6 text-2xl"
                                        >
                                            →
                                        </motion.div>
                                    </motion.div>
                                </Link>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default Categories;
