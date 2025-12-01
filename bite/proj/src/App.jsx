import { useState, useEffect } from 'react';
import './LoginForm.css';
import AdminDashboard from './AdminDashboard.jsx';
import StaffDashboard from './StaffDashboard.jsx';
import UnifiedLogin from './UnifiedLogin.jsx';

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userType, setUserType] = useState(null);

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserType(null);
    // Update URL to login page
    window.history.pushState({ route: 'app-login' }, '', '/');
  };

  const handleLogin = (type) => {
    setIsLoggedIn(true);
    setUserType(type);
    // Update URL based on user type
    const defaultRoute = type === 'admin' ? '/admin-dashboard' : '/staff-dashboard';
    window.history.pushState({ route: `app-${type}-dashboard`, userType: type }, '', defaultRoute);
  };

  if (isLoggedIn) {
    if (userType === 'admin') {
      return <div data-route-name="app-admin-dashboard" data-user-type="admin"><AdminDashboard onLogout={handleLogout} /></div>;
    }
    if (userType === 'staff') {
      return <div data-route-name="app-staff-dashboard" data-user-type="staff"><StaffDashboard onLogout={handleLogout} /></div>;
    }
  }

  return <div data-route-name="app-login" data-user-type="unauthenticated"><UnifiedLogin onLogin={handleLogin} /></div>;
};

export default App;