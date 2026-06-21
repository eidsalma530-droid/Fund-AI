import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiZap } from 'react-icons/fi';
import { campaignsAPI } from '../services/api';
import AIEvaluationReport, { buildAiResultFromCampaign } from './AIEvaluationReport';

const AIEvaluationModal = ({ open, onClose, campaign }) => {
    const [fullCampaign, setFullCampaign] = useState(campaign);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!open || !campaign?.id) return;

        setLoading(true);
        campaignsAPI.getOne(campaign.id)
            .then((data) => setFullCampaign(data.campaign || campaign))
            .catch(() => setFullCampaign(campaign))
            .finally(() => setLoading(false));
    }, [open, campaign]);

    const aiResult = buildAiResultFromCampaign(fullCampaign);
    if (!aiResult && !open) return null;

    const modal = (
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 flex items-center justify-center p-4 md:p-6"
                    style={{ zIndex: 9999, backgroundColor: 'rgba(5, 5, 15, 0.97)' }}
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.92, y: 24 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.92, y: 24 }}
                        transition={{ type: 'spring', stiffness: 260, damping: 24 }}
                        className="w-full max-w-4xl max-h-[92vh] overflow-hidden rounded-2xl border border-white/15 bg-[#0f0f23] shadow-[0_24px_80px_rgba(0,0,0,0.85)] flex flex-col isolate"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-start justify-between gap-4 p-6 pb-4 border-b border-white/10 bg-[#0f0f23] shrink-0">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#667eea] to-[#f093fb] flex items-center justify-center shadow-[0_0_20px_rgba(102,126,234,0.45)]">
                                        <FiZap className="text-white" size={18} />
                                    </div>
                                    <span className="text-xs uppercase tracking-wider text-[#a5b4fc] font-semibold">AI Evaluation</span>
                                </div>
                                <h2 className="text-2xl md:text-3xl font-bold">
                                    {fullCampaign?.name || campaign?.name}
                                </h2>
                                <p className="text-white/50 text-sm mt-1">Comprehensive analysis from our AI models & Gemini Valuator</p>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.08, rotate: 90 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={onClose}
                                className="p-2 rounded-xl bg-[#1a1a35] hover:bg-[#252545] text-white/70"
                                aria-label="Close"
                            >
                                <FiX size={20} />
                            </motion.button>
                        </div>

                        <div className="overflow-y-auto flex-1 p-6 pt-4 bg-[#0f0f23]">
                            {loading ? (
                                <div className="flex items-center justify-center py-20">
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                        className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full"
                                    />
                                </div>
                            ) : aiResult ? (
                                <AIEvaluationReport aiResult={aiResult} />
                            ) : (
                                <p className="text-center text-white/50 py-12">No AI evaluation found for this campaign.</p>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );

    if (typeof document === 'undefined') return null;
    return createPortal(modal, document.body);
};

export { buildAiResultFromCampaign };
export default AIEvaluationModal;
