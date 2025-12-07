import React, { useState, useEffect } from 'react';
import { FaEye, FaCheck, FaSearch, FaCog, FaChevronDown, FaUser, FaPhone, FaMapMarkerAlt, FaCalendar, FaClock, FaPaw, FaExclamationTriangle, FaInfoCircle, FaTimes } from 'react-icons/fa';
import { getAllAppointments, confirmAppointment, sendPatientNotification, getPendingAppointments, getConfirmedAppointments } from '../supabase';

const AppointmentList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [openDropdown, setOpenDropdown] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' or 'confirmed'
  const [pendingCount, setPendingCount] = useState(0);
  const [confirmedCount, setConfirmedCount] = useState(0);

  // Fetch appointments when component mounts or tab changes
  useEffect(() => {
    fetchAppointments();
  }, [activeTab]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openDropdown && !event.target.closest('.dropdown-container')) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openDropdown]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      
      // Fetch appointments based on active tab from database
      let result;
      if (activeTab === 'pending') {
        result = await getPendingAppointments();
      } else {
        result = await getConfirmedAppointments();
      }
      
      const { data, error } = result;
      
      if (error) {
        setMessage(`Error loading appointments: ${error.message}`);
      } else {
        setAppointments(data || []);
      }
      
      // Also fetch counts for both tabs
      const [pendingResult, confirmedResult] = await Promise.all([
        getPendingAppointments(),
        getConfirmedAppointments()
      ]);
      
      if (pendingResult.data) setPendingCount(pendingResult.data.length);
      if (confirmedResult.data) setConfirmedCount(confirmedResult.data.length);
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAppointment = async (appointmentId, patientEmail, patientName) => {
    try {
      setLoading(true);
      const { error } = await confirmAppointment(appointmentId);
      
      if (error) {
        setMessage(`Error confirming appointment: ${error.message}`);
      } else {
        setMessage('✅ Appointment confirmed successfully!');
        
        // Send notification to patient
        await sendPatientNotification(
          appointmentId,
          `Your appointment has been confirmed. We look forward to seeing you!`,
          'appointment_confirmed'
        );
        
        // Refresh appointments list and counts
        await fetchAppointments();
        setOpenDropdown(null);
        
        // Auto-close success message
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Filter appointments based on search term (status filtering is done in database)
  const filteredAppointments = appointments.filter(appointment => {
    // Apply search filter
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      (appointment.patient_name && appointment.patient_name.toLowerCase().includes(searchLower)) ||
      (appointment.patient_contact && appointment.patient_contact.toLowerCase().includes(searchLower)) ||
      (appointment.patient_address && appointment.patient_address.toLowerCase().includes(searchLower)) ||
      (appointment.biting_animal && appointment.biting_animal.toLowerCase().includes(searchLower)) ||
      (appointment.place_bitten && appointment.place_bitten.toLowerCase().includes(searchLower)) ||
      (appointment.appointment_date && appointment.appointment_date.includes(searchLower)) ||
      (appointment.status && appointment.status.toLowerCase().includes(searchLower))
    );
  });

  // Pagination
  const totalPages = Math.ceil(filteredAppointments.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedAppointments = filteredAppointments.slice(startIndex, startIndex + rowsPerPage);

  // Reset to first page when search term, rows per page, or active tab changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, rowsPerPage, activeTab]);

  const handleViewDetails = (appointment) => {
    setSelectedAppointment(appointment);
    setIsDetailsModalOpen(true);
    setOpenDropdown(null);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'confirmed':
      case 'completed': // Treat completed as confirmed for display
        return { backgroundColor: '#10b981', color: 'white' };
      case 'pending':
        return { backgroundColor: '#f59e0b', color: 'white' };
      case 'cancelled':
        return { backgroundColor: '#ef4444', color: 'white' };
      default:
        return { backgroundColor: '#6b7280', color: 'white' };
    }
  };

  // Get display status - show "confirmed" for completed appointments
  const getDisplayStatus = (status) => {
    if (status === 'completed') {
      return 'confirmed';
    }
    return status || 'pending';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'Not specified';
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="content-section" style={{
      width: '100%',
      height: '100vh',
      overflow: 'auto'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '32px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        margin: '20px',
        border: '1px solid #f1f5f9',
        minHeight: 'calc(100vh - 40px)',
        width: 'calc(100% - 40px)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px'
        }}>
          <h2 style={{
            margin: 0,
            fontSize: '28px',
            fontWeight: '800',
            color: '#0f172a',
            letterSpacing: '-0.025em'
          }}>
             Appointment Management
          </h2>
          {message && (
            <div style={{
              padding: '12px 16px',
              borderRadius: '8px',
              backgroundColor: message.includes('Error') ? '#fef2f2' : '#f0fdf4',
              color: message.includes('Error') ? '#dc2626' : '#16a34a',
              border: `1px solid ${message.includes('Error') ? '#fecaca' : '#bbf7d0'}`,
              fontSize: '14px',
              fontWeight: '500'
            }}>
              {message}
            </div>
          )}
        
        </div>

        {/* Tabs for Pending and Completed */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '24px',
          borderBottom: '2px solid #e5e7eb',
          paddingBottom: '0'
        }}>
          <button
            onClick={() => setActiveTab('pending')}
            style={{
              padding: '12px 24px',
              backgroundColor: activeTab === 'pending' ? '#3b82f6' : 'transparent',
              color: activeTab === 'pending' ? 'white' : '#6b7280',
              border: 'none',
              borderBottom: activeTab === 'pending' ? '3px solid #3b82f6' : '3px solid transparent',
              borderRadius: '8px 8px 0 0',
              fontSize: '15px',
              fontWeight: activeTab === 'pending' ? '600' : '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== 'pending') {
                e.target.style.backgroundColor = '#f3f4f6';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== 'pending') {
                e.target.style.backgroundColor = 'transparent';
              }
            }}
          >
            Pending Appointments
            <span style={{
              backgroundColor: activeTab === 'pending' ? 'rgba(255, 255, 255, 0.3)' : '#e5e7eb',
              color: activeTab === 'pending' ? 'white' : '#6b7280',
              padding: '2px 8px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: '600'
            }}>
              {pendingCount}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('confirmed')}
            style={{
              padding: '12px 24px',
              backgroundColor: activeTab === 'confirmed' ? '#3b82f6' : 'transparent',
              color: activeTab === 'confirmed' ? 'white' : '#6b7280',
              border: 'none',
              borderBottom: activeTab === 'confirmed' ? '3px solid #3b82f6' : '3px solid transparent',
              borderRadius: '8px 8px 0 0',
              fontSize: '15px',
              fontWeight: activeTab === 'confirmed' ? '600' : '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== 'confirmed') {
                e.target.style.backgroundColor = '#f3f4f6';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== 'confirmed') {
                e.target.style.backgroundColor = 'transparent';
              }
            }}
          >
            Confirmed Appointments
            <span style={{
              backgroundColor: activeTab === 'confirmed' ? 'rgba(255, 255, 255, 0.3)' : '#e5e7eb',
              color: activeTab === 'confirmed' ? 'white' : '#6b7280',
              padding: '2px 8px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: '600'
            }}>
              {confirmedCount}
            </span>
          </button>
        </div>

        {/* Search and Controls */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          gap: '16px'
        }}>
          <div style={{
            position: 'relative',
            flex: 1,
            maxWidth: '400px'
          }}>
            <FaSearch style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#6b7280',
              fontSize: '14px'
            }} />
            <input
              type="text"
              placeholder="Search by name, contact, address, animal, place..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px 12px 40px',
                border: '2px solid #e2e8f0',
                borderRadius: '10px',
                fontSize: '14px',
                outline: 'none',
                transition: 'all 0.2s ease',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#3b82f6';
                e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e2e8f0';
                e.target.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
              }}
            />
          </div>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <label style={{
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151'
            }}>Show:</label>
            <select
              value={rowsPerPage}
              onChange={(e) => setRowsPerPage(Number(e.target.value))}
              style={{
                padding: '8px 12px',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                backgroundColor: 'white',
                cursor: 'pointer'
              }}
            >
              <option value={5}>5 rows</option>
              <option value={10}>10 rows</option>
              <option value={25}>25 rows</option>
              <option value={50}>50 rows</option>
              <option value={100}>100 rows</option>
            </select>
          </div>
        </div>

        {/* Patients Table */}
        <div style={{
          overflowX: 'auto',
          maxHeight: '70vh',
          overflowY: 'auto',
          border: '1px solid #e5e7eb',
          borderRadius: '16px'
        }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            backgroundColor: 'white',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 10px 25px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            border: '1px solid #e5e7eb'
          }}>
            <thead style={{
              backgroundColor: '#3b82f6',
              color: 'white',
              position: 'relative'
            }}>
              <tr>
                <th style={{
                  padding: '24px 20px',
                  textAlign: 'left',
                  fontWeight: '700',
                  fontSize: '13px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  borderBottom: '2px solid rgba(255, 255, 255, 0.2)',
                  position: 'relative'
                }}>
                  Patient Name
                </th>
                <th style={{
                  padding: '24px 20px',
                  textAlign: 'left',
                  fontWeight: '700',
                  fontSize: '13px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  borderBottom: '2px solid rgba(255, 255, 255, 0.2)'
                }}>
                
                  Phone
                </th>
                <th style={{
                  padding: '24px 20px',
                  textAlign: 'left',
                  fontWeight: '700',
                  fontSize: '13px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  borderBottom: '2px solid rgba(255, 255, 255, 0.2)'
                }}>
                  Date
                </th>
                <th style={{
                  padding: '24px 20px',
                  textAlign: 'left',
                  fontWeight: '700',
                  fontSize: '13px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  borderBottom: '2px solid rgba(255, 255, 255, 0.2)'
                }}>
                  Address
                </th>
                <th style={{
                  padding: '24px 20px',
                  textAlign: 'left',
                  fontWeight: '700',
                  fontSize: '13px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  borderBottom: '2px solid rgba(255, 255, 255, 0.2)'
                }}>
                  Reason
                </th>
                <th style={{
                  padding: '24px 20px',
                  textAlign: 'center',
                  fontWeight: '700',
                  fontSize: '13px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  borderBottom: '2px solid rgba(255, 255, 255, 0.2)'
                }}>
                  Location
                </th>
                <th style={{
                  padding: '24px 20px',
                  textAlign: 'center',
                  fontWeight: '700',
                  fontSize: '13px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  borderBottom: '2px solid rgba(255, 255, 255, 0.2)'
                }}>
                  Status
                </th>
                <th style={{
                  padding: '24px 20px',
                  textAlign: 'center',
                  fontWeight: '700',
                  fontSize: '13px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  borderBottom: '2px solid rgba(255, 255, 255, 0.2)'
                }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" style={{
                    padding: '40px',
                    textAlign: 'center',
                    color: '#6b7280',
                    fontSize: '16px'
                  }}>
                    Loading appointments...
                  </td>
                </tr>
              ) : filteredAppointments.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{
                    padding: '40px',
                    textAlign: 'center',
                    color: '#6b7280',
                    fontSize: '16px'
                  }}>
                    No appointments found
                  </td>
                </tr>
              ) : (
                paginatedAppointments.map((appointment) => {
                  const statusBadge = getStatusBadge(appointment.status);
                  const displayStatus = getDisplayStatus(appointment.status);

                return (
                  <tr key={appointment.id} style={{
                    borderBottom: '1px solid #f1f5f9',
                    transition: 'all 0.3s ease',
                    position: 'relative'
                  }}>
                    <td style={{
                      padding: '20px',
                      fontWeight: '700',
                      color: '#0f172a',
                      fontSize: '15px'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <div style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: '#10b981',
                          flexShrink: 0
                        }}></div>
                        {appointment.patient_name || 'N/A'}
                      </div>
                    </td>
                   
                    <td style={{
                      padding: '20px',
                      color: '#475569',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}>{appointment.patient_contact || 'N/A'}</td>
                    <td style={{
                      padding: '20px',
                      color: '#475569',
                      fontSize: '14px',
                      fontWeight: '600'
                    }}>{formatDate(appointment.appointment_date)}</td>
                    <td style={{
                      padding: '20px',
                      color: '#475569',
                      fontSize: '14px',
                      fontWeight: '500',
                      maxWidth: '200px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>{appointment.patient_address || 'N/A'}</td>
                    <td style={{
                      padding: '20px',
                      color: '#475569',
                      maxWidth: '200px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}>{appointment.reason || 'General consultation'}</td>
                    <td style={{
                      padding: '20px',
                      textAlign: 'center',
                      color: '#475569',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}>
                      {appointment.place_bitten || 'N/A'}
                    </td>
                    <td style={{
                      padding: '20px'
                    }}>
                      <span style={{
                        backgroundColor: statusBadge.backgroundColor,
                        color: statusBadge.color,
                        padding: '8px 16px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '600',
                        textTransform: 'capitalize',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                      }}>
                        {displayStatus}
                      </span>
                    </td>
                    <td style={{
                      padding: '16px',
                      verticalAlign: 'middle',
                      textAlign: 'center'
                    }}>
                      <div style={{
                        display: 'flex',
                        gap: '8px',
                        justifyContent: 'center',
                        alignItems: 'center'
                      }}>
                        <button
                          onClick={() => handleViewDetails(appointment)}
                          style={{
                            padding: '8px 16px',
                            backgroundColor: '#eff6ff',
                            color: '#1e40af',
                            border: '1px solid #bfdbfe',
                            borderRadius: '8px',
                            fontSize: '13px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            boxShadow: '0 1px 3px rgba(59, 130, 246, 0.1)'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = '#dbeafe';
                            e.target.style.borderColor = '#93c5fd';
                            e.target.style.transform = 'translateY(-1px)';
                            e.target.style.boxShadow = '0 4px 6px rgba(59, 130, 246, 0.2)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = '#eff6ff';
                            e.target.style.borderColor = '#bfdbfe';
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = '0 1px 3px rgba(59, 130, 246, 0.1)';
                          }}
                        >
                          <FaEye size={12} />
                          View Details
                        </button>
                        
                        {appointment.status !== 'confirmed' && appointment.status !== 'completed' && (
                          <button
                            onClick={() => {
                              handleConfirmAppointment(
                                appointment.id,
                                appointment.patient_email,
                                appointment.patient_name
                              );
                            }}
                            style={{
                              padding: '8px 16px',
                              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              fontSize: '13px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              boxShadow: '0 2px 4px rgba(59, 130, 246, 0.2)'
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.background = 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)';
                              e.target.style.transform = 'translateY(-1px)';
                              e.target.style.boxShadow = '0 4px 8px rgba(59, 130, 246, 0.3)';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.background = 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)';
                              e.target.style.transform = 'translateY(0)';
                              e.target.style.boxShadow = '0 2px 4px rgba(59, 130, 246, 0.2)';
                            }}
                          >
                            <FaCheck size={12} />
                            Confirm
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '20px',
          padding: '16px 0'
        }}>
          <div style={{
            color: '#6b7280',
            fontSize: '14px'
          }}>
            Showing {startIndex + 1} to {Math.min(startIndex + rowsPerPage, filteredAppointments.length)} of {filteredAppointments.length} entries
          </div>
          
          {totalPages > 1 && (
            <div style={{
              display: 'flex',
              gap: '8px',
              alignItems: 'center'
            }}>
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                style={{
                  padding: '8px 12px',
                  backgroundColor: currentPage === 1 ? '#f3f4f6' : '#3b82f6',
                  color: currentPage === 1 ? '#9ca3af' : 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                Previous
              </button>
              
              <span style={{
                padding: '8px 12px',
                fontSize: '14px',
                color: '#374151'
              }}>
                Page {currentPage} of {totalPages}
              </span>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                style={{
                  padding: '8px 12px',
                  backgroundColor: currentPage === totalPages ? '#f3f4f6' : '#3b82f6',
                  color: currentPage === totalPages ? '#9ca3af' : 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Details Modal */}
      {isDetailsModalOpen && selectedAppointment && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }} onClick={() => setIsDetailsModalOpen(false)}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '20px',
            padding: 0,
            maxWidth: '900px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            display: 'flex',
            flexDirection: 'column'
          }} onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              padding: '24px 32px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              color: 'white'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px'
                }}>
                  <FaInfoCircle />
                </div>
                <div>
                  <h3 style={{
                    margin: 0,
                    fontSize: '24px',
                    fontWeight: '700',
                    color: 'white'
                  }}>
                    Appointment Details
                  </h3>
                  <p style={{
                    margin: '4px 0 0 0',
                    fontSize: '14px',
                    color: 'rgba(255, 255, 255, 0.9)',
                    fontWeight: '400'
                  }}>
                    {selectedAppointment.patient_name || 'Patient Information'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsDetailsModalOpen(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  color: 'white',
                  padding: '10px',
                  borderRadius: '8px',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
                  e.target.style.transform = 'rotate(90deg)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                  e.target.style.transform = 'rotate(0deg)';
                }}
              >
                <FaTimes />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{
              padding: '32px',
              overflowY: 'auto',
              flex: 1
            }}>
              {/* Status Badge */}
              <div style={{
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <span style={{
                  backgroundColor: getStatusBadge(selectedAppointment.status).backgroundColor,
                  color: getStatusBadge(selectedAppointment.status).color,
                  padding: '8px 16px',
                  borderRadius: '20px',
                  fontSize: '13px',
                  fontWeight: '600',
                  textTransform: 'capitalize',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                }}>
                  {getDisplayStatus(selectedAppointment.status)}
                </span>
                <span style={{
                  color: '#64748b',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <FaCalendar style={{ fontSize: '12px' }} />
                  Appointment Date: {formatDate(selectedAppointment.appointment_date)}
                </span>
              </div>

              {/* Patient Information Section */}
              <div style={{
                marginBottom: '24px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  marginBottom: '20px',
                  paddingBottom: '12px',
                  borderBottom: '2px solid #e2e8f0'
                }}>
                  <FaUser style={{ color: '#3b82f6', fontSize: '18px' }} />
                  <h4 style={{
                    margin: 0,
                    fontSize: '18px',
                    fontWeight: '700',
                    color: '#1e293b'
                  }}>
                    Patient Information
                  </h4>
                </div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '20px'
                }}>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}>
                    <label style={{
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#64748b',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>Full Name</label>
                    <div style={{
                      fontSize: '15px',
                      fontWeight: '600',
                      color: '#1e293b',
                      padding: '10px 14px',
                      background: '#f8fafc',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0'
                    }}>
                      {selectedAppointment.patient_name || 'N/A'}
                    </div>
                  </div>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}>
                    <label style={{
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#64748b',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>Age</label>
                    <div style={{
                      fontSize: '15px',
                      fontWeight: '500',
                      color: '#1e293b',
                      padding: '10px 14px',
                      background: '#f8fafc',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0'
                    }}>
                      {selectedAppointment.patient_age || 'N/A'}
                    </div>
                  </div>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}>
                    <label style={{
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#64748b',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>Gender</label>
                    <div style={{
                      fontSize: '15px',
                      fontWeight: '500',
                      color: '#1e293b',
                      padding: '10px 14px',
                      background: '#f8fafc',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0'
                    }}>
                      {selectedAppointment.patient_sex || 'N/A'}
                    </div>
                  </div>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}>
                    <label style={{
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#64748b',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>Date of Birth</label>
                    <div style={{
                      fontSize: '15px',
                      fontWeight: '500',
                      color: '#1e293b',
                      padding: '10px 14px',
                      background: '#f8fafc',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0'
                    }}>
                      {selectedAppointment.date_of_birth ? formatDate(selectedAppointment.date_of_birth) : 'N/A'}
                    </div>
                  </div>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}>
                    <label style={{
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#64748b',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <FaMapMarkerAlt style={{ fontSize: '10px' }} />
                      Address
                    </label>
                    <div style={{
                      fontSize: '15px',
                      fontWeight: '500',
                      color: '#1e293b',
                      padding: '10px 14px',
                      background: '#f8fafc',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      lineHeight: '1.5'
                    }}>
                      {selectedAppointment.patient_address || 'N/A'}
                    </div>
                  </div>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}>
                    <label style={{
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#64748b',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <FaPhone style={{ fontSize: '10px' }} />
                      Contact Number
                    </label>
                    <div style={{
                      fontSize: '15px',
                      fontWeight: '500',
                      color: '#1e293b',
                      padding: '10px 14px',
                      background: '#f8fafc',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0'
                    }}>
                      {selectedAppointment.patient_contact || 'N/A'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bite Information Section */}
              <div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  marginBottom: '20px',
                  paddingBottom: '12px',
                  borderBottom: '2px solid #e2e8f0'
                }}>
                  <FaExclamationTriangle style={{ color: '#ef4444', fontSize: '18px' }} />
                  <h4 style={{
                    margin: 0,
                    fontSize: '18px',
                    fontWeight: '700',
                    color: '#1e293b'
                  }}>
                    Bite Incident Information
                  </h4>
                </div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '20px'
                }}>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}>
                    <label style={{
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#64748b',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <FaCalendar style={{ fontSize: '10px' }} />
                      Date Bitten
                    </label>
                    <div style={{
                      fontSize: '15px',
                      fontWeight: '500',
                      color: '#1e293b',
                      padding: '10px 14px',
                      background: '#fef2f2',
                      borderRadius: '8px',
                      border: '1px solid #fecaca'
                    }}>
                      {selectedAppointment.date_bitten ? formatDate(selectedAppointment.date_bitten) : 'N/A'}
                    </div>
                  </div>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}>
                    <label style={{
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#64748b',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>Site of Bite</label>
                    <div style={{
                      fontSize: '15px',
                      fontWeight: '500',
                      color: '#1e293b',
                      padding: '10px 14px',
                      background: '#fef2f2',
                      borderRadius: '8px',
                      border: '1px solid #fecaca'
                    }}>
                      {selectedAppointment.site_of_bite || 'N/A'}
                    </div>
                  </div>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}>
                    <label style={{
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#64748b',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <FaPaw style={{ fontSize: '10px' }} />
                      Biting Animal
                    </label>
                    <div style={{
                      fontSize: '15px',
                      fontWeight: '500',
                      color: '#1e293b',
                      padding: '10px 14px',
                      background: '#fef2f2',
                      borderRadius: '8px',
                      border: '1px solid #fecaca'
                    }}>
                      {selectedAppointment.biting_animal || 'N/A'}
                    </div>
                  </div>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}>
                    <label style={{
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#64748b',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>Animal Status</label>
                    <div style={{
                      fontSize: '15px',
                      fontWeight: '500',
                      color: '#1e293b',
                      padding: '10px 14px',
                      background: '#fef2f2',
                      borderRadius: '8px',
                      border: '1px solid #fecaca'
                    }}>
                      {selectedAppointment.animal_status || 'N/A'}
                    </div>
                  </div>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}>
                    <label style={{
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#64748b',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <FaMapMarkerAlt style={{ fontSize: '10px' }} />
                      Place Bitten (Barangay)
                    </label>
                    <div style={{
                      fontSize: '15px',
                      fontWeight: '500',
                      color: '#1e293b',
                      padding: '10px 14px',
                      background: '#fef2f2',
                      borderRadius: '8px',
                      border: '1px solid #fecaca'
                    }}>
                      {selectedAppointment.place_bitten || 'N/A'}
                    </div>
                  </div>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}>
                    <label style={{
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#64748b',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>Provoked</label>
                    <div style={{
                      fontSize: '15px',
                      fontWeight: '500',
                      color: '#1e293b',
                      padding: '10px 14px',
                      background: '#fef2f2',
                      borderRadius: '8px',
                      border: '1px solid #fecaca'
                    }}>
                      {selectedAppointment.provoke || 'N/A'}
                    </div>
                  </div>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}>
                    <label style={{
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#64748b',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>Local Wound Treatment</label>
                    <div style={{
                      fontSize: '15px',
                      fontWeight: '500',
                      color: '#1e293b',
                      padding: '10px 14px',
                      background: '#fef2f2',
                      borderRadius: '8px',
                      border: '1px solid #fecaca',
                      lineHeight: '1.5'
                    }}>
                      {selectedAppointment.local_wound_treatment || 'N/A'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '24px 32px',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end',
              background: '#f8fafc'
            }}>
              <button
                onClick={() => setIsDetailsModalOpen(false)}
                style={{
                  padding: '12px 24px',
                  backgroundColor: 'white',
                  color: '#64748b',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#f1f5f9';
                  e.target.style.borderColor = '#cbd5e1';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'white';
                  e.target.style.borderColor = '#e2e8f0';
                }}
              >
                <FaTimes style={{ fontSize: '12px' }} />
                Close
              </button>
              {selectedAppointment.status !== 'confirmed' && selectedAppointment.status !== 'completed' && (
                <button
                  onClick={() => {
                    handleConfirmAppointment(
                      selectedAppointment.id,
                      selectedAppointment.patient_email,
                      selectedAppointment.patient_name
                    );
                    setIsDetailsModalOpen(false);
                  }}
                  style={{
                    padding: '12px 24px',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-1px)';
                    e.target.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 2px 4px rgba(16, 185, 129, 0.2)';
                  }}
                >
                  <FaCheck style={{ fontSize: '12px' }} />
                  Confirm Appointment
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentList; 