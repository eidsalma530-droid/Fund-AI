import { useEffect, useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import Hero from '../components/Hero';
import CampaignCard from '../components/CampaignCard';
import { campaignsAPI } from '../services/api';
import { FiEdit, FiCpu, FiDollarSign } from 'react-icons/fi';

const Home = () => {
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCampaigns = async () => {
            try {
                const data = await campaignsAPI.getAll({ featured: true, limit: 6 });
                setCampaigns(data.campaigns || []);
            } catch (error) {
                console.error('Failed to fetch campaigns:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchCampaigns();
    }, []);

    return (
        <div className="min-h-screen">
            {/* Hero Section */}
            <Hero />

            {/* Featured Campaigns */}
            <section className="py-20 px-6">
                <div className="max-w-7xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-12"
                    >
                        <h2 className="text-4xl font-bold mb-4">
                            🔥 <span className="gradient-text">Featured</span> Campaigns
                        </h2>
                        <p className="text-white/60 max-w-2xl mx-auto">
                            Discover the most promising projects, hand-picked by our AI and community
                        </p>
                    </motion.div>

                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[...Array(6)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="glass-card h-80 animate-pulse"
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {campaigns.map((campaign, index) => (
                                <CampaignCard key={campaign.id} campaign={campaign} index={index} />
                            ))}
                        </div>
                    )}

                    {/* View All Button */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mt-12"
                    >
                        <motion.a
                            href="/campaigns"
                            className="btn-secondary inline-flex items-center gap-2"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            View All Campaigns
                            <span>→</span>
                        </motion.a>
                    </motion.div>
                </div>
            </section>

            {/* How It Works */}
            <section id="how-it-works" className="py-20 px-6">
                <div className="max-w-5xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-4xl font-bold mb-4">
                            How <span className="gradient-text">FundAI</span> Works
                        </h2>
                        <p className="text-white/60 max-w-2xl mx-auto">
                            Three simple steps from idea to funded project
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                        {/* Connecting line (desktop) */}
                        <div className="hidden md:block absolute top-16 left-[20%] right-[20%] h-0.5 bg-gradient-to-r from-primary/40 via-secondary/40 to-primary/40" />

                        <StepCard
                            step={1}
                            icon={<FiEdit className="text-2xl" />}
                            title="Create Your Campaign"
                            description="Fill in your project details, upload images, set your goal, and add reward tiers for your backers."
                            delay={0}
                        />
                        <StepCard
                            step={2}
                            icon={<FiCpu className="text-2xl" />}
                            title="AI Evaluates It"
                            description="Our Deep Learning and XGBoost models analyze your campaign and Gemini AI provides actionable feedback."
                            delay={0.15}
                        />
                        <StepCard
                            step={3}
                            icon={<FiDollarSign className="text-2xl" />}
                            title="Get Funded"
                            description="Publish your campaign with confidence. Track progress with real-time analytics and engage backers."
                            delay={0.3}
                        />
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section id="stats" className="py-20 px-6 bg-gradient-to-b from-transparent via-primary/5 to-transparent">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <AnimatedStatCard value={2500000} prefix="$" suffix="+" label="Total Funded" icon="💰" delay={0} />
                        <AnimatedStatCard value={500} suffix="+" label="Campaigns" icon="🚀" delay={0.1} />
                        <AnimatedStatCard value={10000} suffix="+" label="Backers" icon="👥" delay={0.2} />
                        <AnimatedStatCard value={95} suffix="%" label="AI Accuracy" icon="🤖" delay={0.3} />
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-6">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="max-w-4xl mx-auto glass-card p-12 text-center relative overflow-hidden"
                >
                    {/* Background Animation */}
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
                        className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full blur-3xl"
                    />

                    <div className="relative z-10">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">
                            Ready to Launch Your <span className="gradient-text">Dream Project</span>?
                        </h2>
                        <p className="text-white/60 mb-8 max-w-xl mx-auto">
                            Join thousands of creators who have successfully funded their ideas with FundAI's intelligent platform.
                        </p>
                        <motion.a
                            href="/signup"
                            className="btn-primary text-lg px-10 py-4 inline-block"
                            whileHover={{ scale: 1.05, boxShadow: '0 0 50px rgba(102, 126, 234, 0.5)' }}
                            whileTap={{ scale: 0.95 }}
                        >
                            Get Started Free 🚀
                        </motion.a>
                    </div>
                </motion.div>
            </section>
        </div>
    );
};

/* ─── Step Card ─── */
const StepCard = ({ step, icon, title, description, delay }) => (
    <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay, duration: 0.5 }}
        whileHover={{ y: -6 }}
        className="glass-card p-8 text-center relative"
    >
        {/* Step Number */}
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-sm font-bold shadow-lg shadow-primary/30">
            {step}
        </div>
        {/* Icon */}
        <div className="w-14 h-14 mx-auto mb-5 mt-2 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 border border-white/10 flex items-center justify-center">
            {icon}
        </div>
        <h3 className="text-lg font-bold mb-2">{title}</h3>
        <p className="text-sm text-white/50 leading-relaxed">{description}</p>
    </motion.div>
);

/* ─── Animated Counter ─── */
const useCounter = (end, duration = 2000) => {
    const [count, setCount] = useState(0);
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: '-50px' });

    useEffect(() => {
        if (!isInView) return;
        let start = 0;
        const step = end / (duration / 16);
        const timer = setInterval(() => {
            start += step;
            if (start >= end) {
                setCount(end);
                clearInterval(timer);
            } else {
                setCount(Math.floor(start));
            }
        }, 16);
        return () => clearInterval(timer);
    }, [isInView, end, duration]);

    return { count, ref };
};

const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(num >= 10000 ? 0 : 1) + 'K';
    return num.toString();
};

const AnimatedStatCard = ({ value, prefix = '', suffix = '', label, icon, delay }) => {
    const { count, ref } = useCounter(value);

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay }}
            whileHover={{ scale: 1.05, y: -5 }}
            className="glass-card p-6 text-center"
        >
            <motion.div
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: delay + 0.2, type: 'spring' }}
                className="text-4xl mb-2"
            >
                {icon}
            </motion.div>
            <div className="text-3xl font-bold gradient-text mb-1">
                {prefix}{formatNumber(count)}{suffix}
            </div>
            <div className="text-white/60 text-sm">{label}</div>
        </motion.div>
    );
};

export default Home;
