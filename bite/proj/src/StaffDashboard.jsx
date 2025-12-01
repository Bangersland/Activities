import { useState, useEffect } from 'react';
import { FaTachometerAlt, FaCalendarCheck, FaUsers, FaMoneyBill, FaUser, FaUserMd, FaCalendarAlt, FaSyringe, FaChartBar, FaMapMarkedAlt } from 'react-icons/fa';
import logoImage from './assets/logo1.png';
import './AdminDashboard.css';
import StaffAppointmentList from './staff/StaffAppointmentList';
import StaffPatientListTracker from './staff/StaffPatientListTracker';
// import StaffPatientPayments from './staff/StaffPatientPayments';
import StaffPatientHistory from './staff/StaffPatientHistory';
import StaffDashboardOverview from './staff/StaffDashboardOverview';
import ProfessionalHeader from './components/ProfessionalHeader.jsx';
import { supabase } from './supabase';

const StaffDashboard = ({ onLogout }) => {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <FaTachometerAlt />, routeName: 'staff-dashboard' },
    { id: 'appointment-list', label: 'Appointment List', icon: <FaCalendarCheck />, routeName: 'staff-appointment-list' },  
    { id: 'patient-list', label: 'Patient List', icon: <FaUsers />, routeName: 'staff-patient-list' },
    { id: 'patient-history', label: 'Patient History', icon: <FaUser />, routeName: 'staff-patient-history' },
    // { id: 'patient-payments', label: 'Patient Payments', icon: <FaMoneyBill />, routeName: 'staff-patient-payments' },
    
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

  // Sync URL with active section on mount and when section changes
  useEffect(() => {
    const currentRoute = menuItems.find(item => item.id === activeSection);
    const routeName = currentRoute?.routeName || 'staff-dashboard';
    
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
    if (path !== '/' && path !== '/staff-dashboard') {
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
      const routeName = currentRoute?.routeName || 'staff-unknown';
      console.log(`[StaffDashboard] Active route: ${routeName} | Section ID: ${activeSection}`);
    }
  }, [activeSection, menuItems]);

  const renderContent = () => {
    const currentRoute = menuItems.find(item => item.id === activeSection);
    const routeName = currentRoute?.routeName || 'staff-unknown';
    
    // Log route change for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log(`[StaffDashboard] Route changed to: ${routeName} (section: ${activeSection})`);
    }
    
    switch (activeSection) {
      case 'dashboard':
        return <div data-route-name={routeName} data-section-id="dashboard"><StaffDashboardOverview /></div>;
      case 'patient-list':
        return <div data-route-name={routeName} data-section-id="patient-list"><StaffPatientListTracker /></div>;
      case 'appointment-list':
        return <div data-route-name={routeName} data-section-id="appointment-list"><StaffAppointmentList /></div>;
      case 'patient-history':
        return <div data-route-name={routeName} data-section-id="patient-history"><StaffPatientHistory /></div>;
      case 'patient-payments':
        return <div data-route-name={routeName} data-section-id="patient-payments"><StaffPatientPayments /></div>;
      default:
        return (
          <div className="content-section" data-route-name="staff-default" data-section-id={activeSection}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              margin: '20px'
            }}>
              <h2 style={{
                margin: '0 0 20px 0',
                fontSize: '24px',
                fontWeight: '700',
                color: '#1f2937'
              }}>
                Staff Portal - {activeSection.replace('-', ' ').toUpperCase()}
              </h2>
              
              <div style={{
                textAlign: 'center',
                padding: '40px',
                color: '#6b7280'
              }}>
                <h3>Staff Section</h3>
                <p>This section is under development for staff members.</p>
              </div>
            </div>
          </div>
        );
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
        <div className="content-main" data-current-route={activeSection}>
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard; 