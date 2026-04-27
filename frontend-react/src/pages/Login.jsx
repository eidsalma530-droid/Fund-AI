import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { FiMail, FiLock, FiArrowRight, FiEye, FiEyeOff, FiZap, FiShield, FiTrendingUp } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';
import { authAPI } from '../services/api';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const navigate = useNavigate();
    const login = useAuthStore((state) => state.login);

    const validate = () => {
        const newErrors = {};
        if (!email.trim()) newErrors.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Enter a valid email';
        if (!password) newErrors.password = 'Password is required';
        else if (password.length < 6) newErrors.password = 'Min 6 characters';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        setLoading(true);
        try {
            const data = await authAPI.login({ email, password });
            login(data.user, data.token);
            toast.success('Welcome back! 👋');
            navigate('/dashboard');
        } catch (error) {
            toast.error(error.message || 'Login failed');
            setErrors({ general: error.message });
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const idToken = await result.user.getIdToken();
            
            const data = await authAPI.firebaseLogin(idToken);
            login(data.user, data.token);
            
            toast.success('Welcome back! 👋');
            
            if (!data.profile_complete) {
                navigate('/complete-profile');
            } else {
                navigate('/dashboard');
            }
        } catch (error) {
            console.error(error);
            toast.error(error.message || 'Google login failed');
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
            {/* Left Panel — Branding */}
            <motion.div
                initial={{ opacity: 0, x: -60 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                className="hidden lg:flex lg:w-1/2 relative overflow-hidden"
            >
                {/* Animated gradient background */}
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
                    {/* Logo */}
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
                        <p className="text-white/50 text-lg mt-4">The future of crowdfunding is here.</p>
                    </motion.div>

                    {/* Features */}
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

                    {/* Stats */}
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
            <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-24 relative">
                {/* Subtle background for mobile */}
                <div className="absolute inset-0 lg:hidden bg-gradient-to-br from-[#0f0f23] via-[#1a1145] to-[#0d0d2b]" />

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="w-full max-w-md relative z-10"
                >
                    <div className="glass-card p-8 border border-white/10">
                        {/* Header */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="text-center mb-8"
                        >
                            <div className="lg:hidden mb-6">
                                <Link to="/" className="inline-flex items-center gap-2">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                                        <span className="text-lg">🚀</span>
                                    </div>
                                    <span className="text-xl font-bold">Fund<span className="gradient-text">AI</span></span>
                                </Link>
                            </div>
                            <h1 className="text-3xl font-bold mb-2">Welcome Back</h1>
                            <p className="text-white/50">Log in to continue your journey</p>
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

                        {/* Form */}
                        <div className="space-y-5">
                            <motion.button
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.35 }}
                                onClick={handleGoogleLogin}
                                disabled={loading}
                                className="w-full flex items-center justify-center gap-3 py-3 rounded-xl bg-white text-gray-900 font-semibold hover:bg-gray-100 transition-all shadow-lg"
                            >
                                <FcGoogle size={24} />
                                Sign in with Google
                            </motion.button>

                            <div className="flex items-center gap-4 py-2">
                                <div className="flex-1 h-px bg-white/10" />
                                <span className="text-xs text-white/30 uppercase">or</span>
                                <div className="flex-1 h-px bg-white/10" />
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-5">
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.4 }}
                            >
                                <label className="block text-sm font-medium mb-2">Email</label>
                                <div className="relative">
                                    <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => { setEmail(e.target.value); setErrors(p => ({ ...p, email: null, general: null })); }}
                                        className={`input-field !pl-[40px] ${errors.email ? 'border-red-500/50' : ''}`}
                                        placeholder="you@example.com"
                                        required
                                    />
                                </div>
                                {errors.email && (
                                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-xs mt-1">
                                        {errors.email}
                                    </motion.p>
                                )}
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.5 }}
                            >
                                <label className="block text-sm font-medium mb-2">Password</label>
                                <div className="relative">
                                    <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => { setPassword(e.target.value); setErrors(p => ({ ...p, password: null, general: null })); }}
                                        className={`input-field !pl-[40px] !pr-12 ${errors.password ? 'border-red-500/50' : ''}`}
                                        placeholder="••••••••"
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
                                {errors.password && (
                                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-xs mt-1">
                                        {errors.password}
                                    </motion.p>
                                )}
                            </motion.div>

                            {/* Remember Me */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.55 }}
                                className="flex items-center justify-between"
                            >
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <div
                                        onClick={() => setRememberMe(!rememberMe)}
                                        className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all cursor-pointer ${
                                            rememberMe ? 'bg-primary border-primary' : 'bg-[rgba(26,26,46,0.8)] border-white/10 hover:border-white/30'
                                        }`}
                                    >
                                        {rememberMe && (
                                            <motion.svg
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                className="w-3.5 h-3.5 text-white"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="3"
                                            >
                                                <polyline points="20 6 9 17 4 12" />
                                            </motion.svg>
                                        )}
                                    </div>
                                    <span className="text-sm text-white/60">Remember me</span>
                                </label>
                            </motion.div>

                            <motion.button
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6 }}
                                type="submit"
                                disabled={loading}
                                className="btn-primary w-full flex items-center justify-center gap-2 py-3.5"
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
                                        Log In <FiArrowRight />
                                    </>
                                )}
                            </motion.button>
                        </form>

                        {/* Divider */}
                        <div className="flex items-center gap-4 my-6">
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
                            Don't have an account?{' '}
                            <Link to="/signup" className="text-primary hover:underline font-medium">
                                Create one free →
                            </Link>
                        </motion.p>
                    </div>
                </div>
            </motion.div>
        </div>
    </div>
    );
};

export default Login;
