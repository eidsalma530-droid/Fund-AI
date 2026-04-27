import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FiUser, FiCalendar, FiGlobe, FiArrowRight } from 'react-icons/fi';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';
import { authAPI, getCountries } from '../services/api';

const CompleteProfile = () => {
    const { user, updateUser } = useAuthStore();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [countries, setCountries] = useState([]);
    const [formData, setFormData] = useState({
        name: user?.name || '',
        age: '',
        nationality: '',
        role: user?.role || 'investor'
    });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        // If already complete, redirect to dashboard
        if (user.age && user.nationality && user.name) {
            navigate('/dashboard');
        }

        const fetchCountries = async () => {
            try {
                const data = await getCountries();
                setCountries(data.countries || []);
            } catch (err) {
                console.error('Failed to fetch countries:', err);
            }
        };
        fetchCountries();
    }, [user, navigate]);

    const validate = () => {
        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = 'Full name is required';
        if (!formData.age) newErrors.age = 'Age is required';
        else if (isNaN(formData.age) || formData.age < 13) newErrors.age = 'Must be at least 13';
        if (!formData.nationality) newErrors.nationality = 'Nationality is required';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        setLoading(true);
        try {
            const data = await authAPI.completeProfile(formData);
            updateUser(data.user);
            toast.success('Profile completed! Welcome to FundAI 🚀');
            navigate('/dashboard');
        } catch (error) {
            toast.error(error.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0f0f23] flex items-center justify-center px-6 py-20 relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px]" />

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-xl relative z-10"
            >
                <div className="glass-card p-8 md:p-12 border border-white/10">
                    <div className="text-center mb-10">
                        <h1 className="text-3xl font-bold mb-3">Complete Your Profile</h1>
                        <p className="text-white/50">Just a few more details to get you started</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Name */}
                        <div>
                            <label className="block text-sm font-medium mb-2 ml-1 text-white/70">Full Name</label>
                            <div className="relative group">
                                <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-primary transition-colors" size={18} />
                                <input
                                    type="text"
                                    className={`input-field !pl-[40px] ${errors.name ? 'border-red-500/50' : ''}`}
                                    placeholder="John Doe"
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                />
                            </div>
                            {errors.name && <p className="text-red-400 text-xs mt-1 ml-1">{errors.name}</p>}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Age */}
                            <div>
                                <label className="block text-sm font-medium mb-2 ml-1 text-white/70">Age</label>
                                <div className="relative group">
                                    <FiCalendar className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-primary transition-colors" size={18} />
                                    <input
                                        type="number"
                                        className={`input-field !pl-[40px] ${errors.age ? 'border-red-500/50' : ''}`}
                                        placeholder="25"
                                        value={formData.age}
                                        onChange={(e) => setFormData({...formData, age: e.target.value})}
                                    />
                                </div>
                                {errors.age && <p className="text-red-400 text-xs mt-1 ml-1">{errors.age}</p>}
                            </div>

                            {/* Nationality */}
                            <div>
                                <label className="block text-sm font-medium mb-2 ml-1 text-white/70">Nationality</label>
                                <div className="relative group">
                                    <FiGlobe className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-primary transition-colors" size={18} />
                                    <select
                                        className={`input-field !pl-[40px] appearance-none ${errors.nationality ? 'border-red-500/50' : ''}`}
                                        value={formData.nationality}
                                        onChange={(e) => setFormData({...formData, nationality: e.target.value})}
                                    >
                                        <option value="" className="bg-gray-900">Select</option>
                                        {Array.isArray(countries) && countries.map(c => (
                                            <option key={c.code} value={c.name} className="bg-gray-900">{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                                {errors.nationality && <p className="text-red-400 text-xs mt-1 ml-1">{errors.nationality}</p>}
                            </div>
                        </div>

                        {/* Role Selection */}
                        <div>
                            <label className="block text-sm font-medium mb-4 ml-1 text-white/70">I am joining as a:</label>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    onClick={() => setFormData({...formData, role: 'creator'})}
                                    className={`p-4 rounded-xl border-2 transition-all ${
                                        formData.role === 'creator'
                                            ? 'border-primary bg-primary/10'
                                            : 'border-white/10 bg-white/5 hover:border-white/20'
                                    }`}
                                >
                                    <span className="block text-xl mb-1">🎨</span>
                                    <span className="font-semibold text-sm">Creator</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({...formData, role: 'investor'})}
                                    className={`p-4 rounded-xl border-2 transition-all ${
                                        formData.role === 'investor'
                                            ? 'border-primary bg-primary/10'
                                            : 'border-white/10 bg-white/5 hover:border-white/20'
                                    }`}
                                >
                                    <span className="block text-xl mb-1">💼</span>
                                    <span className="font-semibold text-sm">Investor</span>
                                </button>
                            </div>
                        </div>

                        <motion.button
                            type="submit"
                            disabled={loading}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="btn-primary w-full py-4 flex items-center justify-center gap-2 mt-4"
                        >
                            {loading ? (
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                                />
                            ) : (
                                <>
                                    Complete Setup <FiArrowRight />
                                </>
                            )}
                        </motion.button>
                    </form>
                </div>
            </motion.div>
        </div>
    );
};

export default CompleteProfile;
