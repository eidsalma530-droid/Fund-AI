import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { FiMenu, FiX, FiUser, FiLogOut, FiHome, FiGrid, FiPlusCircle, FiMessageSquare, FiBell, FiSearch, FiBookmark, FiLayout } from 'react-icons/fi';
import { notificationsAPI, messagesAPI, searchAPI, SERVER_BASE } from '../services/api';

const Navbar = () => {
    const { user, isAuthenticated, logout } = useAuthStore();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [unreadMessageCount, setUnreadMessageCount] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const searchRef = useRef(null);
    const notifRef = useRef(null);

    useEffect(() => {
        if (isAuthenticated && user?.id) {
            fetchNotifications();
            fetchUnreadMessageCount();
            const interval = setInterval(() => {
                fetchNotifications();
                fetchUnreadMessageCount();
            }, 30000);
            const handleFocus = () => {
                fetchNotifications();
                fetchUnreadMessageCount();
            };
            const handleMessagesUpdated = (e) => {
                setUnreadMessageCount(e.detail?.unread_count ?? 0);
            };
            window.addEventListener('focus', handleFocus);
            window.addEventListener('fundai-messages-updated', handleMessagesUpdated);
            return () => {
                clearInterval(interval);
                window.removeEventListener('focus', handleFocus);
                window.removeEventListener('fundai-messages-updated', handleMessagesUpdated);
            };
        }
    }, [isAuthenticated, user]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (searchRef.current && !searchRef.current.contains(e.target)) {
                setShowSearch(false);
            }
            if (notifRef.current && !notifRef.current.contains(e.target)) {
                setShowNotifications(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchNotifications = async () => {
        try {
            const data = await notificationsAPI.getAll(user.id);
            setNotifications(data.notifications || []);
            setUnreadCount(data.unread_count || 0);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        }
    };

    const fetchUnreadMessageCount = async () => {
        try {
            const data = await messagesAPI.getAll(user.id);
            setUnreadMessageCount(data.unread_count || 0);
        } catch (error) {
            console.error('Failed to fetch unread message count:', error);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await notificationsAPI.markAllRead(user.id);
            setUnreadCount(0);
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        } catch (error) {
            console.error('Failed to mark notifications as read');
        }
    };

    const handleSearch = async (query) => {
        setSearchQuery(query);
        if (!query.trim()) {
            setSearchResults([]);
            return;
        }
        setSearching(true);
        try {
            const data = await searchAPI.search(query);
            setSearchResults(data.campaigns?.slice(0, 5) || []);
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setSearching(false);
        }
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
            setShowSearch(false);
            setSearchQuery('');
        }
    };

    const handleLogoutClick = () => {
        setShowLogoutConfirm(true);
        setIsOpen(false);
    };

    const handleConfirmLogout = () => {
        setShowLogoutConfirm(false);
        logout();
        navigate('/', { replace: true });
    };

    return (
        <motion.nav
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            className="fixed top-0 left-0 right-0 z-50 px-6 py-4"
        >
            <div className="max-w-7xl mx-auto">
                <motion.div
                    className="glass-card px-6 py-3 flex items-center justify-between"
                    whileHover={{ boxShadow: '0 0 30px rgba(102, 126, 234, 0.2)' }}
                >
                    {/* Logo */}
                    <Link to="/">
                        <motion.div
                            className="flex items-center gap-3"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center">
                                <img src="/LOGO.png" alt="FundAI Logo" className="w-full h-full object-contain" />
                            </div>
                            <span className="text-2xl font-bold gradient-text hidden sm:inline">FundAI</span>
                        </motion.div>
                    </Link>

                    {/* Search Bar - Desktop */}
                    <div className="hidden md:block flex-1 max-w-md mx-8" ref={searchRef}>
                        <form onSubmit={handleSearchSubmit} className="relative">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => handleSearch(e.target.value)}
                                onFocus={() => setShowSearch(true)}
                                placeholder="Search campaigns..."
                                className="w-full px-4 py-2 pl-10 rounded-xl bg-white/10 border border-white/10 focus:border-primary/50 focus:outline-none transition-colors"
                            />
                            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />

                            {/* Search Dropdown */}
                            <AnimatePresence>
                                {showSearch && searchQuery && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="absolute top-full left-0 right-0 mt-2 p-2 max-h-80 overflow-y-auto rounded-2xl border border-white/10 shadow-2xl" style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', zIndex: 9999 }}
                                    >
                                        {searching ? (
                                            <div className="p-4 text-center text-white/60">Searching...</div>
                                        ) : searchResults.length === 0 ? (
                                            <div className="p-4 text-center text-white/60">No results found</div>
                                        ) : (
                                            <>
                                                {searchResults.map(campaign => (
                                                    <Link
                                                        key={campaign.id}
                                                        to={`/campaign/${campaign.id}`}
                                                        onClick={() => {
                                                            setShowSearch(false);
                                                            setSearchQuery('');
                                                        }}
                                                        className="block p-3 rounded-lg hover:bg-white/10 transition-colors"
                                                    >
                                                        <p className="font-medium truncate">{campaign.name}</p>
                                                        <p className="text-sm text-white/60 truncate">{campaign.blurb}</p>
                                                    </Link>
                                                ))}
                                                <button
                                                    onClick={handleSearchSubmit}
                                                    className="w-full p-3 text-primary text-sm hover:bg-white/10 rounded-lg"
                                                >
                                                    View all results →
                                                </button>
                                            </>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </form>
                    </div>

                    {/* Desktop Nav + Right Actions */}
                    <div className="hidden md:flex items-center gap-6 shrink-0">
                        <div className="flex items-center gap-4">
                            <NavLink to="/campaigns" icon={<FiGrid />}>Campaigns</NavLink>
                            <NavLink to="/categories" icon={<FiHome />}>Categories</NavLink>
                            {isAuthenticated && user?.role === 'creator' && (
                                <NavLink to="/create" icon={<FiPlusCircle />}>Create</NavLink>
                            )}
                        </div>

                        <div className="flex items-center gap-3 pl-6 border-l border-white/10">
                        {isAuthenticated ? (
                            <>
                                {/* Notifications */}
                                <div className="relative" ref={notifRef}>
                                    <NavIconTooltip label="Notifications">
                                        <motion.button
                                            onClick={() => setShowNotifications(!showNotifications)}
                                            className="relative p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            aria-label="Notifications"
                                        >
                                            <FiBell />
                                            {unreadCount > 0 && (
                                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center">
                                                    {unreadCount > 9 ? '9+' : unreadCount}
                                                </span>
                                            )}
                                        </motion.button>
                                    </NavIconTooltip>

                                    {/* Notifications Dropdown */}
                                    <AnimatePresence>
                                        {showNotifications && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                                className="absolute top-full right-0 mt-2 w-80 p-2 max-h-96 overflow-y-auto rounded-2xl border border-white/10 shadow-2xl" style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', zIndex: 9999 }}
                                            >
                                                <div className="flex items-center justify-between p-2 border-b border-white/10">
                                                    <span className="font-bold">Notifications</span>
                                                    {unreadCount > 0 && (
                                                        <button
                                                            onClick={handleMarkAllRead}
                                                            className="text-xs text-primary hover:underline"
                                                        >
                                                            Mark all read
                                                        </button>
                                                    )}
                                                </div>
                                                {notifications.length === 0 ? (
                                                    <div className="p-4 text-center text-white/60">
                                                        <span className="text-2xl block mb-2">🔔</span>
                                                        No notifications
                                                    </div>
                                                ) : (
                                                    notifications.slice(0, 10).map(notif => (
                                                        <Link
                                                            key={notif.id}
                                                            to={notif.link || '#'}
                                                            onClick={() => setShowNotifications(false)}
                                                            className={`block p-3 rounded-lg transition-colors ${notif.is_read ? 'hover:bg-white/5' : 'bg-primary/10 hover:bg-primary/20'
                                                                }`}
                                                        >
                                                            <p className="font-medium text-sm">{notif.title}</p>
                                                            <p className="text-xs text-white/60 truncate">{notif.message}</p>
                                                            <p className="text-xs text-white/40 mt-1">
                                                                {new Date(notif.created_at).toLocaleDateString()}
                                                            </p>
                                                        </Link>
                                                    ))
                                                )}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Messages */}
                                <NavIconTooltip label="Messages">
                                    <Link to="/messages" aria-label="Messages" onClick={fetchUnreadMessageCount}>
                                        <motion.button
                                            className="relative p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            <FiMessageSquare />
                                            {unreadMessageCount > 0 && (
                                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center">
                                                    {unreadMessageCount > 9 ? '9+' : unreadMessageCount}
                                                </span>
                                            )}
                                        </motion.button>
                                    </Link>
                                </NavIconTooltip>

                                {/* Bookmarks */}
                                <NavIconTooltip label="Saved">
                                    <Link to="/bookmarks" aria-label="Saved">
                                        <motion.button
                                            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            <FiBookmark />
                                        </motion.button>
                                    </Link>
                                </NavIconTooltip>

                                {/* Dashboard */}
                                <NavIconTooltip label="Dashboard">
                                    <Link to="/dashboard" aria-label="Dashboard">
                                        <motion.button
                                            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            <FiLayout />
                                        </motion.button>
                                    </Link>
                                </NavIconTooltip>

                                {/* Profile */}
                                <NavIconTooltip label="Profile">
                                    <Link to="/profile" aria-label="Profile">
                                        <motion.div
                                            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-xs overflow-hidden">
                                                {user?.avatar ? (
                                                    <img src={`${SERVER_BASE}/uploads/avatars/${user.avatar}`} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    user?.name?.[0] || <FiUser />
                                                )}
                                            </div>
                                            <span className="hidden lg:inline">{user?.name?.split(' ')[0] || 'Profile'}</span>
                                        </motion.div>
                                    </Link>
                                </NavIconTooltip>

                                <NavIconTooltip label="Log Out">
                                    <motion.button
                                        onClick={handleLogoutClick}
                                        className="p-2 rounded-xl text-red-400 hover:bg-red-500/20 transition-colors"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        aria-label="Log Out"
                                    >
                                        <FiLogOut />
                                    </motion.button>
                                </NavIconTooltip>
                            </>
                        ) : (
                            <>
                                <Link to="/login">
                                    <motion.button
                                        className="btn-secondary text-sm"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        Log In
                                    </motion.button>
                                </Link>
                                <Link to="/signup">
                                    <motion.button
                                        className="btn-primary text-sm"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        Sign Up
                                    </motion.button>
                                </Link>
                            </>
                        )}
                        </div>
                    </div>

                    {/* Mobile Menu Button */}
                    <motion.button
                        className="md:hidden text-2xl"
                        onClick={() => setIsOpen(!isOpen)}
                        whileTap={{ scale: 0.9 }}
                    >
                        {isOpen ? <FiX /> : <FiMenu />}
                    </motion.button>
                </motion.div>

                {/* Mobile Menu */}
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="md:hidden overflow-hidden"
                        >
                            <div className="glass-card mt-2 p-4 flex flex-col gap-3">
                                {/* Mobile Search */}
                                <form onSubmit={handleSearchSubmit} className="relative mb-2">
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search campaigns..."
                                        className="w-full px-4 py-2 pl-10 rounded-xl bg-white/10 border border-white/10"
                                    />
                                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                                </form>

                                <MobileNavLink to="/campaigns" onClick={() => setIsOpen(false)}>Campaigns</MobileNavLink>
                                <MobileNavLink to="/categories" onClick={() => setIsOpen(false)}>Categories</MobileNavLink>
                                {isAuthenticated ? (
                                    <>
                                        {user?.role === 'creator' && (
                                            <MobileNavLink to="/create" onClick={() => setIsOpen(false)}>Create Campaign</MobileNavLink>
                                        )}
                                        <MobileNavLink to="/dashboard" onClick={() => setIsOpen(false)}>Dashboard</MobileNavLink>
                                        <MobileNavLink to="/messages" onClick={() => { setIsOpen(false); fetchUnreadMessageCount(); }}>
                                            <span className="flex items-center gap-2">
                                                Messages
                                                {unreadMessageCount > 0 && (
                                                    <span className="min-w-5 h-5 px-1 bg-red-500 rounded-full text-xs flex items-center justify-center">
                                                        {unreadMessageCount > 9 ? '9+' : unreadMessageCount}
                                                    </span>
                                                )}
                                            </span>
                                        </MobileNavLink>
                                        <MobileNavLink to="/bookmarks" onClick={() => setIsOpen(false)}>Saved Campaigns</MobileNavLink>
                                        <MobileNavLink to="/profile" onClick={() => setIsOpen(false)}>My Profile</MobileNavLink>
                                        {user?.is_admin && (
                                            <MobileNavLink to="/admin" onClick={() => setIsOpen(false)}>Admin Panel</MobileNavLink>
                                        )}
                                        <button onClick={handleLogoutClick} className="text-red-400 text-left py-2">
                                            Log Out
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <MobileNavLink to="/login" onClick={() => setIsOpen(false)}>Log In</MobileNavLink>
                                        <MobileNavLink to="/signup" onClick={() => setIsOpen(false)}>Sign Up</MobileNavLink>
                                    </>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Logout Confirmation Modal */}
            <AnimatePresence>
                {showLogoutConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-6"
                        onClick={() => setShowLogoutConfirm(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 50 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 50 }}
                            className="glass-card p-8 max-w-md w-full text-center"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center">
                                <FiLogOut className="text-3xl text-red-400" />
                            </div>
                            <h2 className="text-2xl font-bold mb-2">Log Out</h2>
                            <p className="text-white/60 mb-8">Are you sure you want to log out?</p>
                            <div className="flex gap-3">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setShowLogoutConfirm(false)}
                                    className="btn-secondary flex-1"
                                >
                                    Cancel
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleConfirmLogout}
                                    className="flex-1 px-6 py-3 rounded-xl font-semibold bg-red-500 hover:bg-red-600 text-white transition-colors"
                                >
                                    Log Out
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.nav>
    );
};

const NavIconTooltip = ({ label, children }) => (
    <div className="relative group">
        {children}
        <span
            role="tooltip"
            className="pointer-events-none absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-white/90 bg-[#12122a] border border-white/15 shadow-[0_8px_24px_rgba(0,0,0,0.45)] opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 group-focus-within:opacity-100 group-focus-within:scale-100 transition-all duration-200 whitespace-nowrap z-[60]"
        >
            {label}
        </span>
    </div>
);

const NavLink = ({ to, children, icon }) => (
    <Link to={to}>
        <motion.div
            className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
        >
            {icon}
            <span>{children}</span>
        </motion.div>
    </Link>
);

const MobileNavLink = ({ to, children, onClick }) => (
    <Link to={to} onClick={onClick} className="text-white/70 hover:text-white py-2 transition-colors">
        {children}
    </Link>
);

export default Navbar;
