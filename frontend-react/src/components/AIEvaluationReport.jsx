import { motion } from 'framer-motion';

function normalizeScore(value) {
    if (value == null || Number.isNaN(Number(value))) return null;
    const num = Number(value);
    return num <= 1 ? Number((num * 100).toFixed(1)) : Number(num.toFixed(1));
}

export function buildAiResultFromCampaign(campaign) {
    if (!campaign?.ai_score && campaign?.ai_score !== 0) return null;

    return {
        score: Math.round(normalizeScore(campaign.ai_score)),
        dl_score: normalizeScore(campaign.dl_score),
        xgb_score: normalizeScore(campaign.xgb_score),
        advice: campaign.gemini_advice || '',
        campaignName: campaign.name,
    };
}

export function buildAiResultFromEvaluation(evalResult) {
    if (!evalResult) return null;
    return {
        score: evalResult.score,
        dl_score: evalResult.dl_score,
        xgb_score: evalResult.xgb_score,
        advice: evalResult.advice || '',
        campaignName: evalResult.campaignName,
    };
}

const scoreColor = (value) => {
    const v = value || 0;
    if (v >= 70) return 'text-green-400';
    if (v >= 40) return 'text-yellow-400';
    return 'text-red-400';
};

const AIEvaluationReport = ({ aiResult, showPageHeader = false }) => {
    if (!aiResult) return null;

    return (
        <div>
            {showPageHeader && (
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold mb-4">
                        AI Valuation <span className="gradient-text">Report</span> 🤖
                    </h1>
                    <p className="text-white/60">Comprehensive analysis from our AI models & Gemini Valuator</p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="p-6 text-center rounded-2xl border border-purple-500/30 bg-[#141428]"
                >
                    <div className="text-3xl mb-2">🧠</div>
                    <h3 className="text-sm font-semibold text-purple-400 mb-1">Deep Learning</h3>
                    <p className="text-xs text-white/40 mb-3">NLP & Text Analysis</p>
                    <div className="text-4xl font-bold mb-2">
                        <span className={scoreColor(aiResult.dl_score)}>{aiResult.dl_score?.toFixed(1) ?? '—'}</span>
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

                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="p-6 text-center rounded-2xl border border-blue-500/30 bg-[#141428]"
                >
                    <div className="text-3xl mb-2">📊</div>
                    <h3 className="text-sm font-semibold text-blue-400 mb-1">XGBoost</h3>
                    <p className="text-xs text-white/40 mb-3">Numerical Features</p>
                    <div className="text-4xl font-bold mb-2">
                        <span className={scoreColor(aiResult.xgb_score)}>{aiResult.xgb_score?.toFixed(1) ?? '—'}</span>
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

                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="p-6 text-center rounded-2xl border border-emerald-500/30 bg-[#141428] relative overflow-hidden"
                >
                    <div className="absolute top-2 right-2 text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold">FINAL</div>
                    <div className="text-3xl mb-2">🎯</div>
                    <h3 className="text-sm font-semibold text-emerald-400 mb-1">Meta Ensemble</h3>
                    <p className="text-xs text-white/40 mb-3">Combined Prediction</p>
                    <div className="text-5xl font-bold mb-2">
                        <span className={scoreColor(aiResult.score)}>{aiResult.score}</span>
                        <span className="text-white/30 text-xl">/100</span>
                    </div>
                    <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${aiResult.score}%` }}
                            transition={{ delay: 0.9, duration: 1.5 }}
                            className={`h-full rounded-full ${
                                aiResult.score >= 70 ? 'bg-gradient-to-r from-green-500 to-emerald-400' :
                                aiResult.score >= 40 ? 'bg-gradient-to-r from-yellow-500 to-orange-400' :
                                'bg-gradient-to-r from-red-500 to-pink-400'
                            }`}
                        />
                    </div>
                    <p className="text-xs mt-2 text-white/50">
                        {aiResult.score >= 70 ? '🎉 High chance of success' :
                            aiResult.score >= 40 ? '💡 Moderate — review recommendations' :
                                '⚠️ Needs significant improvement'}
                    </p>
                </motion.div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="p-4 mb-8 flex items-start gap-3 rounded-2xl border border-white/10 bg-[#141428]"
            >
                <span className="text-2xl mt-0.5">ℹ️</span>
                <div className="text-sm text-white/60">
                    <strong className="text-white/80">How scores work:</strong> The Deep Learning model (🧠) analyzes your text and pitch quality using NLP trained on 200K+ campaigns.
                    The XGBoost model (📊) evaluates structural factors like goal, duration, category, and video.
                    The Meta Ensemble (🎯) combines both for the final prediction.
                </div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="p-8 md:p-10 rounded-2xl border border-primary/20 bg-[#141428]"
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
                {aiResult.advice ? (
                    <div className="text-white/85 leading-relaxed text-[15px] whitespace-pre-line
                        [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-8 [&_h2]:mb-4 [&_h2]:text-white [&_h2]:border-b [&_h2]:border-white/10 [&_h2]:pb-2
                        [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mt-6 [&_h3]:mb-3 [&_h3]:text-white/90
                        [&_strong]:text-white [&_strong]:font-semibold
                        [&_li]:ml-4
                        [&_ul]:space-y-1
                    ">
                        {aiResult.advice}
                    </div>
                ) : (
                    <p className="text-white/50 text-sm">No Gemini report was saved for this campaign. Re-evaluate from the campaign editor to generate a new report.</p>
                )}
            </motion.div>
        </div>
    );
};

export default AIEvaluationReport;
