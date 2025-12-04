import React, { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { getTreatmentRecords, getAllAppointments, supabase } from '../supabase';

const PatientList = () => {
  const printRef = useRef(null);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [appointmentStatuses, setAppointmentStatuses] = useState({});
  const [staffNames, setStaffNames] = useState({});
  
  // Fetch treatment records on component mount
  useEffect(() => {
    fetchPatients();
    fetchAppointmentStatuses();
  }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const { data, error } = await getTreatmentRecords();
      
      if (error) {
        console.error('Error fetching treatment records:', error);
        setPatients([]);
      } else {
        // Map treatment records to patient list format
        const mappedPatients = (data || []).map((record, index) => ({
          id: record.id || `P${String(index + 1).padStart(3, '0')}`,
          name: record.patient_name || 'N/A',
          age: record.patient_age || 'N/A',
          gender: record.patient_sex || 'N/A',
          barangay: record.place_bitten_barangay || 'N/A',
          contact: record.patient_contact || 'N/A',
          lastVisit: record.appointment_date || record.created_at?.split('T')[0] || 'N/A',
          status: 'Active',
          treatmentRecord: record // Store full record for modal
        }));
        setPatients(mappedPatients);
      }
    } catch (err) {
      console.error('Error:', err);
      setPatients([]);
    } finally {
      setLoading(false);
    }
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

  // Export to Excel
  const exportToExcel = () => {
    // Prepare data for Excel
    const excelData = patients.map(patient => ({
      'Patient ID': patient.id,
      'Name': patient.name,
      'Age': patient.age,
      'Gender': patient.gender,
      'Barangay': patient.barangay,
      'Contact': patient.contact,
      'Last Visit': patient.lastVisit,
      'Status': patient.status,
      'Appointment Date': patient.treatmentRecord?.appointment_date || 'N/A',
      'Date Bitten': patient.treatmentRecord?.date_bitten || 'N/A'
    }));

    // Create workbook and worksheet
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Patient List');

    // Set column widths
    const columnWidths = [
      { wch: 12 }, // Patient ID
      { wch: 20 }, // Name
      { wch: 6 },  // Age
      { wch: 10 }, // Gender
      { wch: 15 }, // Barangay
      { wch: 15 }, // Contact
      { wch: 12 }, // Last Visit
      { wch: 10 }  // Status
    ];
    worksheet['!cols'] = columnWidths;

    // Generate filename with current date
    const fileName = `Patient_List_${new Date().toISOString().split('T')[0]}.xlsx`;

    // Save file
    XLSX.writeFile(workbook, fileName);
  };

  // Print function
  const handlePrint = () => {
    const printContent = printRef.current;
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    
    // Get styles from current page
    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map(style => style.outerHTML)
      .join('');
    
    // Create print-friendly HTML
    printWindow.document.write(`
      <html>
        <head>
          <title>Patient List - Print</title>
          ${styles}
          <style>
            @media print {
              body { margin: 0; padding: 20px; }
              .no-print { display: none !important; }
              table { width: 100%; border-collapse: collapse; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; font-weight: bold; }
              .status-active { color: green; }
              .status-inactive { color: red; }
              h2 { margin-top: 0; }
            }
            body { font-family: Arial, sans-serif; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .status-active { color: green; }
            .status-inactive { color: red; }
            h2 { margin-top: 0; }
            .print-header { margin-bottom: 20px; }
            .print-date { color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="print-header">
            <h2>Patient List</h2>
            <div class="print-date">Generated on: ${new Date().toLocaleString()}</div>
          </div>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    
    // Wait for content to load, then print
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  return (
    <div className="content-section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Patient List</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={exportToExcel}
            className="btn-secondary"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              padding: '10px 20px',
              cursor: 'pointer'
            }}
          >
            <span>📥</span>
            <span>Export to Excel</span>
          </button>
          <button 
            onClick={handlePrint}
            className="btn-secondary"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              padding: '10px 20px',
              cursor: 'pointer'
            }}
          >
            <span>🖨️</span>
            <span>Print</span>
          </button>
        </div>
      </div>
      
      {/* Search and Filter Section */}
      <div className="search-filter-section">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search patients by name, ID, or contact..."
            className="search-input"
          />
          <button className="search-btn">
            <span>🔍</span>
          </button>
        </div>
        
        <div className="filter-controls">
          <div className="filter-group">
            <label htmlFor="barangay-filter">Barangay:</label>
            <select id="barangay-filter" className="filter-select">
              <option value="">All Barangays</option>
              <option value="barangay-1">Barangay 1</option>
              <option value="barangay-2">Barangay 2</option>
              <option value="barangay-3">Barangay 3</option>
              <option value="barangay-4">Barangay 4</option>
              <option value="barangay-5">Barangay 5</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label htmlFor="year-filter">Year:</label>
            <select id="year-filter" className="filter-select">
              <option value="">All Years</option>
              <option value="2024">2024</option>
              <option value="2023">2023</option>
              <option value="2022">2022</option>
              <option value="2021">2021</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label htmlFor="month-filter">Month:</label>
            <select id="month-filter" className="filter-select">
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
          
          <button className="btn-secondary clear-filters-btn">
            Clear Filters
          </button>
        </div>
      </div>
      
      {/* Patient History Table */}
      <div className="table-container" ref={printRef}>
        <table className="patient-table">
          <thead>
            <tr>
              <th>Patient ID</th>
              <th>Name</th>
              <th>Age</th>
              <th>Gender</th>
              <th>Barangay</th>
              <th>Contact</th>
              <th>Last Visit</th>
              <th>Status</th>
              <th className="no-print">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '20px' }}>
                  Loading patient data...
                </td>
              </tr>
            ) : patients.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '20px' }}>
                  No patient records found
                </td>
              </tr>
            ) : (
              patients.map((patient) => (
                <tr key={patient.id}>
                  <td>{patient.id}</td>
                  <td>{patient.name}</td>
                  <td>{patient.age}</td>
                  <td>{patient.gender}</td>
                  <td>{patient.barangay}</td>
                  <td>{patient.contact}</td>
                  <td>{patient.lastVisit}</td>
                  <td>
                    <span className={patient.status === 'Active' ? 'status-active' : 'status-inactive'}>
                      {patient.status}
                    </span>
                  </td>
                  <td className="no-print">
                    <button 
                      className="action-btn view-btn"
                      onClick={() => handleView(patient)}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      <div className="pagination">
        <button className="pagination-btn">Previous</button>
        <span className="page-info">Page 1 of 5</span>
        <button className="pagination-btn">Next</button>
      </div>

      {/* Patient Details Modal */}
      {showModal && selectedPatient && (
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
          zIndex: 1000,
          padding: '20px'
        }} onClick={() => setShowModal(false)}>
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
                onClick={() => setShowModal(false)}
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

export default PatientList; 