import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { FiCheck, FiEdit, FiZap, FiArrowRight, FiRefreshCw, FiUpload, FiPlus, FiTrash2, FiGift, FiImage, FiVideo, FiCalendar, FiInfo } from 'react-icons/fi';
import { campaignsAPI, getCategories, getCountries, rewardsAPI } from '../services/api';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';

const CreateCampaign = () => {
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuthStore();
    const [step, setStep] = useState(1); // 1: Form, 2: Rewards, 3: AI Feedback, 4: Published
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState([]);
    const [countries, setCountries] = useState([]);
    const [campaign, setCampaign] = useState(null);
    const [aiResult, setAiResult] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [imageFile, setImageFile] = useState(null);
    const fileInputRef = useRef(null);

    // Rewards state
    const [rewards, setRewards] = useState([]);
    const [newReward, setNewReward] = useState({ title: '', description: '', amount: '', estimated_delivery: '' });

    const [formData, setFormData] = useState({
        name: '',
        blurb: '',
        description: '',
        main_category: '',
        usd_goal: '',
        duration_days: 30,
        prep_days: 30,
        country: 'US',
        has_video: false,
    });

    useEffect(() => {
        fetchCategories();
        fetchCountries();
    }, []);

    const fetchCategories = async () => {
        try {
            const data = await getCategories();
            setCategories(data.categories || []);
        } catch (error) {
            console.error('Failed to fetch categories');
        }
    };

    const fetchCountries = async () => {
        try {
            const data = await getCountries();
            setCountries(data.countries || []);
        } catch (error) {
            console.error('Failed to fetch countries');
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onload = (e) => setImagePreview(e.target.result);
            reader.readAsDataURL(file);
        }
    };

    const uploadImage = async (campaignId) => {
        if (!imageFile) return;

        const formData = new FormData();
        formData.append('image', imageFile);
        formData.append('is_primary', 'true');

        try {
            await fetch(`${API_BASE}/api/campaigns/${campaignId}/images`, {
                method: 'POST',
                body: formData,
            });
        } catch (error) {
            console.error('Failed to upload image:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!isAuthenticated) {
            toast.error('Please login to create a campaign');
            return;
        }

        if (!formData.name || !formData.blurb || !formData.main_category || !formData.usd_goal) {
            toast.error('Please fill all required fields');
            return;
        }

        // Image is optional for testing
        // if (!imageFile) {
        //     toast.error('Please upload a campaign image');
        //     return;
        // }

        setLoading(true);
        try {
            // Create campaign as draft
            const createResult = await campaignsAPI.create({
                ...formData,
                creator_id: user.id,
                usd_goal: parseFloat(formData.usd_goal),
                duration_days: parseInt(formData.duration_days),
                prep_days: parseInt(formData.prep_days),
                has_video: formData.has_video ? 1 : 0,
            });

            setCampaign(createResult.campaign);

            // Upload image
            await uploadImage(createResult.campaign.id);

            setStep(2); // Move to rewards step
            toast.success('Campaign created! Now add your rewards.');

        } catch (error) {
            toast.error(error.message || 'Failed to create campaign');
        } finally {
            setLoading(false);
        }
    };

    const handleAddReward = async () => {
        if (!newReward.title || !newReward.amount) {
            toast.error('Title and amount are required');
            return;
        }

        try {
            const result = await rewardsAPI.add(campaign.id, {
                ...newReward,
                amount: parseFloat(newReward.amount),
            });
            setRewards([...rewards, result.reward]);
            setNewReward({ title: '', description: '', amount: '', estimated_delivery: '' });
            toast.success('Reward added!');
        } catch (error) {
            toast.error('Failed to add reward');
        }
    };

    const handleDeleteReward = async (rewardId) => {
        try {
            await rewardsAPI.delete(campaign.id, rewardId);
            setRewards(rewards.filter(r => r.id !== rewardId));
            toast.success('Reward removed');
        } catch (error) {
            toast.error('Failed to remove reward');
        }
    };

    const handleContinueToAI = async () => {
        if (rewards.length === 0) {
            toast.error('Please add at least one reward tier');
            return;
        }

        setLoading(true);
        try {
            toast.loading('AI is analyzing your campaign...', { id: 'ai-eval' });
            const evalResult = await campaignsAPI.evaluate(campaign.id);
            toast.dismiss('ai-eval');

            setCampaign(evalResult.campaign);
            setAiResult({
                score: evalResult.score,
                dl_score: evalResult.dl_score,
                xgb_score: evalResult.xgb_score,
                advice: evalResult.advice,
            });

            setStep(3);
            toast.success(`AI Score: ${evalResult.score}/100`);
        } catch (error) {
            toast.dismiss('ai-eval');
            toast.error('AI evaluation failed');
        } finally {
            setLoading(false);
        }
    };

    const handleReEvaluate = async () => {
        if (!campaign) return;

        setLoading(true);
        try {
            await campaignsAPI.update(campaign.id, {
                name: formData.name,
                blurb: formData.blurb,
                description: formData.description,
            });

            toast.loading('Re-evaluating...', { id: 'ai-eval' });
            const evalResult = await campaignsAPI.evaluate(campaign.id);
            toast.dismiss('ai-eval');

            setCampaign(evalResult.campaign);
            setAiResult({ score: evalResult.score, dl_score: evalResult.dl_score, xgb_score: evalResult.xgb_score, advice: evalResult.advice });
            toast.success(`New AI Score: ${evalResult.score}/100`);
        } catch (error) {
            toast.dismiss('ai-eval');
            toast.error('Re-evaluation failed');
        } finally {
            setLoading(false);
        }
    };

    const handlePublish = async () => {
        if (!campaign) return;

        setLoading(true);
        try {
            await campaignsAPI.publish(campaign.id);
            setStep(4);
            toast.success('Campaign published! 🎉');
        } catch (error) {
            toast.error(error.message || 'Failed to publish');
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

    return (
        <div className="min-h-screen pt-24 px-6 pb-12">
            <div className={`${step === 3 ? 'max-w-5xl' : 'max-w-3xl'} mx-auto transition-all duration-300`}>
                {/* Progress Steps */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-center gap-2 sm:gap-4 mb-12"
                >
                    {[
                        { num: 1, label: 'Details' },
                        { num: 2, label: 'Rewards' },
                        { num: 3, label: 'AI Review' },
                        { num: 4, label: 'Published' },
                    ].map((s, i) => (
                        <div key={s.num} className="flex items-center">
                            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold transition-colors text-sm ${step >= s.num ? 'bg-primary text-white' : 'bg-white/10 text-white/40'
                                }`}>
                                {step > s.num ? <FiCheck /> : s.num}
                            </div>
                            <span className={`ml-1 sm:ml-2 hidden sm:inline text-sm ${step >= s.num ? 'text-white' : 'text-white/40'}`}>
                                {s.label}
                            </span>
                            {i < 3 && <div className={`w-4 sm:w-8 h-0.5 mx-1 sm:mx-4 ${step > s.num ? 'bg-primary' : 'bg-white/10'}`} />}
                        </div>
                    ))}
                </motion.div>

                <AnimatePresence mode="wait">
                    {/* Step 1: Create Form with Image */}
                    {step === 1 && (
                        <motion.div
                            key="form"
                            initial={{ opacity: 0, x: -50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 50 }}
                        >
                            <div className="text-center mb-8">
                                <h1 className="text-4xl font-bold mb-4">
                                    Create Your <span className="gradient-text">Campaign</span> 🚀
                                </h1>
                                <p className="text-white/60">Fill in the details and upload a cover image</p>
                            </div>

                            <div className="glass-card p-8">
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {/* Section: Media */}
                                    <div className="flex items-center gap-2 pb-2 border-b border-white/10">
                                        <FiImage className="text-primary" />
                                        <h3 className="font-semibold text-white/80">Campaign Media</h3>
                                    </div>

                                    {/* Image Upload */}
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Campaign Cover Image *</label>
                                        <div
                                            onClick={() => fileInputRef.current?.click()}
                                            className={`relative h-48 rounded-xl border-2 border-dashed cursor-pointer transition-colors overflow-hidden ${imagePreview ? 'border-primary' : 'border-white/20 hover:border-primary/50'
                                                }`}
                                        >
                                            {imagePreview ? (
                                                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="absolute inset-0 flex flex-col items-center justify-center text-white/40">
                                                    <FiUpload className="text-4xl mb-2" />
                                                    <p>Click to upload image</p>
                                                    <p className="text-xs">PNG, JPG, WEBP (Max 5MB)</p>
                                                </div>
                                            )}
                                            {imagePreview && (
                                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                                    <FiImage className="text-4xl" />
                                                    <span className="ml-2">Change Image</span>
                                                </div>
                                            )}
                                        </div>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageChange}
                                            className="hidden"
                                        />
                                    </div>

                                    {/* Section: Campaign Details */}
                                    <div className="flex items-center gap-2 pb-2 border-b border-white/10 mt-2">
                                        <FiEdit className="text-primary" />
                                        <h3 className="font-semibold text-white/80">Campaign Details</h3>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">Campaign Name *</label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            className="input-field"
                                            placeholder="Enter a catchy title"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">Short Description *</label>
                                        <textarea
                                            name="blurb"
                                            value={formData.blurb}
                                            onChange={handleChange}
                                            rows={2}
                                            className="input-field resize-none"
                                            placeholder="Describe your project in one sentence"
                                            maxLength={150}
                                            required
                                        />
                                        <p className="text-xs text-white/40 mt-1">{formData.blurb.length}/150</p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">Full Description</label>
                                        <textarea
                                            name="description"
                                            value={formData.description}
                                            onChange={handleChange}
                                            rows={5}
                                            className="input-field resize-none"
                                            placeholder="Tell your story - what are you creating and why?"
                                        />
                                    </div>

                                    {/* Section: Campaign Settings */}
                                    <div className="flex items-center gap-2 pb-2 border-b border-white/10 mt-2">
                                        <FiInfo className="text-primary" />
                                        <h3 className="font-semibold text-white/80">Campaign Settings</h3>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-2">Category *</label>
                                            <select
                                                name="main_category"
                                                value={formData.main_category}
                                                onChange={handleChange}
                                                className="input-field"
                                                required
                                            >
                                                <option value="">Select category</option>
                                                {categories.map(cat => (
                                                    <option key={cat} value={cat}>{cat}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-2">Funding Goal ($) *</label>
                                            <input
                                                type="number"
                                                name="usd_goal"
                                                value={formData.usd_goal}
                                                onChange={handleChange}
                                                className="input-field"
                                                placeholder="10000"
                                                min={100}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-2 flex items-center gap-1.5">
                                                <FiCalendar className="text-primary" /> Duration (days)
                                            </label>
                                            <input
                                                type="number"
                                                name="duration_days"
                                                value={formData.duration_days}
                                                onChange={handleChange}
                                                className="input-field"
                                                min={7}
                                                max={60}
                                            />
                                            <p className="text-xs text-white/40 mt-1">How long your campaign will accept funding (7-60 days)</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-2 flex items-center gap-1.5">
                                                <FiCalendar className="text-secondary" /> Preparation Days *
                                            </label>
                                            <input
                                                type="number"
                                                name="prep_days"
                                                value={formData.prep_days}
                                                onChange={handleChange}
                                                className="input-field"
                                                min={1}
                                                max={365}
                                                required
                                            />
                                            <p className="text-xs text-white/40 mt-1">Days you spent preparing before launch — impacts AI score</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-2">Country</label>
                                            <select name="country" value={formData.country} onChange={handleChange} className="input-field">
                                                {countries.length > 0 ? countries.map(c => (
                                                    <option key={c.code} value={c.code}>{c.name}</option>
                                                )) : (
                                                    <option value="US">United States</option>
                                                )}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-3 flex items-center gap-1.5">
                                                <FiVideo className="text-primary" /> Campaign Video
                                            </label>
                                            <motion.button
                                                type="button"
                                                onClick={() => setFormData(prev => ({ ...prev, has_video: !prev.has_video }))}
                                                className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all duration-300 ${
                                                    formData.has_video
                                                        ? 'bg-emerald-500/15 border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.1)]'
                                                        : 'bg-white/5 border-white/10 hover:border-white/20'
                                                }`}
                                                whileTap={{ scale: 0.98 }}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${
                                                        formData.has_video ? 'bg-emerald-500/20' : 'bg-white/10'
                                                    }`}>
                                                        {formData.has_video ? '🎬' : '📷'}
                                                    </div>
                                                    <div className="text-left">
                                                        <p className="font-medium text-sm">{formData.has_video ? 'Video Included' : 'No Video'}</p>
                                                        <p className="text-xs text-white/40">Campaigns with video are 85% more likely to succeed</p>
                                                    </div>
                                                </div>
                                                {/* Toggle Switch */}
                                                <div className={`w-12 h-6 rounded-full p-0.5 transition-colors duration-300 ${
                                                    formData.has_video ? 'bg-emerald-500' : 'bg-white/20'
                                                }`}>
                                                    <motion.div
                                                        className="w-5 h-5 bg-white rounded-full shadow"
                                                        animate={{ x: formData.has_video ? 24 : 0 }}
                                                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                                    />
                                                </div>
                                            </motion.button>
                                        </div>
                                    </div>

                                    <motion.button
                                        type="submit"
                                        className="btn-primary w-full text-lg py-4 flex items-center justify-center gap-3"
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <>
                                                <motion.div
                                                    animate={{ rotate: 360 }}
                                                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                                                />
                                                Creating...
                                            </>
                                        ) : (
                                            <>
                                                Continue to Rewards <FiArrowRight />
                                            </>
                                        )}
                                    </motion.button>
                                </form>
                            </div>
                        </motion.div>
                    )}

                    {/* Step 2: Rewards */}
                    {step === 2 && (
                        <motion.div
                            key="rewards"
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -50 }}
                        >
                            <div className="text-center mb-8">
                                <h1 className="text-4xl font-bold mb-4">
                                    Add <span className="gradient-text">Rewards</span> 🎁
                                </h1>
                                <p className="text-white/60">Create reward tiers for your backers</p>
                            </div>

                            {/* Add Reward Form */}
                            <motion.div className="glass-card p-6 mb-6">
                                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                    <FiGift className="text-primary" /> New Reward Tier
                                </h3>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-2">Pledge Amount ($) *</label>
                                            <input
                                                type="number"
                                                value={newReward.amount}
                                                onChange={(e) => setNewReward({ ...newReward, amount: e.target.value })}
                                                className="input-field"
                                                placeholder="25"
                                                min={1}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-2">Title *</label>
                                            <input
                                                type="text"
                                                value={newReward.title}
                                                onChange={(e) => setNewReward({ ...newReward, title: e.target.value })}
                                                className="input-field"
                                                placeholder="Early Bird Special"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Description</label>
                                        <textarea
                                            value={newReward.description}
                                            onChange={(e) => setNewReward({ ...newReward, description: e.target.value })}
                                            className="input-field resize-none"
                                            rows={2}
                                            placeholder="What backers will receive..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Estimated Delivery</label>
                                        <input
                                            type="month"
                                            value={newReward.estimated_delivery}
                                            onChange={(e) => setNewReward({ ...newReward, estimated_delivery: e.target.value })}
                                            className="input-field"
                                        />
                                    </div>
                                    <motion.button
                                        type="button"
                                        onClick={handleAddReward}
                                        className="btn-secondary w-full flex items-center justify-center gap-2"
                                        whileHover={{ scale: 1.02 }}
                                    >
                                        <FiPlus /> Add Reward
                                    </motion.button>
                                </div>
                            </motion.div>

                            {/* Rewards List */}
                            <motion.div className="glass-card p-6 mb-6">
                                <h3 className="text-lg font-bold mb-4">Your Rewards ({rewards.length})</h3>
                                {rewards.length === 0 ? (
                                    <p className="text-white/60 text-center py-4">No rewards added yet. Add at least one!</p>
                                ) : (
                                    <div className="space-y-3">
                                        {rewards.map((reward, index) => (
                                            <motion.div
                                                key={reward.id || index}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="flex items-center justify-between p-4 bg-white/5 rounded-xl"
                                            >
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-xl font-bold text-primary">${reward.amount}</span>
                                                        <span className="font-medium">{reward.title}</span>
                                                    </div>
                                                    {reward.description && (
                                                        <p className="text-sm text-white/60 mt-1">{reward.description}</p>
                                                    )}
                                                </div>
                                                <motion.button
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    onClick={() => handleDeleteReward(reward.id)}
                                                    className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg"
                                                >
                                                    <FiTrash2 />
                                                </motion.button>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </motion.div>

                            <motion.button
                                onClick={handleContinueToAI}
                                className="btn-primary w-full text-lg py-4 flex items-center justify-center gap-3"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                disabled={loading || rewards.length === 0}
                            >
                                {loading ? (
                                    <>
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 1, repeat: Infinity }}
                                            className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                                        />
                                        Analyzing...
                                    </>
                                ) : (
                                    <>
                                        Get AI Analysis <FiZap />
                                    </>
                                )}
                            </motion.button>
                        </motion.div>
                    )}

                    {/* Step 3: AI Feedback */}
                    {step === 3 && aiResult && (
                        <motion.div
                            key="feedback"
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -50 }}
                            className="max-w-4xl mx-auto"
                        >
                            <div className="text-center mb-8">
                                <h1 className="text-4xl font-bold mb-4">
                                    AI Valuation <span className="gradient-text">Report</span> 🤖
                                </h1>
                                <p className="text-white/60">Comprehensive analysis from our AI models & Gemini Valuator</p>
                            </div>

                            {/* Three Score Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                                {/* Deep Learning Score */}
                                <motion.div
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ delay: 0.1 }}
                                    className="glass-card p-6 text-center border border-purple-500/30"
                                >
                                    <div className="text-3xl mb-2">🧠</div>
                                    <h3 className="text-sm font-semibold text-purple-400 mb-1">Deep Learning</h3>
                                    <p className="text-xs text-white/40 mb-3">NLP & Text Analysis</p>
                                    <div className="text-4xl font-bold mb-2">
                                        <span className={`${(aiResult.dl_score || 0) >= 70 ? 'text-green-400' :
                                                (aiResult.dl_score || 0) >= 40 ? 'text-yellow-400' : 'text-red-400'
                                            }`}>{aiResult.dl_score?.toFixed(1) || '—'}</span>
                                        <span className="text-white/30 text-lg">%</span>
                                    </div>
                                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${aiResult.dl_score || 0}%` }}
                                            transition={{ delay: 0.5, duration: 1.2 }}
                                            className="h-full rounded-full bg-gradient-to-r from-purple-500 to-purple-400"
                                        />
                                    </div>
                                </motion.div>

                                {/* XGBoost Score */}
                                <motion.div
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ delay: 0.2 }}
                                    className="glass-card p-6 text-center border border-blue-500/30"
                                >
                                    <div className="text-3xl mb-2">📊</div>
                                    <h3 className="text-sm font-semibold text-blue-400 mb-1">XGBoost</h3>
                                    <p className="text-xs text-white/40 mb-3">Numerical Features</p>
                                    <div className="text-4xl font-bold mb-2">
                                        <span className={`${(aiResult.xgb_score || 0) >= 70 ? 'text-green-400' :
                                                (aiResult.xgb_score || 0) >= 40 ? 'text-yellow-400' : 'text-red-400'
                                            }`}>{aiResult.xgb_score?.toFixed(1) || '—'}</span>
                                        <span className="text-white/30 text-lg">%</span>
                                    </div>
                                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${aiResult.xgb_score || 0}%` }}
                                            transition={{ delay: 0.7, duration: 1.2 }}
                                            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
                                        />
                                    </div>
                                </motion.div>

                                {/* Final Ensemble Score */}
                                <motion.div
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ delay: 0.3 }}
                                    className="glass-card p-6 text-center border border-emerald-500/30 relative overflow-hidden"
                                >
                                    <div className="absolute top-2 right-2 text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold">FINAL</div>
                                    <div className="text-3xl mb-2">🎯</div>
                                    <h3 className="text-sm font-semibold text-emerald-400 mb-1">Meta Ensemble</h3>
                                    <p className="text-xs text-white/40 mb-3">Combined Prediction</p>
                                    <div className="text-5xl font-bold mb-2">
                                        <span className={`${aiResult.score >= 70 ? 'text-green-400' :
                                                aiResult.score >= 40 ? 'text-yellow-400' : 'text-red-400'
                                            }`}>{aiResult.score}</span>
                                        <span className="text-white/30 text-xl">/100</span>
                                    </div>
                                    <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${aiResult.score}%` }}
                                            transition={{ delay: 0.9, duration: 1.5 }}
                                            className={`h-full rounded-full ${aiResult.score >= 70 ? 'bg-gradient-to-r from-green-500 to-emerald-400' :
                                                aiResult.score >= 40 ? 'bg-gradient-to-r from-yellow-500 to-orange-400' :
                                                'bg-gradient-to-r from-red-500 to-pink-400'}`}
                                        />
                                    </div>
                                    <p className="text-xs mt-2 text-white/50">
                                        {aiResult.score >= 70 ? '🎉 High chance of success' :
                                            aiResult.score >= 40 ? '💡 Moderate — review recommendations' :
                                                '⚠️ Needs significant improvement'}
                                    </p>
                                </motion.div>
                            </div>

                            {/* Score Explanation */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="glass-card p-4 mb-8 flex items-start gap-3 border border-white/10"
                            >
                                <span className="text-2xl mt-0.5">ℹ️</span>
                                <div className="text-sm text-white/60">
                                    <strong className="text-white/80">How scores work:</strong> The Deep Learning model (🧠) analyzes your text and pitch quality using NLP trained on 200K+ campaigns. 
                                    The XGBoost model (📊) evaluates structural factors like goal, duration, category, and video. 
                                    The Meta Ensemble (🎯) combines both for the final prediction.
                                </div>
                            </motion.div>

                            {/* Gemini Valuator Report — BIG */}
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                                className="glass-card p-8 md:p-10 mb-8 border border-primary/20"
                            >
                                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-2xl">
                                        💎
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold">Gemini AI Valuator Report</h3>
                                        <p className="text-sm text-white/50">Powered by Google Gemini — Senior Kickstarter Project Analysis</p>
                                    </div>
                                </div>
                                <div className="prose prose-invert max-w-none">
                                    <div className="text-white/85 leading-relaxed text-[15px] whitespace-pre-line 
                                        [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-8 [&_h2]:mb-4 [&_h2]:text-white [&_h2]:border-b [&_h2]:border-white/10 [&_h2]:pb-2
                                        [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mt-6 [&_h3]:mb-3 [&_h3]:text-white/90
                                        [&_strong]:text-white [&_strong]:font-semibold
                                        [&_li]:ml-4
                                        [&_ul]:space-y-1
                                    ">
                                        {aiResult.advice}
                                    </div>
                                </div>
                            </motion.div>

                            {/* Quick Edit */}
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6 }}
                                className="glass-card p-6 mb-6"
                            >
                                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                    <FiEdit /> Quick Edit
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Campaign Name</label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            className="input-field"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Short Description</label>
                                        <textarea
                                            name="blurb"
                                            value={formData.blurb}
                                            onChange={handleChange}
                                            rows={2}
                                            className="input-field resize-none"
                                        />
                                    </div>
                                </div>
                            </motion.div>

                            {/* Actions */}
                            <div className="flex flex-col sm:flex-row gap-4">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    onClick={handleReEvaluate}
                                    disabled={loading}
                                    className="btn-secondary flex-1 flex items-center justify-center gap-2"
                                >
                                    <FiRefreshCw className={loading ? 'animate-spin' : ''} />
                                    Re-Evaluate
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    onClick={handlePublish}
                                    disabled={loading}
                                    className="btn-primary flex-1 flex items-center justify-center gap-2"
                                >
                                    Publish Campaign <FiArrowRight />
                                </motion.button>
                            </div>
                        </motion.div>
                    )}

                    {/* Step 4: Published */}
                    {step === 4 && (
                        <motion.div
                            key="published"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center"
                        >
                            <motion.div
                                animate={{ y: [0, -20, 0] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="text-8xl mb-8"
                            >
                                🚀
                            </motion.div>
                            <h1 className="text-4xl font-bold mb-4">
                                Campaign <span className="gradient-text">Published!</span>
                            </h1>
                            <p className="text-white/60 mb-8">
                                Your campaign is now live! Share it with the world.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Link to={`/campaign/${campaign?.id}`}>
                                    <motion.button whileHover={{ scale: 1.05 }} className="btn-primary">
                                        View Campaign
                                    </motion.button>
                                </Link>
                                <Link to="/dashboard">
                                    <motion.button whileHover={{ scale: 1.05 }} className="btn-secondary">
                                        Go to Dashboard
                                    </motion.button>
                                </Link>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default CreateCampaign;
