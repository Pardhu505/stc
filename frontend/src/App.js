import React, { useState, useEffect, createContext, useContext } from "react";
import "./App.css";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Theme Context
const ThemeContext = createContext();

const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : false;
  });

  useEffect(() => {
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Auth Context
const AuthContext = createContext();

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      getCurrentUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const getCurrentUser = async () => {
    try {
      const response = await axios.get(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data);
    } catch (error) {
      localStorage.removeItem('token');
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API}/auth/login`, { email, password });
      const { access_token, user: userData } = response.data;
      
      localStorage.setItem('token', access_token);
      setToken(access_token);
      setUser(userData);
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Login failed' 
      };
    }
  };

  const signup = async (name, email, password, role, department = '', team = '') => {
    try {
      const response = await axios.post(`${API}/auth/signup`, { 
        name, 
        email, 
        password, 
        role, 
        department, 
        team 
      });
      const { access_token, user: userData } = response.data;
      
      localStorage.setItem('token', access_token);
      setToken(access_token);
      setUser(userData);
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Signup failed' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, loading, token }}>
      {children}
    </AuthContext.Provider>
  );
};

// Page transition variants
const pageVariants = {
  initial: {
    opacity: 0,
    x: 100,
    scale: 0.95
  },
  in: {
    opacity: 1,
    x: 0,
    scale: 1
  },
  out: {
    opacity: 0,
    x: -100,
    scale: 0.95
  }
};

const pageTransition = {
  type: 'tween',
  ease: 'anticipate',
  duration: 0.5
};

// Footer Component
const Footer = () => {
  const { isDark } = useTheme();
  
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`mt-8 p-4 text-center text-sm ${
        isDark ? 'text-gray-400' : 'text-gray-600'
      }`}
    >
      <p>
        For any technical clarification, kindly reach out to{' '}
        <span className="font-semibold text-purple-600">Data Team : STC-AP | Pardhasaradhi</span>
      </p>
    </motion.div>
  );
};

// Login Component
const Login = ({ onSwitchToSignup, onSwitchToForgotPassword }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const result = await login(email, password);
    if (!result.success) {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div className={`min-h-screen ${
      isDark 
        ? 'bg-gradient-to-br from-gray-900 to-gray-800' 
        : 'bg-gradient-to-br from-purple-50 to-blue-50'
    } flex flex-col items-center justify-center p-4`}>
      <motion.div 
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        transition={pageTransition}
        className={`${
          isDark ? 'bg-gray-800 text-white' : 'bg-white'
        } rounded-2xl shadow-xl p-8 w-full max-w-md relative`}
      >
        
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className={`absolute top-4 right-4 p-2 rounded-lg ${
            isDark 
              ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          } transition-all duration-200`}
        >
          {isDark ? '☀️' : '🌙'}
        </button>

        <div className="text-center mb-8">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="bg-white rounded-2xl p-4 inline-block shadow-lg mb-4 border-2 border-gray-100"
          >
            <img 
              src="https://showtimeconsulting.in/images/settings/2fd13f50.png" 
              alt="Logo" 
              className="w-16 h-16 object-contain mx-auto img-fluid"
            />
          </motion.div>
          <h1 className="text-2xl font-bold">SHOWTIME</h1>
          <h2 className="text-lg text-gray-600">CONSULTING</h2>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} mt-2`}>
            Daily Work Reporting Portal
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className={`block text-sm font-medium ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            } mb-2`}>
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full px-4 py-3 border ${
                isDark 
                  ? 'border-gray-600 bg-gray-700 text-white' 
                  : 'border-gray-300 bg-white'
              } rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200`}
              placeholder="Enter your email"
              required
            />
          </div>

          <div>
            <label className={`block text-sm font-medium ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            } mb-2`}>
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full px-4 py-3 border ${
                  isDark 
                    ? 'border-gray-600 bg-gray-700 text-white' 
                    : 'border-gray-300 bg-white'
                } rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent pr-12 transition-all duration-200`}
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${
                  isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
                } transition-all duration-200`}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-lg"
            >
              {error}
            </motion.div>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 text-white py-3 rounded-lg font-medium hover:bg-purple-700 transition duration-200 disabled:opacity-50"
          >
            {loading ? 'Signing In...' : '🔐 Sign In'}
          </motion.button>
        </form>

        <div className="text-center mt-6">
          <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Don't have an account? </span>
          <button
            onClick={onSwitchToSignup}
            className="text-purple-600 hover:text-purple-700 font-medium transition-all duration-200"
          >
            Create Account
          </button>
        </div>

        <div className="text-center mt-4">
          <button
            onClick={onSwitchToForgotPassword}
            className="text-sm text-purple-600 hover:text-purple-700 transition-all duration-200"
          >
            Forgot Password?
          </button>
        </div>

      </motion.div>
      
      <Footer />
    </div>
  );
};

// RequestPasswordResetPage Component
const RequestPasswordResetPage = ({ onSwitchToLogin }) => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { isDark, toggleTheme } = useTheme();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const response = await axios.post(`${API}/auth/request-password-reset`, { email });
      setMessage(response.data.message);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to request password reset. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen ${
      isDark
        ? 'bg-gradient-to-br from-gray-900 to-gray-800'
        : 'bg-gradient-to-br from-purple-50 to-blue-50'
    } flex flex-col items-center justify-center p-4`}>
      <motion.div
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        transition={pageTransition}
        className={`${
          isDark ? 'bg-gray-800 text-white' : 'bg-white'
        } rounded-2xl shadow-xl p-8 w-full max-w-md relative`}
      >
        <button
          onClick={toggleTheme}
          className={`absolute top-4 right-4 p-2 rounded-lg ${
            isDark
              ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          } transition-all duration-200`}
        >
          {isDark ? '☀️' : '🌙'}
        </button>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">Reset Password</h1>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} mt-2`}>
            Enter your email to receive a reset link.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className={`block text-sm font-medium ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            } mb-2`}>
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full px-4 py-3 border ${
                isDark
                  ? 'border-gray-600 bg-gray-700 text-white'
                  : 'border-gray-300 bg-white'
              } rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200`}
              placeholder="Enter your email"
              required
            />
          </div>

          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-green-600 text-sm text-center bg-green-50 p-3 rounded-lg"
            >
              {message}
            </motion.div>
          )}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-lg"
            >
              {error}
            </motion.div>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 text-white py-3 rounded-lg font-medium hover:bg-purple-700 transition duration-200 disabled:opacity-50"
          >
            {loading ? 'Sending...' : '📧 Send Reset Link'}
          </motion.button>
        </form>

        <div className="text-center mt-6">
          <button
            onClick={onSwitchToLogin}
            className="text-purple-600 hover:text-purple-700 font-medium transition-all duration-200"
          >
            Back to Login
          </button>
        </div>
      </motion.div>
      <Footer />
    </div>
  );
};

// ResetPasswordPage Component
const ResetPasswordPage = ({ onSwitchToLogin }) => {
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { isDark, toggleTheme } = useTheme();

  useEffect(() => {
    // Extract token from URL query parameter
    const queryParams = new URLSearchParams(window.location.search);
    const tokenFromURL = queryParams.get('token');
    if (tokenFromURL) {
      setToken(tokenFromURL);
    } else {
      setError("No reset token found in URL. Please use the link from your email.");
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
        setError('Password must be at least 6 characters long.');
        return;
    }
    if (!token) {
        setError('Reset token is missing.');
        return;
    }

    setLoading(true);
    setMessage('');
    setError('');

    try {
      const response = await axios.post(`${API}/auth/reset-password`, { token, new_password: newPassword });
      setMessage(response.data.message + " You can now login with your new password.");
      // Optionally clear the token from URL after successful reset, though redirecting is better
      // window.history.replaceState({}, document.title, window.location.pathname);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to reset password. The token might be invalid or expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen ${
      isDark
        ? 'bg-gradient-to-br from-gray-900 to-gray-800'
        : 'bg-gradient-to-br from-purple-50 to-blue-50'
    } flex flex-col items-center justify-center p-4`}>
      <motion.div
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        transition={pageTransition}
        className={`${
          isDark ? 'bg-gray-800 text-white' : 'bg-white'
        } rounded-2xl shadow-xl p-8 w-full max-w-md relative`}
      >
        <button
          onClick={toggleTheme}
          className={`absolute top-4 right-4 p-2 rounded-lg ${
            isDark
              ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          } transition-all duration-200`}
        >
          {isDark ? '☀️' : '🌙'}
        </button>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">Set New Password</h1>
        </div>

        {!token && error && (
           <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-lg mb-4"
            >
              {error}
            </motion.div>
        )}

        {token && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className={`block text-sm font-medium ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              } mb-2`}>
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={`w-full px-4 py-3 border ${
                  isDark
                    ? 'border-gray-600 bg-gray-700 text-white'
                    : 'border-gray-300 bg-white'
                } rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200`}
                placeholder="Enter new password"
                required
              />
            </div>
            <div>
              <label className={`block text-sm font-medium ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              } mb-2`}>
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full px-4 py-3 border ${
                  isDark
                    ? 'border-gray-600 bg-gray-700 text-white'
                    : 'border-gray-300 bg-white'
                } rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200`}
                placeholder="Confirm new password"
                required
              />
            </div>

            {message && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-green-600 text-sm text-center bg-green-50 p-3 rounded-lg"
              >
                {message}
              </motion.div>
            )}
            {error && !message && ( // Show error only if no success message
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-lg"
              >
                {error}
              </motion.div>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading || !!message} // Disable if loading or success message shown
              className="w-full bg-purple-600 text-white py-3 rounded-lg font-medium hover:bg-purple-700 transition duration-200 disabled:opacity-50"
            >
              {loading ? 'Resetting...' : '🔒 Reset Password'}
            </motion.button>
          </form>
        )}

        <div className="text-center mt-6">
          <button
            onClick={onSwitchToLogin}
            className="text-purple-600 hover:text-purple-700 font-medium transition-all duration-200"
          >
            Back to Login
          </button>
        </div>
      </motion.div>
      <Footer />
    </div>
  );
};


// Signup Component
const Signup = ({ onSwitchToLogin }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('employee');
  const [department, setDepartment] = useState('');
  const [team, setTeam] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState({});
  const { signup, token } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const response = await axios.get(`${API}/departments`);
      setDepartments(response.data.departments);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const getTeams = () => {
    return department ? Object.keys(departments[department] || {}) : [];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    if (role === 'employee' && (!department || !team)) {
      setError('Please select department and team');
      setLoading(false);
      return;
    }
    
    const result = await signup(name, email, password, role, department, team);
    if (!result.success) {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <motion.div 
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      className={`min-h-screen ${
        isDark 
          ? 'bg-gradient-to-br from-gray-900 to-gray-800' 
          : 'bg-gradient-to-br from-purple-50 to-blue-50'
      } flex items-center justify-center p-4`}
    >
      <div className={`${
        isDark ? 'bg-gray-800 text-white' : 'bg-white'
      } rounded-2xl shadow-xl p-8 w-full max-w-md relative`}>
        
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className={`absolute top-4 right-4 p-2 rounded-lg ${
            isDark 
              ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          } transition-all duration-200`}
        >
          {isDark ? '☀️' : '🌙'}
        </button>

        <div className="text-center mb-8">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="bg-white rounded-2xl p-4 inline-block shadow-lg mb-4 border-2 border-gray-100"
          >
            <img 
              src="https://showtimeconsulting.in/images/settings/2fd13f50.png" 
              alt="Logo" 
              className="w-16 h-16 object-contain mx-auto img-fluid"
            />
          </motion.div>
          <h1 className="text-2xl font-bold">Create Account</h1>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} mt-2`}>
            Join the Daily Work Reporting Portal
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className={`block text-sm font-medium ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            } mb-2`}>
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full px-4 py-3 border ${
                isDark 
                  ? 'border-gray-600 bg-gray-700 text-white' 
                  : 'border-gray-300 bg-white'
              } rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200`}
              placeholder="Enter your full name"
              required
            />
          </div>

          <div>
            <label className={`block text-sm font-medium ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            } mb-2`}>
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full px-4 py-3 border ${
                isDark 
                  ? 'border-gray-600 bg-gray-700 text-white' 
                  : 'border-gray-300 bg-white'
              } rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200`}
              placeholder="Enter your email"
              required
            />
          </div>

          <div>
            <label className={`block text-sm font-medium ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            } mb-2`}>
              Role
            </label>
            <select
              value={role}
              onChange={(e) => {
                setRole(e.target.value);
                setDepartment('');
                setTeam('');
              }}
              className={`w-full px-4 py-3 border ${
                isDark 
                  ? 'border-gray-600 bg-gray-700 text-white' 
                  : 'border-gray-300 bg-white'
              } rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200`}
            >
              <option value="employee">👤 Employee</option>
              <option value="manager">👔 Manager</option>
            </select>
          </div>

          {role === 'employee' && (
            <>
              <div>
                <label className={`block text-sm font-medium ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                } mb-2`}>
                  Department *
                </label>
                <select
                  value={department}
                  onChange={(e) => {
                    setDepartment(e.target.value);
                    setTeam('');
                  }}
                  className={`w-full px-4 py-3 border ${
                    isDark 
                      ? 'border-gray-600 bg-gray-700 text-white' 
                      : 'border-gray-300 bg-white'
                  } rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200`}
                  required
                >
                  <option value="">Select Department</option>
                  {Object.keys(departments).map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                } mb-2`}>
                  Team *
                </label>
                <select
                  value={team}
                  onChange={(e) => setTeam(e.target.value)}
                  className={`w-full px-4 py-3 border ${
                    isDark 
                      ? 'border-gray-600 bg-gray-700 text-white' 
                      : 'border-gray-300 bg-white'
                  } rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200`}
                  required
                  disabled={!department}
                >
                  <option value="">Select Team</option>
                  {getTeams().map(teamName => (
                    <option key={teamName} value={teamName}>{teamName}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div>
            <label className={`block text-sm font-medium ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            } mb-2`}>
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full px-4 py-3 border ${
                  isDark 
                    ? 'border-gray-600 bg-gray-700 text-white' 
                    : 'border-gray-300 bg-white'
                } rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent pr-12 transition-all duration-200`}
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${
                  isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
                } transition-all duration-200`}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <div>
            <label className={`block text-sm font-medium ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            } mb-2`}>
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full px-4 py-3 border ${
                  isDark 
                    ? 'border-gray-600 bg-gray-700 text-white' 
                    : 'border-gray-300 bg-white'
                } rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent pr-12 transition-all duration-200`}
                placeholder="Confirm your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${
                  isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
                } transition-all duration-200`}
              >
                {showConfirmPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-lg"
            >
              {error}
            </motion.div>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 text-white py-3 rounded-lg font-medium hover:bg-purple-700 transition duration-200 disabled:opacity-50"
          >
            {loading ? 'Creating Account...' : '✨ Create Account'}
          </motion.button>
        </form>

        <div className="text-center mt-6">
          <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Already have an account? </span>
          <button
            onClick={onSwitchToLogin}
            className="text-purple-600 hover:text-purple-700 font-medium transition-all duration-200"
          >
            Sign In
          </button>
        </div>
      </div>
      <Footer />
    </motion.div>
  );
};

// Navigation Component
const Navigation = ({ activeSection, setActiveSection }) => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const sections = [
    { id: 'welcome', label: 'Welcome', icon: '🏠' },
    { id: 'daily-report', label: 'Daily Report', icon: '📝' },
    // Only show RM's Team Report for managers
    ...(user?.role === 'manager' ? [{ id: 'team-report', label: "RM's Team Report", icon: '👥' }] : []),
    { id: 'summary-report', label: 'Summary Report', icon: '📊' }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${
        isDark ? 'bg-gray-800 text-white' : 'bg-white'
      } rounded-2xl shadow-lg p-6 mb-6`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="bg-white rounded-xl p-2 shadow-lg border-2 border-gray-100">
            <motion.img 
              whileHover={{ scale: 1.1, rotate: 5 }}
              src="https://showtimeconsulting.in/images/settings/2fd13f50.png" 
              alt="Logo" 
              className="w-12 h-12 object-contain img-fluid"
            />
          </div>
          <div>
            <h1 className="text-xl font-bold">SHOWTIME CONSULTING</h1>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Daily Work Report
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Welcome, {user?.name}
            </span>
            <span className={`px-2 py-1 rounded-full text-xs ${
              user?.role === 'manager' 
                ? 'bg-purple-100 text-purple-800' 
                : 'bg-blue-100 text-blue-800'
            }`}>
              {user?.role === 'manager' ? '👔 Manager' : '👤 Employee'}
            </span>
          </div>
          <button
            onClick={logout}
            className="text-red-600 hover:text-red-700 text-sm transition-all duration-200"
          >
            🚪 Logout
          </button>
          <button 
            onClick={toggleTheme}
            className={`p-2 rounded-lg ${
              isDark 
                ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            } transition-all duration-200`}
          >
            {isDark ? '☀️' : '🌙'}
          </button>
        </div>
      </div>
      
      <div className="flex space-x-2 mt-6">
        {sections.map((section) => (
          <motion.button
            key={section.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveSection(section.id)}
            className={`px-4 py-2 rounded-lg font-medium transition duration-200 ${
              activeSection === section.id
                ? 'bg-purple-600 text-white'
                : isDark
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {section.icon} {section.label}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
};

// Welcome Component
const Welcome = () => {
  const { user } = useAuth();
  const { isDark } = useTheme();

  return (
    <motion.div 
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      className={`${
        isDark ? 'bg-gray-800 text-white' : 'bg-white'
      } rounded-2xl shadow-lg p-8 text-center`}
    >
      <motion.div 
        whileHover={{ scale: 1.05, rotate: 5 }}
        className="bg-white rounded-2xl p-6 inline-block shadow-lg mb-6 border-2 border-gray-100"
      >
        <img 
          src="https://showtimeconsulting.in/images/settings/2fd13f50.png" 
          alt="Logo" 
          className="w-20 h-20 object-contain mx-auto img-fluid"
        />
      </motion.div>
      
      <motion.h1 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-4xl font-bold mb-2"
      >
        <span className="text-purple-600">SHOWTIME</span>
      </motion.h1>
      <motion.h2 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className={`text-xl ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-6`}
      >
        CONSULTING
      </motion.h2>
      
      <motion.h3 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-2xl font-bold mb-4"
      >
        Welcome to the
      </motion.h3>
      <motion.h4 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="text-2xl font-bold text-purple-600 mb-6"
      >
        Daily Work Reporting Portal
      </motion.h4>
      
      <motion.p 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className={`${isDark ? 'text-gray-400' : 'text-gray-600'} max-w-2xl mx-auto leading-relaxed`}
      >
        Streamline your daily work reporting with our professional, intuitive 
        platform designed for efficient team management and progress tracking.
      </motion.p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
        {[
          { icon: "📝", title: "Daily Reports", desc: "Submit your daily work progress and task updates efficiently", color: "purple" },
          { icon: "👥", title: "Team Management", desc: "Track team performance and manage reporting workflows", color: "blue" },
          { icon: "📊", title: "Analytics", desc: "Generate comprehensive reports and export data for analysis", color: "green" }
        ].map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 + index * 0.1 }}
            whileHover={{ scale: 1.05, y: -5 }}
            className={`bg-${item.color}-50 ${
              isDark ? `bg-${item.color}-900 bg-opacity-30` : ''
            } rounded-xl p-6 cursor-pointer`}
          >
            <div className="text-3xl mb-4">{item.icon}</div>
            <h5 className="font-semibold mb-2">{item.title}</h5>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {item.desc}
            </p>
          </motion.div>
        ))}
      </div>
      <Footer />
    </motion.div>
  );
};

// Daily Report Component
const DailyReport = () => {
  const { user, token } = useAuth();
  const { isDark } = useTheme();
  const [departments, setDepartments] = useState({});
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('');
  const [selectedManager, setSelectedManager] = useState('');
  const [employeeName, setEmployeeName] = useState(user?.name || '');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [tasks, setTasks] = useState([{ id: Date.now(), details: '', status: 'WIP' }]);
  const [statusOptions, setStatusOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchDepartments();
    fetchStatusOptions();
  }, []);

  // Separate useEffect for auto-population after departments are loaded
  useEffect(() => {
    // Auto-populate user's department and team if they are an employee
    if (user && user.department && user.team && Object.keys(departments).length > 0) {
      setSelectedDepartment(user.department);
      setSelectedTeam(user.team);
      // Auto-select the first manager from the team
      if (departments[user.department] && departments[user.department][user.team]) {
        const managers = departments[user.department][user.team];
        if (managers && managers.length > 0) {
          setSelectedManager(managers[0]);
        }
      }
    }
  }, [user, departments]);

  // Remove the problematic useEffect that was causing the error

  const fetchDepartments = async () => {
    try {
      const response = await axios.get(`${API}/departments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDepartments(response.data.departments);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const fetchStatusOptions = async () => {
    try {
      const response = await axios.get(`${API}/status-options`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStatusOptions(response.data.status_options);
    } catch (error) {
      console.error('Error fetching status options:', error);
    }
  };

  const getTeams = () => {
    if (!selectedDepartment || !departments || !departments[selectedDepartment]) {
      return [];
    }
    return Object.keys(departments[selectedDepartment]);
  };

  const getManagers = () => {
    // If the current user IS a manager, they are submitting their OWN report.
    // In this context, their "Reporting Manager" is their senior manager/reviewer.
    if (user?.role === 'manager') {
      return ['Anant Tiwari', 'Alimpan Banerjee'];
    }
    
    // If the current user is an EMPLOYEE, they select their actual reporting manager from the department/team structure.
    if (!selectedDepartment || !selectedTeam || !departments || 
        !departments[selectedDepartment] || !departments[selectedDepartment][selectedTeam]) {
      // This case is for an employee when department/team data might still be loading or not selected.
      return [];
    }
    // For an employee, list managers from their selected team.
    return departments[selectedDepartment][selectedTeam] || [];
  };

  const addTask = () => {
    setTasks([...tasks, { id: Date.now(), details: '', status: 'WIP' }]);
  };

  const updateTask = (id, field, value) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, [field]: value } : task
    ));
  };

  const removeTask = (id) => {
    if (tasks.length > 1) {
      setTasks(tasks.filter(task => task.id !== id));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const reportData = {
        employee_name: employeeName,
        department: selectedDepartment,
        team: selectedTeam,
        reporting_manager: selectedManager,
        date: date,
        tasks: tasks.map(({ id, ...task }) => task)
      };

      await axios.post(`${API}/work-reports`, reportData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setMessage('Report submitted successfully!');
      // Reset form
      setTasks([{ id: Date.now(), details: '', status: 'WIP' }]);
    } catch (error) {
      setMessage('Error submitting report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      className={`${
        isDark ? 'bg-gray-800 text-white' : 'bg-white'
      } rounded-2xl shadow-lg p-8`}
    >
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold">Daily Work Report</h2>
        <div className="flex items-center space-x-2">
          <span className={`px-3 py-1 rounded-full text-sm ${
            user?.role === 'manager' 
              ? 'bg-purple-100 text-purple-800' 
              : 'bg-blue-100 text-blue-800'
          }`}>
            {user?.role === 'manager' ? '👔 Manager' : '👤 Employee'}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <label className={`block text-sm font-medium ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            } mb-2`}>
              Department *
            </label>
            <select
              value={selectedDepartment}
              onChange={(e) => {
                setSelectedDepartment(e.target.value);
                setSelectedTeam('');
                setSelectedManager('');
              }}
              className={`w-full px-4 py-3 border ${
                isDark 
                  ? 'border-gray-600 bg-gray-700 text-white' 
                  : 'border-gray-300 bg-white'
              } rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 ${
                (user?.department && user?.role === 'employee') ? 'bg-gray-100 cursor-not-allowed' : ''
              }`}
              required
              disabled={user?.department && user?.role === 'employee'}
            >
              <option value="">Select Department</option>
              {departments && Object.keys(departments).map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={`block text-sm font-medium ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            } mb-2`}>
              Team *
            </label>
            <select
              value={selectedTeam}
              onChange={(e) => {
                setSelectedTeam(e.target.value);
                setSelectedManager('');
              }}
              className={`w-full px-4 py-3 border ${
                isDark 
                  ? 'border-gray-600 bg-gray-700 text-white' 
                  : 'border-gray-300 bg-white'
              } rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 ${
                (user?.team && user?.role === 'employee') ? 'bg-gray-100 cursor-not-allowed' : ''
              }`}
              required
              disabled={(user?.team && user?.role === 'employee') || !selectedDepartment}
            >
              <option value="">Select Team</option>
              {getTeams().map(team => (
                <option key={team} value={team}>{team}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={`block text-sm font-medium ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            } mb-2`}>
              Reporting Manager *
            </label>
            <select
              value={selectedManager}
              onChange={(e) => setSelectedManager(e.target.value)}
              className={`w-full px-4 py-3 border ${
                isDark 
                  ? 'border-gray-600 bg-gray-700 text-white' 
                  : 'border-gray-300 bg-white'
              } rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200`}
              required
              disabled={user?.role === 'employee' && !selectedTeam}
            >
              <option value="">Select Reporting Manager</option>
              {getManagers().map(manager => (
                <option key={manager} value={manager}>{manager}</option>
              ))}
            </select>
            {user?.role === 'manager' && (
              <p className="text-xs text-gray-500 mt-1">
                As a manager, you report to senior leadership
              </p>
            )}
          </div>

          <div>
            <label className={`block text-sm font-medium ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            } mb-2`}>
              Employee Name *
            </label>
            <input
              type="text"
              value={employeeName}
              onChange={(e) => setEmployeeName(e.target.value)}
              className={`w-full px-4 py-3 border ${
                isDark 
                  ? 'border-gray-600 bg-gray-700 text-white' 
                  : 'border-gray-300 bg-white'
              } rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200`}
              placeholder="Enter your full name"
              required
            />
          </div>
        </div>

        <div>
          <label className={`block text-sm font-medium ${
            isDark ? 'text-gray-300' : 'text-gray-700'
          } mb-2`}>
            Date *
          </label>
          <div className="max-w-xs">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={`w-full px-4 py-3 border ${
                isDark 
                  ? 'border-gray-600 bg-gray-700 text-white' 
                  : 'border-gray-300 bg-white'
              } rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200`}
              required
            />
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">Tasks & Status</h3>
          
          {tasks.map((task, index) => (
            <motion.div 
              key={task.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`grid grid-cols-1 lg:grid-cols-12 gap-4 mb-4 p-4 ${
                isDark ? 'bg-gray-700' : 'bg-gray-50'
              } rounded-lg`}
            >
              <div className="lg:col-span-8">
                <label className={`block text-sm font-medium ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                } mb-2`}>
                  Task Details {index + 1} *
                </label>
                <textarea
                  value={task.details}
                  onChange={(e) => updateTask(task.id, 'details', e.target.value)}
                  className={`w-full px-4 py-3 border ${
                    isDark 
                      ? 'border-gray-600 bg-gray-800 text-white' 
                      : 'border-gray-300 bg-white'
                  } rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200`}
                  placeholder="Enter detailed task description..."
                  rows="3"
                  required
                />
              </div>
              
              <div className="lg:col-span-3">
                <label className={`block text-sm font-medium ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                } mb-2`}>
                  Status *
                </label>
                <select
                  value={task.status}
                  onChange={(e) => updateTask(task.id, 'status', e.target.value)}
                  className={`w-full px-4 py-3 border ${
                    isDark 
                      ? 'border-gray-600 bg-gray-800 text-white' 
                      : 'border-gray-300 bg-white'
                  } rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200`}
                  required
                >
                  {statusOptions.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
              
              <div className="lg:col-span-1 flex items-end">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={() => removeTask(task.id)}
                  className={`w-full py-3 ${
                    isDark 
                      ? 'text-red-400 hover:text-red-300 hover:bg-red-900' 
                      : 'text-red-600 hover:text-red-700 hover:bg-red-50'
                  } rounded-lg transition duration-200`}
                  disabled={tasks.length === 1}
                >
                  🗑️
                </motion.button>
              </div>
            </motion.div>
          ))}
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={addTask}
            className={`w-full py-3 border-2 border-dashed ${
              isDark 
                ? 'border-gray-600 text-gray-400 hover:border-purple-500 hover:text-purple-400' 
                : 'border-gray-300 text-gray-600 hover:border-purple-500 hover:text-purple-600'
            } rounded-lg transition duration-200`}
          >
            ➕ Add New Task
          </motion.button>
        </div>

        {message && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`text-center p-3 rounded-lg ${
              message.includes('successfully') 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}
          >
            {message}
          </motion.div>
        )}

        <div className="flex justify-center">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            disabled={loading}
            className="px-8 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition duration-200 disabled:opacity-50"
          >
            {loading ? 'Submitting...' : '📋 Submit Report'}
          </motion.button>
        </div>
      </form>
      <Footer />
    </motion.div>
  );
};

// Team Report Component
const TeamReport = () => {
  const { user, token } = useAuth();
  const { isDark } = useTheme();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState({});
  const [managerResources, setManagerResources] = useState({});
  const [attendanceSummary, setAttendanceSummary] = useState({});
  const [filters, setFilters] = useState({
    department: '',
    team: '',
    manager: ''
  });
  const [editingReport, setEditingReport] = useState(null);
  const [editTasks, setEditTasks] = useState([]);
  const [statusOptions, setStatusOptions] = useState([]);

  useEffect(() => {
    fetchReports();
    fetchDepartments();
    fetchStatusOptions();
    fetchManagerResources();
  }, [filters]);

  const fetchDepartments = async () => {
    try {
      const response = await axios.get(`${API}/departments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDepartments(response.data.departments);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const fetchManagerResources = async () => {
    try {
      const response = await axios.get(`${API}/manager-resources`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setManagerResources(response.data.manager_resources);
    } catch (error) {
      console.error('Error fetching manager resources:', error);
    }
  };

  const fetchAttendanceSummary = async (date) => {
    try {
      const response = await axios.get(`${API}/attendance-summary?date=${date}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAttendanceSummary(response.data.attendance_summary);
    } catch (error) {
      console.error('Error fetching attendance summary:', error);
    }
  };

  const fetchStatusOptions = async () => {
    try {
      const response = await axios.get(`${API}/status-options`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStatusOptions(response.data.status_options);
    } catch (error) {
      console.error('Error fetching status options:', error);
    }
  };

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'All') params.append(key, value);
      });

      const response = await axios.get(`${API}/work-reports?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReports(response.data.reports);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (report) => {
    setEditingReport(report.id);
    setEditTasks([...report.tasks]);
  };

  const saveEdits = async (reportId) => {
    try {
      await axios.put(`${API}/work-reports/${reportId}`, 
        { tasks: editTasks },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEditingReport(null);
      fetchReports();
    } catch (error) {
      alert('Error updating report. Please try again.');
    }
  };

  const deleteReport = async (reportId) => {
    if (window.confirm('Are you sure you want to delete this report? This action cannot be undone.')) {
      try {
        await axios.delete(`${API}/work-reports/${reportId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchReports();
        alert('Report deleted successfully');
      } catch (error) {
        alert('Error deleting report. Please try again.');
      }
    }
  };

  const exportCSV = async () => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'All') params.append(key, value);
      });

      const response = await axios.get(`${API}/work-reports/export/csv?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'work_reports.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      alert('Error exporting CSV. Please try again.');
    }
  };

  const exportPDF = async () => {
    // Get today's date for attendance summary
    const today = new Date().toISOString().split('T')[0];
    await fetchAttendanceSummary(today);

    const doc = new jsPDF();
    
    // Title and Header
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Team Work Report with Attendance Summary', 14, 20);
    
    // Company Logo placeholder
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('SHOWTIME CONSULTING', 14, 30);
    
    // Date and time
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN')} at ${new Date().toLocaleTimeString('en-IN')}`, 14, 40);
    
    let currentY = 50;

    // Add Attendance Summary Section
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`Attendance Summary for ${today}`, 14, currentY);
    currentY += 10;

    // Attendance table data
    const attendanceData = [];
    Object.entries(attendanceSummary).forEach(([manager, data]) => {
      attendanceData.push([
        manager,
        data.total_resources.toString(),
        data.present.toString(),
        data.absent.toString(),
        `${((data.present / data.total_resources) * 100).toFixed(1)}%`
      ]);
    });

    if (attendanceData.length > 0) {
      autoTable(doc, {
        head: [['Manager', 'Total Resources', 'Present', 'Absent', 'Attendance %']],
        body: attendanceData,
        startY: currentY,
        styles: {
          fontSize: 9,
          cellPadding: 3
        },
        headStyles: {
          fillColor: [59, 130, 246], // Blue color
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252]
        },
        margin: { top: 10, bottom: 10 }
      });
      
      currentY = doc.lastAutoTable.finalY + 20;
    }

    // Work Reports Section
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Detailed Work Reports', 14, currentY);
    currentY += 10;
    
    // Prepare table data - each task gets its own row
    const tableData = [];
    reports.forEach(report => {
      if (report.tasks && report.tasks.length > 0) {
        report.tasks.forEach((task, taskIndex) => {
          tableData.push([
            report.date,
            report.employee_name,
            report.department,
            report.team,
            report.reporting_manager,
            task.details,
            task.status
          ]);
        });
      } else {
        // If no tasks, still show the report with empty task
        tableData.push([
          report.date,
          report.employee_name,
          report.department,
          report.team,
          report.reporting_manager,
          'No tasks reported',
          'N/A'
        ]);
      }
    });
    
    // Create the table using autoTable
    autoTable(doc, {
      head: [['Date', 'Employee', 'Department', 'Team', 'Manager', 'Task Details', 'Status']],
      body: tableData,
      startY: currentY,
      styles: {
        fontSize: 8,
        cellPadding: 3,
        overflow: 'linebreak',
        halign: 'left',
        valign: 'top'
      },
      headStyles: {
        fillColor: [147, 51, 234], // Purple color
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252] // Light gray
      },
      columnStyles: {
        0: { cellWidth: 20 }, // Date
        1: { cellWidth: 25 }, // Employee
        2: { cellWidth: 25 }, // Department
        3: { cellWidth: 20 }, // Team
        4: { cellWidth: 25 }, // Manager
        5: { cellWidth: 50 }, // Task Details - wider
        6: { cellWidth: 20 }  // Status
      },
      margin: { top: 50 },
      theme: 'striped'
    });
    
    // Add footer on each page
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      
      // Page number
      doc.text(
        `Page ${i} of ${pageCount}`,
        doc.internal.pageSize.width - 30,
        doc.internal.pageSize.height - 15
      );
      
      // Contact footer
      doc.text(
        'For any technical clarification, kindly reach out to Data Team : STC-AP | Pardhasaradhi',
        14,
        doc.internal.pageSize.height - 10
      );
    }
    
    // Save the PDF
    doc.save(`Team_Work_Report_with_Attendance_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const getTeams = () => {
    return filters.department && filters.department !== 'All Departments' 
      ? Object.keys(departments[filters.department] || {}) 
      : [];
  };

  const getManagers = () => {
    if (filters.department && filters.team && 
        filters.department !== 'All Departments' && 
        filters.team !== 'All Teams') {
      return departments[filters.department][filters.team] || [];
    }
    return [];
  };

  return (
    <motion.div 
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      className={`${
        isDark ? 'bg-gray-800 text-white' : 'bg-white'
      } rounded-2xl shadow-lg p-8`}
    >
      <h2 className="text-2xl font-bold mb-8">
        RM's Team Work Report
      </h2>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div>
          <label className={`block text-sm font-medium ${
            isDark ? 'text-gray-300' : 'text-gray-700'
          } mb-2`}>
            Filter by Department
          </label>
          <select
            value={filters.department}
            onChange={(e) => setFilters({
              ...filters,
              department: e.target.value,
              team: '',
              manager: ''
            })}
            className={`w-full px-4 py-3 border ${
              isDark 
                ? 'border-gray-600 bg-gray-700 text-white' 
                : 'border-gray-300 bg-white'
            } rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200`}
          >
            <option value="">All Departments</option>
            {Object.keys(departments).map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={`block text-sm font-medium ${
            isDark ? 'text-gray-300' : 'text-gray-700'
          } mb-2`}>
            Filter by Team
          </label>
          <select
            value={filters.team}
            onChange={(e) => setFilters({
              ...filters,
              team: e.target.value,
              manager: ''
            })}
            className={`w-full px-4 py-3 border ${
              isDark 
                ? 'border-gray-600 bg-gray-700 text-white' 
                : 'border-gray-300 bg-white'
            } rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200`}
            disabled={!filters.department}
          >
            <option value="">All Teams</option>
            {getTeams().map(team => (
              <option key={team} value={team}>{team}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={`block text-sm font-medium ${
            isDark ? 'text-gray-300' : 'text-gray-700'
          } mb-2`}>
            Filter by Reporting Manager
          </label>
          <select
            value={filters.manager}
            onChange={(e) => setFilters({
              ...filters,
              manager: e.target.value
            })}
            className={`w-full px-4 py-3 border ${
              isDark 
                ? 'border-gray-600 bg-gray-700 text-white' 
                : 'border-gray-300 bg-white'
            } rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200`}
            disabled={!filters.team}
          >
            <option value="">All Reporting Managers</option>
            {getManagers().map(manager => (
              <option key={manager} value={manager}>{manager}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={exportCSV}
          className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition duration-200"
        >
          📄 Export CSV
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={exportPDF}
          className="px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition duration-200"
        >
          📄 Export PDF
        </motion.button>
      </div>

      {/* Reports Table */}
      {loading ? (
        <div className="text-center py-8">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="text-4xl mb-4"
          >
            ⏳
          </motion.div>
          <div>Loading reports...</div>
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-6xl mb-4">📋</div>
          <div className={isDark ? 'text-gray-400' : 'text-gray-500'}>No reports found</div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className={`w-full border-collapse border ${
            isDark ? 'border-gray-600' : 'border-gray-300'
          }`}>
            <thead>
              <tr className={isDark ? 'bg-gray-700' : 'bg-gray-50'}>
                <th className={`border ${
                  isDark ? 'border-gray-600' : 'border-gray-300'
                } px-4 py-3 text-left font-semibold`}>Date</th>
                <th className={`border ${
                  isDark ? 'border-gray-600' : 'border-gray-300'
                } px-4 py-3 text-left font-semibold`}>Employee Name</th>
                <th className={`border ${
                  isDark ? 'border-gray-600' : 'border-gray-300'
                } px-4 py-3 text-left font-semibold`}>Department</th>
                <th className={`border ${
                  isDark ? 'border-gray-600' : 'border-gray-300'
                } px-4 py-3 text-left font-semibold`}>Team</th>
                <th className={`border ${
                  isDark ? 'border-gray-600' : 'border-gray-300'
                } px-4 py-3 text-left font-semibold`}>Reporting Manager</th>
                <th className={`border ${
                  isDark ? 'border-gray-600' : 'border-gray-300'
                } px-4 py-3 text-left font-semibold`}>Status</th>
                <th className={`border ${
                  isDark ? 'border-gray-600' : 'border-gray-300'
                } px-4 py-3 text-left font-semibold`}>Tasks</th>
                {user?.role === 'manager' && (
                  <th className={`border ${
                    isDark ? 'border-gray-600' : 'border-gray-300'
                  } px-4 py-3 text-left font-semibold`}>Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <motion.tr 
                  key={report.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`${
                    isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                  } transition-all duration-200`}
                >
                  <td className={`border ${
                    isDark ? 'border-gray-600' : 'border-gray-300'
                  } px-4 py-3`}>{report.date}</td>
                  <td className={`border ${
                    isDark ? 'border-gray-600' : 'border-gray-300'
                  } px-4 py-3`}>{report.employee_name}</td>
                  <td className={`border ${
                    isDark ? 'border-gray-600' : 'border-gray-300'
                  } px-4 py-3`}>{report.department}</td>
                  <td className={`border ${
                    isDark ? 'border-gray-600' : 'border-gray-300'
                  } px-4 py-3`}>{report.team}</td>
                  <td className={`border ${
                    isDark ? 'border-gray-600' : 'border-gray-300'
                  } px-4 py-3`}>{report.reporting_manager}</td>
                  <td className={`border ${
                    isDark ? 'border-gray-600' : 'border-gray-300'
                  } px-4 py-3`}>
                    <div className="flex flex-wrap gap-1">
                      {report.tasks.map((task, idx) => (
                        <span key={idx} className={`px-2 py-1 rounded-full text-xs ${
                          task.status === 'Completed' ? 'bg-green-100 text-green-800' :
                          task.status === 'WIP' ? 'bg-blue-100 text-blue-800' :
                          task.status === 'Delayed' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {task.status}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className={`border ${
                    isDark ? 'border-gray-600' : 'border-gray-300'
                  } px-4 py-3`}>
                    {editingReport === report.id ? (
                      <div className="space-y-2">
                        {editTasks.map((task, idx) => (
                          <div key={idx} className="flex gap-2">
                            <textarea
                              value={task.details}
                              onChange={(e) => {
                                const newTasks = [...editTasks];
                                newTasks[idx].details = e.target.value;
                                setEditTasks(newTasks);
                              }}
                              className={`flex-1 px-2 py-1 border rounded text-sm ${
                                isDark 
                                  ? 'border-gray-600 bg-gray-700 text-white' 
                                  : 'border-gray-300 bg-white'
                              }`}
                              rows="2"
                            />
                            <select
                              value={task.status}
                              onChange={(e) => {
                                const newTasks = [...editTasks];
                                newTasks[idx].status = e.target.value;
                                setEditTasks(newTasks);
                              }}
                              className={`px-2 py-1 border rounded text-sm ${
                                isDark 
                                  ? 'border-gray-600 bg-gray-700 text-white' 
                                  : 'border-gray-300 bg-white'
                              }`}
                            >
                              {statusOptions.map(status => (
                                <option key={status} value={status}>{status}</option>
                              ))}
                            </select>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {report.tasks.map((task, idx) => (
                          <div key={idx} className="text-sm">
                            <div className="font-medium">{task.details}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                  
                  {user?.role === 'manager' && (
                    <td className={`border ${
                      isDark ? 'border-gray-600' : 'border-gray-300'
                    } px-4 py-3`}>
                      {editingReport === report.id ? (
                        <div className="flex gap-2">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => saveEdits(report.id)}
                            className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-all duration-200"
                          >
                            Save
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setEditingReport(null)}
                            className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 transition-all duration-200"
                          >
                            Cancel
                          </motion.button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => startEditing(report)}
                            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-all duration-200"
                          >
                            ✏️ Edit
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => deleteReport(report.id)}
                            className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-all duration-200"
                          >
                            🗑️ Delete
                          </motion.button>
                        </div>
                      )}
                    </td>
                  )}
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Footer />
    </motion.div>
  );
};

// Summary Report Component
const SummaryReport = () => {
  const { token } = useAuth();
  const { isDark } = useTheme();
  const [groupedReports, setGroupedReports] = useState([]); // Changed state variable name
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState({}); // For filter dropdown
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');

  useEffect(() => {
    fetchDepartments();
    fetchReports();
  }, []);

  const fetchDepartments = async () => {
    try {
      const response = await axios.get(`${API}/departments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDepartments(response.data.departments);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (fromDate) params.append('from_date', fromDate);
      if (toDate) params.append('to_date', toDate);
      if (selectedDepartment && selectedDepartment !== 'All Departments') {
        params.append('department', selectedDepartment);
      }

      // Call the new endpoint for grouped summary data
      const response = await axios.get(`${API}/summary-reports-grouped?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGroupedReports(response.data.reports); // Assuming backend sends { reports: [...] }
    } catch (error) {
      console.error('Error fetching grouped summary reports:', error);
      setGroupedReports([]); // Clear data on error
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setFromDate('');
    setToDate('');
    setSelectedDepartment('');
  };

  const exportPDF = async () => {
    const doc = new jsPDF();
    
    // Title and Header
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Team Summary Report', 14, 20);
    
    // Company branding
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('SHOWTIME CONSULTING', 14, 30);
    
    // Date and filters info
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN')} at ${new Date().toLocaleTimeString('en-IN')}`, 14, 40);
    
    if (fromDate || toDate) {
      doc.text(`Date Range: ${fromDate || 'All'} to ${toDate || 'All'}`, 14, 48);
    }
    
    if (selectedDepartment) {
      doc.text(`Department: ${selectedDepartment}`, 14, 56);
    }
    let currentY = selectedDepartment ? 70 : 62; // Keep similar starting Y

    // Updated Summary Statistics (if any, or remove)
    // For now, let's just show total groups. More complex stats can be added if needed.
    doc.setFont('helvetica', 'bold');
    doc.text('Report Summary:', 14, currentY);
    currentY += 8;
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Manager Groups: ${groupedReports.length}`, 14, currentY);
    currentY += 15;

    // New table data based on groupedReports
    const tableData = [];
    groupedReports.forEach(group => {
      // Join tasks and statuses with newline for bullet-point like appearance in PDF cell
      const tasksString = group.tasks_list.map(task => `- ${task}`).join('\n');
      const statusesString = group.statuses_list.map(status => `- ${status}`).join('\n');

      tableData.push([
        group.department,
        group.team,
        group.reporting_manager,
        group.no_of_resource.toString(),
        tasksString,
        statusesString,
        group.reviewer || 'N/A'
      ]);
    });
    
    if (tableData.length > 0) {
      autoTable(doc, {
        head: [[
          'Department', 'Team', 'Reporting Manager', 'No of Resources',
          'Tasks', 'Statuses', 'Reviewer'
        ]],
        body: tableData,
        startY: currentY,
        styles: {
          fontSize: 8, // Adjusted font size
          cellPadding: 3,
          overflow: 'linebreak', // Important for tasks/statuses
          halign: 'left',
          valign: 'top'
        },
        headStyles: {
          fillColor: [147, 51, 234], // Purple
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 9
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252] // Light gray
        },
        columnStyles: {
          0: { cellWidth: 25 }, // Department
          1: { cellWidth: 25 }, // Team
          2: { cellWidth: 30 }, // Reporting Manager
          3: { cellWidth: 20, halign: 'center' }, // No of Resource
          4: { cellWidth: 'auto' }, // Tasks (auto to take remaining space)
          5: { cellWidth: 25 }, // Statuses
          6: { cellWidth: 25 }  // Reviewer
        },
        theme: 'striped',
        didParseCell: function (data) { // To handle multiline text better
            if (data.column.index === 4 || data.column.index === 5) { // Tasks and Statuses columns
                if (typeof data.cell.raw === 'string') {
                    // Ensure jspdf-autotable handles newlines correctly
                    // No specific action needed here if using '\n' in cell content,
                    // autotable should handle it with 'linebreak'.
                }
            }
        }
      });
    }
    
    // Add footer on each page
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      
      // Page number
      doc.text(
        `Page ${i} of ${pageCount}`,
        doc.internal.pageSize.width - 30,
        doc.internal.pageSize.height - 15
      );
      
      // Contact footer
      doc.text(
        'For any technical clarification, kindly reach out to Data Team : STC-AP | Pardhasaradhi',
        14,
        doc.internal.pageSize.height - 10
      );
    }
    
    doc.save(`Team_Summary_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <motion.div 
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      className={`${
        isDark ? 'bg-gray-800 text-white' : 'bg-white'
      } rounded-2xl shadow-lg p-8`}
    >
      <h2 className="text-2xl font-bold mb-4">Team Summary Report</h2>
      
      <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} mb-8`}>
        Hierarchical view: Date → Department → Team → Manager → Employee → Tasks → Status
      </p>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div>
          <label className={`block text-sm font-medium ${
            isDark ? 'text-gray-300' : 'text-gray-700'
          } mb-2`}>
            From Date
          </label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className={`w-full px-4 py-3 border ${
              isDark 
                ? 'border-gray-600 bg-gray-700 text-white' 
                : 'border-gray-300 bg-white'
            } rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200`}
          />
        </div>

        <div>
          <label className={`block text-sm font-medium ${
            isDark ? 'text-gray-300' : 'text-gray-700'
          } mb-2`}>
            To Date
          </label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className={`w-full px-4 py-3 border ${
              isDark 
                ? 'border-gray-600 bg-gray-700 text-white' 
                : 'border-gray-300 bg-white'
            } rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200`}
          />
        </div>

        <div>
          <label className={`block text-sm font-medium ${
            isDark ? 'text-gray-300' : 'text-gray-700'
          } mb-2`}>
            Filter by Department
          </label>
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className={`w-full px-4 py-3 border ${
              isDark 
                ? 'border-gray-600 bg-gray-700 text-white' 
                : 'border-gray-300 bg-white'
            } rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200`}
          >
            <option value="">All Departments</option>
            {Object.keys(departments).map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={fetchReports}
          className="px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition duration-200"
        >
          🔍 Apply Filters
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={clearFilters}
          className="px-6 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition duration-200"
        >
          🗑️ Clear Filters
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={exportPDF}
          className="px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition duration-200"
        >
          📄 Export PDF
        </motion.button>
      </div>

      {/* Reports Display */}
      {loading ? (
        <div className="text-center py-12">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="text-6xl mb-4"
          >
            📊
          </motion.div>
          <div className={isDark ? 'text-gray-400' : 'text-gray-500'}>Loading reports...</div>
        </div>
      ) : groupedReports.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📊</div>
          <div className={`${isDark ? 'text-gray-400' : 'text-gray-500'} text-lg font-medium`}>No grouped summary reports available</div>
          <div className={`${isDark ? 'text-gray-500' : 'text-gray-400'} mt-2`}>Try different filters or submit reports.</div>
        </div>
      ) : (
        <div className="overflow-x-auto shadow-lg rounded-lg">
          <table className={`w-full min-w-max border-collapse border ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
            <thead>
              <tr className={isDark ? 'bg-gray-700' : 'bg-gray-100'}>
                <th className={`px-6 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider border-b ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>Department</th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider border-b ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>Team</th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider border-b ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>Reporting Manager</th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider border-b ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>No of Resource</th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider border-b ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>Tasks</th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider border-b ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>Statuses</th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider border-b ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>Reviewer</th>
              </tr>
            </thead>
            <tbody className={isDark ? 'divide-y divide-gray-700' : 'divide-y divide-gray-200'}>
              {groupedReports.map((group, index) => (
                <motion.tr
                  key={`${group.department}-${group.team}-${group.reporting_manager}-${index}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className={isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}
                >
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'} border-b ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>{group.department}</td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'} border-b ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>{group.team}</td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'} border-b ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>{group.reporting_manager}</td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm text-center ${isDark ? 'text-gray-300' : 'text-gray-700'} border-b ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>{group.no_of_resource}</td>
                  <td className={`px-6 py-4 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'} border-b ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                    {group.tasks_list && group.tasks_list.length > 0 ? (
                      <ul className="list-disc list-inside space-y-1">
                        {group.tasks_list.map((task, i) => (
                          <li key={i} className="truncate" title={task}>{task}</li> // Added truncate and title for long tasks
                        ))}
                      </ul>
                    ) : (
                      <span className="text-xs italic">No tasks</span>
                    )}
                  </td>
                  <td className={`px-6 py-4 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'} border-b ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                    {group.statuses_list && group.statuses_list.length > 0 ? (
                      <ul className="list-none list-inside space-y-1">
                        {group.statuses_list.map((status, i) => (
                          <li key={i}>
                             <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                status === 'Completed' ? (isDark ? 'bg-green-700 text-green-100' : 'bg-green-100 text-green-800') :
                                status === 'WIP' ? (isDark ? 'bg-blue-700 text-blue-100' :'bg-blue-100 text-blue-800') :
                                status === 'Delayed' ? (isDark ? 'bg-red-700 text-red-100' :'bg-red-100 text-red-800') :
                                (isDark ? 'bg-gray-600 text-gray-200' : 'bg-gray-100 text-gray-800')
                              }`}>
                              {status}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-xs italic">No statuses</span>
                    )}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'} border-b ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>{group.reviewer || 'N/A'}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Footer />
    </motion.div>
  );
};

// Main App Component
const App = () => {
  // Determine initial auth view based on URL
  const getInitialAuthView = () => {
    const queryParams = new URLSearchParams(window.location.search);
    if (queryParams.has('token')) { // Check for the 'token' query parameter for reset password page
      return 'resetPassword';
    }
    if (window.location.pathname.includes('/forgot-password')) { // Simple path check
        return 'forgotPassword';
    }
    return 'login'; // Default
  };

  const [authView, setAuthView] = useState(getInitialAuthView); // 'login', 'signup', 'forgotPassword', 'resetPassword'
  const [activeSection, setActiveSection] = useState('welcome');

  // Effect to update authView if URL changes (e.g. user navigates back/forward)
  useEffect(() => {
    const handlePopState = () => {
      setAuthView(getInitialAuthView());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);


  // Functions to switch auth views
  const switchToLogin = () => {
    window.history.pushState({}, '', '/');
    setAuthView('login');
  };
  const switchToSignup = () => {
    window.history.pushState({}, '', '/signup'); // Example, adjust if needed
    setAuthView('signup');
  };
  const switchToForgotPassword = () => {
    window.history.pushState({}, '', '/forgot-password');
    setAuthView('forgotPassword');
  };
   // switchToResetPassword is not directly called by button, but by URL trigger.

  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent 
          authView={authView}
          switchToLogin={switchToLogin}
          switchToSignup={switchToSignup}
          switchToForgotPassword={switchToForgotPassword}
          activeSection={activeSection}
          setActiveSection={setActiveSection}
        />
      </AuthProvider>
    </ThemeProvider>
  );
};

const AppContent = ({
  authView,
  switchToLogin,
  switchToSignup,
  switchToForgotPassword,
  activeSection,
  setActiveSection
}) => {
  const { user, loading } = useAuth();
  const { isDark } = useTheme();

  useEffect(() => {
    // If user logs in while on a reset password page, redirect to welcome
    if (user && (authView === 'forgotPassword' || authView === 'resetPassword')) {
      switchToLogin(); // This will set authView to 'login', and then the user check will pass
      setActiveSection('welcome'); // Ensure user is taken to dashboard
    }
  }, [user, authView, switchToLogin, setActiveSection]);


  if (loading) {
    return (
      <div className={`min-h-screen ${
        isDark 
          ? 'bg-gradient-to-br from-gray-900 to-gray-800' 
          : 'bg-gradient-to-br from-purple-50 to-blue-50'
      } flex items-center justify-center`}>
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="text-6xl mb-4"
          >
            ⏳
          </motion.div>
          <div className={isDark ? 'text-gray-400' : 'text-gray-600'}>Loading...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <AnimatePresence mode="wait">
        {authView === 'login' && (
          <Login
            key="login"
            onSwitchToSignup={switchToSignup}
            onSwitchToForgotPassword={switchToForgotPassword}
          />
        )}
        {authView === 'signup' && (
          <Signup key="signup" onSwitchToLogin={switchToLogin} />
        )}
        {authView === 'forgotPassword' && (
          <RequestPasswordResetPage key="forgotPassword" onSwitchToLogin={switchToLogin} />
        )}
        {authView === 'resetPassword' && (
          <ResetPasswordPage key="resetPassword" onSwitchToLogin={switchToLogin} />
        )}
      </AnimatePresence>
    );
  }

  // If user is logged in, show the main application
  return (
    <div className={`min-h-screen ${
      isDark 
        ? 'bg-gradient-to-br from-gray-900 to-gray-800' 
        : 'bg-gradient-to-br from-purple-50 to-blue-50'
    } p-4`}>
      <div className="max-w-7xl mx-auto">
        <Navigation activeSection={activeSection} setActiveSection={setActiveSection} />
        
        <AnimatePresence mode="wait">
          {activeSection === 'welcome' && <Welcome key="welcome" />}
          {activeSection === 'daily-report' && <DailyReport key="daily-report" />}
          {activeSection === 'team-report' && <TeamReport key="team-report" />}
          {activeSection === 'summary-report' && <SummaryReport key="summary-report" />}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default App;