import { useState } from 'react';
import './LoginForm.css';
import logo1 from './assets/logo1.png';
import { signInWithUsername } from './supabase';

const UnifiedLogin = ({ onLogin }) => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (credentials.username && credentials.password) {
      try {
        console.log('Attempting login with:', credentials.username);
        
        // Use the enhanced signInWithUsername function that handles both username and email
        const { data, error } = await signInWithUsername(
          credentials.username,
          credentials.password
        );

        console.log('Login response:', { data, error });

        if (error) {
          console.error('Login error:', error);
          setError(`Login failed: ${error.message}`);
        } else if (data?.user) {
          console.log('Login successful:', data.user);
          const userRole = data.user?.user_metadata?.role || 'staff';
          console.log('User role:', userRole);
          onLogin(userRole);
        } else {
          setError('Invalid username/email or password');
        }
      } catch (error) {
        console.error('Login exception:', error);
        setError('Login failed. Please try again.');
      }
    } else {
      setError('Please enter both username/email and password');
    }
    
    setIsLoading(false);
  };

  return (
    <div className="da-container">
      <div className="da-login-box">
        <div className="da-header">
          <img 
            src={logo1} 
            alt="Bitecare Logo" 
            style={{
              width: '60px',
              height: '60px',
              marginBottom: '-15px',
              objectFit: 'contain'
            }}
          />
          <h1>Bitecare</h1>
          <p>RHU Animal Bite Treatment Center</p>
        </div>

        <form onSubmit={handleSubmit} className="da-form">
          {error && <div className="da-error">{error}</div>}

          <div className="da-form-group">
            <label htmlFor="username">Username or Email</label>
            <input
              type="text"
              id="username"
              name="username"
              value={credentials.username}
              onChange={handleChange}
              placeholder="Enter your username or email"
              autoComplete="username"
            />
          </div>

          <div className="da-form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={credentials.password}
              onChange={handleChange}
              placeholder="Enter your password"
              autoComplete="current-password"
            />
          </div>

          <button type="submit" disabled={isLoading} className="da-submit-btn">
            {isLoading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        {/* <div style={{ 
          textAlign: 'center', 
          marginTop: '15px',
          padding: '12px 16px',
          background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.08), rgba(118, 75, 162, 0.08))',
          borderRadius: '12px',
          fontSize: '13px',
          color: '#4a5568',
          border: '1px solid rgba(102, 126, 234, 0.15)',
          backdropFilter: 'blur(10px)'
        }}>
          <p style={{ margin: '0 0 8px 0', fontWeight: '600', color: '#2d3748' }}>Login Instructions:</p>
          <div style={{ display: 'grid', gap: '4px', fontSize: '11px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: '500' }}>Staff Login:</span>
              <span style={{ fontFamily: 'monospace', color: '#667eea' }}>Username or Email</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: '500' }}>Example Staff:</span>
              <span style={{ fontFamily: 'monospace', color: '#667eea' }}>Nurse1 / 143kate.mekachiku@gmail.com</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: '500' }}>Admin Login:</span>
              <span style={{ fontFamily: 'monospace', color: '#667eea' }}>admin / admin123</span>
            </div>
          </div>
        </div> */}

        {/* <div style={{ 
          textAlign: 'center', 
          marginTop: '15px',
          padding: '12px 16px',
          background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.08), rgba(118, 75, 162, 0.08))',
          borderRadius: '12px',
          fontSize: '13px',
          color: '#4a5568',
          border: '1px solid rgba(102, 126, 234, 0.15)',
          backdropFilter: 'blur(10px)'
        }}>
          <p style={{ margin: '0 0 8px 0', fontWeight: '600', color: '#2d3748' }}>Login Instructions:</p>
          <div style={{ display: 'grid', gap: '4px', fontSize: '11px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: '500' }}>Use Username:</span>
              <span style={{ fontFamily: 'monospace', color: '#667eea' }}>kmunest</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: '500' }}>Or Email:</span>
              <span style={{ fontFamily: 'monospace', color: '#667eea' }}>kmunest@gmail.com</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: '500' }}>Demo Admin:</span>
              <span style={{ fontFamily: 'monospace', color: '#667eea' }}>admin / admin123</span>
            </div>
          </div> */}
        {/* </div> */}

        {/* <div className="da-footer">
          <div className="da-copyright">
            <p>Bitecare System - RHU Animal Bite Treatment Center</p>
            <p>Enter your credentials to continue</p>
          </div>
        </div> */}
      </div>
    </div>
  );
};

export default UnifiedLogin; 