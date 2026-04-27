import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams, Link } from 'react-router-dom';
import { FiSearch, FiFilter } from 'react-icons/fi';
import { searchAPI, getCategories } from '../services/api';
import CampaignCard from '../components/CampaignCard';

const SearchResults = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const query = searchParams.get('q') || '';
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [categories, setCategories] = useState([]);
    const [filters, setFilters] = useState({
        category: searchParams.get('category') || '',
        min_score: searchParams.get('min_score') || '',
        status: searchParams.get('status') || '',
    });

    useEffect(() => {
        fetchCategories();
    }, []);

    useEffect(() => {
        if (query) {
            performSearch();
        }
    }, [query, filters]);

    const fetchCategories = async () => {
        try {
            const data = await getCategories();
            setCategories(data.categories || []);
        } catch (error) {
            console.error('Failed to fetch categories');
        }
    };

    const performSearch = async () => {
        setLoading(true);
        try {
            const data = await searchAPI.search(query, {
                category: filters.category,
                min_score: filters.min_score,
                status: filters.status,
            });
            setResults(data.campaigns || []);
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (key, value) => {
        const newFilters = { ...filters, [key]: value };
        setFilters(newFilters);

        const params = new URLSearchParams(searchParams);
        if (value) {
            params.set(key, value);
        } else {
            params.delete(key);
        }
        setSearchParams(params);
    };

    return (
        <div className="min-h-screen pt-24 px-6 pb-12">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <h1 className="text-4xl font-bold mb-2">
                        Search Results for "<span className="gradient-text">{query}</span>"
                    </h1>
                    <p className="text-white/60">{results.length} campaigns found</p>
                </motion.div>

                {/* Filters */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="glass-card p-4 mb-8"
                >
                    <div className="flex items-center gap-2 mb-4">
                        <FiFilter className="text-primary" />
                        <span className="font-medium">Filters</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <select
                            value={filters.category}
                            onChange={(e) => handleFilterChange('category', e.target.value)}
                            className="input-field"
                        >
                            <option value="">All Categories</option>
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                        <select
                            value={filters.status}
                            onChange={(e) => handleFilterChange('status', e.target.value)}
                            className="input-field"
                        >
                            <option value="">All Statuses</option>
                            <option value="active">Active</option>
                            <option value="funded">Funded</option>
                            <option value="evaluated">Evaluated</option>
                        </select>
                        <select
                            value={filters.min_score}
                            onChange={(e) => handleFilterChange('min_score', e.target.value)}
                            className="input-field"
                        >
                            <option value="">Any AI Score</option>
                            <option value="0.7">70%+ AI Score</option>
                            <option value="0.5">50%+ AI Score</option>
                            <option value="0.3">30%+ AI Score</option>
                        </select>
                    </div>
                </motion.div>

                {/* Results */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="h-80 glass-card animate-pulse" />
                        ))}
                    </div>
                ) : results.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="glass-card p-12 text-center"
                    >
                        <div className="text-6xl mb-4">🔍</div>
                        <h3 className="text-xl font-bold mb-2">No campaigns found</h3>
                        <p className="text-white/60 mb-6">Try adjusting your search or filters</p>
                        <Link to="/campaigns">
                            <motion.button whileHover={{ scale: 1.05 }} className="btn-primary">
                                Browse All Campaigns
                            </motion.button>
                        </Link>
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {results.map((campaign, index) => (
                            <CampaignCard key={campaign.id} campaign={campaign} index={index} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SearchResults;
