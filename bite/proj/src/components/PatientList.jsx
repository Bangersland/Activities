import React, { useState, useRef, useEffect } from 'react';
import { FaFileAlt, FaPrint, FaDownload, FaTimes, FaCheckCircle, FaExclamationCircle, FaFilter, FaClock, FaIdCard } from 'react-icons/fa';
import * as XLSX from 'xlsx';
import { getTreatmentRecords, getAllAppointments, supabase } from '../supabase';

const PatientList = () => {
  const printRef = useRef(null);
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [appointmentStatuses, setAppointmentStatuses] = useState({});
  const [staffNames, setStaffNames] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'completed', 'incomplete', 'ongoing'
  const [barangayFilter, setBarangayFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  
  // Fetch treatment records on component mount
  useEffect(() => {
    fetchPatients();
    fetchAppointmentStatuses();
  }, []);

  useEffect(() => {
    filterPatients();
  }, [patients, searchTerm, statusFilter, barangayFilter, yearFilter, monthFilter]);

  // Calculate patient completion status
  const calculateCompletionStatus = (record) => {
    const doses = [
      record.d0_status,
      record.d3_status,
      record.d7_status,
      record.d14_status,
      record.d28_30_status
    ];

    // Check if all doses are completed
    const allCompleted = doses.every(status => status === 'completed');
    
    // Check if any dose is missed - only mark as incomplete if there are missed doses
    const hasMissed = doses.some(status => status === 'missed');

    if (allCompleted) {
      return 'completed';
    } else if (hasMissed) {
      // Only mark as incomplete if there are missed doses
      return 'incomplete';
    }
    
    // If no missed doses but not all completed, it's still ongoing (pending doses)
    return 'ongoing';
  };

  // Get completion details
  const getCompletionDetails = (record) => {
    const doses = [
      { name: 'D0', status: record.d0_status, date: record.d0_date },
      { name: 'D3', status: record.d3_status, date: record.d3_date },
      { name: 'D7', status: record.d7_status, date: record.d7_date },
      { name: 'D14', status: record.d14_status, date: record.d14_date },
      { name: 'D28/30', status: record.d28_30_status, date: record.d28_30_date }
    ];

    const completed = doses.filter(d => d.status === 'completed').length;
    const missed = doses.filter(d => d.status === 'missed').length;
    const pending = doses.filter(d => !d.status || d.status === 'pending').length;

    return {
      total: 5,
      completed,
      missed,
      pending,
      doses
    };
  };

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const { data, error } = await getTreatmentRecords();
      
      if (error) {
        console.error('Error fetching treatment records:', error);
        setPatients([]);
      } else {
        // Map treatment records to patient list format with completion status
        const mappedPatients = (data || []).map((record, index) => {
          const completionStatus = calculateCompletionStatus(record);
          const completionDetails = getCompletionDetails(record);
          
          // Determine which dose is scheduled for today
          let todayDose = null;
          if (isDateToday(record.d0_date)) todayDose = 1;
          else if (isDateToday(record.d3_date)) todayDose = 2;
          else if (isDateToday(record.d7_date)) todayDose = 3;
          else if (isDateToday(record.d14_date)) todayDose = 4;
          else if (isDateToday(record.d28_30_date)) todayDose = 5;
          
          return {
          id: record.id || `P${String(index + 1).padStart(3, '0')}`,
          name: record.patient_name || 'N/A',
          age: record.patient_age || 'N/A',
          gender: record.patient_sex || 'N/A',
          barangay: record.place_bitten_barangay || 'N/A',
          contact: record.patient_contact || 'N/A',
          lastVisit: record.appointment_date || record.created_at?.split('T')[0] || 'N/A',
            status: completionStatus,
            completionDetails,
            treatmentRecord: record,
            todayDose: todayDose // Which dose is scheduled for today
          };
        });
        setPatients(mappedPatients);
      }
    } catch (err) {
      console.error('Error:', err);
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to check if a date matches today
  const isDateToday = (dateStr) => {
    if (!dateStr) return false;
    try {
      const today = new Date();
      const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const date = new Date(dateStr);
      const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      return dateOnly.getTime() === todayDateOnly.getTime();
    } catch (e) {
      return false;
    }
  };

  // Helper function to get which dose is scheduled for today
  const getTodayDose = (record) => {
    if (!record) return null;
    
    if (isDateToday(record.d0_date)) return 1; // Awaiting 1st Dose
    if (isDateToday(record.d3_date)) return 2; // Awaiting 2nd Dose
    if (isDateToday(record.d7_date)) return 3; // Awaiting 3rd Dose
    if (isDateToday(record.d14_date)) return 4; // Awaiting 4th Dose
    if (isDateToday(record.d28_30_date)) return 5; // Awaiting 5th Dose
    
    return null;
  };

  const filterPatients = () => {
    let filtered = [...patients];

    // Filter: Only show patients if one of their dose dates matches today
    // Ensure each patient appears only once by tracking seen patient IDs
    const seenPatientIds = new Set();
    filtered = filtered.filter(p => {
      const record = p.treatmentRecord;
      if (!record) return false;
      
      // Skip if we've already seen this patient (prevent duplicates)
      if (seenPatientIds.has(p.id)) return false;
      
      // Check which dose is scheduled for today (in order: 1st, 2nd, 3rd, 4th, 5th)
      // getTodayDose returns the FIRST matching dose date
      const todayDose = getTodayDose(record);
      if (todayDose === null) return false;
      
      // Update the patient's todayDose property to ensure consistency
      p.todayDose = todayDose;
      
      // Mark this patient as seen to prevent duplicates
      seenPatientIds.add(p.id);
      
      return true;
    });

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => p.status === statusFilter);
    }

    // Apply barangay filter
    if (barangayFilter) {
      filtered = filtered.filter(p => p.barangay === barangayFilter);
    }

    // Apply year filter
    if (yearFilter) {
      filtered = filtered.filter(p => {
        const record = p.treatmentRecord;
        const date = record?.appointment_date || record?.created_at;
        if (!date) return false;
        const year = new Date(date).getFullYear().toString();
        return year === yearFilter;
      });
    }

    // Apply month filter
    if (monthFilter) {
      filtered = filtered.filter(p => {
        const record = p.treatmentRecord;
        const date = record?.appointment_date || record?.created_at;
        if (!date) return false;
        const month = (new Date(date).getMonth() + 1).toString();
        return month === monthFilter;
      });
    }

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(term) ||
        p.contact.includes(term) ||
        p.id.toLowerCase().includes(term) ||
        p.barangay.toLowerCase().includes(term)
      );
    }

    setFilteredPatients(filtered);
  };

  // Get unique barangays for filter
  const getUniqueBarangays = () => {
    const barangays = [...new Set(patients.map(p => p.barangay).filter(Boolean))].sort();
    return barangays;
  };

  // Get unique years for filter
  const getUniqueYears = () => {
    const years = new Set();
    patients.forEach(p => {
      const record = p.treatmentRecord;
      const date = record?.appointment_date || record?.created_at;
      if (date) {
        const year = new Date(date).getFullYear();
        years.add(year);
      }
    });
    return Array.from(years).sort((a, b) => b - a); // Sort descending
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setBarangayFilter('');
    setYearFilter('');
    setMonthFilter('');
  };

  const fetchAppointmentStatuses = async () => {
    try {
      const { data, error } = await getAllAppointments();
      if (!error && data) {
        const statusMap = {};
        data.forEach(apt => {
          statusMap[apt.id] = apt.status;
        });
        setAppointmentStatuses(statusMap);
      }
    } catch (err) {
      console.error('Error fetching appointment statuses:', err);
    }
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

  const handleView = async (patient) => {
    setSelectedPatient(patient);
    setShowModal(true);
    
    // Fetch staff names for all dose updated_by fields
    if (patient.treatmentRecord) {
      const record = patient.treatmentRecord;
      const userIds = [
        record.d0_updated_by,
        record.d3_updated_by,
        record.d7_updated_by,
        record.d14_updated_by,
        record.d28_30_updated_by
      ].filter(Boolean);
      
      // Fetch all staff names
      const namePromises = userIds
        .filter(userId => !staffNames[userId])
        .map(userId => getStaffName(userId));
      
      await Promise.all(namePromises);
    }
  };


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

  // Export filtered patients to Excel
  const exportToExcel = () => {
    const reportPatients = filteredPatients;
    
    const excelData = reportPatients.map(patient => {
      const record = patient.treatmentRecord;
      return {
        'Patient ID': patient.id,
        'Name': patient.name,
        'Age': patient.age,
        'Gender': patient.gender,
        'Contact': patient.contact,
        'Barangay': patient.barangay,
        'Address': record?.patient_address || 'N/A',
        'Appointment Date': record?.appointment_date || 'N/A',
        'Date Bitten': record?.date_bitten || 'N/A',
        'Biting Animal': record?.biting_animal || 'N/A',
        'Site of Bite': record?.site_of_bite || 'N/A',
        'Type of Exposure': record?.type_of_exposure || 'N/A',
        'Category of Exposure': formatCategoryOfExposure(record?.category_of_exposure),
        'Vaccine Brand': record?.vaccine_brand_name || 'N/A',
        'Treatment': formatTreatmentToBeGiven(record?.treatment_to_be_given),
        'Route': record?.route || 'N/A',
        'RIG': record?.rig || 'N/A',
        'D0 Status': record?.d0_status || 'N/A',
        'D3 Status': record?.d3_status || 'N/A',
        'D7 Status': record?.d7_status || 'N/A',
        'D14 Status': record?.d14_status || 'N/A',
        'D28/30 Status': record?.d28_30_status || 'N/A',
        'Completion Status': patient.status === 'completed' ? 'Completed' : patient.status === 'incomplete' ? 'Incomplete' : 'Ongoing',
        'Completed Doses': `${patient.completionDetails.completed}/5`,
        'Remarks': record?.remarks || 'N/A'
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Patient Report');

    const fileName = `Patient_List_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  // Print Vaccine Card
  const handlePrintVaccineCard = (patient) => {
    if (!patient || !patient.treatmentRecord) return;
    
    const record = patient.treatmentRecord;
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
                <p>${patient.id}</p>
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

  // Print filtered patients
  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;
    
    const printWindow = window.open('', '_blank');
    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map(style => style.outerHTML)
      .join('');
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Patient Report - Print</title>
          ${styles}
          <style>
            @media print {
              body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
              .no-print { display: none !important; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
              th { background-color: #3b82f6; color: white; font-weight: bold; }
              .status-completed { color: #059669; font-weight: 600; }
              .status-incomplete { color: #dc2626; font-weight: 600; }
              h2 { margin-top: 0; color: #1f2937; }
              .report-header { margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #e5e7eb; }
              .report-meta { color: #6b7280; font-size: 14px; margin-top: 5px; }
            }
            body { font-family: Arial, sans-serif; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
            th { background-color: #3b82f6; color: white; font-weight: bold; }
            .status-completed { color: #059669; font-weight: 600; }
            .status-incomplete { color: #dc2626; font-weight: 600; }
            h2 { margin-top: 0; color: #1f2937; }
            .report-header { margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #e5e7eb; }
            .report-meta { color: #6b7280; font-size: 14px; margin-top: 5px; }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const completedCount = patients.filter(p => p.status === 'completed').length;
  const incompleteCount = patients.filter(p => p.status === 'incomplete').length;
  const ongoingCount = patients.filter(p => p.status === 'ongoing').length;

  return (
    <div className="content-section">
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '28px', fontWeight: '700', color: '#1f2937' }}>
            Patient List
          </h2>
          <div style={{ 
            display: 'flex', 
            gap: '16px', 
            marginTop: '8px',
            fontSize: '14px',
            color: '#64748b'
          }}>
            <span><strong>{patients.length}</strong> Total Patients</span>
            <span style={{ color: '#059669' }}><strong>{completedCount}</strong> Completed</span>
            <span style={{ color: '#dc2626' }}><strong>{incompleteCount}</strong> Incomplete</span>
            <span style={{ color: '#f59e0b' }}><strong>{ongoingCount}</strong> Ongoing</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button 
            onClick={exportToExcel}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              padding: '10px 20px',
              background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '14px',
              boxShadow: '0 2px 4px rgba(5, 150, 105, 0.2)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-1px)';
              e.target.style.boxShadow = '0 4px 12px rgba(5, 150, 105, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 2px 4px rgba(5, 150, 105, 0.2)';
            }}
          >
            <FaDownload />
            Export to Excel
          </button>
          <button 
            onClick={handlePrint}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              padding: '10px 20px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '14px',
              boxShadow: '0 2px 4px rgba(59, 130, 246, 0.2)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-1px)';
              e.target.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 2px 4px rgba(59, 130, 246, 0.2)';
            }}
          >
            <FaPrint />
            Print
          </button>
        </div>
      </div>
      
      {/* Search and Filter Section */}
      <div style={{
        background: 'white',
        padding: '20px',
        borderRadius: '12px',
        marginBottom: '20px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}>
        {/* Search Bar */}
        <div style={{ marginBottom: '16px' }}>
          <input
            type="text"
            placeholder="Search patients by name, ID, contact, or barangay..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
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

        {/* Filter Controls */}
        <div style={{ 
          display: 'flex', 
          gap: '16px', 
          flexWrap: 'wrap', 
          alignItems: 'center' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FaFilter style={{ color: '#64748b' }} />
            <label htmlFor="status-filter" style={{ 
              fontSize: '14px', 
              fontWeight: '600', 
              color: '#374151',
              marginRight: '8px'
            }}>
              Status:
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: '10px 14px',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '14px',
                cursor: 'pointer',
                outline: 'none',
                background: 'white',
                minWidth: '140px'
              }}
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="incomplete">Incomplete (Missed)</option>
              <option value="ongoing">Ongoing</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label htmlFor="barangay-filter" style={{ 
              fontSize: '14px', 
              fontWeight: '600', 
              color: '#374151',
              marginRight: '8px'
            }}>
              Barangay:
            </label>
            <select
              id="barangay-filter"
              value={barangayFilter}
              onChange={(e) => setBarangayFilter(e.target.value)}
              style={{
                padding: '10px 14px',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '14px',
                cursor: 'pointer',
                outline: 'none',
                background: 'white',
                minWidth: '160px'
              }}
            >
              <option value="">All Barangays</option>
              {getUniqueBarangays().map(barangay => (
                <option key={barangay} value={barangay}>{barangay}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label htmlFor="year-filter" style={{ 
              fontSize: '14px', 
              fontWeight: '600', 
              color: '#374151',
              marginRight: '8px'
            }}>
              Year:
            </label>
            <select
              id="year-filter"
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              style={{
                padding: '10px 14px',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '14px',
                cursor: 'pointer',
                outline: 'none',
                background: 'white',
                minWidth: '120px'
              }}
            >
              <option value="">All Years</option>
              {getUniqueYears().map(year => (
                <option key={year} value={year.toString()}>{year}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label htmlFor="month-filter" style={{ 
              fontSize: '14px', 
              fontWeight: '600', 
              color: '#374151',
              marginRight: '8px'
            }}>
              Month:
            </label>
            <select
              id="month-filter"
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              style={{
                padding: '10px 14px',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '14px',
                cursor: 'pointer',
                outline: 'none',
                background: 'white',
                minWidth: '140px'
              }}
            >
              <option value="">All Months</option>
              <option value="1">January</option>
              <option value="2">February</option>
              <option value="3">March</option>
              <option value="4">April</option>
              <option value="5">May</option>
              <option value="6">June</option>
              <option value="7">July</option>
              <option value="8">August</option>
              <option value="9">September</option>
              <option value="10">October</option>
              <option value="11">November</option>
              <option value="12">December</option>
            </select>
          </div>

          <button
            onClick={clearFilters}
            style={{
              padding: '10px 20px',
              background: '#f3f4f6',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#e5e7eb';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = '#f3f4f6';
            }}
          >
            Clear Filters
          </button>
        </div>
      </div>
      
      {/* Patient Table */}
      <div className="table-container" ref={printRef} style={{
        background: 'white',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}>
        <table className="patient-table" style={{ 
          width: '100%', 
          borderCollapse: 'collapse',
          fontSize: '13px'
        }}>
          <thead>
            <tr style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' }}>
              <th style={{ padding: '12px', textAlign: 'left', color: 'white', fontWeight: '600', border: '1px solid rgba(255,255,255,0.2)' }}>ID</th>
              <th style={{ padding: '12px', textAlign: 'left', color: 'white', fontWeight: '600', border: '1px solid rgba(255,255,255,0.2)' }}>Name</th>
              <th style={{ padding: '12px', textAlign: 'left', color: 'white', fontWeight: '600', border: '1px solid rgba(255,255,255,0.2)' }}>Age</th>
              <th style={{ padding: '12px', textAlign: 'left', color: 'white', fontWeight: '600', border: '1px solid rgba(255,255,255,0.2)' }}>Contact</th>
              <th style={{ padding: '12px', textAlign: 'left', color: 'white', fontWeight: '600', border: '1px solid rgba(255,255,255,0.2)' }}>Awaiting Dose</th>
              <th style={{ padding: '12px', textAlign: 'left', color: 'white', fontWeight: '600', border: '1px solid rgba(255,255,255,0.2)' }}>Type of Exposure</th>
              <th style={{ padding: '12px', textAlign: 'left', color: 'white', fontWeight: '600', border: '1px solid rgba(255,255,255,0.2)' }}>Category</th>
              <th style={{ padding: '12px', textAlign: 'left', color: 'white', fontWeight: '600', border: '1px solid rgba(255,255,255,0.2)' }}>Vaccine</th>
              <th style={{ padding: '12px', textAlign: 'left', color: 'white', fontWeight: '600', border: '1px solid rgba(255,255,255,0.2)' }}>Doses</th>
              <th style={{ padding: '12px', textAlign: 'left', color: 'white', fontWeight: '600', border: '1px solid rgba(255,255,255,0.2)' }}>Status</th>
              <th className="no-print" style={{ padding: '12px', textAlign: 'left', color: 'white', fontWeight: '600', border: '1px solid rgba(255,255,255,0.2)' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="11" style={{ textAlign: 'center', padding: '40px', border: '1px solid #e5e7eb' }}>
                  <div style={{ color: '#64748b', fontSize: '16px' }}>Loading patient data...</div>
                </td>
              </tr>
            ) : filteredPatients.length === 0 ? (
              <tr>
                <td colSpan="11" style={{ textAlign: 'center', padding: '40px', border: '1px solid #e5e7eb' }}>
                  <div style={{ color: '#64748b', fontSize: '16px' }}>No patients scheduled for today</div>
                </td>
              </tr>
            ) : (
              filteredPatients.map((patient) => {
                const record = patient.treatmentRecord;
                return (
                  <tr key={patient.id} style={{ 
                    borderBottom: '1px solid #e5e7eb',
                    transition: 'background 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'white'}>
                    <td style={{ padding: '12px', border: '1px solid #e5e7eb', color: '#1f2937' }}>{patient.id}</td>
                    <td style={{ padding: '12px', border: '1px solid #e5e7eb', color: '#1f2937', fontWeight: '500' }}>{patient.name}</td>
                    <td style={{ padding: '12px', border: '1px solid #e5e7eb', color: '#1f2937' }}>{patient.age}</td>
                    <td style={{ padding: '12px', border: '1px solid #e5e7eb', color: '#1f2937' }}>{patient.contact}</td>
                    <td style={{ padding: '12px', border: '1px solid #e5e7eb', color: '#1f2937', fontWeight: '600' }}>
                      {patient.todayDose === 1 ? 'Awaiting 1st Dose' :
                       patient.todayDose === 2 ? 'Awaiting 2nd Dose' :
                       patient.todayDose === 3 ? 'Awaiting 3rd Dose' :
                       patient.todayDose === 4 ? 'Awaiting 4th Dose' :
                       patient.todayDose === 5 ? 'Awaiting 5th Dose' : 'N/A'}
                    </td>
                    <td style={{ padding: '12px', border: '1px solid #e5e7eb', color: '#1f2937' }}>{record?.type_of_exposure || 'N/A'}</td>
                    <td style={{ padding: '12px', border: '1px solid #e5e7eb', color: '#1f2937' }}>
                      {formatCategoryOfExposure(record?.category_of_exposure)}
                    </td>
                    <td style={{ padding: '12px', border: '1px solid #e5e7eb', color: '#1f2937' }}>{record?.vaccine_brand_name || 'N/A'}</td>
                    <td style={{ padding: '12px', border: '1px solid #e5e7eb', color: '#1f2937' }}>
                      {patient.completionDetails.completed}/5
                    </td>
                    <td style={{ padding: '12px', border: '1px solid #e5e7eb' }}>
                      <span className={patient.status === 'completed' ? 'status-completed' : patient.status === 'incomplete' ? 'status-incomplete' : 'status-ongoing'}
                        style={{
                          color: patient.status === 'completed' ? '#059669' : patient.status === 'incomplete' ? '#dc2626' : '#f59e0b',
                          fontWeight: '600'
                        }}>
                        {patient.status === 'completed' ? 'Completed' : patient.status === 'incomplete' ? 'Incomplete' : 'Ongoing'}
                      </span>
                    </td>
                    <td className="no-print" style={{ padding: '12px', border: '1px solid #e5e7eb' }}>
                      <button 
                        onClick={() => handleView(patient)}
                        style={{
                          padding: '6px 12px',
                          background: '#3b82f6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '500',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = '#2563eb';
                          e.target.style.transform = 'translateY(-1px)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = '#3b82f6';
                          e.target.style.transform = 'translateY(0)';
                        }}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Patient Details Modal */}
      {showModal && selectedPatient && (
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
        }} onClick={() => setShowModal(false)}>
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
                Patient Details
              </h2>
              <button
                onClick={() => setShowModal(false)}
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

            {selectedPatient.treatmentRecord && (() => {
              const record = selectedPatient.treatmentRecord;
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
                  {/* Status Badge */}
                  <div style={{
                    marginBottom: '24px',
                    padding: '16px',
                    borderRadius: '12px',
                    background: selectedPatient.status === 'completed' 
                      ? 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)'
                      : selectedPatient.status === 'incomplete'
                      ? 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)'
                      : 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                    border: `2px solid ${selectedPatient.status === 'completed' ? '#10b981' : selectedPatient.status === 'incomplete' ? '#ef4444' : '#f59e0b'}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: selectedPatient.status === 'completed' ? '#065f46' : selectedPatient.status === 'incomplete' ? '#991b1b' : '#92400e',
                        marginBottom: '4px'
                      }}>
                        Treatment Status
                      </div>
                      <div style={{
                        fontSize: '20px',
                        fontWeight: '700',
                        color: selectedPatient.status === 'completed' ? '#059669' : selectedPatient.status === 'incomplete' ? '#dc2626' : '#f59e0b',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        {selectedPatient.status === 'completed' ? <FaCheckCircle /> : selectedPatient.status === 'incomplete' ? <FaExclamationCircle /> : <FaClock />}
                        {selectedPatient.status === 'completed' ? 'Completed' : selectedPatient.status === 'incomplete' ? 'Incomplete' : 'Ongoing'}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '14px', color: selectedPatient.status === 'completed' ? '#065f46' : selectedPatient.status === 'incomplete' ? '#991b1b' : '#92400e' }}>
                        Doses Completed
                      </div>
                      <div style={{
                        fontSize: '24px',
                        fontWeight: '700',
                        color: selectedPatient.status === 'completed' ? '#059669' : selectedPatient.status === 'incomplete' ? '#dc2626' : '#f59e0b'
                      }}>
                        {selectedPatient.completionDetails.completed}/5
                      </div>
                    </div>
                  </div>

                  {/* Patient Information */}
                  <div style={{ marginBottom: '25px' }}>
                    <h3 style={{ 
                      margin: '0 0 16px 0', 
                      color: '#374151', 
                      fontSize: '18px',
                      fontWeight: '700',
                      borderBottom: '2px solid #3b82f6',
                      paddingBottom: '8px'
                    }}>
                      Patient Information
                    </h3>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      gap: '16px'
                    }}>
                      <div>
                        <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Name</label>
                        <p style={{ margin: '6px 0 0 0', fontSize: '15px', color: '#1f2937', fontWeight: '500' }}>{record.patient_name || 'N/A'}</p>
                      </div>
                      <div>
                        <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Age</label>
                        <p style={{ margin: '6px 0 0 0', fontSize: '15px', color: '#1f2937', fontWeight: '500' }}>{record.patient_age || 'N/A'}</p>
                      </div>
                      <div>
                        <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Gender</label>
                        <p style={{ margin: '6px 0 0 0', fontSize: '15px', color: '#1f2937', fontWeight: '500' }}>{record.patient_sex || 'N/A'}</p>
                      </div>
                      <div>
                        <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Contact</label>
                        <p style={{ margin: '6px 0 0 0', fontSize: '15px', color: '#1f2937', fontWeight: '500' }}>{record.patient_contact || 'N/A'}</p>
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Address</label>
                        <p style={{ margin: '6px 0 0 0', fontSize: '15px', color: '#1f2937', fontWeight: '500' }}>{record.patient_address || 'N/A'}</p>
                      </div>
                      <div>
                        <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Appointment Date</label>
                        <p style={{ margin: '6px 0 0 0', fontSize: '15px', color: '#1f2937', fontWeight: '500' }}>{record.appointment_date || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Diagnosis Information */}
                  <div style={{ marginBottom: '25px' }}>
                    <h3 style={{ 
                      margin: '0 0 16px 0', 
                      color: '#374151', 
                      fontSize: '18px',
                      fontWeight: '700',
                      borderBottom: '2px solid #3b82f6',
                      paddingBottom: '8px'
                    }}>
                      Diagnosis Information
                    </h3>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      gap: '16px'
                    }}>
                      <div>
                        <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Biting Animal</label>
                        <p style={{ margin: '6px 0 0 0', fontSize: '15px', color: '#1f2937', fontWeight: '500' }}>{record.biting_animal || 'N/A'}</p>
                      </div>
                      <div>
                        <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date Bitten</label>
                        <p style={{ margin: '6px 0 0 0', fontSize: '15px', color: '#1f2937', fontWeight: '500' }}>{record.date_bitten || 'N/A'}</p>
                      </div>
                      <div>
                        <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Site of Bite</label>
                        <p style={{ margin: '6px 0 0 0', fontSize: '15px', color: '#1f2937', fontWeight: '500' }}>{record.site_of_bite || 'N/A'}</p>
                      </div>
                      <div>
                        <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Type of Exposure</label>
                        <p style={{ margin: '6px 0 0 0', fontSize: '15px', color: '#1f2937', fontWeight: '500' }}>{record.type_of_exposure || 'N/A'}</p>
                      </div>
                      <div>
                        <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Category of Exposure</label>
                        <p style={{ margin: '6px 0 0 0', fontSize: '15px', color: '#1f2937', fontWeight: '500' }}>
                          {formatCategoryOfExposure(record.category_of_exposure)}
                        </p>
                      </div>
                      <div>
                        <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Vaccine Brand</label>
                        <p style={{ margin: '6px 0 0 0', fontSize: '15px', color: '#1f2937', fontWeight: '500' }}>{record.vaccine_brand_name || 'N/A'}</p>
                      </div>
                      <div>
                        <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Treatment</label>
                        <p style={{ margin: '6px 0 0 0', fontSize: '15px', color: '#1f2937', fontWeight: '500' }}>
                          {formatTreatmentToBeGiven(record.treatment_to_be_given)}
                        </p>
                      </div>
                      <div>
                        <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Route</label>
                        <p style={{ margin: '6px 0 0 0', fontSize: '15px', color: '#1f2937', fontWeight: '500' }}>{record.route || 'N/A'}</p>
                      </div>
                      <div>
                        <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>RIG</label>
                        <p style={{ margin: '6px 0 0 0', fontSize: '15px', color: '#1f2937', fontWeight: '500' }}>{record.rig || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Dose Information */}
                  <div>
                    <h3 style={{ 
                      margin: '0 0 16px 0', 
                      color: '#374151', 
                      fontSize: '18px',
                      fontWeight: '700',
                      borderBottom: '2px solid #3b82f6',
                      paddingBottom: '8px'
                    }}>
                      Dose Information
                    </h3>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        fontSize: '14px',
                        background: 'white',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                      }}>
                        <thead>
                          <tr style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' }}>
                            <th style={{ padding: '12px', textAlign: 'left', color: 'white', fontWeight: '600' }}>Dose</th>
                            <th style={{ padding: '12px', textAlign: 'left', color: 'white', fontWeight: '600' }}>Date</th>
                            <th style={{ padding: '12px', textAlign: 'left', color: 'white', fontWeight: '600' }}>Status</th>
                            <th style={{ padding: '12px', textAlign: 'left', color: 'white', fontWeight: '600' }}>Updated By</th>
                            <th style={{ padding: '12px', textAlign: 'left', color: 'white', fontWeight: '600' }}>Updated At</th>
                          </tr>
                        </thead>
                        <tbody>
                          {doses.map((dose, index) => (
                            <tr key={index} style={{
                              borderBottom: '1px solid #e5e7eb',
                              transition: 'background 0.2s ease'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'white'}>
                              <td style={{ padding: '12px', fontWeight: '600', color: '#1f2937' }}>{dose.number}</td>
                              <td style={{ padding: '12px', color: '#1f2937' }}>{dose.date || 'N/A'}</td>
                              <td style={{ padding: '12px' }}>
                                <span style={{
                                  padding: '6px 12px',
                                  borderRadius: '20px',
                                  fontSize: '12px',
                                  fontWeight: '600',
                                  backgroundColor: dose.status === 'completed' ? '#d1fae5' : 
                                                  dose.status === 'missed' ? '#fee2e2' : '#fef3c7',
                                  color: dose.status === 'completed' ? '#065f46' : 
                                         dose.status === 'missed' ? '#991b1b' : '#92400e'
                                }}>
                                  {dose.status ? dose.status.charAt(0).toUpperCase() + dose.status.slice(1) : 'Pending'}
                                </span>
                              </td>
                              <td style={{ padding: '12px', color: '#1f2937' }}>{dose.updatedBy}</td>
                              <td style={{ padding: '12px', color: '#64748b', fontSize: '13px' }}>
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

export default PatientList;
