import React, { useState, useEffect } from 'react';
import { getAllAppointments, getVaccines, createTreatmentRecord, updateAppointmentStatus, getCurrentUser } from '../supabase';
import { FaEye } from 'react-icons/fa';

const StaffAppointmentList = () => {
  const [activeTab, setActiveTab] = useState('upcoming');
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [vaccines, setVaccines] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [treatmentData, setTreatmentData] = useState({
    type_of_exposure: '',
    category_of_exposure: {
      category_i: false,
      category_ii: false,
      category_iii: false
    },
    vaccine_brand_name: '',
    treatment_to_be_given: {
      pre_exposure: false,
      post_exposure: false
    },
    route: '',
    rig: '',
    d0_date: '',
    d3_date: '',
    d7_date: '',
    d14_date: '',
    d28_30_date: '',
    status_of_animal: '',
    remarks: ''
  });

  // Fetch appointments and vaccines on component mount
  useEffect(() => {
    fetchAppointments();
    fetchVaccines();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const { data, error } = await getAllAppointments();
      
      if (error) {
        console.error('Error fetching appointments:', error.message);
      } else {
        // Load all appointments (confirmed, completed, cancelled)
        setAppointments(data || []);
      }
    } catch (error) {
      console.error('Error:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchVaccines = async () => {
    try {
      const { data, error } = await getVaccines();
      if (error) {
        console.error('Error fetching vaccines:', error);
      } else {
        console.log('Vaccines fetched:', data); // Debug log
        setVaccines(data || []);
      }
    } catch (error) {
      console.error('Error fetching vaccines:', error);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Format time for display
  // (formatTime function removed as it was unused)

  // Filter appointments by tab
  const filteredAppointments = appointments.filter(appointment => {
    switch (activeTab) {
      case 'upcoming':
        return appointment.status === 'confirmed';
      case 'completed':
        return appointment.status === 'completed';
      case 'cancelled':
        return appointment.status === 'cancelled';
      default:
        return true;
    }
  });

  // Count appointments by status
  const upcomingCount = appointments.filter(apt => apt.status === 'confirmed').length;
  const completedCount = appointments.filter(apt => apt.status === 'completed').length;
  const cancelledCount = appointments.filter(apt => apt.status === 'cancelled').length;

  // Handle view details
  const handleViewDetails = (appointment) => {
    setSelectedAppointment(appointment);
    setShowModal(true);
  };

  // Handle modal close
  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedAppointment(null);
    setTreatmentData({
      type_of_exposure: '',
      category_of_exposure: {
        category_i: false,
        category_ii: false,
        category_iii: false
      },
      vaccine_brand_name: '',
      treatment_to_be_given: {
        pre_exposure: false,
        post_exposure: false
      },
      route: '',
      rig: '',
      d0_date: '',
      d3_date: '',
      d7_date: '',
      d14_date: '',
      d28_30_date: '',
      status_of_animal: '',
      remarks: ''
    });
  };

  // Handle form input changes
  const handleInputChange = (field, value) => {
    setTreatmentData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle nested checkbox changes
  const handleNestedCheckboxChange = (parentField, childField, value) => {
    setTreatmentData(prev => ({
      ...prev,
      [parentField]: {
        ...prev[parentField],
        [childField]: value
      }
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Get current user for created_by field
      const { user } = await getCurrentUser();
      
      // Prepare treatment record data
      const treatmentRecord = {
        appointment_id: selectedAppointment.id,
        
        // Patient Information
        patient_user_id: selectedAppointment.user_id || null, // Link to patient's user account
        patient_name: selectedAppointment.patient_name,
        patient_contact: selectedAppointment.patient_contact,
        patient_address: selectedAppointment.patient_address,
        patient_age: selectedAppointment.patient_age,
        patient_sex: selectedAppointment.patient_sex,
        appointment_date: selectedAppointment.appointment_date,
        
        // Bite Information
        date_bitten: selectedAppointment.date_bitten,
        time_bitten: selectedAppointment.time_bitten,
        site_of_bite: selectedAppointment.place_bitten,
        biting_animal: selectedAppointment.biting_animal,
        animal_status: selectedAppointment.animal_status,
        place_bitten_barangay: selectedAppointment.barangay || selectedAppointment.patient_address,
        provoked: selectedAppointment.provoke,
        local_wound_treatment: selectedAppointment.washing_of_bite || selectedAppointment.local_wound_treatment,
        
        // Treatment Details
        type_of_exposure: treatmentData.type_of_exposure,
        category_of_exposure: treatmentData.category_of_exposure,
        vaccine_brand_name: treatmentData.vaccine_brand_name,
        treatment_to_be_given: treatmentData.treatment_to_be_given,
        route: treatmentData.route,
        rig: treatmentData.rig,
        d0_date: treatmentData.d0_date || null,
        d3_date: treatmentData.d3_date || null,
        d7_date: treatmentData.d7_date || null,
        d14_date: treatmentData.d14_date || null,
        d28_30_date: treatmentData.d28_30_date || null,
        status_of_animal_date: treatmentData.status_of_animal || null,
        remarks: treatmentData.remarks,
        
        created_by: user?.id
      };
      
      // Save treatment record
      const { data: treatmentResult, error: treatmentError } = await createTreatmentRecord(treatmentRecord);
      
      if (treatmentError) {
        console.error('Error saving treatment record:', treatmentError);
        alert('Error saving treatment record. Please try again.');
        return;
      }
      
      // Update appointment status to completed
      const { error: statusError } = await updateAppointmentStatus(selectedAppointment.id, 'completed');
      
      if (statusError) {
        console.error('Error updating appointment status:', statusError);
        alert('Treatment saved but failed to update appointment status.');
      }
      
      console.log('Treatment record saved successfully:', treatmentResult);
      alert('Treatment details saved successfully! Appointment moved to completed.');
      
      // Refresh appointments list
      await fetchAppointments();
      
      // Close modal
      handleCloseModal();
      
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      alert('An error occurred while saving. Please try again.');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Upcoming':
        return { backgroundColor: '#3b82f6', color: 'white' };
      case 'Completed':
        return { backgroundColor: '#10b981', color: 'white' };
      case 'Cancelled':
        return { backgroundColor: '#ef4444', color: 'white' };
      default:
        return { backgroundColor: '#6b7280', color: 'white' };
    }
  };

  return (
    <div className="content-section" style={{
      backgroundColor: '#f0f8ff',
      minHeight: '100vh',
      padding: '20px',
      width: '100%'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        width: '100%',
        height: '100%'
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
            All Appointments
          </h2>
        </div>

        {/* Navigation Tabs */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '24px',
          borderBottom: '1px solid #e5e7eb'
        }}>
          {[
            { id: 'upcoming', label: 'Upcoming', count: upcomingCount },
            { id: 'completed', label: 'Completed', count: completedCount },
            { id: 'cancelled', label: 'Cancelled/Missed', count: cancelledCount }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '12px 20px',
                backgroundColor: activeTab === tab.id ? '#dbeafe' : 'transparent',
                color: activeTab === tab.id ? '#1e40af' : '#6b7280',
                border: 'none',
                borderRadius: '8px 8px 0 0',
                fontSize: '14px',
                fontWeight: activeTab === tab.id ? '600' : '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Appointment Table */}
        <div style={{
          overflowX: 'auto'
        }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse'
          }}>
            <thead>
              <tr style={{
                borderBottom: '1px solid #e5e7eb'
              }}>
                {['Date', 'Patient', 'Dose #', 'Status', 'Actions'].map((header) => (
                  <th key={header} style={{
                    padding: '16px 12px',
                    textAlign: 'left',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: 'white',
                    backgroundColor: '#3b82f6'
                  }}>
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" style={{
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
                  <td colSpan="5" style={{
                    padding: '40px',
                    textAlign: 'center',
                    color: '#6b7280',
                    fontSize: '16px'
                  }}>
                    No {activeTab} appointments found
                  </td>
                </tr>
              ) : (
                filteredAppointments.map((appointment) => (
                  <tr key={appointment.id} style={{
                    borderBottom: '1px solid #f3f4f6'
                  }}>
                    <td style={{
                      padding: '16px 12px',
                      fontSize: '14px',
                      color: '#1f2937',
                      fontWeight: '500'
                    }}>
                      {formatDate(appointment.appointment_date)}
                    </td>
                    <td style={{
                      padding: '16px 12px',
                      fontSize: '14px',
                      color: '#1f2937',
                      fontWeight: '500'
                    }}>
                      {appointment.patient_name || 'N/A'}
                    </td>
                    <td style={{
                      padding: '16px 12px',
                      fontSize: '14px',
                      color: '#1f2937',
                      fontWeight: '500'
                    }}>
                      1
                    </td>
                    <td style={{
                      padding: '16px 12px'
                    }}>
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '500',
                        ...getStatusColor(
                          appointment.status === 'confirmed' ? 'Upcoming' : 
                          appointment.status === 'completed' ? 'Completed' : 
                          appointment.status === 'cancelled' ? 'Cancelled' : 'Unknown'
                        )
                      }}>
                        {
                          appointment.status === 'confirmed' ? 'Upcoming' : 
                          appointment.status === 'completed' ? 'Completed' : 
                          appointment.status === 'cancelled' ? 'Cancelled' : 
                          appointment.status
                        }
                      </span>
                    </td>
                   
                    <td style={{
                      padding: '16px 12px'
                    }}>
                      <button 
                        onClick={() => handleViewDetails(appointment)}
                        style={{
                          background: '#3b82f6',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          padding: '8px 12px',
                          color: 'white',
                          fontSize: '14px',
                          fontWeight: '500',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <FaEye size={14} />
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Treatment Details Modal */}
        {showModal && selectedAppointment && (
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
              borderRadius: '12px',
              padding: '24px',
              width: '90%',
              maxWidth: '800px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px',
                borderBottom: '1px solid #e5e7eb',
                paddingBottom: '16px'
              }}>
                <h3 style={{
                  margin: 0,
                  fontSize: '20px',
                  fontWeight: '700',
                  color: '#1f2937'
                }}>
                  Treatment Details - {selectedAppointment.patient_name}
                </h3>
                <button
                  onClick={handleCloseModal}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '24px',
                    cursor: 'pointer',
                    color: '#6b7280',
                    padding: '4px'
                  }}
                >
                  ×
                </button>
              </div>

              {/* Patient Information Section */}
              <div style={{
                backgroundColor: '#f8fafc',
                padding: '20px',
                borderRadius: '8px',
                marginBottom: '24px',
                border: '1px solid #e2e8f0'
              }}>
                <h4 style={{
                  margin: '0 0 16px 0',
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#1e40af',
                  borderBottom: '2px solid #3b82f6',
                  paddingBottom: '8px'
                }}>
                  Patient Information
                </h4>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '16px'
                }}>
                  <div>
                    <span style={{ fontWeight: '600', color: '#374151' }}>Name:</span>
                    <span style={{ marginLeft: '8px', color: '#6b7280' }}>
                      {selectedAppointment.patient_name || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span style={{ fontWeight: '600', color: '#374151' }}>Contact:</span>
                    <span style={{ marginLeft: '8px', color: '#6b7280' }}>
                      {selectedAppointment.patient_contact || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span style={{ fontWeight: '600', color: '#374151' }}>Address:</span>
                    <span style={{ marginLeft: '8px', color: '#6b7280' }}>
                      {selectedAppointment.patient_address || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span style={{ fontWeight: '600', color: '#374151' }}>Age:</span>
                    <span style={{ marginLeft: '8px', color: '#6b7280' }}>
                      {selectedAppointment.patient_age || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span style={{ fontWeight: '600', color: '#374151' }}>Sex:</span>
                    <span style={{ marginLeft: '8px', color: '#6b7280' }}>
                      {selectedAppointment.patient_sex || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span style={{ fontWeight: '600', color: '#374151' }}>Appointment Date:</span>
                    <span style={{ marginLeft: '8px', color: '#6b7280' }}>
                      {formatDate(selectedAppointment.appointment_date)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bite Incident Information Section */}
              <div style={{
                backgroundColor: '#fef2f2',
                padding: '20px',
                borderRadius: '8px',
                marginBottom: '24px',
                border: '1px solid #fecaca'
              }}>
                <h4 style={{
                  margin: '0 0 16px 0',
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#dc2626',
                  borderBottom: '2px solid #ef4444',
                  paddingBottom: '8px'
                }}>
                  Bite Information
                </h4>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '16px'
                }}>
                  <div>
                    <span style={{ fontWeight: '600', color: '#dc2626' }}>DATE BITTEN:</span>
                    <span style={{ marginLeft: '8px', color: '#6b7280' }}>
                      {selectedAppointment.date_bitten ? formatDate(selectedAppointment.date_bitten) : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span style={{ fontWeight: '600', color: '#dc2626' }}>TIME BITTEN:</span>
                    <span style={{ marginLeft: '8px', color: '#6b7280' }}>
                      {selectedAppointment.time_bitten || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span style={{ fontWeight: '600', color: '#dc2626' }}>SITE OF BITE:</span>
                    <span style={{ marginLeft: '8px', color: '#6b7280' }}>
                      {selectedAppointment.site_of_bite || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span style={{ fontWeight: '600', color: '#dc2626' }}>BITING ANIMAL:</span>
                    <span style={{ marginLeft: '8px', color: '#6b7280' }}>
                      {selectedAppointment.biting_animal || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span style={{ fontWeight: '600', color: '#dc2626' }}>ANIMAL STATUS:</span>
                    <span style={{ marginLeft: '8px', color: '#6b7280' }}>
                      {selectedAppointment.animal_status || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span style={{ fontWeight: '600', color: '#dc2626' }}>PLACE BITTEN (BARANGAY):</span>
                    <span style={{ marginLeft: '8px', color: '#6b7280' }}>
                      {selectedAppointment.barangay || selectedAppointment.place_bitten || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span style={{ fontWeight: '600', color: '#dc2626' }}>PROVOKED:</span>
                    <span style={{ marginLeft: '8px', color: '#6b7280' }}>
                      {selectedAppointment.provoke || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span style={{ fontWeight: '600', color: '#dc2626' }}>LOCAL WOUND TREATMENT:</span>
                    <span style={{ marginLeft: '8px', color: '#6b7280' }}>
                      {selectedAppointment.washing_of_bite || selectedAppointment.local_wound_treatment || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit}>
                <div style={{
                  backgroundColor: '#f0f9ff',
                  padding: '20px',
                  borderRadius: '8px',
                  marginBottom: '24px',
                  border: '1px solid #bae6fd'
                }}>
                  <h4 style={{
                    margin: '0 0 16px 0',
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#0369a1',
                    borderBottom: '2px solid #0ea5e9',
                    paddingBottom: '8px'
                  }}>
                    Treatment Details
                  </h4>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '20px',
                    marginBottom: '24px'
                  }}>
                  {/* Type of Exposure */}
                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#374151'
                    }}>
                      Type of Exposure
                    </label>
                    <input
                      type="text"
                      value={treatmentData.type_of_exposure}
                      onChange={(e) => handleInputChange('type_of_exposure', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '14px'
                      }}
                      placeholder="Enter type of exposure"
                    />
                  </div>

                  {/* Category of Exposure */}
                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#374151'
                    }}>
                      Category of Exposure
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: '14px',
                        color: '#374151',
                        cursor: 'pointer'
                      }}>
                        <input
                          type="checkbox"
                          checked={treatmentData.category_of_exposure.category_i}
                          onChange={(e) => handleNestedCheckboxChange('category_of_exposure', 'category_i', e.target.checked)}
                          style={{
                            marginRight: '8px',
                            width: '16px',
                            height: '16px'
                          }}
                        />
                        Category I
                      </label>
                      <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: '14px',
                        color: '#374151',
                        cursor: 'pointer'
                      }}>
                        <input
                          type="checkbox"
                          checked={treatmentData.category_of_exposure.category_ii}
                          onChange={(e) => handleNestedCheckboxChange('category_of_exposure', 'category_ii', e.target.checked)}
                          style={{
                            marginRight: '8px',
                            width: '16px',
                            height: '16px'
                          }}
                        />
                        Category II
                      </label>
                      <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: '14px',
                        color: '#374151',
                        cursor: 'pointer'
                      }}>
                        <input
                          type="checkbox"
                          checked={treatmentData.category_of_exposure.category_iii}
                          onChange={(e) => handleNestedCheckboxChange('category_of_exposure', 'category_iii', e.target.checked)}
                          style={{
                            marginRight: '8px',
                            width: '16px',
                            height: '16px'
                          }}
                        />
                        Category III
                      </label>
                    </div>
                  </div>

                  {/* Vaccine Brand Name */}
                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#374151'
                    }}>
                      Vaccine Brand Name
                    </label>
                    <select
                      value={treatmentData.vaccine_brand_name}
                      onChange={(e) => handleInputChange('vaccine_brand_name', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '14px'
                      }}
                    >
                      <option value="">Select Vaccine</option>
                      {vaccines && vaccines.length > 0 ? (
                        vaccines.map((vaccine) => (
                          <option key={vaccine.id} value={vaccine.vaccine_brand}>
                            {vaccine.vaccine_brand}
                          </option>
                        ))
                      ) : (
                        <option value="" disabled>No vaccines available</option>
                      )}
                    </select>
                    {/* Debug info */}
                    <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                      Vaccines loaded: {vaccines?.length || 0}
                    </div>
                  </div>

                  {/* Treatment to be Given */}
                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#374151'
                    }}>
                      Treatment to be Given
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: '14px',
                        color: '#374151',
                        cursor: 'pointer'
                      }}>
                        <input
                          type="checkbox"
                          checked={treatmentData.treatment_to_be_given.pre_exposure}
                          onChange={(e) => handleNestedCheckboxChange('treatment_to_be_given', 'pre_exposure', e.target.checked)}
                          style={{
                            marginRight: '8px',
                            width: '16px',
                            height: '16px'
                          }}
                        />
                        Pre-Exposure Prophylaxis
                      </label>
                      <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: '14px',
                        color: '#374151',
                        cursor: 'pointer'
                      }}>
                        <input
                          type="checkbox"
                          checked={treatmentData.treatment_to_be_given.post_exposure}
                          onChange={(e) => handleNestedCheckboxChange('treatment_to_be_given', 'post_exposure', e.target.checked)}
                          style={{
                            marginRight: '8px',
                            width: '16px',
                            height: '16px'
                          }}
                        />
                        Post Exposure Prophylaxis
                      </label>
                    </div>
                  </div>

                  {/* Route */}
                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#374151'
                    }}>
                      Route
                    </label>
                    <input
                      type="text"
                      value={treatmentData.route}
                      onChange={(e) => handleInputChange('route', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '14px'
                      }}
                      placeholder="Enter route (e.g., ID, IM)"
                    />
                  </div>

                  {/* RIG */}
                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#374151'
                    }}>
                      RIG
                    </label>
                    <input
                      type="text"
                      value={treatmentData.rig}
                      onChange={(e) => handleInputChange('rig', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '14px'
                      }}
                      placeholder="Enter RIG details"
                    />
                  </div>

                  {/* Date Fields */}
                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#374151'
                    }}>
                      D0 Date
                    </label>
                    <input
                      type="date"
                      value={treatmentData.d0_date}
                      onChange={(e) => handleInputChange('d0_date', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '14px'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#374151'
                    }}>
                      D3 Date
                    </label>
                    <input
                      type="date"
                      value={treatmentData.d3_date}
                      onChange={(e) => handleInputChange('d3_date', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '14px'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#374151'
                    }}>
                      D7 Date
                    </label>
                    <input
                      type="date"
                      value={treatmentData.d7_date}
                      onChange={(e) => handleInputChange('d7_date', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '14px'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#374151'
                    }}>
                      D14 Date
                    </label>
                    <input
                      type="date"
                      value={treatmentData.d14_date}
                      onChange={(e) => handleInputChange('d14_date', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '14px'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#374151'
                    }}>
                      D28/30 Date
                    </label>
                    <input
                      type="date"
                      value={treatmentData.d28_30_date}
                      onChange={(e) => handleInputChange('d28_30_date', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '14px'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#374151'
                    }}>
                      Status of Animal After Exposure Date
                    </label>
                    <input
                      type="date"
                      value={treatmentData.status_of_animal}
                      onChange={(e) => handleInputChange('status_of_animal', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                </div>
                </div>

                {/* Remarks - Full Width */}
                <div style={{ marginBottom: '24px' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#374151'
                  }}>
                    Remarks
                  </label>
                  <textarea
                    value={treatmentData.remarks}
                    onChange={(e) => handleInputChange('remarks', e.target.value)}
                    rows={4}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                      resize: 'vertical'
                    }}
                    placeholder="Enter any additional remarks or notes"
                  />
                </div>

                {/* Action Buttons */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '12px'
                }}>
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    style={{
                      padding: '12px 24px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      backgroundColor: 'white',
                      color: '#374151',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      padding: '12px 24px',
                      border: 'none',
                      borderRadius: '8px',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    Save Treatment Details
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffAppointmentList; 