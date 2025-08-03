import { useState } from 'react';
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
  };

  const handleLogin = (type) => {
    setIsLoggedIn(true);
    setUserType(type);
  };

  if (isLoggedIn) {
    if (userType === 'admin') {
      return <AdminDashboard onLogout={handleLogout} />;
    }
    if (userType === 'staff') {
      return <StaffDashboard onLogout={handleLogout} />;
    }
  }

  return <UnifiedLogin onLogin={handleLogin} />;
};

export default App;