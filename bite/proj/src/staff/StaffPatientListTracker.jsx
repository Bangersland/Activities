import React, { useState, useEffect } from 'react';
import { 
  getAllDoseStatistics, 
  getPatientsByDose, 
  updateDoseStatus,
  getCurrentUser 
} from '../supabase';

const StaffPatientListTracker = () => {
  const [doseStats, setDoseStats] = useState({});
  const [selectedDose, setSelectedDose] = useState(null);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [patientsLoading, setPatientsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const doseLabels = {
    1: "Awaiting 1st Dose",
    2: "Awaiting 2nd Dose",
    3: "Awaiting 3rd Dose",
    4: "Awaiting 4th Dose",
    5: "Booster"
  };

  // Fetch dose statistics on component mount
  useEffect(() => {
    fetchDoseStatistics();
    fetchCurrentUser();
  }, []);

  // Fetch patients when a dose is selected
  useEffect(() => {
    if (selectedDose) {
      fetchPatientsForDose(selectedDose);
    }
  }, [selectedDose]);

  const fetchCurrentUser = async () => {
    const { user, error } = await getCurrentUser();
    if (!error && user) {
      setCurrentUser(user);
    }
  };

  const fetchDoseStatistics = async () => {
    setLoading(true);
    try {
      const { data, error } = await getAllDoseStatistics();
      if (error) {
        console.error('Error fetching dose statistics:', error);
      } else {
        setDoseStats(data || {});
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatientsForDose = async (doseNumber) => {
    setPatientsLoading(true);
    try {
      const { data, error } = await getPatientsByDose(doseNumber, true);
      if (error) {
        console.error('Error fetching patients:', error);
        setPatients([]);
      } else {
        setPatients(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
      setPatients([]);
    } finally {
      setPatientsLoading(false);
    }
  };

  const handleDoseClick = (doseNumber) => {
    const newSelectedDose = selectedDose === doseNumber ? null : doseNumber;
    setSelectedDose(newSelectedDose);
  };

  const handleUpdateStatus = async (treatmentRecordId, doseNumber, status) => {
    let user = currentUser;
    
    // If no current user, try to fetch it
    if (!user) {
      const { user: fetchedUser, error } = await getCurrentUser();
      if (error || !fetchedUser) {
        alert('User not authenticated. Please log in again.');
        return;
      }
      user = fetchedUser;
      setCurrentUser(user);
    }

    const updatedByName = user.user_metadata?.first_name && user.user_metadata?.last_name
      ? `${user.user_metadata.first_name} ${user.user_metadata.last_name}`
      : user.user_metadata?.username || user.email || 'Unknown';

    try {
      const { data, error } = await updateDoseStatus(
        treatmentRecordId,
        doseNumber,
        status,
        user.id,
        updatedByName
      );

      if (error) {
        console.error('Error updating dose status:', error);
        alert('Failed to update dose status: ' + (error.message || 'Unknown error'));
      } else {
        // Refresh the data
        await fetchDoseStatistics();
        await fetchPatientsForDose(doseNumber);
        alert(`Dose marked as ${status} successfully!`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to update dose status');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadgeStyle = (status) => {
    const styles = {
      pending: { backgroundColor: '#fef3c7', color: '#92400e', border: '1px solid #fbbf24' },
      completed: { backgroundColor: '#d1fae5', color: '#065f46', border: '1px solid #10b981' },
      missed: { backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #ef4444' }
    };
    return styles[status] || styles.pending;
  };

  return (
    <div className="content-section" style={{
      backgroundColor: '#f0f8ff',
      minHeight: '100vh',
      padding: selectedDose ? '10px' : '20px',
      width: '100%',
      transition: 'padding 0.3s ease'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: selectedDose ? '16px' : '24px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        width: '100%',
        height: '100%',
        transition: 'padding 0.3s ease'
      }}>
        {/* Header */}
        <div style={{
          marginBottom: '24px'
        }}>
          <h2 style={{
            margin: '0 0 8px 0',
            fontSize: '24px',
            fontWeight: '700',
            color: '#1f2937'
          }}>
            Patients
          </h2>
          <p style={{
            margin: '0',
            color: '#6b7280',
            fontSize: '16px'
          }}>
            Manage patient records and vaccination status
          </p>
        </div>

        {/* Vaccination Tracker */}
        <div style={{
          marginBottom: '30px'
        }}>
          <h3 style={{
            margin: '0 0 20px 0',
            fontSize: '20px',
            fontWeight: '600',
            color: '#374151'
          }}>
            Vaccination Tracker
          </h3>
          
          {loading ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#6b7280' }}>
              Loading statistics...
            </div>
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              {[1, 2, 3, 4, 5].map((doseNumber) => {
                const stats = doseStats[doseNumber] || { pending: 0, completed: 0, missed: 0 };
                const isSelected = selectedDose === doseNumber;
                
                return (
                  <div key={doseNumber}>
                    <div 
                      style={{
                        backgroundColor: isSelected ? '#eff6ff' : 'white',
                        border: isSelected ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                        borderRadius: '8px',
                        padding: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onClick={() => handleDoseClick(doseNumber)}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.backgroundColor = '#f8fafc';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.backgroundColor = 'white';
                        }
                      }}
                    >
                      {/* Left side - Dose info */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px'
                      }}>
                        <div style={{
                          width: '48px',
                          height: '48px',
                          backgroundColor: '#dbeafe',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#1e40af',
                          fontSize: '18px',
                          fontWeight: '600'
                        }}>
                          {doseNumber}
                        </div>
                        
                        <div>
                          <div style={{
                            fontSize: '16px',
                            fontWeight: '600',
                            color: '#1f2937',
                            marginBottom: '4px'
                          }}>
                            {doseLabels[doseNumber]}
                          </div>
                          <div style={{
                            fontSize: '14px',
                            color: '#6b7280'
                          }}>
                            {stats.pending} pending, {stats.missed} missed
                          </div>
                        </div>
                      </div>

                      {/* Right side - Completion status */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '20px'
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          color: '#059669',
                          fontSize: '14px',
                          fontWeight: '500'
                        }}>
                          <span style={{ fontSize: '16px' }}>✔</span>
                          {stats.completed} completed
                        </div>
                        
                        <div style={{
                          color: '#9ca3af',
                          fontSize: '16px',
                          cursor: 'pointer'
                        }}>
                          {isSelected ? '▼' : '→'}
                        </div>
                      </div>
                    </div>

                    {/* Patient Table - appears directly below selected dose */}
                    {isSelected && (
                      <div 
                        style={{
                          marginTop: '16px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          width: '100%'
                        }}
                      >
                        {patientsLoading ? (
                          <div style={{ textAlign: 'center', padding: '40px', color: '#3b82f6', fontSize: '16px', width: '100%' }}>
                            Loading patients...
                          </div>
                        ) : patients.length === 0 ? (
                          <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280', fontSize: '16px', width: '100%' }}>
                            No patients found for this dose.
                          </div>
                        ) : (
                          <div style={{
                            border: '2px solid #3b82f6',
                            borderRadius: '12px',
                            overflow: 'hidden',
                            boxShadow: '0 4px 6px rgba(59, 130, 246, 0.1)',
                            backgroundColor: 'white',
                            width: '100%'
                          }}>
                            <div style={{
                              maxHeight: '60vh',
                              overflowY: 'auto',
                              overflowX: 'hidden'
                            }}>
                              <table style={{
                                width: '100%',
                                borderCollapse: 'collapse',
                                backgroundColor: 'white',
                                tableLayout: 'fixed'
                              }}>
                                <thead style={{
                                  position: 'sticky',
                                  top: 0,
                                  zIndex: 10
                                }}>
                                  <tr style={{
                                    backgroundColor: '#1e40af',
                                    borderBottom: '2px solid #3b82f6'
                                  }}>
                                    <th style={{
                                      padding: '14px 12px',
                                      textAlign: 'left',
                                      fontSize: '13px',
                                      fontWeight: '700',
                                      color: '#ffffff',
                                      letterSpacing: '0.5px',
                                      width: '15%',
                                      borderRight: '1px solid rgba(255, 255, 255, 0.2)'
                                    }}>Patient Name</th>
                                    <th style={{
                                      padding: '14px 12px',
                                      textAlign: 'left',
                                      fontSize: '13px',
                                      fontWeight: '700',
                                      color: '#ffffff',
                                      letterSpacing: '0.5px',
                                      width: '12%',
                                      borderRight: '1px solid rgba(255, 255, 255, 0.2)'
                                    }}>Contact</th>
                                    <th style={{
                                      padding: '14px 12px',
                                      textAlign: 'left',
                                      fontSize: '13px',
                                      fontWeight: '700',
                                      color: '#ffffff',
                                      letterSpacing: '0.5px',
                                      width: '18%',
                                      borderRight: '1px solid rgba(255, 255, 255, 0.2)'
                                    }}>Category of Exposure</th>
                                    <th style={{
                                      padding: '14px 12px',
                                      textAlign: 'left',
                                      fontSize: '13px',
                                      fontWeight: '700',
                                      color: '#ffffff',
                                      letterSpacing: '0.5px',
                                      width: '15%',
                                      borderRight: '1px solid rgba(255, 255, 255, 0.2)'
                                    }}>Vaccine Brand</th>
                                    <th style={{
                                      padding: '14px 12px',
                                      textAlign: 'left',
                                      fontSize: '13px',
                                      fontWeight: '700',
                                      color: '#ffffff',
                                      letterSpacing: '0.5px',
                                      width: '10%',
                                      borderRight: '1px solid rgba(255, 255, 255, 0.2)'
                                    }}>Route</th>
                                    <th style={{
                                      padding: '14px 12px',
                                      textAlign: 'left',
                                      fontSize: '13px',
                                      fontWeight: '700',
                                      color: '#ffffff',
                                      letterSpacing: '0.5px',
                                      width: '12%',
                                      borderRight: '1px solid rgba(255, 255, 255, 0.2)'
                                    }}>Updated By</th>
                                    <th style={{
                                      padding: '14px 12px',
                                      textAlign: 'center',
                                      fontSize: '13px',
                                      fontWeight: '700',
                                      color: '#ffffff',
                                      letterSpacing: '0.5px',
                                      width: '10%',
                                      borderRight: '1px solid rgba(255, 255, 255, 0.2)'
                                    }}>Status</th>
                                    <th style={{
                                      padding: '14px 12px',
                                      textAlign: 'center',
                                      fontSize: '13px',
                                      fontWeight: '700',
                                      color: '#ffffff',
                                      letterSpacing: '0.5px',
                                      width: '8%'
                                    }}>Actions</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {patients.map((patient, index) => {
                                    const status = patient.doseStatus || 'pending';
                                    const badgeStyle = getStatusBadgeStyle(status);
                                    
                                    // Format category of exposure (JSONB field)
                                    let categoryOfExposure = 'N/A';
                                    if (patient.category_of_exposure) {
                                      if (typeof patient.category_of_exposure === 'string') {
                                        try {
                                          const parsed = JSON.parse(patient.category_of_exposure);
                                          if (Array.isArray(parsed)) {
                                            categoryOfExposure = parsed.join(', ');
                                          } else if (typeof parsed === 'object') {
                                            categoryOfExposure = Object.values(parsed).filter(v => v).join(', ');
                                          } else {
                                            categoryOfExposure = parsed;
                                          }
                                        } catch {
                                          categoryOfExposure = patient.category_of_exposure;
                                        }
                                      } else if (Array.isArray(patient.category_of_exposure)) {
                                        categoryOfExposure = patient.category_of_exposure.join(', ');
                                      } else if (typeof patient.category_of_exposure === 'object') {
                                        categoryOfExposure = Object.values(patient.category_of_exposure).filter(v => v).join(', ');
                                      }
                                    }
                                    
                                    return (
                                      <tr 
                                        key={patient.id}
                                        style={{
                                          borderBottom: '1px solid #dbeafe',
                                          backgroundColor: index % 2 === 0 ? '#ffffff' : '#f0f8ff',
                                          transition: 'background-color 0.2s ease'
                                        }}
                                        onMouseEnter={(e) => {
                                          e.currentTarget.style.backgroundColor = '#e0f2fe';
                                        }}
                                        onMouseLeave={(e) => {
                                          e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#ffffff' : '#f0f8ff';
                                        }}
                                      >
                                        <td style={{
                                          padding: '14px 12px',
                                          fontSize: '13px',
                                          color: '#1e293b',
                                          borderRight: '1px solid #dbeafe',
                                          wordWrap: 'break-word',
                                          overflowWrap: 'break-word'
                                        }}>
                                          <div style={{ fontWeight: '600', color: '#1e40af' }}>
                                            {patient.patient_name || 'Unknown Patient'}
                                          </div>
                                        </td>
                                        <td style={{
                                          padding: '14px 12px',
                                          fontSize: '13px',
                                          color: '#475569',
                                          borderRight: '1px solid #dbeafe',
                                          wordWrap: 'break-word'
                                        }}>
                                          {patient.patient_contact || 'N/A'}
                                        </td>
                                        <td style={{
                                          padding: '14px 12px',
                                          fontSize: '13px',
                                          color: '#475569',
                                          borderRight: '1px solid #dbeafe',
                                          wordWrap: 'break-word',
                                          overflowWrap: 'break-word'
                                        }}>
                                          {categoryOfExposure || 'N/A'}
                                        </td>
                                        <td style={{
                                          padding: '14px 12px',
                                          fontSize: '13px',
                                          color: '#475569',
                                          borderRight: '1px solid #dbeafe',
                                          wordWrap: 'break-word'
                                        }}>
                                          {patient.vaccine_brand_name || 'N/A'}
                                        </td>
                                        <td style={{
                                          padding: '14px 12px',
                                          fontSize: '13px',
                                          color: '#475569',
                                          borderRight: '1px solid #dbeafe',
                                          wordWrap: 'break-word'
                                        }}>
                                          {patient.route || 'N/A'}
                                        </td>
                                        <td style={{
                                          padding: '14px 12px',
                                          fontSize: '13px',
                                          color: '#475569',
                                          borderRight: '1px solid #dbeafe',
                                          wordWrap: 'break-word'
                                        }}>
                                          {patient.updatedByName || 'N/A'}
                                        </td>
                                        <td style={{
                                          padding: '14px 12px',
                                          textAlign: 'center',
                                          borderRight: '1px solid #dbeafe'
                                        }}>
                                          <span style={{
                                            padding: '6px 10px',
                                            borderRadius: '6px',
                                            fontSize: '11px',
                                            fontWeight: '700',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px',
                                            display: 'inline-block',
                                            ...badgeStyle
                                          }}>
                                            {status}
                                          </span>
                                        </td>
                                        <td style={{
                                          padding: '14px 12px',
                                          textAlign: 'center'
                                        }}>
                                          <div style={{
                                            display: 'flex',
                                            gap: '8px',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                          }}>
                                            <button
                                              onClick={() => handleUpdateStatus(patient.id, doseNumber, 'completed')}
                                              style={{
                                                padding: '8px',
                                                backgroundColor: '#10b981',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '6px',
                                                fontSize: '16px',
                                                fontWeight: '600',
                                                cursor: 'pointer',
                                                width: '32px',
                                                height: '32px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                transition: 'all 0.2s ease',
                                                boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)'
                                              }}
                                              onMouseEnter={(e) => {
                                                e.target.style.backgroundColor = '#059669';
                                                e.target.style.transform = 'translateY(-1px)';
                                                e.target.style.boxShadow = '0 4px 6px rgba(16, 185, 129, 0.3)';
                                              }}
                                              onMouseLeave={(e) => {
                                                e.target.style.backgroundColor = '#10b981';
                                                e.target.style.transform = 'translateY(0)';
                                                e.target.style.boxShadow = '0 2px 4px rgba(16, 185, 129, 0.2)';
                                              }}
                                              title="Mark as Completed"
                                            >
                                              ✓
                                            </button>
                                            <button
                                              onClick={() => handleUpdateStatus(patient.id, doseNumber, 'missed')}
                                              style={{
                                                padding: '8px',
                                                backgroundColor: '#ef4444',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '6px',
                                                fontSize: '16px',
                                                fontWeight: '600',
                                                cursor: 'pointer',
                                                width: '32px',
                                                height: '32px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                transition: 'all 0.2s ease',
                                                boxShadow: '0 2px 4px rgba(239, 68, 68, 0.2)'
                                              }}
                                              onMouseEnter={(e) => {
                                                e.target.style.backgroundColor = '#dc2626';
                                                e.target.style.transform = 'translateY(-1px)';
                                                e.target.style.boxShadow = '0 4px 6px rgba(239, 68, 68, 0.3)';
                                              }}
                                              onMouseLeave={(e) => {
                                                e.target.style.backgroundColor = '#ef4444';
                                                e.target.style.transform = 'translateY(0)';
                                                e.target.style.boxShadow = '0 2px 4px rgba(239, 68, 68, 0.2)';
                                              }}
                                              title="Mark as Missed"
                                            >
                                              ×
                                            </button>
                                          </div>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StaffPatientListTracker;
