import { motion } from 'framer-motion';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const RoleSwitchToggle = ({ role, onSwitch, loading, compact = false }) => {
    const isCreator = role === 'creator';
    const targetRole = isCreator ? 'investor' : 'creator';
    const targetLabel = isCreator ? 'Investor' : 'Creator';
    const targetEmoji = isCreator ? '💼' : '🎨';

    const ovalSize = compact ? 'w-[50px] h-[32px]' : 'w-[76px] h-[46px]';
    const arrowSize = compact ? 11 : 14;
    const emojiSize = compact ? 'text-sm' : 'text-lg';

    return (
        <motion.button
            type="button"
            onClick={() => onSwitch(targetRole)}
            disabled={loading}
            whileHover={{ scale: loading ? 1 : 1.03 }}
            whileTap={{ scale: loading ? 1 : 0.97 }}
            className={`group relative flex items-center bg-white/[0.04] border border-white/10 hover:border-primary/40 transition-colors disabled:opacity-60 disabled:cursor-not-allowed overflow-hidden shrink-0 ${
                compact
                    ? 'gap-2 px-2.5 py-1.5 rounded-xl h-[34px]'
                    : 'gap-4 px-4 py-3 rounded-2xl'
            }`}
            aria-label={`Switch to ${targetLabel}`}
        >
            <div className="absolute inset-0 bg-gradient-to-r from-[#667eea]/0 via-[#667eea]/10 to-[#f093fb]/0 opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className={`relative ${ovalSize} shrink-0`}>
                <motion.div
                    className="absolute inset-0 rounded-[50%]"
                    style={{
                        background: 'linear-gradient(135deg, #667eea, #f093fb)',
                        padding: '2px',
                    }}
                    animate={{ rotate: loading ? 360 : 0 }}
                    transition={{
                        rotate: {
                            duration: loading ? 1.2 : 0,
                            repeat: loading ? Infinity : 0,
                            ease: 'linear',
                        },
                    }}
                >
                    <div className="w-full h-full rounded-[50%] bg-[#0f0f23]/95" />
                </motion.div>

                <motion.div
                    className={`absolute rounded-[50%] border border-white/10 ${compact ? 'inset-[4px]' : 'inset-[6px]'}`}
                    animate={{
                        boxShadow: loading
                            ? ['0 0 8px rgba(102,126,234,0.2)', '0 0 18px rgba(240,147,251,0.45)', '0 0 8px rgba(102,126,234,0.2)']
                            : '0 0 12px rgba(102, 126, 234, 0.25)',
                    }}
                    transition={{ duration: loading ? 1.2 : 0.3, repeat: loading ? Infinity : 0 }}
                />

                <motion.div
                    className="absolute inset-0"
                    animate={{ rotate: isCreator ? 0 : 180 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                >
                    <motion.span
                        className={`absolute left-1/2 -translate-x-1/2 text-[#f093fb] ${compact ? 'top-[4px]' : 'top-[7px]'}`}
                        animate={{ x: [0, 2, 0] }}
                        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                    >
                        <FiChevronRight size={arrowSize} strokeWidth={3} />
                    </motion.span>
                    <motion.span
                        className={`absolute left-1/2 -translate-x-1/2 text-[#667eea] ${compact ? 'bottom-[4px]' : 'bottom-[7px]'}`}
                        animate={{ x: [0, -2, 0] }}
                        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
                    >
                        <FiChevronLeft size={arrowSize} strokeWidth={3} />
                    </motion.span>
                </motion.div>

                <motion.div
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    initial={false}
                    animate={{ scale: loading ? [1, 0.85, 1] : 1, opacity: loading ? [1, 0.5, 1] : 1 }}
                    transition={{ duration: 1.2, repeat: loading ? Infinity : 0 }}
                >
                    <span className={emojiSize}>{targetEmoji}</span>
                </motion.div>
            </div>

            <div className="relative text-left min-w-0 whitespace-nowrap">
                <p className={`uppercase tracking-wider text-white/40 ${compact ? 'text-[9px] leading-none mb-0.5' : 'text-[11px] mb-0.5'}`}>
                    {loading ? 'Switching...' : 'Tap to switch'}
                </p>
                <p className={`font-semibold gradient-text ${compact ? 'text-xs leading-tight' : 'text-sm sm:text-base'}`}>
                    Switch to {targetLabel}
                </p>
            </div>
        </motion.button>
    );
};

export default RoleSwitchToggle;
