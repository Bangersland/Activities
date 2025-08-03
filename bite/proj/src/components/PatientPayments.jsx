import React, { useState } from 'react';

const PatientPayments = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('All Methods');

  const paymentData = [
    {
      id: 1,
      date: 'Jun 3, 2025',
      patient: 'John Doe',
      amount: '₱1,000',
      method: 'Cash',
      notes: '-'
    },
    {
      id: 2,
      date: 'Jul 8, 2025',
      patient: 'Jane Smith',
      amount: '₱500',
      method: 'Card',
      notes: 'Partial payment'
    },
    {
      id: 3,
      date: 'May 4, 2025',
      patient: 'Maria Garcia',
      amount: '₱1,000',
      method: 'Insurance',
      notes: '-'
    },
    {
      id: 4,
      date: 'Jun 18, 2025',
      patient: 'David Kim',
      amount: '₱750',
      method: 'Cash',
      notes: 'Partial payment'
    },
    {
      id: 5,
      date: 'Apr 12, 2025',
      patient: 'Sarah Johnson',
      amount: '₱1,200',
      method: 'Card',
      notes: 'Full payment'
    },
    {
      id: 6,
      date: 'Mar 25, 2025',
      patient: 'Michael Chen',
      amount: '₱800',
      method: 'Insurance',
      notes: '-'
    }
  ];

  const filteredPayments = paymentData.filter(payment => 
    payment.patient.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (selectedMethod === 'All Methods' || payment.method === selectedMethod)
  );

  const getMethodTagStyle = () => {
    return {
      backgroundColor: '#f3f4f6',
      color: '#374151',
      padding: '4px 12px',
      borderRadius: '16px',
      fontSize: '12px',
      fontWeight: '500',
      display: 'inline-block'
    };
  };

  const handleExport = () => {
    // Create Excel workbook structure
    const workbook = {
      SheetNames: ['Payment History'],
      Sheets: {
        'Payment History': {
          '!ref': `A1:E${filteredPayments.length + 1}`,
          A1: { v: 'Date', t: 's' },
          B1: { v: 'Patient', t: 's' },
          C1: { v: 'Amount', t: 's' },
          D1: { v: 'Method', t: 's' },
          E1: { v: 'Notes', t: 's' }
        }
      }
    };

    // Add data rows
    filteredPayments.forEach((payment, index) => {
      const rowIndex = index + 2;
      workbook.Sheets['Payment History'][`A${rowIndex}`] = { v: payment.date, t: 's' };
      workbook.Sheets['Payment History'][`B${rowIndex}`] = { v: payment.patient, t: 's' };
      workbook.Sheets['Payment History'][`C${rowIndex}`] = { v: payment.amount, t: 's' };
      workbook.Sheets['Payment History'][`D${rowIndex}`] = { v: payment.method, t: 's' };
      workbook.Sheets['Payment History'][`E${rowIndex}`] = { v: payment.notes, t: 's' };
    });

    // Convert to Excel format using XLSX library
    // Note: XLSX library needs to be installed for this to work
    // const XLSX = require('xlsx');
    // const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'binary' });

    // Convert binary string to blob


    // const blob = new Blob([s2ab(wbout)], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    // const link = document.createElement('a');
    // const url = URL.createObjectURL(blob);
    // link.setAttribute('href', url);
    // link.setAttribute('download', `payment_history_${new Date().toISOString().split('T')[0]}.xlsx`);
    // link.style.visibility = 'hidden';
    // document.body.appendChild(link);
    // link.click();
    // document.body.removeChild(link);
    alert('Export functionality requires XLSX library to be installed');
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
        {/* Title */}
        <h2 style={{
          margin: '0 0 20px 0',
          fontSize: '24px',
          fontWeight: '700',
          color: '#1f2937'
        }}>
          Payment History
        </h2>

        {/* Search and Filter Controls */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          gap: '16px'
        }}>
          {/* Search Bar */}
          <div style={{
            position: 'relative',
            flex: '1',
            maxWidth: '400px'
          }}>
            <div style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#9ca3af',
              fontSize: '16px'
            }}>
              🔍
            </div>
            <input
              type="text"
              placeholder="Search by patient name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 12px 12px 40px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px',
                backgroundColor: '#f9fafb',
                outline: 'none'
              }}
            />
          </div>

          {/* Filter Controls */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            {/* Method Filter */}
            <select
              value={selectedMethod}
              onChange={(e) => setSelectedMethod(e.target.value)}
              style={{
                padding: '8px 12px',
                border: '1px solid #3b82f6',
                borderRadius: '6px',
                backgroundColor: 'white',
                color: '#3b82f6',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <option value="All Methods">All Methods</option>
              <option value="Cash">Cash</option>
              <option value="Card">Card</option>
              <option value="Insurance">Insurance</option>
            </select>

          

            {/* Sort Icon */}
          
            {/* Export Button */}
            <button
              onClick={handleExport}
              style={{
                padding: '8px 16px',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: '#059669',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }
              }}
                         >
                Export Excel
             </button>
          </div>
        </div>

        {/* Payment History Table */}
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
                borderBottom: '1px solid #e5e7eb',
                backgroundColor: '#f9fafb'
              }}>
                <th style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontWeight: '600',
                  color: '#374151',
                  fontSize: '14px'
                }}>
                  Date
                </th>
                <th style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontWeight: '600',
                  color: '#374151',
                  fontSize: '14px'
                }}>
                  Patient
                </th>
                <th style={{
                  padding: '12px 16px',
                  textAlign: 'right',
                  fontWeight: '600',
                  color: '#374151',
                  fontSize: '14px'
                }}>
                  Amount
                </th>
                <th style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontWeight: '600',
                  color: '#374151',
                  fontSize: '14px'
                }}>
                  Method
                </th>
                <th style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontWeight: '600',
                  color: '#374151',
                  fontSize: '14px'
                }}>
                  Notes
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map((payment) => (
                <tr key={payment.id} style={{
                  borderBottom: '1px solid #f3f4f6',
                  '&:hover': {
                    backgroundColor: '#f9fafb'
                  }
                }}>
                  <td style={{
                    padding: '16px',
                    color: '#374151',
                    fontSize: '14px'
                  }}>
                    {payment.date}
                  </td>
                  <td style={{
                    padding: '16px',
                    color: '#374151',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}>
                    {payment.patient}
                  </td>
                  <td style={{
                    padding: '16px',
                    textAlign: 'right',
                    color: '#374151',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}>
                    {payment.amount}
                  </td>
                  <td style={{
                    padding: '16px'
                  }}>
                    <span style={getMethodTagStyle(payment.method)}>
                      {payment.method}
                    </span>
                  </td>
                  <td style={{
                    padding: '16px',
                    color: '#6b7280',
                    fontSize: '14px'
                  }}>
                    {payment.notes}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* No Results Message */}
        {filteredPayments.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: '#6b7280',
            fontSize: '16px'
          }}>
            No payment records found matching your search criteria.
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientPayments; 