import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiZap, FiTrendingUp, FiShield } from 'react-icons/fi';

const Hero = () => {
    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden">
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        rotate: [0, 180, 360],
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                    className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-3xl"
                />
                <motion.div
                    animate={{
                        scale: [1.2, 1, 1.2],
                        rotate: [360, 180, 0],
                    }}
                    transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
                    className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-br from-secondary/20 to-transparent rounded-full blur-3xl"
                />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
                {/* Badge */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card text-sm text-primary mb-8">
                        <FiZap className="animate-pulse" />
                        Powered by Advanced AI
                    </span>
                </motion.div>

                {/* Main Heading */}
                <motion.h1
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="text-5xl md:text-7xl font-bold mb-6 leading-tight"
                >
                    Fund Your Dreams with{' '}
                    <motion.span
                        className="gradient-text"
                        animate={{
                            backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                        }}
                        transition={{ duration: 5, repeat: Infinity }}
                        style={{ backgroundSize: '200% 200%' }}
                    >
                        AI Intelligence
                    </motion.span>
                </motion.h1>

                {/* Subtitle */}
                <motion.p
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="text-xl text-white/60 max-w-2xl mx-auto mb-10"
                >
                    Launch campaigns backed by machine learning predictions.
                    Get real-time success scores and intelligent recommendations.
                </motion.p>

                {/* CTA Buttons */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
                >
                    <Link to="/signup">
                        <motion.button
                            className="btn-primary text-lg px-8 py-4 flex items-center gap-2 group"
                            whileHover={{ scale: 1.05, boxShadow: '0 0 40px rgba(102, 126, 234, 0.5)' }}
                            whileTap={{ scale: 0.95 }}
                        >
                            Start Your Campaign
                            <motion.span
                                animate={{ x: [0, 5, 0] }}
                                transition={{ duration: 1, repeat: Infinity }}
                            >
                                <FiArrowRight />
                            </motion.span>
                        </motion.button>
                    </Link>
                    <Link to="/campaigns">
                        <motion.button
                            className="btn-secondary text-lg px-8 py-4"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            Browse Campaigns
                        </motion.button>
                    </Link>
                </motion.div>

                {/* Feature Cards */}
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto"
                >
                    <FeatureCard
                        icon={<FiZap className="text-2xl" />}
                        title="AI-Powered Insights"
                        description="Get instant success predictions from our ML models"
                        delay={0.5}
                    />
                    <FeatureCard
                        icon={<FiTrendingUp className="text-2xl" />}
                        title="Smart Analytics"
                        description="Track funding progress with real-time charts"
                        delay={0.6}
                    />
                    <FeatureCard
                        icon={<FiShield className="text-2xl" />}
                        title="Verified Creators"
                        description="Trust our AI-verified campaign system"
                        delay={0.7}
                    />
                </motion.div>
            </div>
        </section>
    );
};

const FeatureCard = ({ icon, title, description, delay }) => (
    <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay }}
        whileHover={{ y: -5, boxShadow: '0 20px 40px rgba(102, 126, 234, 0.2)' }}
        className="glass-card p-6 text-center"
    >
        <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            {icon}
        </div>
        <h3 className="font-bold mb-2">{title}</h3>
        <p className="text-sm text-white/60">{description}</p>
    </motion.div>
);

export default Hero;
