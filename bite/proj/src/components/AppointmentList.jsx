import React, { useState, useEffect } from 'react';
import { FaEye, FaCheck, FaSearch, FaCog, FaChevronDown } from 'react-icons/fa';
import { getAllAppointments, confirmAppointment, sendPatientNotification } from '../supabase';

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

  // Fetch appointments on component mount
  useEffect(() => {
    fetchAppointments();
  }, []);

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
      const { data, error } = await getAllAppointments();
      
      if (error) {
        setMessage(`Error loading appointments: ${error.message}`);
      } else {
        setAppointments(data);
      }
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
        
        // Refresh appointments list
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

  // Filter appointments based on search term and exclude completed appointments
  const filteredAppointments = appointments.filter(appointment => {
    // First filter out completed appointments
    if (appointment.status === 'completed') return false;
    
    // Then apply search filter
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

  // Reset to first page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, rowsPerPage]);

  const handleViewDetails = (appointment) => {
    setSelectedAppointment(appointment);
    setIsDetailsModalOpen(true);
    setOpenDropdown(null);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'confirmed':
        return { backgroundColor: '#10b981', color: 'white' };
      case 'pending':
        return { backgroundColor: '#f59e0b', color: 'white' };
      case 'cancelled':
        return { backgroundColor: '#ef4444', color: 'white' };
      default:
        return { backgroundColor: '#6b7280', color: 'white' };
    }
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
                  <td colSpan="8" style={{
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
                  <td colSpan="8" style={{
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
                        {appointment.status || 'pending'}
                      </span>
                    </td>
                    <td style={{
                      padding: '20px',
                      textAlign: 'center'
                    }}>
                      <div 
                        className="dropdown-container"
                        style={{
                          position: 'relative',
                          display: 'inline-block'
                        }}
                      >
                        <button
                          onClick={() => setOpenDropdown(openDropdown === appointment.id ? null : appointment.id)}
                          style={{
                            padding: '12px 20px',
                            backgroundColor: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '10px',
                            fontSize: '13px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'all 0.2s ease',
                            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.transform = 'translateY(-1px)';
                            e.target.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
                          }}
                        >
                          <span style={{
                            fontSize: '14px'
                          }}>⚙️</span>
                          Actions
                          <span style={{
                            fontSize: '10px',
                            transition: 'transform 0.2s ease',
                            transform: openDropdown === appointment.id ? 'rotate(180deg)' : 'rotate(0deg)',
                            color: 'white'
                          }}>
                            ▼
                          </span>
                        </button>
                        
                        {openDropdown === appointment.id && (
                          <div style={{
                            position: 'absolute',
                            top: '100%',
                            right: '0',
                            backgroundColor: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                            zIndex: 1000,
                            minWidth: '140px',
                            marginTop: '4px'
                          }}>
                            <button
                              onClick={() => handleViewDetails(appointment)}
                              style={{
                                width: '100%',
                                padding: '12px 16px',
                                backgroundColor: 'transparent',
                                color: '#1e293b',
                                border: 'none',
                                textAlign: 'left',
                                fontSize: '14px',
                                fontWeight: '500',
                                cursor: 'pointer',
                                borderBottom: '1px solid #f1f5f9',
                                transition: 'all 0.2s ease',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.backgroundColor = '#f8fafc';
                                e.target.style.color = '#3b82f6';
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.backgroundColor = 'transparent';
                                e.target.style.color = '#1e293b';
                              }}
                            >
                              <FaCog style={{
                                color: 'white',
                                fontSize: '14px',
                                marginRight: '8px'
                              }} />
                              Actions
                            </button>
                            {appointment.status !== 'confirmed' && (
                              <button
                                onClick={() => {
                                  handleConfirmAppointment(
                                    appointment.id,
                                    appointment.patient_email,
                                    appointment.patient_name
                                  );
                                }}
                                style={{
                                  width: '100%',
                                }}
                                onMouseEnter={(e) => {
                                  e.target.style.backgroundColor = '#f0fdf4';
                                  e.target.style.color = '#059669';
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.backgroundColor = 'transparent';
                                  e.target.style.color = '#10b981';
                                }}
                              >
                                <FaCheck style={{
                                  fontSize: '14px',
                                  marginRight: '8px',
                                  color: '#10b981'
                                }} />
                                Confirm Appointment
                              </button>
                            )}
                          </div>
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
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflowY: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px',
              borderBottom: '2px solid #f1f5f9',
              paddingBottom: '16px'
            }}>
              <h3 style={{
                margin: 0,
                fontSize: '24px',
                fontWeight: '700',
                color: '#0f172a'
              }}>
                Appointment Details
              </h3>
              <button
                onClick={() => setIsDetailsModalOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#64748b',
                  padding: '4px',
                  borderRadius: '6px',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#f1f5f9';
                  e.target.style.color = '#ef4444';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.color = '#64748b';
                }}
              >
                ✕
              </button>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '24px',
              marginBottom: '24px'
            }}>
              {/* Patient Information */}
              <div style={{
                backgroundColor: '#f0fdf4',
                padding: '20px',
                borderRadius: '12px',
                border: '1px solid #bbf7d0'
              }}>
                <h4 style={{
                  margin: '0 0 16px 0',
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#1e293b'
                }}>
                  Patient Information
                </h4>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#064e3b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>Full Name</label>
                  <p style={{
                    margin: '4px 0 0 0',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#1e293b'
                  }}>{selectedAppointment.patient_name || 'N/A'}</p>
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#064e3b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>Age</label>
                  <p style={{
                    margin: '4px 0 0 0',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#1e293b'
                  }}>{selectedAppointment.patient_age || 'N/A'}</p>
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#064e3b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>Sex</label>
                  <p style={{
                    margin: '4px 0 0 0',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#1e293b'
                  }}>{selectedAppointment.patient_sex || 'N/A'}</p>
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#064e3b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>Date of Birth</label>
                  <p style={{
                    margin: '4px 0 0 0',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#1e293b'
                  }}>{selectedAppointment.date_of_birth ? formatDate(selectedAppointment.date_of_birth) : 'N/A'}</p>
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#064e3b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>Address</label>
                  <p style={{
                    margin: '4px 0 0 0',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#1e293b'
                  }}>{selectedAppointment.patient_address || 'N/A'}</p>
                </div>
                <div>
                  <label style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#064e3b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>Contact</label>
                  <p style={{
                    margin: '4px 0 0 0',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#1e293b'
                  }}>{selectedAppointment.patient_contact || 'N/A'}</p>
                </div>
              </div>

              {/* Bite Information */}
              <div style={{
                backgroundColor: '#fef2f2',
                padding: '20px',
                borderRadius: '12px',
                border: '1px solid #fecaca'
              }}>
                <h4 style={{
                  margin: '0 0 16px 0',
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#1e293b'
                }}>
                  Bite Information
                </h4>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#991b1b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>Date Bitten</label>
                  <p style={{
                    margin: '4px 0 0 0',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#1e293b'
                  }}>{selectedAppointment.date_bitten ? formatDate(selectedAppointment.date_bitten) : 'N/A'}</p>
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#991b1b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>Time Bitten</label>
                  <p style={{
                    margin: '4px 0 0 0',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#1e293b'
                  }}>{selectedAppointment.time_bitten || 'N/A'}</p>
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#991b1b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>Site of Bite</label>
                  <p style={{
                    margin: '4px 0 0 0',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#1e293b'
                  }}>{selectedAppointment.site_of_bite || 'N/A'}</p>
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#991b1b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>Biting Animal</label>
                  <p style={{
                    margin: '4px 0 0 0',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#1e293b'
                  }}>{selectedAppointment.biting_animal || 'N/A'}</p>
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#991b1b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>Animal Status</label>
                  <p style={{
                    margin: '4px 0 0 0',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#1e293b'
                  }}>{selectedAppointment.animal_status || 'N/A'}</p>
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#991b1b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>Place Bitten (Barangay)</label>
                  <p style={{
                    margin: '4px 0 0 0',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#1e293b'
                  }}>{selectedAppointment.place_bitten || 'N/A'}</p>
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#991b1b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>Provoked</label>
                  <p style={{
                    margin: '4px 0 0 0',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#1e293b'
                  }}>{selectedAppointment.provoke || 'N/A'}</p>
                </div>
                <div>
                  <label style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#991b1b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>Local Wound Treatment</label>
                  <p style={{
                    margin: '4px 0 0 0',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#1e293b'
                  }}>{selectedAppointment.local_wound_treatment || 'N/A'}</p>
                </div>
              </div>
            </div>

            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => setIsDetailsModalOpen(false)}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#f1f5f9',
                  color: '#64748b',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#e2e8f0';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#f1f5f9';
                }}
              >
                Close
              </button>
              {selectedAppointment.status !== 'confirmed' && (
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
                    backgroundColor: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-1px)';
                    e.target.style.boxShadow = '0 4px 8px rgba(16, 185, 129, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 2px 4px rgba(16, 185, 129, 0.2)';
                  }}
                >
                  ✅ Confirm Appointment
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