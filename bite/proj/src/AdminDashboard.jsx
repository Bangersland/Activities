import { useState, useEffect } from 'react';
import './AdminDashboard.css';
import Dashboard from './components/Dashboard.jsx';
import AppointmentList from './components/AppointmentList.jsx';
import PatientList from './components/PatientList.jsx';
// import PatientPayments from './components/PatientPayments.jsx';
import Staff from './components/Staff.jsx';
import Schedule from './components/Schedule.jsx';
import VaccineManagement from './components/VaccineManagement.jsx';
import AnalyticsReports from './components/AnalyticsReports.jsx';
import Map from './components/Map.jsx';
import ProfessionalHeader from './components/ProfessionalHeader.jsx';
import { FaTachometerAlt, FaCalendarCheck, FaUsers, FaUserMd, FaCalendarAlt, FaSyringe, FaChartBar, FaMapMarkedAlt, FaBell, FaTimes } from 'react-icons/fa';
import { supabase } from './supabase';
import logoImage from './assets/logo1.png';

const AdminDashboard = ({ onLogout }) => {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [notification, setNotification] = useState(null);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <FaTachometerAlt />, routeName: 'admin-dashboard' },
    { id: 'appointment-list', label: 'Appointment List', icon: <FaCalendarCheck />, routeName: 'admin-appointment-list' },
    { id: 'patient-list', label: 'Patient History', icon: <FaUsers />, routeName: 'admin-patient-list' },
    // { id: 'patient-payments', label: 'Patient Payments', icon: <FaMoneyBill />, routeName: 'admin-patient-payments' },
    { id: 'staff', label: 'Staff', icon: <FaUserMd />, routeName: 'admin-staff' },
    { id: 'schedule', label: 'Schedule', icon: <FaCalendarAlt />, routeName: 'admin-schedule' },
    { id: 'vaccine-management', label: 'Vaccine Management', icon: <FaSyringe />, routeName: 'admin-vaccine-management' },
    { id: 'analytics-reports', label: 'Analytics Reports', icon: <FaChartBar />, routeName: 'admin-analytics-reports' },
    { id: 'map', label: 'Map', icon: <FaMapMarkedAlt />, routeName: 'admin-map' }
  ];

  useEffect(() => {
    // Get current user
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    getUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setCurrentUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Set up real-time subscription for new appointments
  useEffect(() => {
    // Subscribe to new appointments
    const channel = supabase
      .channel('appointments-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'appointments',
          filter: 'status=eq.pending'
        },
        (payload) => {
          // Show notification when a new pending appointment is created
          const newAppointment = payload.new;
          setNotification({
            id: newAppointment.id,
            message: `New appointment booked by ${newAppointment.patient_name || 'a patient'}`,
            appointmentDate: newAppointment.appointment_date,
            timestamp: new Date()
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleNotificationClick = () => {
    // Navigate to appointment list (which defaults to pending tab)
    setActiveSection('appointment-list');
    window.history.pushState({ route: 'admin-appointment-list', section: 'appointment-list' }, '', '/admin-appointment-list');
    setNotification(null);
    // Force a small delay to ensure the component re-renders
    setTimeout(() => {
      window.dispatchEvent(new Event('appointment-list-refresh'));
    }, 100);
  };

  const handleCloseNotification = () => {
    setNotification(null);
  };

  // Sync URL with active section on mount and when section changes
  useEffect(() => {
    const currentRoute = menuItems.find(item => item.id === activeSection);
    const routeName = currentRoute?.routeName || 'admin-dashboard';
    
    // Update URL without page reload
    const newUrl = `/${routeName}`;
    if (window.location.pathname !== newUrl) {
      window.history.pushState({ route: routeName, section: activeSection }, '', newUrl);
    }
  }, [activeSection, menuItems]);

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = (event) => {
      if (event.state && event.state.section) {
        setActiveSection(event.state.section);
      } else {
        // Parse URL to determine section
        const path = window.location.pathname;
        const routeFromUrl = path.replace('/', '');
        const menuItem = menuItems.find(item => item.routeName === routeFromUrl);
        if (menuItem) {
          setActiveSection(menuItem.id);
        }
      }
    };

    // Check initial URL on mount
    const path = window.location.pathname;
    if (path !== '/' && path !== '/admin-dashboard') {
      const routeFromUrl = path.replace('/', '');
      const menuItem = menuItems.find(item => item.routeName === routeFromUrl);
      if (menuItem) {
        setActiveSection(menuItem.id);
      }
    }

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [menuItems]);

  // Track route changes for debugging
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const currentRoute = menuItems.find(item => item.id === activeSection);
      const routeName = currentRoute?.routeName || 'admin-unknown';
      console.log(`[AdminDashboard] Active route: ${routeName} | Section ID: ${activeSection}`);
    }
  }, [activeSection, menuItems]);

  const renderContent = () => {
    const currentRoute = menuItems.find(item => item.id === activeSection);
    const routeName = currentRoute?.routeName || 'admin-unknown';
    
    // Log route change for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log(`[AdminDashboard] Route changed to: ${routeName} (section: ${activeSection})`);
    }
    
    switch (activeSection) {
      case 'dashboard':
        return <div data-route-name={routeName} data-section-id="dashboard"><Dashboard /></div>;
      case 'appointment-list':
        return <div data-route-name={routeName} data-section-id="appointment-list"><AppointmentList /></div>;
      case 'patient-list':
        return <div data-route-name={routeName} data-section-id="patient-list"><PatientList /></div>;
      case 'patient-payments':
        return <div data-route-name={routeName} data-section-id="patient-payments"><PatientPayments /></div>;
      case 'staff':
        return <div data-route-name={routeName} data-section-id="staff"><Staff /></div>;
      case 'schedule':
        return <div data-route-name={routeName} data-section-id="schedule"><Schedule /></div>;
      case 'vaccine-management':
        return <div data-route-name={routeName} data-section-id="vaccine-management"><VaccineManagement /></div>;
      case 'analytics-reports':
        return <div data-route-name={routeName} data-section-id="analytics-reports"><AnalyticsReports /></div>;
      case 'map':
        return <div data-route-name={routeName} data-section-id="map"><Map /></div>;
      default:
        return <div data-route-name="admin-default" data-section-id="dashboard"><Dashboard /></div>;
    }
  };

  return (
    <div className="admin-dashboard">
      {/* Sidebar */}
      <div className={`sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <div className="logo-section">
            <img
              src={logoImage}
              alt="BOGO CITY HEALTH OFFICE CEBU"
              style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '2px solid rgba(255, 255, 255, 0.2)',
                marginRight: '15px'
              }}
            />
            <h2>Bitecare</h2>
          </div>
          <button 
            className="sidebar-toggle" 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            title={isSidebarOpen ? 'Collapse Sidebar' : 'Expand Sidebar'}
          >
            {isSidebarOpen ? '◀' : '▶'}
          </button>
        </div>
        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${activeSection === item.id ? 'active' : ''}`}
              onClick={() => {
                setActiveSection(item.id);
                // Update URL immediately
                window.history.pushState({ route: item.routeName, section: item.id }, '', `/${item.routeName}`);
              }}
              data-route-name={item.routeName}
              data-section-id={item.id}
              title={`Route: ${item.routeName}`}
            >
              <span className="nav-icon">{item.icon}</span>
              {isSidebarOpen && <span className="nav-label">{item.label}</span>}
            </button>
          ))}
        </nav>
        
      </div>
      {/* Main Content */}
      <div className={`main-content ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <ProfessionalHeader 
          user={currentUser} 
          onLogout={onLogout}
        />
        <main className="content-main" data-current-route={activeSection}>
          {renderContent()}
        </main>
      </div>

      {/* Appointment Notification */}
      {notification && (
        <div className="appointment-notification" onClick={handleNotificationClick}>
          <div className="notification-content">
            <div className="notification-icon">
              <FaBell />
            </div>
            <div className="notification-text">
              <div className="notification-title">New Appointment</div>
              <div className="notification-message">{notification.message}</div>
              {notification.appointmentDate && (
                <div className="notification-date">
                  Date: {new Date(notification.appointmentDate).toLocaleDateString()}
                </div>
              )}
            </div>
            <button 
              className="notification-close" 
              onClick={(e) => {
                e.stopPropagation();
                handleCloseNotification();
              }}
            >
              <FaTimes />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard; 