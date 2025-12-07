import React, { useState, useEffect } from 'react';
import { FaUsers, FaPlus, FaTimes, FaFileUpload, FaFileAlt, FaTrash, FaDownload } from 'react-icons/fa';
import { 
  getAllAppointments,
  getTreatmentRecords
} from '../supabase';

const GroupManagement = ({ onClose }) => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [patientsPerGroup, setPatientsPerGroup] = useState(5);
  const [availablePatients, setAvailablePatients] = useState([]);
  const [groupName, setGroupName] = useState('');

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      // Get patients from both appointments and treatment records
      const [appointmentsResult, treatmentRecordsResult] = await Promise.all([
        getAllAppointments(),
        getTreatmentRecords()
      ]);

      const allPatients = new Map();

      // Add patients from appointments
      if (!appointmentsResult.error && appointmentsResult.data) {
        appointmentsResult.data
          .filter(apt => apt.patient_contact && apt.patient_name)
          .forEach(apt => {
            const contact = apt.patient_contact.trim();
            const name = apt.patient_name.trim();
            if (contact && name) {
              if (!allPatients.has(contact) || 
                  new Date(apt.appointment_date || apt.created_at) > 
                  new Date(allPatients.get(contact).lastDate || 0)) {
                allPatients.set(contact, {
                  contact: contact,
                  name: name,
                  lastDate: apt.appointment_date || apt.created_at,
                  source: 'appointment'
                });
              }
            }
          });
      }

      // Add patients from treatment records
      if (!treatmentRecordsResult.error && treatmentRecordsResult.data) {
        treatmentRecordsResult.data
          .filter(record => record.patient_contact && record.patient_name)
          .forEach(record => {
            const contact = record.patient_contact.trim();
            const name = record.patient_name.trim();
            if (contact && name) {
              if (!allPatients.has(contact) || 
                  new Date(record.appointment_date || record.created_at) > 
                  new Date(allPatients.get(contact).lastDate || 0)) {
                allPatients.set(contact, {
                  contact: contact,
                  name: name,
                  lastDate: record.appointment_date || record.created_at,
                  source: 'treatment'
                });
              }
            }
          });
      }

      // Convert map to array and sort by name
      const uniquePatients = Array.from(allPatients.values())
        .sort((a, b) => a.name.localeCompare(b.name));

      setAvailablePatients(uniquePatients);
    } catch (error) {
      console.error('Error fetching patients:', error);
      setAvailablePatients([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroups = (e) => {
    e.preventDefault();
    if (!groupName.trim() || patientsPerGroup < 1) {
      alert('Please enter a group name and valid number of patients per group');
      return;
    }

    if (availablePatients.length === 0) {
      alert('No patients available to group');
      return;
    }

    // Automatically group patients
    const newGroups = [];
    const totalPatients = availablePatients.length;
    const numGroups = Math.ceil(totalPatients / patientsPerGroup);

    for (let i = 0; i < numGroups; i++) {
      const startIdx = i * patientsPerGroup;
      const endIdx = Math.min(startIdx + patientsPerGroup, totalPatients);
      const groupPatients = availablePatients.slice(startIdx, endIdx);

      newGroups.push({
        id: `group-${Date.now()}-${i}`,
        name: `${groupName} - Group ${i + 1}`,
        patients: groupPatients,
        prescriptions: [],
        createdAt: new Date().toISOString()
      });
    }

    setGroups(prev => [...prev, ...newGroups]);
    setGroupName('');
    setPatientsPerGroup(5);
    setShowCreateModal(false);
  };

  const handleDeleteGroup = (groupId) => {
    if (window.confirm('Are you sure you want to delete this group?')) {
      setGroups(prev => prev.filter(g => g.id !== groupId));
    }
  };

  const handleAddPrescription = (groupId) => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return;

    // Create file input
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.doc,.docx,.txt,.jpg,.jpeg,.png';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const prescription = {
            id: `prescription-${Date.now()}`,
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
            uploadedAt: new Date().toISOString(),
            fileData: event.target.result // Base64 or blob URL
          };

          setGroups(prev => prev.map(g => 
            g.id === groupId 
              ? { ...g, prescriptions: [...g.prescriptions, prescription] }
              : g
          ));
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const handleRemovePrescription = (groupId, prescriptionId) => {
    setGroups(prev => prev.map(g => 
      g.id === groupId 
        ? { ...g, prescriptions: g.prescriptions.filter(p => p.id !== prescriptionId) }
        : g
    ));
  };

  const handleDownloadPrescription = (prescription) => {
    const link = document.createElement('a');
    link.href = prescription.fileData;
    link.download = prescription.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
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
        zIndex: 2000,
        padding: '20px'
      }} onClick={onClose}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '1200px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
        }} onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            padding: '24px',
            borderRadius: '20px 20px 0 0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            color: 'white'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px'
              }}>
                <FaUsers />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700' }}>
                  Patient Group Management
                </h2>
                <p style={{ margin: '4px 0 0 0', fontSize: '14px', opacity: 0.9 }}>
                  Create groups and manage prescriptions (Design Mode)
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'white',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.3)';
                e.target.style.transform = 'rotate(90deg)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                e.target.style.transform = 'rotate(0deg)';
              }}
            >
              <FaTimes />
            </button>
          </div>

          {/* Content */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px'
          }}>
            {/* Create Group Button */}
            <div style={{
              marginBottom: '24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ fontSize: '14px', color: '#64748b' }}>
                Total Patients: <strong>{availablePatients.length}</strong>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                style={{
                  padding: '12px 24px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)'
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
                <FaPlus />
                Create Groups
              </button>
            </div>

            {/* Groups List */}
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                Loading patients...
              </div>
            ) : groups.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '60px 20px',
                color: '#64748b'
              }}>
                <FaUsers style={{ fontSize: '64px', marginBottom: '16px', opacity: 0.3 }} />
                <p style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
                  No groups created yet
                </p>
                <p style={{ fontSize: '14px' }}>
                  Click "Create Groups" to automatically group patients
                </p>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                gap: '20px'
              }}>
                {groups.map((group) => (
                  <div
                    key={group.id}
                    style={{
                      background: 'white',
                      border: '2px solid #e2e8f0',
                      borderRadius: '16px',
                      padding: '20px',
                      transition: 'all 0.2s ease',
                      position: 'relative'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    {/* Delete Button */}
                    <button
                      onClick={() => handleDeleteGroup(group.id)}
                      style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        background: '#fee2e2',
                        border: 'none',
                        borderRadius: '6px',
                        width: '28px',
                        height: '28px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: '#dc2626',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = '#fecaca';
                        e.target.style.transform = 'scale(1.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = '#fee2e2';
                        e.target.style.transform = 'scale(1)';
                      }}
                    >
                      <FaTrash style={{ fontSize: '12px' }} />
                    </button>

                    {/* Group Header */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      marginBottom: '16px'
                    }}>
                      <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '20px'
                      }}>
                        <FaUsers />
                      </div>
                      <div style={{ flex: 1 }}>
                        <h3 style={{
                          margin: 0,
                          fontSize: '18px',
                          fontWeight: '700',
                          color: '#1e293b'
                        }}>
                          {group.name}
                        </h3>
                        <p style={{
                          margin: '4px 0 0 0',
                          fontSize: '12px',
                          color: '#64748b'
                        }}>
                          {group.patients.length} patient{group.patients.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>

                    {/* Patients List */}
                    <div style={{
                      marginBottom: '16px',
                      maxHeight: '200px',
                      overflowY: 'auto',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      padding: '8px'
                    }}>
                      {group.patients.map((patient, idx) => (
                        <div
                          key={patient.contact}
                          style={{
                            padding: '8px',
                            marginBottom: '4px',
                            background: '#f8fafc',
                            borderRadius: '6px',
                            fontSize: '13px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: '600', color: '#1e293b' }}>
                              {patient.name}
                            </div>
                            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                              {patient.contact}
                            </div>
                          </div>
                          <div style={{
                            fontSize: '11px',
                            color: '#94a3b8',
                            fontWeight: '500'
                          }}>
                            #{idx + 1}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Prescriptions Section */}
                    <div style={{
                      borderTop: '1px solid #e2e8f0',
                      paddingTop: '12px'
                    }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '8px'
                      }}>
                        <div style={{
                          fontSize: '12px',
                          fontWeight: '600',
                          color: '#64748b',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          Prescriptions ({group.prescriptions.length})
                        </div>
                        <button
                          onClick={() => handleAddPrescription(group.id)}
                          style={{
                            padding: '6px 12px',
                            background: '#f0fdf4',
                            border: '1px solid #bbf7d0',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            color: '#166534',
                            fontSize: '12px',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.background = '#dcfce7';
                            e.target.style.transform = 'scale(1.05)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.background = '#f0fdf4';
                            e.target.style.transform = 'scale(1)';
                          }}
                        >
                          <FaFileUpload style={{ fontSize: '10px' }} />
                          Upload
                        </button>
                      </div>
                      {group.prescriptions.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {group.prescriptions.map((prescription) => (
                            <div
                              key={prescription.id}
                              style={{
                                padding: '8px',
                                background: '#f0f9ff',
                                border: '1px solid #bae6fd',
                                borderRadius: '6px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                fontSize: '12px'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                                <FaFileAlt style={{ color: '#0ea5e9', fontSize: '14px' }} />
                                <div>
                                  <div style={{ fontWeight: '600', color: '#1e293b' }}>
                                    {prescription.fileName}
                                  </div>
                                  <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
                                    {(prescription.fileSize / 1024).toFixed(2)} KB
                                  </div>
                                </div>
                              </div>
                              <div style={{ display: 'flex', gap: '6px' }}>
                                <button
                                  onClick={() => handleDownloadPrescription(prescription)}
                                  style={{
                                    padding: '4px 8px',
                                    background: '#dbeafe',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    color: '#1e40af',
                                    fontSize: '11px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                  }}
                                  title="Download"
                                >
                                  <FaDownload style={{ fontSize: '10px' }} />
                                </button>
                                <button
                                  onClick={() => handleRemovePrescription(group.id, prescription.id)}
                                  style={{
                                    padding: '4px 8px',
                                    background: '#fee2e2',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    color: '#dc2626',
                                    fontSize: '11px'
                                  }}
                                  title="Remove"
                                >
                                  <FaTimes style={{ fontSize: '10px' }} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{
                          padding: '12px',
                          textAlign: 'center',
                          color: '#94a3b8',
                          fontSize: '12px',
                          background: '#f8fafc',
                          borderRadius: '6px',
                          border: '1px dashed #cbd5e1'
                        }}>
                          No prescriptions uploaded
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Groups Modal */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 3000,
          padding: '20px'
        }} onClick={() => setShowCreateModal(false)}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '24px',
            width: '100%',
            maxWidth: '500px'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '700' }}>
                Create Patient Groups
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  color: '#64748b'
                }}
              >
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleCreateGroups}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151'
                }}>
                  Group Name Prefix *
                </label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'all 0.2s ease'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#3b82f6';
                    e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e2e8f0';
                    e.target.style.boxShadow = 'none';
                  }}
                  placeholder="e.g., D0 Patients, Follow-up Group"
                  required
                />
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151'
                }}>
                  Number of Patients per Group *
                </label>
                <input
                  type="number"
                  min="1"
                  max={availablePatients.length}
                  value={patientsPerGroup}
                  onChange={(e) => setPatientsPerGroup(parseInt(e.target.value) || 1)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'all 0.2s ease'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#3b82f6';
                    e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e2e8f0';
                    e.target.style.boxShadow = 'none';
                  }}
                  required
                />
                <div style={{
                  marginTop: '8px',
                  fontSize: '12px',
                  color: '#64748b',
                  padding: '8px',
                  background: '#f0f9ff',
                  borderRadius: '6px',
                  border: '1px solid #bae6fd'
                }}>
                  <strong>Preview:</strong> With {availablePatients.length} patients and {patientsPerGroup} per group, 
                  you will create <strong>{Math.ceil(availablePatients.length / patientsPerGroup)}</strong> group(s).
                </div>
              </div>
              <div style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-end'
              }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setGroupName('');
                    setPatientsPerGroup(5);
                  }}
                  style={{
                    padding: '12px 24px',
                    background: '#f1f5f9',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#64748b'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '12px 24px',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: 'white',
                    boxShadow: '0 2px 4px rgba(59, 130, 246, 0.2)'
                  }}
                >
                  Create Groups
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default GroupManagement;
