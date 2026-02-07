import React, { useState, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('passenger'); 
  const [isLogin, setIsLogin] = useState(true); // Toggle between Login/Signup
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const { login, signup } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsSubmitting(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await signup(email, password);
        // After signup, we can either auto-login (which firebase does) or show success.
        // Firebase auto-signs in, so App.jsx will handle redirect.
      }
    } catch (err) {
      console.error("Auth Error:", err);
      setError(isLogin 
        ? 'Failed to sign in. Please check your credentials.' 
        : 'Failed to create account. Email might be in use.');
      setIsSubmitting(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setSuccessMessage('');
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
        <p className="login-subtitle">
          {isLogin ? 'Please sign in to your account' : 'Sign up to get started'}
        </p>
        
        {error && <div className="error-message" style={{ color: 'red', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              disabled={isSubmitting}
              minLength={6}
            />
          </div>

          <div className="form-group">
            <label>I am a...</label>
            <div className="role-selector">
              <button
                type="button"
                className={`role-btn ${role === 'passenger' ? 'active' : ''}`}
                onClick={() => setRole('passenger')}
                disabled={isSubmitting}
              >
                Passenger
              </button>
              <button
                type="button"
                className={`role-btn ${role === 'driver' ? 'active' : ''}`}
                onClick={() => setRole('driver')}
                disabled={isSubmitting}
              >
                Driver
              </button>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.5rem', textAlign: 'center' }}>
              * Role is determined by your account type.
            </p>
          </div>

          <button type="submit" className="login-btn" disabled={isSubmitting}>
            {isSubmitting 
              ? (isLogin ? 'Signing in...' : 'Creating Account...') 
              : (isLogin ? 'Login' : 'Sign Up')}
          </button>

          <div className="auth-toggle">
            <p>
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button 
                type="button" 
                className="toggle-link" 
                onClick={toggleMode}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: '#1565c0', 
                  fontWeight: 'bold', 
                  cursor: 'pointer', 
                  padding: 0,
                  fontSize: 'inherit'
                }}
              >
                {isLogin ? 'Sign Up' : 'Login'}
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
