import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';

const PatientList = () => {
  const printRef = useRef(null);
  
  // Sample patient data - replace with actual data from database
  const [patients] = useState([
    { id: 'P001', name: 'Juan Dela Cruz', age: 35, gender: 'Male', barangay: 'Barangay 1', contact: '09123456789', lastVisit: '2024-01-15', status: 'Active' },
    { id: 'P002', name: 'Maria Santos', age: 28, gender: 'Female', barangay: 'Barangay 2', contact: '09234567890', lastVisit: '2024-01-10', status: 'Active' },
    { id: 'P003', name: 'Pedro Reyes', age: 45, gender: 'Male', barangay: 'Barangay 3', contact: '09345678901', lastVisit: '2024-01-08', status: 'Inactive' },
    { id: 'P004', name: 'Ana Garcia', age: 32, gender: 'Female', barangay: 'Barangay 1', contact: '09456789012', lastVisit: '2024-01-12', status: 'Active' },
    { id: 'P005', name: 'Luis Martinez', age: 50, gender: 'Male', barangay: 'Barangay 4', contact: '09567890123', lastVisit: '2024-01-05', status: 'Active' },
    { id: 'P006', name: 'Carmen Lopez', age: 38, gender: 'Female', barangay: 'Barangay 2', contact: '09678901234', lastVisit: '2024-01-14', status: 'Active' },
    { id: 'P007', name: 'Roberto Torres', age: 42, gender: 'Male', barangay: 'Barangay 5', contact: '09789012345', lastVisit: '2024-01-03', status: 'Inactive' },
    { id: 'P008', name: 'Isabel Flores', age: 29, gender: 'Female', barangay: 'Barangay 3', contact: '09890123456', lastVisit: '2024-01-11', status: 'Active' },
  ]);

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
      'Status': patient.status
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
            {patients.map((patient) => (
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
                  <button className="action-btn view-btn">View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      <div className="pagination">
        <button className="pagination-btn">Previous</button>
        <span className="page-info">Page 1 of 5</span>
        <button className="pagination-btn">Next</button>
      </div>
    </div>
  );
};

export default PatientList; 