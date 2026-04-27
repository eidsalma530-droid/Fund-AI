import { useEffect, Component } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { motion } from 'framer-motion';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Campaigns from './pages/Campaigns';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import CreateCampaign from './pages/CreateCampaign';
import CampaignDetail from './pages/CampaignDetail';
import Categories from './pages/Categories';
import Messages from './pages/Messages';
import Profile from './pages/Profile';
import Bookmarks from './pages/Bookmarks';
import SearchResults from './pages/SearchResults';
import EditCampaign from './pages/EditCampaign';
import Analytics from './pages/Analytics';
import Admin from './pages/Admin';
import CompleteProfile from './pages/CompleteProfile';
import Footer from './components/Footer';
import useAuthStore from './store/authStore';

// ============== Error Boundary ==============
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center px-6">
          <div className="glass-card p-12 max-w-lg text-center">
            <div className="text-6xl mb-6">⚠️</div>
            <h1 className="text-2xl font-bold mb-3">Something went wrong</h1>
            <p className="text-white/50 mb-6">
              An unexpected error occurred. Please try refreshing the page.
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.href = '/';
              }}
              className="btn-primary px-8 py-3"
            >
              Go Home
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// ============== 404 Not Found Page ==============
const NotFound = () => (
  <div className="min-h-screen flex items-center justify-center px-6 pt-20">
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-12 max-w-lg text-center"
    >
      <div className="text-8xl font-bold gradient-text mb-4">404</div>
      <h1 className="text-2xl font-bold mb-3">Page Not Found</h1>
      <p className="text-white/50 mb-8">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <div className="flex gap-4 justify-center">
        <Link to="/" className="btn-primary px-6 py-3">
          Go Home
        </Link>
        <Link to="/campaigns" className="btn-secondary px-6 py-3">
          Browse Campaigns
        </Link>
      </div>
    </motion.div>
  </div>
);

// ============== Route Guards ==============

// Protected Route wrapper — redirects to /login if not authenticated
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, sessionVerified } = useAuthStore();

  // While verifying session, show nothing (prevents flash)
  if (!sessionVerified) return null;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Guest Route wrapper — redirects to /dashboard if already authenticated
const GuestRoute = ({ children }) => {
  const { isAuthenticated, sessionVerified } = useAuthStore();

  if (!sessionVerified) return null;

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  const verifySession = useAuthStore((state) => state.verifySession);

  useEffect(() => {
    verifySession();
  }, []);

  return (
    <BrowserRouter>
      {/* Animated Background */}
      <div className="animated-bg" />

      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'rgba(15, 15, 35, 0.9)',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.1)',
            backdropFilter: 'blur(20px)',
          },
          success: {
            iconTheme: { primary: '#10b981', secondary: '#fff' },
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: '#fff' },
          },
        }}
      />

      {/* Navigation */}
      <Navbar />

      {/* Error Boundary wrapping all routes */}
      <ErrorBoundary>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/campaigns" element={<Campaigns />} />
          <Route path="/campaign/:id" element={<CampaignDetail />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/search" element={<SearchResults />} />

          {/* Guest-Only Routes (redirect to dashboard if logged in) */}
          <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
          <Route path="/signup" element={<GuestRoute><Signup /></GuestRoute>} />

          {/* Protected Routes */}
          <Route path="/complete-profile" element={<ProtectedRoute><CompleteProfile /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/create" element={<ProtectedRoute><CreateCampaign /></ProtectedRoute>} />
          <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/profile/:userId" element={<Profile />} />
          <Route path="/bookmarks" element={<ProtectedRoute><Bookmarks /></ProtectedRoute>} />
          <Route path="/edit-campaign/:id" element={<ProtectedRoute><EditCampaign /></ProtectedRoute>} />
          <Route path="/analytics/:id" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />

          {/* Admin Route */}
          <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />

          {/* 404 Catch-All */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </ErrorBoundary>

      {/* Footer */}
      <Footer />
    </BrowserRouter>
  );
}

export default App;
