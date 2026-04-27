import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiInbox, FiSend, FiEdit, FiX, FiSearch, FiCornerUpLeft } from 'react-icons/fi';
import useAuthStore from '../store/authStore';
import { Link, useSearchParams } from 'react-router-dom';
import { messagesAPI, searchAPI, SERVER_BASE } from '../services/api';
import toast from 'react-hot-toast';

const Messages = () => {
    const { user, isAuthenticated } = useAuthStore();
    const [searchParams] = useSearchParams();
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('inbox');
    const [showCompose, setShowCompose] = useState(false);
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [composeData, setComposeData] = useState({ recipient_id: '', recipient_name: '', subject: '', content: '' });
    const [sending, setSending] = useState(false);
    const [userSearch, setUserSearch] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);

    useEffect(() => {
        if (isAuthenticated && user?.id) fetchMessages();
    }, [isAuthenticated, user]);

    // Auto-open compose if URL has ?to= param (from campaign comment message button)
    useEffect(() => {
        const toId = searchParams.get('to');
        const subject = searchParams.get('subject');
        if (toId) {
            setComposeData(prev => ({ ...prev, recipient_id: toId, recipient_name: `User #${toId}`, subject: subject || '' }));
            setShowCompose(true);
        }
    }, [searchParams]);

    const fetchMessages = async () => {
        try {
            const data = await messagesAPI.getAll(user.id);
            setMessages(data.messages || []);
        } catch (error) {
            console.error('Failed to fetch messages:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkRead = async (messageId) => {
        try {
            await messagesAPI.markRead(messageId);
            setMessages(prev => prev.map(m => m.id === messageId ? { ...m, is_read: true } : m));
        } catch (error) {
            console.error('Failed to mark message as read');
        }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!composeData.recipient_id || !composeData.subject || !composeData.content) {
            toast.error('Please fill all fields');
            return;
        }
        setSending(true);
        try {
            await messagesAPI.send({
                sender_id: user.id,
                recipient_id: parseInt(composeData.recipient_id),
                subject: composeData.subject,
                content: composeData.content,
            });
            toast.success('Message sent! ✉️');
            setShowCompose(false);
            setComposeData({ recipient_id: '', recipient_name: '', subject: '', content: '' });
            setUserSearch('');
            setSearchResults([]);
            fetchMessages();
        } catch (error) {
            toast.error(error.message || 'Failed to send message');
        } finally {
            setSending(false);
        }
    };

    // Search users by name
    const handleUserSearch = async (query) => {
        setUserSearch(query);
        if (query.length < 2) { setSearchResults([]); return; }
        setSearchLoading(true);
        try {
            const data = await searchAPI.search(query, { type: 'users' });
            const users = (data.users || data.results || []).filter(u => u.id !== user?.id);
            setSearchResults(users.slice(0, 5));
        } catch {
            setSearchResults([]);
        } finally {
            setSearchLoading(false);
        }
    };

    const handleReply = (message) => {
        setSelectedMessage(null);
        setComposeData({
            recipient_id: message.sender_id === user.id ? message.recipient_id : message.sender_id,
            recipient_name: message.sender_id === user.id ? message.recipient_name : message.sender_name,
            subject: message.subject.startsWith('Re:') ? message.subject : `Re: ${message.subject}`,
            content: '',
        });
        setShowCompose(true);
    };

    const inboxMessages = messages.filter(m => m.recipient_id === user?.id);
    const sentMessages = messages.filter(m => m.sender_id === user?.id);
    const displayMessages = activeTab === 'inbox' ? inboxMessages : sentMessages;
    const unreadCount = inboxMessages.filter(m => !m.is_read).length;

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen pt-24 px-6 flex items-center justify-center">
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center glass-card p-12">
                    <div className="text-6xl mb-4">🔒</div>
                    <h2 className="text-2xl font-bold mb-4">Login Required</h2>
                    <Link to="/login"><motion.button whileHover={{ scale: 1.05 }} className="btn-primary">Log In</motion.button></Link>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-24 px-6 pb-12">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-4xl font-bold"><span className="gradient-text">Messages</span> 💬</h1>
                        {unreadCount > 0 && <p className="text-white/60 mt-1">{unreadCount} unread</p>}
                    </div>
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setShowCompose(true)} className="btn-primary flex items-center gap-2">
                        <FiEdit /> Compose
                    </motion.button>
                </motion.div>

                {/* Tabs */}
                <div className="flex gap-4 mb-6">
                    <button onClick={() => setActiveTab('inbox')} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-colors ${activeTab === 'inbox' ? 'bg-primary/20 text-primary' : 'text-white/60 hover:bg-white/10'}`}>
                        <FiInbox /> Inbox {unreadCount > 0 && <span className="px-2 py-0.5 rounded-full bg-primary text-white text-xs">{unreadCount}</span>}
                    </button>
                    <button onClick={() => setActiveTab('sent')} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-colors ${activeTab === 'sent' ? 'bg-primary/20 text-primary' : 'text-white/60 hover:bg-white/10'}`}>
                        <FiSend /> Sent
                    </button>
                </div>

                {/* Messages List */}
                {loading ? (
                    <div className="space-y-4">{[1, 2, 3].map(i => <div key={i} className="h-20 bg-white/5 rounded-xl animate-pulse" />)}</div>
                ) : displayMessages.length === 0 ? (
                    <div className="glass-card p-12 text-center">
                        <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 2, repeat: Infinity }} className="text-6xl mb-4">📭</motion.div>
                        <h3 className="text-xl font-bold mb-2">No messages</h3>
                        <p className="text-white/60">{activeTab === 'inbox' ? "When someone messages you, they'll appear here" : "Messages you send will appear here"}</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {displayMessages.map((message, index) => (
                            <motion.div
                                key={message.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                onClick={() => { setSelectedMessage(message); if (!message.is_read && activeTab === 'inbox') handleMarkRead(message.id); }}
                                className={`glass-card p-4 cursor-pointer hover:border-primary/50 border transition-colors ${!message.is_read && activeTab === 'inbox' ? 'border-primary/30 bg-primary/5' : 'border-transparent'}`}
                            >
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0">
                                        {activeTab === 'inbox' ? (message.sender_name?.[0] || '?') : (message.recipient_name?.[0] || '?')}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="font-medium truncate">{activeTab === 'inbox' ? message.sender_name : message.recipient_name}</p>
                                            <span className="text-xs text-white/40 whitespace-nowrap">{new Date(message.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <p className="font-semibold text-sm truncate">{message.subject}</p>
                                        <p className="text-sm text-white/60 truncate">{message.content}</p>
                                    </div>
                                    {!message.is_read && activeTab === 'inbox' && <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Compose Modal */}
            <AnimatePresence>
                {showCompose && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-6" onClick={() => setShowCompose(false)}>
                        <motion.div initial={{ scale: 0.9, y: 50 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 50 }} className="glass-card p-8 max-w-lg w-full" onClick={e => e.stopPropagation()}>
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold">New Message</h2>
                                <button onClick={() => setShowCompose(false)} className="text-white/60 hover:text-white"><FiX size={24} /></button>
                            </div>

                            <form onSubmit={handleSend} className="space-y-4">
                                {/* User search / recipient */}
                                <div>
                                    <label className="block text-sm font-medium mb-2">To</label>
                                    {composeData.recipient_id ? (
                                        <div className="flex items-center gap-2 p-3 bg-white/5 rounded-xl border border-white/10">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-sm">
                                                {composeData.recipient_name?.[0] || '?'}
                                            </div>
                                            <span className="flex-1 font-medium">{composeData.recipient_name}</span>
                                            <button type="button" onClick={() => { setComposeData(prev => ({ ...prev, recipient_id: '', recipient_name: '' })); setUserSearch(''); }} className="text-white/40 hover:text-white">
                                                <FiX size={16} />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="relative">
                                            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                                            <input
                                                type="text"
                                                value={userSearch}
                                                onChange={(e) => handleUserSearch(e.target.value)}
                                                className="input-field pl-10"
                                                placeholder="Search users by name..."
                                            />
                                            {searchResults.length > 0 && (
                                                <div className="absolute top-full left-0 right-0 mt-1 bg-[#1a1a2e] border border-white/10 rounded-xl overflow-hidden z-10 max-h-48 overflow-y-auto">
                                                    {searchResults.map(u => (
                                                        <button
                                                            key={u.id}
                                                            type="button"
                                                            onClick={() => {
                                                                setComposeData(prev => ({ ...prev, recipient_id: u.id, recipient_name: u.name }));
                                                                setUserSearch('');
                                                                setSearchResults([]);
                                                            }}
                                                            className="w-full flex items-center gap-3 p-3 hover:bg-white/10 transition-colors text-left"
                                                        >
                                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-sm flex-shrink-0">
                                                                {u.avatar ? <img src={`${SERVER_BASE}/uploads/avatars/${u.avatar}`} alt="" className="w-full h-full rounded-full object-cover" /> : u.name?.[0]}
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-sm">{u.name}</p>
                                                                <p className="text-xs text-white/40">{u.role || u.email}</p>
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                            {searchLoading && <div className="absolute top-full left-0 right-0 mt-1 p-3 bg-[#1a1a2e] border border-white/10 rounded-xl text-center text-sm text-white/40">Searching...</div>}
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Subject</label>
                                    <input type="text" value={composeData.subject} onChange={(e) => setComposeData(prev => ({ ...prev, subject: e.target.value }))} className="input-field" placeholder="Message subject" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Message</label>
                                    <textarea value={composeData.content} onChange={(e) => setComposeData(prev => ({ ...prev, content: e.target.value }))} className="input-field resize-none" rows={5} placeholder="Write your message..." required />
                                </div>
                                <motion.button type="submit" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} disabled={sending} className="btn-primary w-full flex items-center justify-center gap-2">
                                    {sending ? 'Sending...' : <><FiSend /> Send Message</>}
                                </motion.button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Message Detail Modal */}
            <AnimatePresence>
                {selectedMessage && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-6" onClick={() => setSelectedMessage(null)}>
                        <motion.div initial={{ scale: 0.9, y: 50 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 50 }} className="glass-card p-8 max-w-lg w-full" onClick={e => e.stopPropagation()}>
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h2 className="text-xl font-bold">{selectedMessage.subject}</h2>
                                    <p className="text-sm text-white/60">
                                        {selectedMessage.sender_id === user.id ? `To: ${selectedMessage.recipient_name}` : `From: ${selectedMessage.sender_name}`} • {new Date(selectedMessage.created_at).toLocaleString()}
                                    </p>
                                </div>
                                <button onClick={() => setSelectedMessage(null)} className="text-white/60 hover:text-white"><FiX size={24} /></button>
                            </div>
                            <div className="p-4 bg-white/5 rounded-xl mb-4">
                                <p className="text-white/80 whitespace-pre-line">{selectedMessage.content}</p>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleReply(selectedMessage)}
                                className="btn-primary w-full flex items-center justify-center gap-2"
                            >
                                <FiCornerUpLeft /> Reply
                            </motion.button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Messages;
