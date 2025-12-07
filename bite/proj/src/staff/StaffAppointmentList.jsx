import React, { useState, useEffect } from 'react';
import { getAllAppointments, getVaccines, createTreatmentRecord, updateAppointmentStatus, getCurrentUser, getTreatmentRecordByAppointmentId, getTreatmentRecords } from '../supabase';
import { FaEye, FaTimes, FaSync, FaUsers, FaPlus, FaIdCard } from 'react-icons/fa';
import GroupManagement from '../components/GroupManagement';

const StaffAppointmentList = () => {
  const [activeTab, setActiveTab] = useState('upcoming');
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [vaccines, setVaccines] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [treatmentRecord, setTreatmentRecord] = useState(null);
  const [loadingTreatment, setLoadingTreatment] = useState(false);
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
  const [showGroupManagement, setShowGroupManagement] = useState(false);
  const [showAddPatientModal, setShowAddPatientModal] = useState(false);
  const [newPatientData, setNewPatientData] = useState({
    // Patient Information
    patient_name: '',
    patient_contact: '',
    patient_address: '',
    patient_age: '',
    patient_sex: '',
    appointment_date: new Date().toISOString().split('T')[0],
    // Bite Information
    date_bitten: '',
    time_bitten: '',
    site_of_bite: '',
    biting_animal: '',
    animal_status: '',
    place_bitten_barangay: '',
    provoked: '',
    local_wound_treatment: '',
    // Treatment Details
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
    status_of_animal_date: '',
    remarks: ''
  });
  const [savingPatient, setSavingPatient] = useState(false);

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
  const formatTime = (timeString) => {
    if (!timeString) return 'Not specified';
    return timeString;
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
  const handleViewDetails = async (appointment) => {
    console.log('Opening details for appointment:', appointment);
    console.log('Appointment status:', appointment.status);
    console.log('Appointment ID:', appointment.id);
    
    setSelectedAppointment(appointment);
    setShowModal(true);
    
    // If appointment is completed, fetch the treatment record from treatment_records table
    if (appointment.status === 'completed') {
      setLoadingTreatment(true);
      setTreatmentRecord(null); // Reset first
      try {
        console.log('Fetching treatment record for appointment ID:', appointment.id);
        
        // First, try to fetch by appointment_id
        let { data, error } = await getTreatmentRecordByAppointmentId(appointment.id);
        console.log('Treatment record fetch by appointment_id result:', { data, error });
        
        // If not found by appointment_id, try to fetch by patient contact and appointment date
        if (!data && !error && appointment.patient_contact && appointment.appointment_date) {
          console.log('Trying alternative fetch by patient contact and date...');
          const { data: allRecords, error: allError } = await getTreatmentRecords();
          
          if (!allError && allRecords) {
            // Find matching record by patient contact and appointment date
            const matchingRecord = allRecords.find(record => 
              record.patient_contact === appointment.patient_contact &&
              record.appointment_date === appointment.appointment_date
            );
            
            if (matchingRecord) {
              console.log('Found treatment record by patient contact and date:', matchingRecord);
              data = matchingRecord;
              error = null;
            } else {
              console.log('No matching record found by patient contact and date');
            }
          }
        }
        
        if (error) {
          console.error('Error fetching treatment record:', error);
          setTreatmentRecord(null);
        } else if (data) {
          setTreatmentRecord(data);
          console.log('Treatment record loaded successfully:', data);
          console.log('Treatment record keys:', Object.keys(data));
        } else {
          console.warn('No treatment record found for appointment ID:', appointment.id);
          setTreatmentRecord(null);
        }
      } catch (error) {
        console.error('Exception while fetching treatment record:', error);
        setTreatmentRecord(null);
      } finally {
        setLoadingTreatment(false);
      }
    } else {
      // Reset treatment record for upcoming appointments
      setTreatmentRecord(null);
      setLoadingTreatment(false);
    }
  };

  // Handle modal close
  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedAppointment(null);
    setTreatmentRecord(null);
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
        user_id: selectedAppointment.user_id || null, // Link to patient's user account
        patient_name: selectedAppointment.patient_name,
        patient_contact: selectedAppointment.patient_contact,
        patient_address: selectedAppointment.patient_address,
        patient_age: selectedAppointment.patient_age,
        patient_sex: selectedAppointment.patient_sex,
        appointment_date: selectedAppointment.appointment_date,
        
        // Bite Information
        date_bitten: selectedAppointment.date_bitten,
        time_bitten: selectedAppointment.time_bitten,
        site_of_bite: selectedAppointment.site_of_bite,
        biting_animal: selectedAppointment.biting_animal,
        animal_status: selectedAppointment.animal_status,
        place_bitten_barangay: selectedAppointment.place_bitten,
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

  const handleAddPatient = () => {
    setNewPatientData({
      // Patient Information
      patient_name: '',
      patient_contact: '',
      patient_address: '',
      patient_age: '',
      patient_sex: '',
      appointment_date: new Date().toISOString().split('T')[0],
      // Bite Information
      date_bitten: '',
      time_bitten: '',
      site_of_bite: '',
      biting_animal: '',
      animal_status: '',
      place_bitten_barangay: '',
      provoked: '',
      local_wound_treatment: '',
      // Treatment Details
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
      status_of_animal_date: '',
      remarks: ''
    });
    setShowAddPatientModal(true);
  };

  const handleNewPatientInputChange = (field, value) => {
    setNewPatientData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNewPatientNestedCheckboxChange = (parentField, childField, value) => {
    setNewPatientData(prev => ({
      ...prev,
      [parentField]: {
        ...prev[parentField],
        [childField]: value
      }
    }));
  };

  const handleSaveNewPatient = async (e) => {
    e.preventDefault();
    
    if (!newPatientData.patient_name || !newPatientData.patient_contact) {
      alert('Please fill in at least Patient Name and Contact');
      return;
    }

    try {
      setSavingPatient(true);
      const { user } = await getCurrentUser();
      
      // Prepare treatment record data (no appointment_id since patient didn't book online)
      const treatmentRecord = {
        appointment_id: null, // No appointment since they didn't book online
        
        // Patient Information
        user_id: null, // Patient doesn't have user account
        patient_name: newPatientData.patient_name,
        patient_contact: newPatientData.patient_contact,
        patient_address: newPatientData.patient_address || null,
        patient_age: newPatientData.patient_age ? parseInt(newPatientData.patient_age) : null,
        patient_sex: newPatientData.patient_sex || null,
        appointment_date: newPatientData.appointment_date || null,
        
        // Bite Information
        date_bitten: newPatientData.date_bitten || null,
        time_bitten: newPatientData.time_bitten || null,
        site_of_bite: newPatientData.site_of_bite || null,
        biting_animal: newPatientData.biting_animal || null,
        animal_status: newPatientData.animal_status || null,
        place_bitten_barangay: newPatientData.place_bitten_barangay || null,
        provoked: newPatientData.provoked || null,
        local_wound_treatment: newPatientData.local_wound_treatment || null,
        
        // Treatment Details
        type_of_exposure: newPatientData.type_of_exposure || null,
        category_of_exposure: newPatientData.category_of_exposure,
        vaccine_brand_name: newPatientData.vaccine_brand_name || null,
        treatment_to_be_given: newPatientData.treatment_to_be_given,
        route: newPatientData.route || null,
        rig: newPatientData.rig || null,
        d0_date: newPatientData.d0_date || null,
        d3_date: newPatientData.d3_date || null,
        d7_date: newPatientData.d7_date || null,
        d14_date: newPatientData.d14_date || null,
        d28_30_date: newPatientData.d28_30_date || null,
        status_of_animal_date: newPatientData.status_of_animal_date || null,
        remarks: newPatientData.remarks || null,
        
        created_by: user?.id
      };
      
      // Save treatment record
      const { data: treatmentResult, error: treatmentError } = await createTreatmentRecord(treatmentRecord);
      
      if (treatmentError) {
        console.error('Error saving treatment record:', treatmentError);
        alert('Error saving patient record. Please try again.');
        return;
      }
      
      console.log('Patient record saved successfully:', treatmentResult);
      
      // Ask if user wants to print vaccine card
      const printCard = window.confirm('Patient added successfully! Would you like to print the vaccine card?');
      
      if (printCard && treatmentResult) {
        handlePrintVaccineCard(treatmentResult);
      }
      
      // Refresh appointments list
      await fetchAppointments();
      
      // Close modal and reset form
      setShowAddPatientModal(false);
      setNewPatientData({
        patient_name: '',
        patient_contact: '',
        patient_address: '',
        patient_age: '',
        patient_sex: '',
        appointment_date: new Date().toISOString().split('T')[0],
        date_bitten: '',
        time_bitten: '',
        site_of_bite: '',
        biting_animal: '',
        animal_status: '',
        place_bitten_barangay: '',
        provoked: '',
        local_wound_treatment: '',
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
        status_of_animal_date: '',
        remarks: ''
      });
      
    } catch (error) {
      console.error('Error in handleSaveNewPatient:', error);
      alert('An error occurred while saving. Please try again.');
    } finally {
      setSavingPatient(false);
    }
  };

  // Helper function to format category of exposure
  const formatCategoryOfExposure = (category) => {
    if (!category) return 'N/A';
    if (typeof category === 'string') {
      try {
        category = JSON.parse(category);
      } catch (e) {
        return category;
      }
    }
    const categories = [];
    if (category.category_i) categories.push('Category I');
    if (category.category_ii) categories.push('Category II');
    if (category.category_iii) categories.push('Category III');
    return categories.length > 0 ? categories.join(', ') : 'N/A';
  };

  // Helper function to format treatment to be given
  const formatTreatmentToBeGiven = (treatment) => {
    if (!treatment) return 'N/A';
    if (typeof treatment === 'string') {
      try {
        treatment = JSON.parse(treatment);
      } catch (e) {
        return treatment;
      }
    }
    const treatments = [];
    if (treatment.pre_exposure) treatments.push('Pre-Exposure Prophylaxis');
    if (treatment.post_exposure) treatments.push('Post-Exposure Prophylaxis');
    return treatments.length > 0 ? treatments.join(', ') : 'N/A';
  };

  // Print Vaccine Card
  const handlePrintVaccineCard = (record, appointment = null) => {
    if (!record) return;
    
    const doses = [
      { name: 'D0', date: record.d0_date, status: record.d0_status || 'pending' },
      { name: 'D3', date: record.d3_date, status: record.d3_status || 'pending' },
      { name: 'D7', date: record.d7_date, status: record.d7_status || 'pending' },
      { name: 'D14', date: record.d14_date, status: record.d14_status || 'pending' },
      { name: 'D28/30', date: record.d28_30_date, status: record.d28_30_status || 'pending' }
    ];

    const printWindow = window.open('', '_blank');
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Vaccine Card - ${record.patient_name}</title>
          <style>
            @media print {
              @page {
                size: A4;
                margin: 15mm;
              }
              body { margin: 0; padding: 0; }
            }
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: 'Arial', sans-serif;
              padding: 20px;
              background: white;
            }
            .vaccine-card {
              max-width: 800px;
              margin: 0 auto;
              border: 3px solid #1e40af;
              border-radius: 12px;
              padding: 30px;
              background: linear-gradient(to bottom, #eff6ff 0%, #ffffff 20%);
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .card-header {
              text-align: center;
              border-bottom: 3px solid #1e40af;
              padding-bottom: 20px;
              margin-bottom: 25px;
            }
            .card-header h1 {
              color: #1e40af;
              font-size: 28px;
              font-weight: 700;
              margin-bottom: 8px;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            .card-header p {
              color: #64748b;
              font-size: 14px;
              font-weight: 500;
            }
            .patient-info {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              margin-bottom: 25px;
            }
            .info-section {
              background: #f8fafc;
              padding: 15px;
              border-radius: 8px;
              border-left: 4px solid #3b82f6;
            }
            .info-section h3 {
              color: #1e40af;
              font-size: 12px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-bottom: 8px;
            }
            .info-section p {
              color: #1f2937;
              font-size: 16px;
              font-weight: 600;
              word-break: break-word;
            }
            .vaccine-details {
              background: #f0fdf4;
              padding: 20px;
              border-radius: 8px;
              border: 2px solid #22c55e;
              margin-bottom: 25px;
            }
            .vaccine-details h2 {
              color: #166534;
              font-size: 18px;
              font-weight: 700;
              margin-bottom: 15px;
              text-align: center;
              border-bottom: 2px solid #22c55e;
              padding-bottom: 10px;
            }
            .vaccine-info {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 15px;
              margin-bottom: 15px;
            }
            .dose-schedule {
              margin-top: 20px;
            }
            .dose-schedule h3 {
              color: #166534;
              font-size: 14px;
              font-weight: 700;
              margin-bottom: 12px;
              text-transform: uppercase;
            }
            .dose-table {
              width: 100%;
              border-collapse: collapse;
              background: white;
              border-radius: 6px;
              overflow: hidden;
            }
            .dose-table thead {
              background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
              color: white;
            }
            .dose-table th {
              padding: 12px;
              text-align: left;
              font-weight: 700;
              font-size: 12px;
              text-transform: uppercase;
            }
            .dose-table td {
              padding: 12px;
              border-bottom: 1px solid #e5e7eb;
              font-size: 14px;
            }
            .dose-table tr:last-child td {
              border-bottom: none;
            }
            .status-badge {
              display: inline-block;
              padding: 4px 12px;
              border-radius: 20px;
              font-size: 12px;
              font-weight: 600;
              text-transform: uppercase;
            }
            .status-completed {
              background: #d1fae5;
              color: #065f46;
            }
            .status-pending {
              background: #fef3c7;
              color: #92400e;
            }
            .status-missed {
              background: #fee2e2;
              color: #991b1b;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 2px solid #e5e7eb;
              color: #64748b;
              font-size: 12px;
            }
            .qr-placeholder {
              width: 100px;
              height: 100px;
              border: 2px dashed #cbd5e1;
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 20px auto;
              border-radius: 8px;
              color: #94a3b8;
              font-size: 10px;
              text-align: center;
            }
            @media print {
              .vaccine-card {
                box-shadow: none;
                border: 3px solid #1e40af;
              }
            }
          </style>
        </head>
        <body>
          <div class="vaccine-card">
            <div class="card-header">
              <h1>🩺 Rabies Vaccination Card</h1>
              <p>Official Vaccination Record</p>
            </div>
            
            <div class="patient-info">
              <div class="info-section">
                <h3>Patient Name</h3>
                <p>${record.patient_name || 'N/A'}</p>
              </div>
              <div class="info-section">
                <h3>Patient ID</h3>
                <p>${record.id || 'N/A'}</p>
              </div>
              <div class="info-section">
                <h3>Contact Number</h3>
                <p>${record.patient_contact || 'N/A'}</p>
              </div>
              <div class="info-section">
                <h3>Date of Birth / Age</h3>
                <p>${record.patient_age ? `${record.patient_age} years old` : 'N/A'}</p>
              </div>
              <div class="info-section">
                <h3>Gender</h3>
                <p>${record.patient_sex || 'N/A'}</p>
              </div>
              <div class="info-section">
                <h3>Address</h3>
                <p>${record.patient_address || 'N/A'}</p>
              </div>
            </div>

            <div class="vaccine-details">
              <h2>Vaccination Information</h2>
              <div class="vaccine-info">
                <div class="info-section" style="background: white; border-left-color: #22c55e;">
                  <h3>Vaccine Brand</h3>
                  <p>${record.vaccine_brand_name || 'N/A'}</p>
                </div>
                <div class="info-section" style="background: white; border-left-color: #22c55e;">
                  <h3>Type of Exposure</h3>
                  <p>${record.type_of_exposure || 'N/A'}</p>
                </div>
                <div class="info-section" style="background: white; border-left-color: #22c55e;">
                  <h3>Category</h3>
                  <p>${formatCategoryOfExposure(record.category_of_exposure)}</p>
                </div>
                <div class="info-section" style="background: white; border-left-color: #22c55e;">
                  <h3>Treatment</h3>
                  <p>${formatTreatmentToBeGiven(record.treatment_to_be_given)}</p>
                </div>
                <div class="info-section" style="background: white; border-left-color: #22c55e;">
                  <h3>Route</h3>
                  <p>${record.route || 'N/A'}</p>
                </div>
                <div class="info-section" style="background: white; border-left-color: #22c55e;">
                  <h3>RIG</h3>
                  <p>${record.rig || 'N/A'}</p>
                </div>
              </div>

              <div class="dose-schedule">
                <h3>Vaccination Schedule</h3>
                <table class="dose-table">
                  <thead>
                    <tr>
                      <th>Dose</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${doses.map(dose => `
                      <tr>
                        <td><strong>${dose.name}</strong></td>
                        <td>${dose.date ? new Date(dose.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            </div>

            <div class="footer">
              <p><strong>Issued Date:</strong> ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              <p style="margin-top: 10px;">This is an official vaccination record. Please keep this card safe.</p>
              <div class="qr-placeholder">
                <div>QR Code<br/>Placeholder</div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 250);
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
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
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
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <h2 style={{
            margin: '0 0 8px 0',
            fontSize: '24px',
            fontWeight: '700',
            color: '#1f2937'
          }}>
            All Appointments
          </h2>
          <div style={{
            display: 'flex',
            gap: '12px',
            alignItems: 'center'
          }}>
            <button
              onClick={handleAddPatient}
              style={{
                padding: '10px 16px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 4px rgba(59, 130, 246, 0.2)'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-1px)';
                e.target.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 2px 4px rgba(59, 130, 246, 0.2)';
              }}
              title="Add new patient directly to treatment records"
            >
              <FaPlus />
              Add Patient
            </button>
            <button
              onClick={() => setShowGroupManagement(true)}
              style={{
                padding: '10px 16px',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
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
              title="Manage groups and send prescriptions to patients"
            >
              <FaUsers />
              Group Chat
            </button>
          </div>
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
              maxWidth: '900px',
              maxHeight: '95vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px',
                borderBottom: '1px solid #e5e7eb',
                paddingBottom: '16px'
              }}>
                <div>
                  <h3 style={{
                    margin: 0,
                    fontSize: '20px',
                    fontWeight: '700',
                    color: '#1f2937'
                  }}>
                    Treatment Details
                  </h3>
                  {selectedAppointment.status === 'completed' && (
                    <div style={{
                      fontSize: '12px',
                      color: '#6b7280',
                      marginTop: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <span>Status: {selectedAppointment.status}</span>
                      {loadingTreatment && <span>• Loading treatment record...</span>}
                      {!loadingTreatment && treatmentRecord && <span>• Treatment record loaded</span>}
                      {!loadingTreatment && !treatmentRecord && <span>• No treatment record found</span>}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {treatmentRecord && (
                    <button
                      onClick={() => handlePrintVaccineCard(treatmentRecord, selectedAppointment)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 16px',
                        background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 2px 4px rgba(5, 150, 105, 0.2)'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.transform = 'translateY(-1px)';
                        e.target.style.boxShadow = '0 4px 12px rgba(5, 150, 105, 0.3)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = '0 2px 4px rgba(5, 150, 105, 0.2)';
                      }}
                      title="Print Vaccine Card"
                    >
                      <FaIdCard />
                      Print Vaccine Card
                    </button>
                  )}
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
              </div>

              {/* Show treatment details if completed, otherwise show form */}
              {selectedAppointment.status === 'completed' ? (
                // Display existing treatment record
                <div style={{ maxHeight: 'calc(90vh - 200px)', overflowY: 'auto' }}>
                  {loadingTreatment ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                      Loading treatment details...
                    </div>
                  ) : treatmentRecord ? (
                    <>
                      {/* Summary Card */}
                      <div style={{
                        marginBottom: '24px',
                        padding: '16px',
                        backgroundColor: '#eff6ff',
                        borderRadius: '8px',
                        border: '1px solid #bfdbfe'
                      }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: '12px'
                        }}>
                          <div>
                            <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600', marginBottom: '4px' }}>PATIENT</div>
                            <div style={{ fontSize: '18px', fontWeight: '700', color: '#1f2937' }}>
                              {treatmentRecord.patient_name || 'Unknown Patient'}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600', marginBottom: '4px' }}>APPOINTMENT DATE</div>
                            <div style={{ fontSize: '16px', fontWeight: '600', color: '#3b82f6' }}>
                              {formatDate(treatmentRecord.appointment_date)}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Patient Information */}
                      <div style={{ marginBottom: '24px' }}>
                        <h4 style={{
                          margin: '0 0 16px 0',
                          fontSize: '16px',
                          fontWeight: '600',
                          color: '#374151',
                          borderBottom: '2px solid #3b82f6',
                          paddingBottom: '8px'
                        }}>
                          Patient Information
                        </h4>
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(2, 1fr)',
                          gap: '16px'
                        }}>
                          <DetailItem label="Name" value={treatmentRecord.patient_name} />
                          <DetailItem label="Contact" value={treatmentRecord.patient_contact} />
                          <DetailItem label="Address" value={treatmentRecord.patient_address} />
                          <DetailItem label="Age" value={treatmentRecord.patient_age} />
                          <DetailItem label="Sex" value={treatmentRecord.patient_sex} />
                          <DetailItem label="Appointment Date" value={formatDate(treatmentRecord.appointment_date)} />
                          <DetailItem label="Appointment ID" value={treatmentRecord.appointment_id} />
                          <DetailItem label="Record ID" value={treatmentRecord.id} />
                        </div>
                      </div>

                      {/* Bite Information */}
                      <div style={{ marginBottom: '24px' }}>
                        <h4 style={{
                          margin: '0 0 16px 0',
                          fontSize: '16px',
                          fontWeight: '600',
                          color: '#374151',
                          borderBottom: '2px solid #3b82f6',
                          paddingBottom: '8px'
                        }}>
                          Bite Information
                        </h4>
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(2, 1fr)',
                          gap: '12px'
                        }}>
                          <DetailItem label="Date Bitten" value={formatDate(treatmentRecord.date_bitten)} />
                          <DetailItem label="Time Bitten" value={formatTime(treatmentRecord.time_bitten)} />
                          <DetailItem label="Site of Bite" value={treatmentRecord.site_of_bite} />
                          <DetailItem label="Biting Animal" value={treatmentRecord.biting_animal} />
                          <DetailItem label="Animal Status" value={treatmentRecord.animal_status} />
                          <DetailItem label="Place Bitten (Barangay)" value={treatmentRecord.place_bitten_barangay} />
                          <DetailItem label="Provoked" value={treatmentRecord.provoked} />
                          <DetailItem label="Local Wound Treatment" value={treatmentRecord.local_wound_treatment} />
                        </div>
                      </div>

                      {/* Treatment Details Display */}
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
                          gap: '16px'
                        }}>
                          <DetailItem label="Type of Exposure" value={treatmentRecord.type_of_exposure} />
                          <DetailItem label="Category of Exposure" value={formatJSON(treatmentRecord.category_of_exposure)} />
                          <DetailItem label="Vaccine Brand Name" value={treatmentRecord.vaccine_brand_name} />
                          <DetailItem label="Treatment to be Given" value={formatJSON(treatmentRecord.treatment_to_be_given)} />
                          <DetailItem label="Route" value={treatmentRecord.route} />
                          <DetailItem label="RIG" value={treatmentRecord.rig} />
                        </div>
                      </div>

                      {/* Vaccination Schedule */}
                      <div style={{
                        backgroundColor: '#f0fdf4',
                        padding: '20px',
                        borderRadius: '8px',
                        marginBottom: '24px',
                        border: '1px solid #bbf7d0'
                      }}>
                        <h4 style={{
                          margin: '0 0 16px 0',
                          fontSize: '16px',
                          fontWeight: '600',
                          color: '#166534',
                          borderBottom: '2px solid #22c55e',
                          paddingBottom: '8px'
                        }}>
                          Vaccination Schedule
                        </h4>
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr',
                          gap: '16px'
                        }}>
                          <DetailItem label="D0 Date" value={formatDate(treatmentRecord.d0_date)} />
                          <DetailItem label="D3 Date" value={formatDate(treatmentRecord.d3_date)} />
                          <DetailItem label="D7 Date" value={formatDate(treatmentRecord.d7_date)} />
                          <DetailItem label="D14 Date" value={formatDate(treatmentRecord.d14_date)} />
                          <DetailItem label="D28/30 Date" value={formatDate(treatmentRecord.d28_30_date)} />
                          <DetailItem label="Status of Animal Date" value={formatDate(treatmentRecord.status_of_animal_date)} />
                        </div>
                      </div>

                      {/* Remarks - Always show, even if empty */}
                      <div style={{ marginBottom: '24px' }}>
                        <h4 style={{
                          margin: '0 0 16px 0',
                          fontSize: '16px',
                          fontWeight: '600',
                          color: '#374151',
                          borderBottom: '2px solid #3b82f6',
                          paddingBottom: '8px'
                        }}>
                          Remarks
                        </h4>
                        <p style={{
                          margin: 0,
                          padding: '12px',
                          backgroundColor: treatmentRecord.remarks ? '#f9fafb' : '#fef2f2',
                          borderRadius: '8px',
                          color: treatmentRecord.remarks ? '#374151' : '#991b1b',
                          lineHeight: '1.6',
                          fontStyle: treatmentRecord.remarks ? 'normal' : 'italic'
                        }}>
                          {treatmentRecord.remarks || 'No remarks provided'}
                        </p>
                      </div>
                    </>
                  ) : (
                    <div style={{
                      textAlign: 'center',
                      padding: '40px',
                      color: '#6b7280',
                      backgroundColor: '#fef2f2',
                      borderRadius: '8px',
                      border: '1px solid #fecaca'
                    }}>
                      <p style={{ fontSize: '16px', fontWeight: '600', color: '#991b1b', marginBottom: '8px' }}>
                        No Treatment Record Found
                      </p>
                      <p style={{ fontSize: '14px', color: '#6b7280' }}>
                        This completed appointment does not have a treatment record associated with it.
                      </p>
                      <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '8px' }}>
                        Appointment ID: {selectedAppointment.id}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                // Show patient details and form for upcoming appointments
                <div style={{ maxHeight: 'calc(90vh - 200px)', overflowY: 'auto' }}>
                  {/* Patient Information from Appointments Table */}
                  <div style={{ marginBottom: '24px' }}>
                    <h4 style={{
                      margin: '0 0 16px 0',
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#374151',
                      borderBottom: '2px solid #3b82f6',
                      paddingBottom: '8px'
                    }}>
                      Patient Information
                    </h4>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      gap: '16px'
                    }}>
                      <DetailItem label="Name" value={selectedAppointment.patient_name} />
                      <DetailItem label="Contact" value={selectedAppointment.patient_contact} />
                      <DetailItem label="Address" value={selectedAppointment.patient_address} />
                      <DetailItem label="Age" value={selectedAppointment.patient_age} />
                      <DetailItem label="Sex" value={selectedAppointment.patient_sex} />
                      <DetailItem label="Appointment Date" value={formatDate(selectedAppointment.appointment_date)} />
                    </div>
                  </div>

                  {/* Bite Information from Appointments Table */}
                  <div style={{ marginBottom: '24px' }}>
                    <h4 style={{
                      margin: '0 0 16px 0',
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#374151',
                      borderBottom: '2px solid #3b82f6',
                      paddingBottom: '8px'
                    }}>
                      Bite Information
                    </h4>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      gap: '12px'
                    }}>
                      <DetailItem label="Date Bitten" value={selectedAppointment.date_bitten ? formatDate(selectedAppointment.date_bitten) : null} />
                      <DetailItem label="Time Bitten" value={selectedAppointment.time_bitten} />
                      <DetailItem label="Site of Bite" value={selectedAppointment.site_of_bite} />
                      <DetailItem label="Biting Animal" value={selectedAppointment.biting_animal} />
                      <DetailItem label="Animal Status" value={selectedAppointment.animal_status} />
                      <DetailItem label="Place Bitten (Barangay)" value={selectedAppointment.place_bitten} />
                      <DetailItem label="Provoked" value={selectedAppointment.provoke} />
                      <DetailItem label="Local Wound Treatment" value={selectedAppointment.washing_of_bite || selectedAppointment.local_wound_treatment} />
                    </div>
                  </div>

                  {/* Treatment Details Form */}
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
              )}
            </div>
          </div>
        )}

        {/* Group Management Modal */}
        {showGroupManagement && (
          <GroupManagement
            onClose={() => setShowGroupManagement(false)}
          />
        )}

        {/* Add Patient Modal */}
        {showAddPatientModal && (
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
          }} onClick={() => setShowAddPatientModal(false)}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '30px',
              maxWidth: '900px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
            }} onClick={(e) => e.stopPropagation()}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px',
                borderBottom: '2px solid #e5e7eb',
                paddingBottom: '16px'
              }}>
                <h2 style={{ margin: 0, color: '#1f2937', fontSize: '24px', fontWeight: '700' }}>
                  Add New Patient
                </h2>
                <button
                  onClick={() => setShowAddPatientModal(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '24px',
                    cursor: 'pointer',
                    color: '#6b7280',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '6px',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = '#f3f4f6';
                    e.target.style.color = '#1f2937';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'none';
                    e.target.style.color = '#6b7280';
                  }}
                >
                  <FaTimes />
                </button>
              </div>

              <form onSubmit={handleSaveNewPatient}>
                {/* Patient Information */}
                <div style={{ marginBottom: '24px' }}>
                  <h4 style={{
                    margin: '0 0 16px 0',
                    fontSize: '18px',
                    fontWeight: '700',
                    color: '#374151',
                    borderBottom: '2px solid #3b82f6',
                    paddingBottom: '8px'
                  }}>
                    Patient Information
                  </h4>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '16px'
                  }}>
                    <div>
                      <label style={{
                        display: 'block',
                        marginBottom: '8px',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#374151'
                      }}>
                        Patient Name *
                      </label>
                      <input
                        type="text"
                        value={newPatientData.patient_name}
                        onChange={(e) => handleNewPatientInputChange('patient_name', e.target.value)}
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
                    </div>
                    <div>
                      <label style={{
                        display: 'block',
                        marginBottom: '8px',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#374151'
                      }}>
                        Contact Number *
                      </label>
                      <input
                        type="text"
                        value={newPatientData.patient_contact}
                        onChange={(e) => handleNewPatientInputChange('patient_contact', e.target.value)}
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
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{
                        display: 'block',
                        marginBottom: '8px',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#374151'
                      }}>
                        Address
                      </label>
                      <input
                        type="text"
                        value={newPatientData.patient_address}
                        onChange={(e) => handleNewPatientInputChange('patient_address', e.target.value)}
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
                        Age
                      </label>
                      <input
                        type="number"
                        value={newPatientData.patient_age}
                        onChange={(e) => handleNewPatientInputChange('patient_age', e.target.value)}
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
                        Sex
                      </label>
                      <select
                        value={newPatientData.patient_sex}
                        onChange={(e) => handleNewPatientInputChange('patient_sex', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: '2px solid #e2e8f0',
                          borderRadius: '8px',
                          fontSize: '14px',
                          outline: 'none',
                          transition: 'all 0.2s ease',
                          background: 'white'
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = '#3b82f6';
                          e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = '#e2e8f0';
                          e.target.style.boxShadow = 'none';
                        }}
                      >
                        <option value="">Select</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </div>
                    <div>
                      <label style={{
                        display: 'block',
                        marginBottom: '8px',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#374151'
                      }}>
                        Appointment Date
                      </label>
                      <input
                        type="date"
                        value={newPatientData.appointment_date}
                        onChange={(e) => handleNewPatientInputChange('appointment_date', e.target.value)}
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
                      />
                    </div>
                  </div>
                </div>

                {/* Bite Information */}
                <div style={{ marginBottom: '24px' }}>
                  <h4 style={{
                    margin: '0 0 16px 0',
                    fontSize: '18px',
                    fontWeight: '700',
                    color: '#374151',
                    borderBottom: '2px solid #3b82f6',
                    paddingBottom: '8px'
                  }}>
                    Bite Information
                  </h4>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '16px'
                  }}>
                    <div>
                      <label style={{
                        display: 'block',
                        marginBottom: '8px',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#374151'
                      }}>
                        Date Bitten
                      </label>
                      <input
                        type="date"
                        value={newPatientData.date_bitten}
                        onChange={(e) => handleNewPatientInputChange('date_bitten', e.target.value)}
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
                        Time Bitten
                      </label>
                      <input
                        type="time"
                        value={newPatientData.time_bitten}
                        onChange={(e) => handleNewPatientInputChange('time_bitten', e.target.value)}
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
                        Site of Bite
                      </label>
                      <input
                        type="text"
                        value={newPatientData.site_of_bite}
                        onChange={(e) => handleNewPatientInputChange('site_of_bite', e.target.value)}
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
                        Biting Animal
                      </label>
                      <input
                        type="text"
                        value={newPatientData.biting_animal}
                        onChange={(e) => handleNewPatientInputChange('biting_animal', e.target.value)}
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
                        Animal Status
                      </label>
                      <input
                        type="text"
                        value={newPatientData.animal_status}
                        onChange={(e) => handleNewPatientInputChange('animal_status', e.target.value)}
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
                        Place Bitten (Barangay)
                      </label>
                      <input
                        type="text"
                        value={newPatientData.place_bitten_barangay}
                        onChange={(e) => handleNewPatientInputChange('place_bitten_barangay', e.target.value)}
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
                        Provoked
                      </label>
                      <input
                        type="text"
                        value={newPatientData.provoked}
                        onChange={(e) => handleNewPatientInputChange('provoked', e.target.value)}
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
                        Local Wound Treatment
                      </label>
                      <input
                        type="text"
                        value={newPatientData.local_wound_treatment}
                        onChange={(e) => handleNewPatientInputChange('local_wound_treatment', e.target.value)}
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
                      />
                    </div>
                  </div>
                </div>

                {/* Treatment Details */}
                <div style={{
                  backgroundColor: '#f0f9ff',
                  padding: '20px',
                  borderRadius: '8px',
                  marginBottom: '24px',
                  border: '1px solid #bae6fd'
                }}>
                  <h4 style={{
                    margin: '0 0 16px 0',
                    fontSize: '18px',
                    fontWeight: '700',
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
                        value={newPatientData.type_of_exposure}
                        onChange={(e) => handleNewPatientInputChange('type_of_exposure', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: '1px solid #d1d5db',
                          borderRadius: '8px',
                          fontSize: '14px',
                          outline: 'none'
                        }}
                        placeholder="Enter type of exposure"
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
                            checked={newPatientData.category_of_exposure.category_i}
                            onChange={(e) => handleNewPatientNestedCheckboxChange('category_of_exposure', 'category_i', e.target.checked)}
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
                            checked={newPatientData.category_of_exposure.category_ii}
                            onChange={(e) => handleNewPatientNestedCheckboxChange('category_of_exposure', 'category_ii', e.target.checked)}
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
                            checked={newPatientData.category_of_exposure.category_iii}
                            onChange={(e) => handleNewPatientNestedCheckboxChange('category_of_exposure', 'category_iii', e.target.checked)}
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
                        value={newPatientData.vaccine_brand_name}
                        onChange={(e) => handleNewPatientInputChange('vaccine_brand_name', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: '1px solid #d1d5db',
                          borderRadius: '8px',
                          fontSize: '14px',
                          outline: 'none',
                          background: 'white'
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
                    </div>

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
                            checked={newPatientData.treatment_to_be_given.pre_exposure}
                            onChange={(e) => handleNewPatientNestedCheckboxChange('treatment_to_be_given', 'pre_exposure', e.target.checked)}
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
                            checked={newPatientData.treatment_to_be_given.post_exposure}
                            onChange={(e) => handleNewPatientNestedCheckboxChange('treatment_to_be_given', 'post_exposure', e.target.checked)}
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
                        value={newPatientData.route}
                        onChange={(e) => handleNewPatientInputChange('route', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: '1px solid #d1d5db',
                          borderRadius: '8px',
                          fontSize: '14px',
                          outline: 'none'
                        }}
                        placeholder="Enter route (e.g., ID, IM)"
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
                        RIG
                      </label>
                      <input
                        type="text"
                        value={newPatientData.rig}
                        onChange={(e) => handleNewPatientInputChange('rig', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: '1px solid #d1d5db',
                          borderRadius: '8px',
                          fontSize: '14px',
                          outline: 'none'
                        }}
                        placeholder="Enter RIG details"
                      />
                    </div>
                  </div>
                </div>

                {/* Vaccination Schedule */}
                <div style={{
                  backgroundColor: '#f0fdf4',
                  padding: '20px',
                  borderRadius: '8px',
                  marginBottom: '24px',
                  border: '1px solid #bbf7d0'
                }}>
                  <h4 style={{
                    margin: '0 0 16px 0',
                    fontSize: '18px',
                    fontWeight: '700',
                    color: '#166534',
                    borderBottom: '2px solid #22c55e',
                    paddingBottom: '8px'
                  }}>
                    Vaccination Schedule (Optional)
                  </h4>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '16px'
                  }}>
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
                        value={newPatientData.d0_date}
                        onChange={(e) => handleNewPatientInputChange('d0_date', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: '1px solid #d1d5db',
                          borderRadius: '8px',
                          fontSize: '14px',
                          outline: 'none'
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
                        value={newPatientData.d3_date}
                        onChange={(e) => handleNewPatientInputChange('d3_date', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: '1px solid #d1d5db',
                          borderRadius: '8px',
                          fontSize: '14px',
                          outline: 'none'
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
                        value={newPatientData.d7_date}
                        onChange={(e) => handleNewPatientInputChange('d7_date', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: '1px solid #d1d5db',
                          borderRadius: '8px',
                          fontSize: '14px',
                          outline: 'none'
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
                        value={newPatientData.d14_date}
                        onChange={(e) => handleNewPatientInputChange('d14_date', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: '1px solid #d1d5db',
                          borderRadius: '8px',
                          fontSize: '14px',
                          outline: 'none'
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
                        value={newPatientData.d28_30_date}
                        onChange={(e) => handleNewPatientInputChange('d28_30_date', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: '1px solid #d1d5db',
                          borderRadius: '8px',
                          fontSize: '14px',
                          outline: 'none'
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
                        Status of Animal Date
                      </label>
                      <input
                        type="date"
                        value={newPatientData.status_of_animal_date}
                        onChange={(e) => handleNewPatientInputChange('status_of_animal_date', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: '1px solid #d1d5db',
                          borderRadius: '8px',
                          fontSize: '14px',
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Remarks */}
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
                    value={newPatientData.remarks}
                    onChange={(e) => handleNewPatientInputChange('remarks', e.target.value)}
                    rows={4}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                      resize: 'vertical',
                      outline: 'none'
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
                    onClick={() => setShowAddPatientModal(false)}
                    style={{
                      padding: '12px 24px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      backgroundColor: 'white',
                      color: '#374151',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = '#f3f4f6';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = 'white';
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingPatient}
                    style={{
                      padding: '12px 24px',
                      border: 'none',
                      borderRadius: '8px',
                      backgroundColor: savingPatient ? '#9ca3af' : '#3b82f6',
                      color: 'white',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: savingPatient ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: savingPatient ? 'none' : '0 2px 4px rgba(59, 130, 246, 0.2)'
                    }}
                    onMouseEnter={(e) => {
                      if (!savingPatient) {
                        e.target.style.backgroundColor = '#2563eb';
                        e.target.style.transform = 'translateY(-1px)';
                        e.target.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!savingPatient) {
                        e.target.style.backgroundColor = '#3b82f6';
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = '0 2px 4px rgba(59, 130, 246, 0.2)';
                      }
                    }}
                  >
                    {savingPatient ? 'Saving...' : 'Save Patient'}
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

// Helper function to format JSON data
const formatJSON = (jsonData) => {
  if (!jsonData) return 'Not specified';
  
  if (typeof jsonData === 'string') {
    try {
      jsonData = JSON.parse(jsonData);
    } catch (e) {
      return jsonData;
    }
  }
  
  if (typeof jsonData === 'object' && jsonData !== null) {
    const entries = Object.entries(jsonData)
      .filter(([_, value]) => value === true || value === 'true')
      .map(([key, _]) => {
        let formatted = key.replace(/_/g, ' ');
        formatted = formatted.replace(/\b\w/g, l => l.toUpperCase());
        return formatted;
      });
    return entries.length > 0 ? entries.join(', ') : 'None selected';
  }
  
  return 'Not specified';
};

// Helper component for detail items
const DetailItem = ({ label, value }) => {
  const hasValue = value !== null && value !== undefined && value !== '';
  
  return (
    <div style={{
      padding: '10px',
      backgroundColor: hasValue ? '#f9fafb' : '#fef2f2',
      borderRadius: '6px',
      border: `1px solid ${hasValue ? '#e5e7eb' : '#fecaca'}`
    }}>
      <div style={{
        fontSize: '11px',
        fontWeight: '700',
        color: hasValue ? '#6b7280' : '#991b1b',
        marginBottom: '6px',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
      }}>
        {hasValue ? '✓' : '✗'} {label}
      </div>
      <div style={{
        fontSize: '14px',
        color: hasValue ? '#1f2937' : '#991b1b',
        fontWeight: hasValue ? '500' : '400',
        wordBreak: 'break-word',
        lineHeight: '1.5',
        fontStyle: hasValue ? 'normal' : 'italic'
      }}>
        {hasValue ? value : 'Not specified'}
      </div>
    </div>
  );
};

export default StaffAppointmentList; 