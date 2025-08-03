import { useState, useEffect } from 'react';
import { FaTachometerAlt, FaCalendarCheck, FaUsers, FaMoneyBill, FaUser, FaUserMd, FaCalendarAlt, FaSyringe, FaChartBar, FaMapMarkedAlt } from 'react-icons/fa';
import logoImage from './assets/logo1.png';
import './AdminDashboard.css';
import StaffAppointmentList from './staff/StaffAppointmentList';
import StaffPatientListTracker from './staff/StaffPatientListTracker';
import StaffPatientPayments from './staff/StaffPatientPayments';
import StaffPatientHistory from './staff/StaffPatientHistory';
import StaffDashboardOverview from './staff/StaffDashboardOverview';
import ProfessionalHeader from './components/ProfessionalHeader.jsx';
import { supabase } from './supabase';

const StaffDashboard = ({ onLogout }) => {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

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

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <FaTachometerAlt /> },
    { id: 'appointment-list', label: 'Appointment List', icon: <FaCalendarCheck /> },  
    { id: 'patient-list', label: 'Patient List', icon: <FaUsers /> },
    { id: 'patient-history', label: 'Patient History', icon: <FaUser /> },
    { id: 'patient-payments', label: 'Patient Payments', icon: <FaMoneyBill /> },
    
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <StaffDashboardOverview />;
      case 'patient-list':
        return <StaffPatientListTracker />;
      case 'appointment-list':
        return <StaffAppointmentList />;
      case 'patient-history':
        return <StaffPatientHistory />;
      case 'patient-payments':
        return <StaffPatientPayments />;
      default:
        return (
          <div className="content-section">
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
              onClick={() => setActiveSection(item.id)}
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
        <div className="content-main">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard; 