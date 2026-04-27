import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FiZap, FiGithub, FiTwitter, FiLinkedin, FiHeart } from 'react-icons/fi';

const Footer = () => {
    const currentYear = new Date().getFullYear();

    const footerLinks = [
        {
            title: 'Platform',
            links: [
                { label: 'Browse Campaigns', to: '/campaigns' },
                { label: 'Categories', to: '/categories' },
                { label: 'Create Campaign', to: '/create' },
            ],
        },
        {
            title: 'Account',
            links: [
                { label: 'Dashboard', to: '/dashboard' },
                { label: 'Profile', to: '/profile' },
                { label: 'Bookmarks', to: '/bookmarks' },
            ],
        },
        {
            title: 'Resources',
            links: [
                { label: 'How It Works', to: '/#how-it-works' },
                { label: 'AI Scoring', to: '/#stats' },
                { label: 'Sign Up', to: '/signup' },
            ],
        },
    ];

    return (
        <footer className="relative mt-20 border-t border-white/10">
            {/* Subtle gradient glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

            <div className="max-w-7xl mx-auto px-6 pt-16 pb-8">
                {/* Top Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
                    {/* Brand Column */}
                    <div className="col-span-2 md:col-span-1">
                        <Link to="/" className="inline-flex items-center gap-2 mb-4">
                            <div className="w-9 h-9 rounded-lg overflow-hidden">
                                <img src="/LOGO.png" alt="FundAI" className="w-full h-full object-contain" />
                            </div>
                            <span className="text-xl font-bold gradient-text">FundAI</span>
                        </Link>
                        <p className="text-sm text-white/50 leading-relaxed mb-4">
                            AI-powered crowdfunding platform that helps creators launch successful campaigns with machine learning insights.
                        </p>
                        <motion.div
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs text-primary"
                            whileHover={{ scale: 1.05 }}
                        >
                            <FiZap size={12} className="animate-pulse" />
                            Powered by AI
                        </motion.div>
                    </div>

                    {/* Link Columns */}
                    {footerLinks.map((group) => (
                        <div key={group.title}>
                            <h4 className="font-semibold text-white/80 mb-4 text-sm uppercase tracking-wider">
                                {group.title}
                            </h4>
                            <ul className="space-y-2.5">
                                {group.links.map((link) => (
                                    <li key={link.label}>
                                        <Link
                                            to={link.to}
                                            className="text-sm text-white/40 hover:text-white transition-colors duration-200"
                                        >
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Divider */}
                <div className="border-t border-white/5 pt-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        {/* Copyright */}
                        <p className="text-xs text-white/30 flex items-center gap-1">
                            © {currentYear} FundAI. Made with <FiHeart size={12} className="text-red-400" /> and AI
                        </p>

                        {/* Social Icons */}
                        <div className="flex items-center gap-3">
                            {[FiGithub, FiTwitter, FiLinkedin].map((Icon, i) => (
                                <motion.a
                                    key={i}
                                    href="#"
                                    className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-colors"
                                    whileHover={{ scale: 1.1, y: -2 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <Icon size={14} />
                                </motion.a>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
