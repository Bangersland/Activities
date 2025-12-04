import React, { useState, useEffect } from 'react';
import { FaEye, FaSearch, FaTimes } from 'react-icons/fa';
import { getTreatmentRecords, supabase } from '../supabase';

const StaffPatientHistory = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [treatmentRecords, setTreatmentRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [patientRecords, setPatientRecords] = useState([]);
  const [appointmentStatuses, setAppointmentStatuses] = useState({});
  const [creatorNames, setCreatorNames] = useState({});
  const [staffNames, setStaffNames] = useState({});
  const [selectedRecord, setSelectedRecord] = useState(null);

  useEffect(() => {
    fetchTreatmentRecords();
  }, []);

  const fetchTreatmentRecords = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error: fetchError } = await getTreatmentRecords();
      
      if (fetchError) {
        console.error('Error fetching treatment records:', fetchError);
        setError(fetchError.message || 'Failed to fetch treatment records');
        setTreatmentRecords([]);
        return;
      }
      
      console.log('Fetched treatment records:', data?.length || 0, 'records');
      setTreatmentRecords(data || []);
      
      if (!data || data.length === 0) {
        console.log('No treatment records found in database');
      }
    } catch (err) {
      console.error('Error:', err);
      setError(err.message || 'An error occurred while fetching records');
      setTreatmentRecords([]);
    } finally {
      setLoading(false);
    }
  };

  // Group treatment records by patient
  const getGroupedPatients = () => {
    if (!treatmentRecords || treatmentRecords.length === 0) {
      return [];
    }
    
    const grouped = {};
    
    treatmentRecords.forEach((record, index) => {
      // Use patient_name, patient_contact, or a combination as key
      const patientName = record.patient_name?.trim() || 'Unknown Patient';
      const patientContact = record.patient_contact?.trim() || '';
      const key = patientName + (patientContact ? `_${patientContact}` : '') || `record_${index}`;
      
      if (!grouped[key]) {
        grouped[key] = {
          patientName: patientName,
          patientAge: record.patient_age,
          patientSex: record.patient_sex,
          patientContact: patientContact,
          patientAddress: record.patient_address?.trim() || '',
          barangay: record.place_bitten_barangay?.trim() || '',
          records: []
        };
      }
      
      grouped[key].records.push(record);
    });
    
    // Sort records by date (most recent first) for each patient
    Object.values(grouped).forEach(patient => {
      patient.records.sort((a, b) => {
        const dateA = new Date(a.created_at || a.appointment_date || 0);
        const dateB = new Date(b.created_at || b.appointment_date || 0);
        return dateB - dateA;
      });
    });
    
    const result = Object.values(grouped);
    console.log('Grouped patients:', result.length, 'unique patients');
    return result;
  };

  const getStaffName = async (userId) => {
    if (!userId) return 'N/A';
    if (staffNames[userId]) return staffNames[userId];
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('first_name, last_name, username')
        .eq('id', userId)
        .single();
      
      if (!error && data) {
        const name = data.first_name && data.last_name
          ? `${data.first_name} ${data.last_name}`
          : data.username || 'Unknown';
        setStaffNames(prev => ({ ...prev, [userId]: name }));
        return name;
      }
    } catch (err) {
      console.error('Error fetching staff name:', err);
    }
    return 'N/A';
  };

  const handleViewPatient = async (patient) => {
    setSelectedPatient(patient);
    setPatientRecords(patient.records);
    // Show the most recent record by default
    setSelectedRecord(patient.records[0] || null);
    setIsViewModalOpen(true);
    
    // Fetch appointment statuses and creator names for all records
    const statuses = {};
    const creators = {};
    const userIds = new Set();
    const doseUserIds = new Set();
    
    for (const record of patient.records) {
      if (record.appointment_id) {
        try {
          const { data } = await supabase
            .from('appointments')
            .select('status')
            .eq('id', record.appointment_id)
            .single();
          statuses[record.appointment_id] = data?.status || 'N/A';
        } catch (error) {
          statuses[record.appointment_id] = 'N/A';
        }
      }
      
      if (record.created_by) {
        userIds.add(record.created_by);
      }

      // Collect dose updated_by user IDs
      if (record.d0_updated_by) doseUserIds.add(record.d0_updated_by);
      if (record.d3_updated_by) doseUserIds.add(record.d3_updated_by);
      if (record.d7_updated_by) doseUserIds.add(record.d7_updated_by);
      if (record.d14_updated_by) doseUserIds.add(record.d14_updated_by);
      if (record.d28_30_updated_by) doseUserIds.add(record.d28_30_updated_by);
    }
    
    // Fetch creator names from profiles
    if (userIds.size > 0) {
      try {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, username')
          .in('id', Array.from(userIds));
        
        if (profiles) {
          profiles.forEach(profile => {
            const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.username || 'Unknown';
            creators[profile.id] = fullName;
          });
        }
      } catch (error) {
        console.error('Error fetching creator names:', error);
      }
    }

    // Fetch staff names for dose updated_by fields
    if (doseUserIds.size > 0) {
      const namePromises = Array.from(doseUserIds)
        .filter(userId => !staffNames[userId])
        .map(userId => getStaffName(userId));
      await Promise.all(namePromises);
    }
    
    setAppointmentStatuses(statuses);
    setCreatorNames(creators);
  };

  const closeViewModal = () => {
    setIsViewModalOpen(false);
    setSelectedPatient(null);
    setPatientRecords([]);
    setSelectedRecord(null);
    setAppointmentStatuses({});
    setCreatorNames({});
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const groupedPatients = getGroupedPatients();
  
  // Filter patients based on search term
  const filteredPatients = groupedPatients.filter(patient => {
    const searchLower = searchTerm.toLowerCase();
    return (
      patient.patientName.toLowerCase().includes(searchLower) ||
      patient.patientContact?.toLowerCase().includes(searchLower) ||
      patient.patientAddress?.toLowerCase().includes(searchLower) ||
      patient.barangay?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="content-section" style={{
      padding: '24px',
      backgroundColor: 'white',
      borderRadius: '12px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    }}>
      <div style={{
        marginBottom: '32px'
      }}>
        <h2 style={{
          margin: 0,
          marginBottom: '8px',
          fontSize: '28px',
          fontWeight: '800',
          color: '#0f172a',
          letterSpacing: '-0.025em'
        }}>
          Patient History
        </h2>
        <p style={{
          margin: 0,
          color: '#64748b',
          fontSize: '14px'
        }}>
          View all patient treatment records and history
        </p>
      </div>

      {/* Info and Refresh */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px'
      }}>
        {treatmentRecords.length > 0 && (
          <p style={{
            margin: 0,
            color: '#6b7280',
            fontSize: '14px'
          }}>
            Total records: {treatmentRecords.length} | Patients: {getGroupedPatients().length}
          </p>
        )}
        <button
          onClick={fetchTreatmentRecords}
          disabled={loading}
          style={{
            padding: '8px 16px',
            backgroundColor: loading ? '#9ca3af' : '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          🔄 {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {/* Search Bar */}
      <div style={{
        marginBottom: '24px'
      }}>
        <div style={{
          position: 'relative',
          maxWidth: '500px'
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
            placeholder="Search by name, contact, address, barangay..."
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
      </div>

      {/* Error Message */}
      {error && (
        <div style={{
          padding: '16px',
          backgroundColor: '#fef2f2',
          color: '#dc2626',
          borderRadius: '8px',
          marginBottom: '24px',
          border: '1px solid #fecaca'
        }}>
          <strong>Error:</strong> {error}
          <button
            onClick={fetchTreatmentRecords}
            style={{
              marginLeft: '16px',
              padding: '6px 12px',
              backgroundColor: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Patients Table */}
      <div style={{
        overflowX: 'auto',
        maxHeight: '70vh',
        overflowY: 'auto',
        border: '1px solid #e5e7eb',
        borderRadius: '16px'
      }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
            Loading patient records...
          </div>
        ) : error ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#dc2626' }}>
            {error}
          </div>
        ) : (
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
                  Barangay
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
                  Records
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
              {filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{
                    padding: '40px',
                    textAlign: 'center',
                    color: '#6b7280',
                    fontSize: '14px'
                  }}>
                    {searchTerm ? 
                      `No patients found matching "${searchTerm}"` : 
                      treatmentRecords.length === 0 ? 
                        'No treatment records found in database. Records will appear here once treatment records are created.' :
                        'No patients found. Check console for details.'
                    }
                  </td>
                </tr>
              ) : (
                filteredPatients.map((patient, index) => {
                  const lastRecord = patient.records[0];
                  return (
                    <tr key={index} style={{
                      borderBottom: '1px solid #f3f4f6',
                      backgroundColor: index % 2 === 0 ? 'white' : '#f9fafb',
                      transition: 'background-color 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f3f4f6';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = index % 2 === 0 ? 'white' : '#f9fafb';
                    }}>
                      <td style={{
                        padding: '20px',
                        color: '#1f2937',
                        fontSize: '14px',
                        fontWeight: '600'
                      }}>
                        {patient.patientName}
                      </td>
                      <td style={{
                        padding: '20px',
                        color: '#374151',
                        fontSize: '14px'
                      }}>
                        {patient.patientContact || 'N/A'}
                      </td>
                      <td style={{
                        padding: '20px',
                        color: '#374151',
                        fontSize: '14px'
                      }}>
                        {formatDate(lastRecord?.appointment_date || lastRecord?.created_at)}
                      </td>
                      <td style={{
                        padding: '20px',
                        color: '#374151',
                        fontSize: '14px'
                      }}>
                        {patient.patientAddress || 'N/A'}
                      </td>
                      <td style={{
                        padding: '20px',
                        color: '#374151',
                        fontSize: '14px',
                        textAlign: 'center'
                      }}>
                        {patient.barangay || 'N/A'}
                      </td>
                      <td style={{
                        padding: '20px',
                        textAlign: 'center',
                        color: '#374151',
                        fontSize: '14px',
                        fontWeight: '600'
                      }}>
                        <span style={{
                          backgroundColor: '#3b82f6',
                          color: 'white',
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}>
                          {patient.records.length} record{patient.records.length !== 1 ? 's' : ''}
                        </span>
                      </td>
                      <td style={{
                        padding: '20px',
                        textAlign: 'center'
                      }}>
                        <button
                          onClick={() => handleViewPatient(patient)}
                          style={{
                            padding: '8px 16px',
                            backgroundColor: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '13px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = '#2563eb';
                            e.target.style.transform = 'translateY(-1px)';
                            e.target.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = '#3b82f6';
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = 'none';
                          }}
                        >
                          <FaEye size={12} />
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* View Patient Records Modal */}
      {isViewModalOpen && selectedPatient && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '20px'
        }} onClick={closeViewModal}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '30px',
            maxWidth: '800px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }} onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
              borderBottom: '2px solid #e5e7eb',
              paddingBottom: '15px'
            }}>
              <h2 style={{ margin: 0, color: '#1f2937' }}>Patient Details</h2>
              <button
                onClick={closeViewModal}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#6b7280'
                }}
              >
                ×
              </button>
            </div>

            {/* Record Selector */}
            {patientRecords.length > 1 && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px', display: 'block' }}>
                  Select Record:
                </label>
                <select
                  value={selectedRecord?.id || ''}
                  onChange={(e) => {
                    const record = patientRecords.find(r => r.id === e.target.value);
                    setSelectedRecord(record || null);
                  }}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                >
                  {patientRecords.map((record, index) => (
                    <option key={record.id || index} value={record.id || index}>
                      Record {index + 1} - {formatDate(record.appointment_date || record.created_at)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {selectedRecord && (() => {
              const record = selectedRecord;
              const doses = [
                { 
                  number: 'D0', 
                  date: record.d0_date, 
                  status: record.d0_status || 'pending',
                  updatedBy: record.d0_updated_by ? staffNames[record.d0_updated_by] || 'Loading...' : 'N/A',
                  updatedAt: record.d0_updated_at
                },
                { 
                  number: 'D3', 
                  date: record.d3_date, 
                  status: record.d3_status || 'pending',
                  updatedBy: record.d3_updated_by ? staffNames[record.d3_updated_by] || 'Loading...' : 'N/A',
                  updatedAt: record.d3_updated_at
                },
                { 
                  number: 'D7', 
                  date: record.d7_date, 
                  status: record.d7_status || 'pending',
                  updatedBy: record.d7_updated_by ? staffNames[record.d7_updated_by] || 'Loading...' : 'N/A',
                  updatedAt: record.d7_updated_at
                },
                { 
                  number: 'D14', 
                  date: record.d14_date, 
                  status: record.d14_status || 'pending',
                  updatedBy: record.d14_updated_by ? staffNames[record.d14_updated_by] || 'Loading...' : 'N/A',
                  updatedAt: record.d14_updated_at
                },
                { 
                  number: 'D28/30', 
                  date: record.d28_30_date, 
                  status: record.d28_30_status || 'pending',
                  updatedBy: record.d28_30_updated_by ? staffNames[record.d28_30_updated_by] || 'Loading...' : 'N/A',
                  updatedAt: record.d28_30_updated_at
                }
              ];

              return (
                <div>
                  {/* Patient Information */}
                  <div style={{ marginBottom: '25px' }}>
                    <h3 style={{ margin: '0 0 15px 0', color: '#374151', fontSize: '18px' }}>Patient Information</h3>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      gap: '15px'
                    }}>
                      <div>
                        <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>Name</label>
                        <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#1f2937' }}>{record.patient_name || 'N/A'}</p>
                      </div>
                      <div>
                        <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>Age</label>
                        <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#1f2937' }}>{record.patient_age || 'N/A'}</p>
                      </div>
                      <div>
                        <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>Gender</label>
                        <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#1f2937' }}>{record.patient_sex || 'N/A'}</p>
                      </div>
                      <div>
                        <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>Contact</label>
                        <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#1f2937' }}>{record.patient_contact || 'N/A'}</p>
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>Address</label>
                        <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#1f2937' }}>{record.patient_address || 'N/A'}</p>
                      </div>
                      <div>
                        <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>Appointment Date</label>
                        <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#1f2937' }}>{record.appointment_date || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Additional Information */}
                  <div style={{ marginBottom: '25px' }}>
                    <h3 style={{ margin: '0 0 15px 0', color: '#374151', fontSize: '18px' }}>Additional Information</h3>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      gap: '15px'
                    }}>
                      <div>
                        <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>Biting Animal</label>
                        <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#1f2937' }}>{record.biting_animal || 'N/A'}</p>
                      </div>
                      <div>
                        <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>Date Bitten</label>
                        <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#1f2937' }}>{record.date_bitten || 'N/A'}</p>
                      </div>
                      <div>
                        <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>Type of Exposure</label>
                        <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#1f2937' }}>{record.type_of_exposure || 'N/A'}</p>
                      </div>
                      <div>
                        <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>Category of Exposure</label>
                        <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#1f2937' }}>
                          {record.category_of_exposure ? (() => {
                            const categories = [];
                            if (typeof record.category_of_exposure === 'object') {
                              if (record.category_of_exposure.category_i) categories.push('Category I');
                              if (record.category_of_exposure.category_ii) categories.push('Category II');
                              if (record.category_of_exposure.category_iii) categories.push('Category III');
                            }
                            return categories.length > 0 ? categories.join(', ') : 'N/A';
                          })() : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>Vaccine Brand</label>
                        <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#1f2937' }}>{record.vaccine_brand_name || 'N/A'}</p>
                      </div>
                      <div>
                        <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>RIG</label>
                        <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#1f2937' }}>{record.rig || 'N/A'}</p>
                      </div>
                      <div>
                        <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>Route</label>
                        <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#1f2937' }}>{record.route || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Dose Information */}
                  <div>
                    <h3 style={{ margin: '0 0 15px 0', color: '#374151', fontSize: '18px' }}>Dose Information</h3>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        fontSize: '14px'
                      }}>
                        <thead>
                          <tr style={{ backgroundColor: '#f9fafb' }}>
                            <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #e5e7eb' }}>Dose</th>
                            <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #e5e7eb' }}>Date</th>
                            <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #e5e7eb' }}>Status</th>
                            <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #e5e7eb' }}>Updated By</th>
                            <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #e5e7eb' }}>Updated At</th>
                          </tr>
                        </thead>
                        <tbody>
                          {doses.map((dose, index) => (
                            <tr key={index}>
                              <td style={{ padding: '10px', border: '1px solid #e5e7eb' }}>{dose.number}</td>
                              <td style={{ padding: '10px', border: '1px solid #e5e7eb' }}>{dose.date || 'N/A'}</td>
                              <td style={{ padding: '10px', border: '1px solid #e5e7eb' }}>
                                <span style={{
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  fontSize: '12px',
                                  fontWeight: '600',
                                  backgroundColor: dose.status === 'completed' ? '#d1fae5' : 
                                                  dose.status === 'missed' ? '#fee2e2' : '#fef3c7',
                                  color: dose.status === 'completed' ? '#065f46' : 
                                         dose.status === 'missed' ? '#991b1b' : '#92400e'
                                }}>
                                  {dose.status.charAt(0).toUpperCase() + dose.status.slice(1)}
                                </span>
                              </td>
                              <td style={{ padding: '10px', border: '1px solid #e5e7eb' }}>{dose.updatedBy}</td>
                              <td style={{ padding: '10px', border: '1px solid #e5e7eb' }}>
                                {dose.updatedAt ? new Date(dose.updatedAt).toLocaleString() : 'N/A'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              );
            })()}

          </div>
        </div>
      )}
    </div>
  );
};

export default StaffPatientHistory;
