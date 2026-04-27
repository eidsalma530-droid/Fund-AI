import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FiSave, FiPlus, FiTrash2, FiImage, FiUsers, FiHelpCircle, FiGift, FiTarget } from 'react-icons/fi';
import { campaignsAPI, rewardsAPI, faqsAPI, teamAPI, milestonesAPI, getCategories } from '../services/api';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

const EditCampaign = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('details');
    const [categories, setCategories] = useState([]);

    const [campaign, setCampaign] = useState({
        name: '',
        blurb: '',
        description: '',
        main_category: '',
        usd_goal: '',
        duration_days: 30,
    });
    const [rewards, setRewards] = useState([]);
    const [faqs, setFaqs] = useState([]);
    const [team, setTeam] = useState([]);
    const [milestones, setMilestones] = useState([]);

    const [newReward, setNewReward] = useState({ title: '', description: '', min_amount: '' });
    const [newFaq, setNewFaq] = useState({ question: '', answer: '' });
    const [newTeamMember, setNewTeamMember] = useState({ name: '', role: '', email: '' });
    const [newMilestone, setNewMilestone] = useState({ title: '', description: '', target_amount: '' });

    useEffect(() => {
        if (isAuthenticated) {
            fetchData();
        }
    }, [id, isAuthenticated]);

    const fetchData = async () => {
        try {
            const [campaignData, rewardsData, faqsData, teamData, milestonesData, categoriesData] = await Promise.all([
                campaignsAPI.getOne(id),
                rewardsAPI.getAll(id),
                faqsAPI.getAll(id),
                teamAPI.getAll(id),
                milestonesAPI.getAll(id),
                getCategories(),
            ]);
            setCampaign(campaignData.campaign);
            setRewards(rewardsData.rewards || []);
            setFaqs(faqsData.faqs || []);
            setTeam(teamData.team_members || []);
            setMilestones(milestonesData.milestones || []);
            setCategories(categoriesData.categories || []);
        } catch (error) {
            console.error('Failed to fetch campaign:', error);
            toast.error('Failed to load campaign');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await campaignsAPI.update(id, {
                name: campaign.name,
                blurb: campaign.blurb,
                description: campaign.description,
                main_category: campaign.main_category,
                usd_goal: parseFloat(campaign.usd_goal),
                duration_days: parseInt(campaign.duration_days),
            });
            toast.success('Campaign updated!');
        } catch (error) {
            toast.error(error.message || 'Failed to update campaign');
        } finally {
            setSaving(false);
        }
    };

    const handleAddReward = async () => {
        if (!newReward.title || !newReward.min_amount) {
            toast.error('Please fill required fields');
            return;
        }
        try {
            await rewardsAPI.create(id, {
                ...newReward,
                min_amount: parseFloat(newReward.min_amount),
            });
            toast.success('Reward added!');
            setNewReward({ title: '', description: '', min_amount: '' });
            const data = await rewardsAPI.getAll(id);
            setRewards(data.rewards || []);
        } catch (error) {
            toast.error('Failed to add reward');
        }
    };

    const handleAddFaq = async () => {
        if (!newFaq.question || !newFaq.answer) {
            toast.error('Please fill both question and answer');
            return;
        }
        try {
            await faqsAPI.create(id, newFaq);
            toast.success('FAQ added!');
            setNewFaq({ question: '', answer: '' });
            const data = await faqsAPI.getAll(id);
            setFaqs(data.faqs || []);
        } catch (error) {
            toast.error('Failed to add FAQ');
        }
    };

    const handleDeleteFaq = async (faqId) => {
        try {
            await faqsAPI.delete(faqId);
            setFaqs(prev => prev.filter(f => f.id !== faqId));
            toast.success('FAQ deleted');
        } catch (error) {
            toast.error('Failed to delete FAQ');
        }
    };

    const handleAddTeamMember = async () => {
        if (!newTeamMember.name || !newTeamMember.role) {
            toast.error('Please fill required fields');
            return;
        }
        try {
            await teamAPI.add(id, newTeamMember);
            toast.success('Team member added!');
            setNewTeamMember({ name: '', role: '', email: '' });
            const data = await teamAPI.getAll(id);
            setTeam(data.team_members || []);
        } catch (error) {
            toast.error('Failed to add team member');
        }
    };

    const handleRemoveTeamMember = async (memberId) => {
        try {
            await teamAPI.remove(memberId);
            setTeam(prev => prev.filter(m => m.id !== memberId));
            toast.success('Team member removed');
        } catch (error) {
            toast.error('Failed to remove team member');
        }
    };

    const handleAddMilestone = async () => {
        if (!newMilestone.title || !newMilestone.target_amount) {
            toast.error('Please fill required fields');
            return;
        }
        try {
            await milestonesAPI.create(id, {
                ...newMilestone,
                target_amount: parseFloat(newMilestone.target_amount),
            });
            toast.success('Milestone added!');
            setNewMilestone({ title: '', description: '', target_amount: '' });
            const data = await milestonesAPI.getAll(id);
            setMilestones(data.milestones || []);
        } catch (error) {
            toast.error('Failed to add milestone');
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

    if (loading) {
        return (
            <div className="min-h-screen pt-24 px-6 flex items-center justify-center">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full"
                />
            </div>
        );
    }

    const tabs = [
        { id: 'details', label: 'Details', icon: FiImage },
        { id: 'rewards', label: 'Rewards', icon: FiGift },
        { id: 'faqs', label: 'FAQs', icon: FiHelpCircle },
        { id: 'team', label: 'Team', icon: FiUsers },
        { id: 'milestones', label: 'Milestones', icon: FiTarget },
    ];

    return (
        <div className="min-h-screen pt-24 px-6 pb-12">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between mb-8"
                >
                    <div>
                        <h1 className="text-3xl font-bold">Edit Campaign</h1>
                        <p className="text-white/60">{campaign.name}</p>
                    </div>
                    <div className="flex gap-3">
                        <Link to={`/campaign/${id}`}>
                            <motion.button whileHover={{ scale: 1.05 }} className="btn-secondary">
                                View Campaign
                            </motion.button>
                        </Link>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleSave}
                            disabled={saving}
                            className="btn-primary flex items-center gap-2"
                        >
                            <FiSave /> {saving ? 'Saving...' : 'Save Changes'}
                        </motion.button>
                    </div>
                </motion.div>

                {/* Tabs */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-2 mb-6 overflow-x-auto pb-2"
                >
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-colors ${activeTab === tab.id ? 'bg-primary text-white' : 'bg-white/10 hover:bg-white/20'
                                }`}
                        >
                            <tab.icon size={16} /> {tab.label}
                        </button>
                    ))}
                </motion.div>

                {/* Tab Content */}
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card p-6"
                >
                    {activeTab === 'details' && (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium mb-2">Campaign Name</label>
                                <input
                                    type="text"
                                    value={campaign.name || ''}
                                    onChange={(e) => setCampaign(prev => ({ ...prev, name: e.target.value }))}
                                    className="input-field"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Blurb (Short Description)</label>
                                <input
                                    type="text"
                                    value={campaign.blurb || ''}
                                    onChange={(e) => setCampaign(prev => ({ ...prev, blurb: e.target.value }))}
                                    className="input-field"
                                    maxLength={150}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Full Description</label>
                                <textarea
                                    value={campaign.description || ''}
                                    onChange={(e) => setCampaign(prev => ({ ...prev, description: e.target.value }))}
                                    className="input-field resize-none"
                                    rows={6}
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Category</label>
                                    <select
                                        value={campaign.main_category || ''}
                                        onChange={(e) => setCampaign(prev => ({ ...prev, main_category: e.target.value }))}
                                        className="input-field"
                                    >
                                        {categories.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Goal ($)</label>
                                    <input
                                        type="number"
                                        value={campaign.usd_goal || ''}
                                        onChange={(e) => setCampaign(prev => ({ ...prev, usd_goal: e.target.value }))}
                                        className="input-field"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'rewards' && (
                        <div>
                            <h3 className="text-xl font-bold mb-4">Reward Tiers</h3>
                            <div className="space-y-4 mb-6">
                                {rewards.map(reward => (
                                    <div key={reward.id} className="p-4 bg-white/5 rounded-xl">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <span className="text-primary font-bold">${reward.min_amount}+</span>
                                                <h4 className="font-bold">{reward.title}</h4>
                                                <p className="text-sm text-white/60">{reward.description}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="border-t border-white/10 pt-6">
                                <h4 className="font-bold mb-4">Add New Reward</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <input
                                        type="text"
                                        placeholder="Reward Title"
                                        value={newReward.title}
                                        onChange={(e) => setNewReward(prev => ({ ...prev, title: e.target.value }))}
                                        className="input-field"
                                    />
                                    <input
                                        type="number"
                                        placeholder="Minimum Amount ($)"
                                        value={newReward.min_amount}
                                        onChange={(e) => setNewReward(prev => ({ ...prev, min_amount: e.target.value }))}
                                        className="input-field"
                                    />
                                </div>
                                <textarea
                                    placeholder="Reward Description"
                                    value={newReward.description}
                                    onChange={(e) => setNewReward(prev => ({ ...prev, description: e.target.value }))}
                                    className="input-field resize-none mb-4"
                                    rows={2}
                                />
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    onClick={handleAddReward}
                                    className="btn-primary flex items-center gap-2"
                                >
                                    <FiPlus /> Add Reward
                                </motion.button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'faqs' && (
                        <div>
                            <h3 className="text-xl font-bold mb-4">Frequently Asked Questions</h3>
                            <div className="space-y-4 mb-6">
                                {faqs.map(faq => (
                                    <div key={faq.id} className="p-4 bg-white/5 rounded-xl">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="font-bold">Q: {faq.question}</h4>
                                                <p className="text-white/60">A: {faq.answer}</p>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteFaq(faq.id)}
                                                className="text-red-400 hover:text-red-300 p-1"
                                            >
                                                <FiTrash2 />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="border-t border-white/10 pt-6">
                                <h4 className="font-bold mb-4">Add New FAQ</h4>
                                <input
                                    type="text"
                                    placeholder="Question"
                                    value={newFaq.question}
                                    onChange={(e) => setNewFaq(prev => ({ ...prev, question: e.target.value }))}
                                    className="input-field mb-4"
                                />
                                <textarea
                                    placeholder="Answer"
                                    value={newFaq.answer}
                                    onChange={(e) => setNewFaq(prev => ({ ...prev, answer: e.target.value }))}
                                    className="input-field resize-none mb-4"
                                    rows={3}
                                />
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    onClick={handleAddFaq}
                                    className="btn-primary flex items-center gap-2"
                                >
                                    <FiPlus /> Add FAQ
                                </motion.button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'team' && (
                        <div>
                            <h3 className="text-xl font-bold mb-4">Team Members</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                {team.map(member => (
                                    <div key={member.id} className="p-4 bg-white/5 rounded-xl flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                                                {member.name?.[0] || '?'}
                                            </div>
                                            <div>
                                                <p className="font-bold">{member.name}</p>
                                                <p className="text-sm text-white/60">{member.role}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleRemoveTeamMember(member.id)}
                                            className="text-red-400 hover:text-red-300 p-1"
                                        >
                                            <FiTrash2 />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <div className="border-t border-white/10 pt-6">
                                <h4 className="font-bold mb-4">Add Team Member</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                    <input
                                        type="text"
                                        placeholder="Name"
                                        value={newTeamMember.name}
                                        onChange={(e) => setNewTeamMember(prev => ({ ...prev, name: e.target.value }))}
                                        className="input-field"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Role"
                                        value={newTeamMember.role}
                                        onChange={(e) => setNewTeamMember(prev => ({ ...prev, role: e.target.value }))}
                                        className="input-field"
                                    />
                                    <input
                                        type="email"
                                        placeholder="Email (optional)"
                                        value={newTeamMember.email}
                                        onChange={(e) => setNewTeamMember(prev => ({ ...prev, email: e.target.value }))}
                                        className="input-field"
                                    />
                                </div>
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    onClick={handleAddTeamMember}
                                    className="btn-primary flex items-center gap-2"
                                >
                                    <FiPlus /> Add Team Member
                                </motion.button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'milestones' && (
                        <div>
                            <h3 className="text-xl font-bold mb-4">Stretch Goals / Milestones</h3>
                            <div className="space-y-4 mb-6">
                                {milestones.map(milestone => (
                                    <div key={milestone.id} className={`p-4 rounded-xl ${milestone.is_reached ? 'bg-green-500/20 border border-green-500/50' : 'bg-white/5'}`}>
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <h4 className="font-bold">{milestone.title}</h4>
                                                <p className="text-sm text-white/60">{milestone.description}</p>
                                            </div>
                                            <span className="text-primary font-bold">${milestone.target_amount?.toLocaleString()}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="border-t border-white/10 pt-6">
                                <h4 className="font-bold mb-4">Add Milestone</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <input
                                        type="text"
                                        placeholder="Milestone Title"
                                        value={newMilestone.title}
                                        onChange={(e) => setNewMilestone(prev => ({ ...prev, title: e.target.value }))}
                                        className="input-field"
                                    />
                                    <input
                                        type="number"
                                        placeholder="Target Amount ($)"
                                        value={newMilestone.target_amount}
                                        onChange={(e) => setNewMilestone(prev => ({ ...prev, target_amount: e.target.value }))}
                                        className="input-field"
                                    />
                                </div>
                                <textarea
                                    placeholder="Description"
                                    value={newMilestone.description}
                                    onChange={(e) => setNewMilestone(prev => ({ ...prev, description: e.target.value }))}
                                    className="input-field resize-none mb-4"
                                    rows={2}
                                />
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    onClick={handleAddMilestone}
                                    className="btn-primary flex items-center gap-2"
                                >
                                    <FiPlus /> Add Milestone
                                </motion.button>
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
};

export default EditCampaign;
