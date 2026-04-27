import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import CampaignCard from '../components/CampaignCard';
import { campaignsAPI, getCategories } from '../services/api';
import { FiSearch, FiFilter, FiX, FiChevronDown } from 'react-icons/fi';

const SORT_OPTIONS = [
    { value: 'newest', label: 'Newest First' },
    { value: 'most_funded', label: 'Most Funded' },
    { value: 'highest_ai', label: 'Highest AI Score' },
    { value: 'ending_soon', label: 'Ending Soon' },
    { value: 'most_backers', label: 'Most Backers' },
];

const Campaigns = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [campaigns, setCampaigns] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
    const [sortBy, setSortBy] = useState('newest');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [campaignData, categoryData] = await Promise.all([
                    campaignsAPI.getAll(),
                    getCategories(),
                ]);
                setCampaigns(campaignData.campaigns || []);
                setCategories(categoryData.categories || []);
            } catch (error) {
                console.error('Failed to fetch campaigns:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Sync selectedCategory when navigating from Categories page
    useEffect(() => {
        const categoryParam = searchParams.get('category') || '';
        if (categoryParam !== selectedCategory) {
            setSelectedCategory(categoryParam);
        }
    }, [searchParams]);

    // Update URL when user changes the dropdown
    const handleCategoryChange = (value) => {
        setSelectedCategory(value);
        if (value) {
            setSearchParams({ category: value });
        } else {
            setSearchParams({});
        }
    };

    const hasActiveFilters = search || selectedCategory || sortBy !== 'newest';

    const handleClearFilters = () => {
        setSearch('');
        setSelectedCategory('');
        setSortBy('newest');
        setSearchParams({});
    };

    const filteredAndSorted = useMemo(() => {
        let result = campaigns.filter((campaign) => {
            const matchesSearch = campaign.name.toLowerCase().includes(search.toLowerCase()) ||
                campaign.blurb?.toLowerCase().includes(search.toLowerCase());
            const matchesCategory = !selectedCategory || campaign.main_category === selectedCategory;
            return matchesSearch && matchesCategory;
        });

        // Sort
        switch (sortBy) {
            case 'most_funded':
                result = [...result].sort((a, b) => (b.funding_percentage || 0) - (a.funding_percentage || 0));
                break;
            case 'highest_ai':
                result = [...result].sort((a, b) => (b.ai_score || 0) - (a.ai_score || 0));
                break;
            case 'ending_soon':
                result = [...result].sort((a, b) => (a.days_remaining ?? 999) - (b.days_remaining ?? 999));
                break;
            case 'most_backers':
                result = [...result].sort((a, b) => (b.backers_count || 0) - (a.backers_count || 0));
                break;
            case 'newest':
            default:
                // Already sorted by newest from API
                break;
        }

        return result;
    }, [campaigns, search, selectedCategory, sortBy]);

    return (
        <div className="min-h-screen pt-24 px-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12"
                >
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">
                        Explore <span className="gradient-text">Campaigns</span>
                    </h1>
                    <p className="text-white/60 max-w-2xl mx-auto">
                        Discover innovative projects powered by AI insights
                    </p>
                </motion.div>

                {/* Filters */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="glass-card p-4 mb-6 flex flex-col md:flex-row gap-4 items-stretch"
                >
                    {/* Search */}
                    <div className="flex-1 relative">
                        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="input-field pl-12"
                            placeholder="Search campaigns..."
                        />
                    </div>

                    {/* Category Filter */}
                    <div className="relative">
                        <FiFilter className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                        <select
                            value={selectedCategory}
                            onChange={(e) => handleCategoryChange(e.target.value)}
                            className="input-field pl-12 pr-8 appearance-none cursor-pointer min-w-[200px]"
                        >
                            <option value="">All Categories</option>
                            {categories.map((cat) => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>

                    {/* Sort */}
                    <div className="relative">
                        <FiChevronDown className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="input-field pl-12 pr-8 appearance-none cursor-pointer min-w-[180px]"
                        >
                            {SORT_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                </motion.div>

                {/* Results Bar */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="flex items-center justify-between mb-6"
                >
                    <div className="flex items-center gap-3">
                        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm">
                            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                            <span className="text-white/60">
                                {filteredAndSorted.length} campaign{filteredAndSorted.length !== 1 ? 's' : ''}
                            </span>
                        </span>

                        {selectedCategory && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs text-primary">
                                {selectedCategory}
                                <button onClick={() => handleCategoryChange('')} className="hover:text-white transition-colors">
                                    <FiX size={12} />
                                </button>
                            </span>
                        )}
                    </div>

                    {/* Clear All Filters */}
                    <AnimatePresence>
                        {hasActiveFilters && (
                            <motion.button
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                onClick={handleClearFilters}
                                className="text-xs text-white/40 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 hover:border-white/20 transition-all"
                            >
                                <FiX size={12} />
                                Clear Filters
                            </motion.button>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* Campaigns Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(9)].map((_, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: i * 0.05 }}
                                className="glass-card h-80 animate-pulse"
                            />
                        ))}
                    </div>
                ) : filteredAndSorted.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-20"
                    >
                        <div className="text-6xl mb-4">🔍</div>
                        <h3 className="text-xl font-bold mb-2">No campaigns found</h3>
                        <p className="text-white/60 mb-6">Try adjusting your search or filters</p>
                        {hasActiveFilters && (
                            <motion.button
                                onClick={handleClearFilters}
                                className="btn-secondary text-sm"
                                whileHover={{ scale: 1.05 }}
                            >
                                Clear All Filters
                            </motion.button>
                        )}
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredAndSorted.map((campaign, index) => (
                            <CampaignCard key={campaign.id} campaign={campaign} index={index} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Campaigns;
