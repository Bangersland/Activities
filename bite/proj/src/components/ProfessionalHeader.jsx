import React, { useState, useEffect } from 'react';
import { FaUser, FaSignOutAlt, FaClock, FaCalendarAlt, FaCog } from 'react-icons/fa';
import { supabase } from '../supabase';

const ProfessionalHeader = ({ user, onLogout }) => {
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [lastLoginTime, setLastLoginTime] = useState(null);

  useEffect(() => {
    // Update date and time every second
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    // Get last login time from user metadata
    if (user?.user_metadata?.last_sign_in_at) {
      setLastLoginTime(new Date(user.user_metadata.last_sign_in_at));
    }

    return () => clearInterval(timer);
  }, [user]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showProfileDropdown && !event.target.closest('.profile-dropdown')) {
        setShowProfileDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileDropdown]);



  const formatLastLogin = (date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      if (onLogout) {
        onLogout();
      }
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const getUserInitials = (user) => {
    if (user?.user_metadata?.first_name && user?.user_metadata?.last_name) {
      return `${user.user_metadata.first_name.charAt(0)}${user.user_metadata.last_name.charAt(0)}`.toUpperCase();
    }
    if (user?.user_metadata?.username) {
      return user.user_metadata.username.charAt(0).toUpperCase();
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  const getUserPhoto = (user) => {
    // Check for profile image in user metadata
    if (user?.user_metadata?.profile_image) {
      return user.user_metadata.profile_image;
    }
    
    // Check for profile image in staff_details
    if (user?.user_metadata?.profile_image_url) {
      return user.user_metadata.profile_image_url;
    }
    
    return null;
  };

  const getUserDisplayName = (user) => {
    if (user?.user_metadata?.first_name && user?.user_metadata?.last_name) {
      return `${user.user_metadata.first_name} ${user.user_metadata.last_name}`;
    }
    if (user?.user_metadata?.username) {
      return user.user_metadata.username;
    }
    if (user?.email) {
      return user.email;
    }
    return 'User';
  };

  const getUserRole = (user) => {
    return user?.user_metadata?.role || user?.app_metadata?.role || 'User';
  };

  return (
    <header className="professional-header">
      <div className="header-left">
        <div className="header-center">
          <h1 className="header-title">
            RHU Animal Bite Treatment Center
          </h1>
        </div>
      </div>

      <div className="header-right">
        <div className="datetime-section">
          <div className="date-info">
            <FaCalendarAlt className="date-icon" />
            <span className="date-text">
              {currentDateTime.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </span>
          </div>
          <div className="time-info">
            <span className="time-text">
              {currentDateTime.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              })}
            </span>
          </div>
        </div>

        <div className="user-section">
          <div className="user-info">
            <div className="user-details">
              {lastLoginTime && (
                <div className="last-login">
                  Last login: {formatLastLogin(lastLoginTime)}
                </div>
              )}
            </div>
          </div>
          
          <div className="profile-dropdown">
                         <button 
               className="profile-trigger"
               onClick={() => setShowProfileDropdown(!showProfileDropdown)}
             >
               <div className="user-avatar">
                 {getUserPhoto(user) ? (
                   <img 
                     src={getUserPhoto(user)} 
                     alt="User Profile" 
                     className="user-photo"
                   />
                 ) : (
                   getUserInitials(user)
                 )}
               </div>
               <FaUser className="profile-icon" />
             </button>
            
            {showProfileDropdown && (
              <div className="dropdown-menu">
                                 <div className="dropdown-header">
                   <div className="dropdown-avatar">
                     {getUserPhoto(user) ? (
                       <img 
                         src={getUserPhoto(user)} 
                         alt="User Profile" 
                         className="dropdown-photo"
                       />
                     ) : (
                       getUserInitials(user)
                     )}
                   </div>
                   <div className="dropdown-user-info">
                     <div className="dropdown-name">{getUserDisplayName(user)}</div>
                     <div className="dropdown-role">{getUserRole(user)}</div>
                     <div className="dropdown-email">{user?.email}</div>
                   </div>
                 </div>
                
                <div className="dropdown-divider"></div>
                
                <div className="dropdown-actions">
                  <button className="dropdown-item logout-item" onClick={handleLogout}>
                    <FaSignOutAlt className="dropdown-item-icon" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .professional-header {
          background: white;
          color: #1f2937;
          padding: 16px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          position: relative;
          z-index: 100;
          border-bottom: 1px solid #e5e7eb;
        }

        .header-left {
          display: flex;
          align-items: center;
          flex: 1;
        }

        .header-center {
          text-align: center;
          flex: 1;
          max-width: 600px;
        }

        .header-title {
          margin: 0;
          font-size: 20px;
          font-weight: 700;
          letter-spacing: 0.5px;
          color: #1f2937;
          text-align: left;
        }

        .header-subtitle {
          margin: 4px 0 0 0;
          font-size: 12px;
          opacity: 0.6;
          font-weight: 400;
          color: #6b7280;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .datetime-section {
          display: flex;
          flex-direction: column;
          gap: 4px;
          text-align: right;
        }

        .date-info, .time-info {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          opacity: 0.8;
          color: #6b7280;
        }

        .date-icon, .time-icon {
          font-size: 10px;
          opacity: 0.6;
          color: #9ca3af;
        }

        .date-text, .time-text {
          font-weight: 500;
          color: #374151;
        }

        .user-section {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .user-info {
          text-align: right;
        }

        .user-details {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .user-name {
          font-weight: 600;
          font-size: 14px;
          color: #1f2937;
        }

        .user-role {
          font-size: 11px;
          opacity: 0.7;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #6b7280;
        }

        .last-login {
          font-size: 10px;
          opacity: 0.6;
          margin-top: 2px;
          color: #9ca3af;
        }

        .profile-dropdown {
          position: relative;
        }

        .profile-trigger {
          background: #f3f4f6;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 8px 12px;
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          color: #374151;
        }

        .profile-trigger:hover {
          background: #e5e7eb;
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .user-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 12px;
          color: white;
          overflow: hidden;
        }

        .user-photo {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 50%;
        }

        .profile-icon {
          font-size: 12px;
          opacity: 0.7;
          color: #6b7280;
        }

        .dropdown-menu {
          position: absolute;
          top: 100%;
          right: 0;
          background: white;
          border-radius: 12px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          min-width: 280px;
          margin-top: 8px;
          z-index: 1000;
          animation: dropdownSlideIn 0.2s ease-out;
        }

        .dropdown-menu::before {
          content: '';
          position: absolute;
          top: -8px;
          right: 16px;
          width: 0;
          height: 0;
          border-left: 8px solid transparent;
          border-right: 8px solid transparent;
          border-bottom: 8px solid white;
        }

        @keyframes dropdownSlideIn {
          from {
            opacity: 0;
            transform: translateY(-10px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .dropdown-header {
          padding: 20px;
          border-bottom: 1px solid #f3f4f6;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .dropdown-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 16px;
          color: white;
          overflow: hidden;
        }

        .dropdown-photo {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 50%;
        }

        .dropdown-user-info {
          flex: 1;
        }

        .dropdown-name {
          font-weight: 600;
          color: #1f2937;
          font-size: 14px;
          margin-bottom: 2px;
        }

        .dropdown-role {
          color: #6b7280;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
        }

        .dropdown-email {
          color: #9ca3af;
          font-size: 11px;
        }

        .dropdown-divider {
          height: 1px;
          background: #f3f4f6;
          margin: 8px 0;
        }

        .dropdown-actions {
          padding: 8px 0;
        }

        .dropdown-item {
          width: 100%;
          padding: 12px 20px;
          background: none;
          border: none;
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          color: #374151;
          font-size: 14px;
        }

        .dropdown-item:hover {
          background: #f9fafb;
          color: #1f2937;
        }

        .dropdown-item-icon {
          font-size: 14px;
          opacity: 0.7;
        }

        .logout-item {
          color: #dc2626;
        }

        .logout-item:hover {
          background: #fef2f2;
          color: #dc2626;
        }

        @media (max-width: 768px) {
          .professional-header {
            padding: 12px 16px;
            flex-direction: column;
            gap: 12px;
          }

          .header-left, .header-right {
            width: 100%;
            justify-content: center;
          }

          .header-center {
            order: -1;
          }

          .header-title {
            font-size: 16px;
          }

          .header-subtitle {
            font-size: 11px;
          }

          .user-section {
            justify-content: center;
          }

          .user-info {
            text-align: center;
          }
        }
      `}</style>
    </header>
  );
};

export default ProfessionalHeader; 