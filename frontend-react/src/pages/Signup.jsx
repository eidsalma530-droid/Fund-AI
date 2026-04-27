import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { FiMail, FiLock, FiUser, FiArrowRight, FiEye, FiEyeOff, FiCheck, FiX, FiZap, FiShield, FiTrendingUp, FiCalendar, FiGlobe } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';
import { authAPI, getCountries } from '../services/api';

const Signup = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'investor',
        age: '',
        nationality: ''
    });
    const [countries, setCountries] = useState([]);
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    const navigate = useNavigate();
    const login = useAuthStore((state) => state.login);

    // Password strength calculator
    const passwordStrength = useMemo(() => {
        const p = formData.password;
        if (!p) return { score: 0, label: '', color: '' };
        let score = 0;
        if (p.length >= 6) score++;
        if (p.length >= 10) score++;
        if (/[A-Z]/.test(p)) score++;
        if (/[0-9]/.test(p)) score++;
        if (/[^A-Za-z0-9]/.test(p)) score++;

        if (score <= 1) return { score: 1, label: 'Weak', color: 'bg-red-500' };
        if (score <= 2) return { score: 2, label: 'Fair', color: 'bg-orange-500' };
        if (score <= 3) return { score: 3, label: 'Good', color: 'bg-yellow-500' };
        if (score <= 4) return { score: 4, label: 'Strong', color: 'bg-green-500' };
        return { score: 5, label: 'Very Strong', color: 'bg-emerald-500' };
    }, [formData.password]);

    // Password requirements checker
    const requirements = useMemo(() => [
        { met: formData.password.length >= 6, text: 'At least 6 characters' },
        { met: /[0-9]/.test(formData.password), text: 'Contains a number' },
        { met: /[A-Z]/.test(formData.password), text: 'Contains uppercase letter' },
    ], [formData.password]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setErrors(prev => ({ ...prev, [e.target.name]: null }));
    };

    const handleBlur = (field) => {
        setTouched(prev => ({ ...prev, [field]: true }));
    };

    useEffect(() => {
        const fetchCountries = async () => {
            try {
                const data = await getCountries();
                setCountries(data.countries || []);
            } catch (err) {
                console.error('Failed to fetch countries:', err);
            }
        };
        fetchCountries();
    }, []);

    const validate = () => {
        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = 'Name is required';
        if (!formData.email.trim()) newErrors.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Enter a valid email';
        if (!formData.password) newErrors.password = 'Password is required';
        else if (formData.password.length < 6) newErrors.password = 'Min 6 characters';
        else if (!/[0-9]/.test(formData.password)) newErrors.password = 'Must contain a number';
        if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
        if (!formData.role) newErrors.role = 'Please select a role';
        if (!formData.age) newErrors.age = 'Age is required';
        if (!formData.nationality) newErrors.nationality = 'Nationality is required';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        setLoading(true);
        try {
            const data = await authAPI.signup({
                name: formData.name,
                email: formData.email,
                password: formData.password,
                role: formData.role,
            });
            login(data.user, data.token);
            toast.success('Account created! 🎉');
            navigate(formData.role === 'creator' ? '/create' : '/campaigns');
        } catch (error) {
            toast.error(error.message || 'Signup failed');
            setErrors({ general: error.message });
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignup = async () => {
        setLoading(true);
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const idToken = await result.user.getIdToken();
            
            const data = await authAPI.firebaseLogin(idToken);
            login(data.user, data.token);
            
            toast.success('Account linked successfully! 🚀');
            
            if (!data.profile_complete) {
                navigate('/complete-profile');
            } else {
                navigate('/dashboard');
            }
        } catch (error) {
            console.error(error);
            toast.error(error.message || 'Google registration failed');
        } finally {
            setLoading(false);
        }
    };

    const features = [
        { icon: <FiZap />, title: 'AI-Powered Insights', desc: 'Get real-time success predictions' },
        { icon: <FiShield />, title: 'Secure Platform', desc: 'Bank-level encryption & JWT auth' },
        { icon: <FiTrendingUp />, title: 'Smart Analytics', desc: 'Track your campaign performance' },
    ];

    return (
        <div className="min-h-screen flex">
            {/* Left Panel — Branding (same as Login) */}
            <motion.div
                initial={{ opacity: 0, x: -60 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                className="hidden lg:flex lg:w-1/2 relative overflow-hidden"
            >
                <div className="absolute inset-0 bg-gradient-to-br from-[#0f0f23] via-[#1a1145] to-[#0d0d2b]" />
                <div className="absolute inset-0 opacity-30">
                    <div className="absolute top-20 left-20 w-72 h-72 bg-purple-600/30 rounded-full blur-[100px] animate-pulse" />
                    <div className="absolute bottom-32 right-20 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
                    <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-pink-600/20 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '4s' }} />
                </div>

                {/* Floating particles */}
                <div className="absolute inset-0 overflow-hidden">
                    {[...Array(20)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute w-1 h-1 bg-white/20 rounded-full"
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 100}%`,
                            }}
                            animate={{
                                y: [0, -30, 0],
                                opacity: [0.2, 0.8, 0.2],
                            }}
                            transition={{
                                duration: 3 + Math.random() * 4,
                                repeat: Infinity,
                                delay: Math.random() * 5,
                            }}
                        />
                    ))}
                </div>

                <div className="relative z-10 flex flex-col justify-center px-16">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="mb-12"
                    >
                        <Link to="/" className="flex items-center gap-3 mb-2">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                                <span className="text-2xl">🚀</span>
                            </div>
                            <span className="text-3xl font-bold">Fund<span className="gradient-text">AI</span></span>
                        </Link>
                        <p className="text-white/50 text-lg mt-4">Join thousands of creators and investors.</p>
                    </motion.div>

                    <div className="space-y-6">
                        {features.map((feature, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -30 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.5 + i * 0.15 }}
                                className="flex items-start gap-4"
                            >
                                <div className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-primary flex-shrink-0">
                                    {feature.icon}
                                </div>
                                <div>
                                    <h3 className="font-semibold text-white">{feature.title}</h3>
                                    <p className="text-sm text-white/50">{feature.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1 }}
                        className="mt-16 flex gap-8"
                    >
                        <div>
                            <div className="text-2xl font-bold gradient-text">500+</div>
                            <div className="text-xs text-white/40">Active Projects</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold gradient-text">$2.5M</div>
                            <div className="text-xs text-white/40">Total Raised</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold gradient-text">95%</div>
                            <div className="text-xs text-white/40">Success Rate</div>
                        </div>
                    </motion.div>
                </div>
            </motion.div>

            {/* Right Panel — Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-16 relative">
                <div className="absolute inset-0 lg:hidden bg-gradient-to-br from-[#0f0f23] via-[#1a1145] to-[#0d0d2b]" />

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="w-full max-w-lg relative z-10"
                >
                    <div className="glass-card p-8 border border-white/10">
                        {/* Header */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="text-center mb-6"
                        >
                            <div className="lg:hidden mb-4">
                                <Link to="/" className="inline-flex items-center gap-2">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                                        <span className="text-lg">🚀</span>
                                    </div>
                                    <span className="text-xl font-bold">Fund<span className="gradient-text">AI</span></span>
                                </Link>
                            </div>
                            <h1 className="text-3xl font-bold mb-2">Create Account</h1>
                            <p className="text-white/50">Join the AI-powered crowdfunding revolution</p>
                        </motion.div>

                        {/* General Error */}
                        <AnimatePresence>
                            {errors.general && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm"
                                >
                                    {errors.general}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Role Selection */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.35 }}
                            className="mb-5"
                        >
                            <label className="block text-sm font-medium mb-3">I want to join as:</label>
                            <div className="grid grid-cols-2 gap-3">
                                <RoleCard
                                    icon="🎨"
                                    title="Creator"
                                    description="Launch campaigns"
                                    selected={formData.role === 'creator'}
                                    onClick={() => { setFormData({ ...formData, role: 'creator' }); setErrors(p => ({ ...p, role: null })); }}
                                />
                                <RoleCard
                                    icon="💼"
                                    title="Investor"
                                    description="Fund projects"
                                    selected={formData.role === 'investor'}
                                    onClick={() => { setFormData({ ...formData, role: 'investor' }); setErrors(p => ({ ...p, role: null })); }}
                                />
                            </div>
                            {errors.role && (
                                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-xs mt-1.5">
                                    {errors.role}
                                </motion.p>
                            )}
                        </motion.div>

                        {/* Form */}
                        <div className="space-y-6">
                            <motion.button
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.38 }}
                                onClick={handleGoogleSignup}
                                disabled={loading}
                                className="w-full flex items-center justify-center gap-3 py-3 rounded-xl bg-white text-gray-900 font-semibold hover:bg-gray-100 transition-all shadow-lg"
                            >
                                <FcGoogle size={24} />
                                Sign up with Google
                            </motion.button>

                            <div className="flex items-center gap-4 py-1">
                                <div className="flex-1 h-px bg-white/10" />
                                <span className="text-xs text-white/30 uppercase">or</span>
                                <div className="flex-1 h-px bg-white/10" />
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
                                <label className="block text-sm font-medium mb-1.5">Full Name</label>
                                <div className="relative">
                                    <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        onBlur={() => handleBlur('name')}
                                        className={`input-field !pl-[40px] ${errors.name && touched.name ? 'border-red-500/50' : ''}`}
                                        placeholder="John Doe"
                                        required
                                    />
                                </div>
                                {errors.name && touched.name && (
                                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-xs mt-1">{errors.name}</motion.p>
                                )}
                            </motion.div>

                            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.45 }}>
                                <label className="block text-sm font-medium mb-1.5">Email</label>
                                <div className="relative">
                                    <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        onBlur={() => handleBlur('email')}
                                        className={`input-field !pl-[40px] !pr-12 ${errors.email && touched.email ? 'border-red-500/50' : ''}`}
                                        placeholder="you@example.com"
                                        required
                                    />
                                    {/* Real-time email validation icon */}
                                    {touched.email && formData.email && (
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                            {/\S+@\S+\.\S+/.test(formData.email) ? (
                                                <FiCheck className="text-green-400" size={18} />
                                            ) : (
                                                <FiX className="text-red-400" size={18} />
                                            )}
                                        </div>
                                    )}
                                </div>
                            </motion.div>

                            {/* Age & Nationality Row */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.48 }}>
                                    <label className="block text-sm font-medium mb-1.5">Age</label>
                                    <div className="relative group">
                                        <FiCalendar className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                                        <input
                                            type="number"
                                            name="age"
                                            value={formData.age}
                                            onChange={handleChange}
                                            onBlur={() => handleBlur('age')}
                                            className={`input-field !pl-[40px] ${errors.age && touched.age ? 'border-red-500/50' : ''}`}
                                            placeholder="25"
                                            required
                                        />
                                    </div>
                                    {errors.age && touched.age && <p className="text-red-400 text-xs mt-1">{errors.age}</p>}
                                </motion.div>

                                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.48 }}>
                                    <label className="block text-sm font-medium mb-1.5">Nationality</label>
                                    <div className="relative group">
                                        <FiGlobe className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                                        <select
                                            name="nationality"
                                            value={formData.nationality}
                                            onChange={handleChange}
                                            onBlur={() => handleBlur('nationality')}
                                            className={`input-field !pl-[40px] appearance-none ${errors.nationality && touched.nationality ? 'border-red-500/50' : ''}`}
                                            required
                                        >
                                            <option value="" className="bg-gray-900 text-white/50">Select</option>
                                            {countries.map(c => (
                                                <option key={c.code} value={c.name} className="bg-gray-900">{c.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    {errors.nationality && touched.nationality && <p className="text-red-400 text-xs mt-1">{errors.nationality}</p>}
                                </motion.div>
                            </div>

                            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
                                <label className="block text-sm font-medium mb-1.5">Password</label>
                                <div className="relative">
                                    <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        onBlur={() => handleBlur('password')}
                                        className="input-field !pl-[40px] !pr-12"
                                        placeholder="••••••"
                                        minLength={6}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                                    >
                                        {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                                    </button>
                                </div>

                                {/* Password Strength Meter */}
                                {formData.password && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-2">
                                        <div className="flex gap-1 mb-1.5">
                                            {[1, 2, 3, 4, 5].map(i => (
                                                <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                                                    i <= passwordStrength.score ? passwordStrength.color : 'bg-white/10'
                                                }`} />
                                            ))}
                                        </div>
                                        <p className={`text-xs ${
                                            passwordStrength.score <= 1 ? 'text-red-400' :
                                            passwordStrength.score <= 2 ? 'text-orange-400' :
                                            passwordStrength.score <= 3 ? 'text-yellow-400' : 'text-green-400'
                                        }`}>
                                            {passwordStrength.label}
                                        </p>
                                        {/* Requirements checklist */}
                                        <div className="mt-2 space-y-1">
                                            {requirements.map((req, i) => (
                                                <div key={i} className="flex items-center gap-2 text-xs">
                                                    {req.met ? (
                                                        <FiCheck className="text-green-400" size={12} />
                                                    ) : (
                                                        <FiX className="text-white/30" size={12} />
                                                    )}
                                                    <span className={req.met ? 'text-green-400' : 'text-white/40'}>{req.text}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </motion.div>

                            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.55 }}>
                                <label className="block text-sm font-medium mb-1.5">Confirm Password</label>
                                <div className="relative">
                                    <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        onBlur={() => handleBlur('confirmPassword')}
                                        className={`input-field !pl-[40px] !pr-12 ${
                                            touched.confirmPassword && formData.confirmPassword
                                                ? formData.password === formData.confirmPassword
                                                    ? 'border-green-500/30'
                                                    : 'border-red-500/50'
                                                : ''
                                        }`}
                                        placeholder="••••••"
                                        minLength={6}
                                        required
                                    />
                                    {touched.confirmPassword && formData.confirmPassword && (
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                            {formData.password === formData.confirmPassword ? (
                                                <FiCheck className="text-green-400" size={18} />
                                            ) : (
                                                <FiX className="text-red-400" size={18} />
                                            )}
                                        </div>
                                    )}
                                </div>
                                {errors.confirmPassword && (
                                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-xs mt-1">
                                        {errors.confirmPassword}
                                    </motion.p>
                                )}
                            </motion.div>

                            <motion.button
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6 }}
                                type="submit"
                                disabled={loading}
                                className="btn-primary w-full flex items-center justify-center gap-2 mt-6 py-3.5"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                {loading ? (
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                        className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                                    />
                                ) : (
                                    <>
                                        Create Account <FiArrowRight />
                                    </>
                                )}
                            </motion.button>
                        </form>

                        {/* Divider */}
                        <div className="flex items-center gap-4 my-5">
                            <div className="flex-1 h-px bg-white/10" />
                            <span className="text-xs text-white/30 uppercase">or</span>
                            <div className="flex-1 h-px bg-white/10" />
                        </div>

                        {/* Footer */}
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.7 }}
                            className="text-center text-white/50"
                        >
                            Already have an account?{' '}
                            <Link to="/login" className="text-primary hover:underline font-medium">
                                Log in →
                            </Link>
                        </motion.p>
                    </div>
                </div>
            </motion.div>
        </div>
    </div>
    );
};

const RoleCard = ({ icon, title, description, selected, onClick }) => (
    <motion.button
        type="button"
        onClick={onClick}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        className={`p-4 rounded-xl text-center transition-all duration-300 border-2 ${
            selected
                ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20'
                : 'border-white/10 bg-white/5 hover:border-white/30'
        }`}
    >
        <motion.div
            animate={selected ? { scale: [1, 1.2, 1] } : {}}
            className="text-2xl mb-1"
        >
            {icon}
        </motion.div>
        <div className="font-semibold text-sm">{title}</div>
        <div className="text-xs text-white/50 mt-0.5">{description}</div>
    </motion.button>
);

export default Signup;
