import React, { useState, useEffect } from 'react';

const AppointmentList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [openDropdown, setOpenDropdown] = useState(null);

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

  const patientData = [
    {
      id: 1,
      patientName: 'Maria Cruz',
      barangay: 'Cogon',
      woundImage: 'View',
      photoVerified: 'Yes',
      identityMatch: 'Yes',
      aiConfidence: '97%',
      status: 'Verified'
    },
    {
      id: 2,
      patientName: 'Juan Santos',
      barangay: 'Polambato',
      woundImage: 'View',
      photoVerified: 'No',
      identityMatch: 'Yes',
      aiConfidence: '42%',
      status: 'Flagged'
    },
    {
      id: 3,
      patientName: 'Ariel Tan',
      barangay: 'La Paz',
      woundImage: 'View',
      photoVerified: 'Yes',
      identityMatch: 'No',
      aiConfidence: '65%',
      status: 'Flagged'
    },
    {
      id: 4,
      patientName: 'Liza Reyes',
      barangay: 'Sambag',
      woundImage: 'View',
      photoVerified: 'Yes',
      identityMatch: 'Yes',
      aiConfidence: '91%',
      status: 'Verified'
    },
    {
      id: 5,
      patientName: 'Pedro Martinez',
      barangay: 'Cogon',
      woundImage: 'View',
      photoVerified: 'No',
      identityMatch: 'No',
      aiConfidence: '23%',
      status: 'Flagged'
    },
    {
      id: 6,
      patientName: 'Ana Garcia',
      barangay: 'Polambato',
      woundImage: 'View',
      photoVerified: 'Yes',
      identityMatch: 'Yes',
      aiConfidence: '89%',
      status: 'Verified'
    }
  ];

  const filteredPatients = patientData.filter(patient =>
    patient.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.barangay.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status) => {
    if (status === 'Verified') {
      return {
        backgroundColor: '#10b981',
        color: 'white'
      };
    } else {
      return {
        backgroundColor: '#f59e0b',
        color: 'white'
      };
    }
  };

  const getConfidenceColor = (confidence) => {
    const percentage = parseInt(confidence);
    if (percentage >= 80) return '#10b981';
    if (percentage >= 60) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className="content-section">
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        margin: '20px'
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
            fontSize: '24px',
            fontWeight: '700',
            color: '#1f2937'
          }}>
          </h2>
        
        </div>

        {/* Search Bar */}
        <div style={{
          marginBottom: '24px'
        }}>
          <div style={{
            position: 'relative',
            maxWidth: '400px'
          }}>
            <input
              type="text"
              placeholder="Search by patient name or barangay..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px',
                backgroundColor: '#f9fafb',
                outline: 'none'
              }}
            />
          </div>
        </div>

        {/* Patients Table */}
        <div style={{
          overflowX: 'auto'
        }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '14px'
          }}>
            <thead>
              <tr style={{
                backgroundColor: '#3b82f6',
                color: 'white'
              }}>
                <th style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontWeight: '600',
                  fontSize: '14px'
                }}>
                  #
                </th>
                <th style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontWeight: '600',
                  fontSize: '14px'
                }}>
                  Patient Name
                </th>
                <th style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontWeight: '600',
                  fontSize: '14px'
                }}>
                  Barangay
                </th>
                <th style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontWeight: '600',
                  fontSize: '14px'
                }}>
                  Wound Image
                </th>
                <th style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontWeight: '600',
                  fontSize: '14px'
                }}>
                  Photo Verified
                </th>
                <th style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontWeight: '600',
                  fontSize: '14px'
                }}>
                  Identity Match
                </th>
                <th style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontWeight: '600',
                  fontSize: '14px'
                }}>
                  AI Confidence
                </th>
                <th style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontWeight: '600',
                  fontSize: '14px'
                }}>
                  Status
                </th>
                <th style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontWeight: '600',
                  fontSize: '14px'
                }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.map((patient) => {
                const statusBadge = getStatusBadge(patient.status);
                const confidenceColor = getConfidenceColor(patient.aiConfidence);

                return (
                  <tr key={patient.id} style={{
                    borderBottom: '1px solid #f3f4f6',
                    backgroundColor: 'white'
                  }}>
                    <td style={{
                      padding: '16px',
                      color: '#374151',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}>
                      {patient.id}
                    </td>
                    <td style={{
                      padding: '16px',
                      color: '#374151',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}>
                      {patient.patientName}
                    </td>
                    <td style={{
                      padding: '16px',
                      color: '#374151',
                      fontSize: '14px'
                    }}>
                      {patient.barangay}
                    </td>
                    <td style={{
                      padding: '16px'
                    }}>
                      <span style={{
                        color: '#3b82f6',
                        cursor: 'pointer',
                        textDecoration: 'underline',
                        fontSize: '14px'
                      }}>
                        {patient.woundImage}
                      </span>
                    </td>
                    <td style={{
                      padding: '16px'
                    }}>
                      <span style={{
                        color: patient.photoVerified === 'Yes' ? '#10b981' : '#ef4444',
                        fontWeight: '500',
                        fontSize: '14px'
                      }}>
                        {patient.photoVerified}
                      </span>
                    </td>
                    <td style={{
                      padding: '16px'
                    }}>
                      <span style={{
                        color: patient.identityMatch === 'Yes' ? '#10b981' : '#ef4444',
                        fontWeight: '500',
                        fontSize: '14px'
                      }}>
                        {patient.identityMatch}
                      </span>
                    </td>
                    <td style={{
                      padding: '16px'
                    }}>
                      <span style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: confidenceColor
                      }}>
                        {patient.aiConfidence}
                      </span>
                    </td>
                    <td style={{
                      padding: '16px'
                    }}>
                      <span style={{
                        backgroundColor: statusBadge.backgroundColor,
                        color: statusBadge.color,
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}>
                        {patient.status}
                      </span>
                    </td>
                    <td style={{
                      padding: '16px'
                    }}>
                      <div 
                        className="dropdown-container"
                        style={{
                          position: 'relative',
                          display: 'inline-block'
                        }}
                      >
                        <button
                          onClick={() => setOpenDropdown(openDropdown === patient.id ? null : patient.id)}
                          style={{
                            padding: '8px 12px',
                            backgroundColor: '#f8fafc',
                            color: '#374151',
                            border: '1px solid #e5e7eb',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = '#f1f5f9';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = '#f8fafc';
                          }}
                        >
                          Actions
                          <span style={{
                            fontSize: '10px',
                            transition: 'transform 0.2s ease',
                            transform: openDropdown === patient.id ? 'rotate(180deg)' : 'rotate(0deg)'
                          }}>
                            ▼
                          </span>
                        </button>
                        
                        {openDropdown === patient.id && (
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
                            {patient.status === 'Verified' ? (
                              <>
                                <button
                                  onClick={() => {
                                    console.log('View patient:', patient.id);
                                    setOpenDropdown(null);
                                  }}
                                  style={{
                                    width: '100%',
                                    padding: '10px 16px',
                                    backgroundColor: 'transparent',
                                    color: '#374151',
                                    border: 'none',
                                    textAlign: 'left',
                                    fontSize: '13px',
                                    cursor: 'pointer',
                                    borderBottom: '1px solid #f3f4f6',
                                    transition: 'background-color 0.2s ease'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.target.style.backgroundColor = '#f8fafc';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.target.style.backgroundColor = 'transparent';
                                  }}
                                >
                                  👁️ View Details
                                </button>
                                <button
                                  onClick={() => {
                                    console.log('Archive patient:', patient.id);
                                    setOpenDropdown(null);
                                  }}
                                  style={{
                                    width: '100%',
                                    padding: '10px 16px',
                                    backgroundColor: 'transparent',
                                    color: '#374151',
                                    border: 'none',
                                    textAlign: 'left',
                                    fontSize: '13px',
                                    cursor: 'pointer',
                                    transition: 'background-color 0.2s ease'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.target.style.backgroundColor = '#f8fafc';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.target.style.backgroundColor = 'transparent';
                                  }}
                                >
                                  📁 Archive Record
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => {
                                    console.log('Review patient:', patient.id);
                                    setOpenDropdown(null);
                                  }}
                                  style={{
                                    width: '100%',
                                    padding: '10px 16px',
                                    backgroundColor: 'transparent',
                                    color: '#374151',
                                    border: 'none',
                                    textAlign: 'left',
                                    fontSize: '13px',
                                    cursor: 'pointer',
                                    borderBottom: '1px solid #f3f4f6',
                                    transition: 'background-color 0.2s ease'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.target.style.backgroundColor = '#f8fafc';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.target.style.backgroundColor = 'transparent';
                                  }}
                                >
                                  🔍 Review Case
                                </button>
                                {patient.aiConfidence.includes('42') || patient.aiConfidence.includes('23') ? (
                                  <button
                                    onClick={() => {
                                      console.log('Delete patient:', patient.id);
                                      setOpenDropdown(null);
                                    }}
                                    style={{
                                      width: '100%',
                                      padding: '10px 16px',
                                      backgroundColor: 'transparent',
                                      color: '#ef4444',
                                      border: 'none',
                                      textAlign: 'left',
                                      fontSize: '13px',
                                      cursor: 'pointer',
                                      transition: 'background-color 0.2s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                      e.target.style.backgroundColor = '#fef2f2';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.target.style.backgroundColor = 'transparent';
                                    }}
                                  >
                                    🗑️ Delete Record
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => {
                                      console.log('Confirm patient:', patient.id);
                                      setOpenDropdown(null);
                                    }}
                                    style={{
                                      width: '100%',
                                      padding: '10px 16px',
                                      backgroundColor: 'transparent',
                                      color: '#374151',
                                      border: 'none',
                                      textAlign: 'left',
                                      fontSize: '13px',
                                      cursor: 'pointer',
                                      transition: 'background-color 0.2s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                      e.target.style.backgroundColor = '#f8fafc';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.target.style.backgroundColor = 'transparent';
                                    }}
                                  >
                                    ✅ Confirm Verification
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div style={{
          marginTop: '20px',
          color: '#6b7280',
          fontSize: '14px'
        }}>
          Showing 1 to {filteredPatients.length} of {filteredPatients.length} entries
        </div>
      </div>
    </div>
  );
};

export default AppointmentList; 