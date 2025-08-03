import React, { useState } from 'react';

const StaffPatientPayments = () => {
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  return (
    <div className="content-section">
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        margin: '20px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px'
        }}>
          <h2 style={{
            margin: '0',
            fontSize: '24px',
            fontWeight: '700',
            color: '#1f2937'
          }}>
            Patient Payment Records
          </h2>
        </div>

        {/* Search Bar */}
        <div style={{
          marginBottom: '24px',
          display: 'flex',
          gap: '16px',
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          <div style={{
            flex: '1',
            minWidth: '300px'
          }}>
            <input
              type="text"
              placeholder="Search payments by patient name, ID, or payment ID..."
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#3b82f6';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#d1d5db';
              }}
            />
          </div>
          <button style={{
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            padding: '12px 20px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
           
            Search
          </button>
          <button style={{
            backgroundColor: '#6b7280',
            color: 'white',
            border: 'none',
            padding: '12px 20px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}>
            Clear
          </button>
        </div>

        {/* Payment Form */}
        {showPaymentForm && (
          <div style={{
            backgroundColor: '#f9fafb',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '24px',
            border: '1px solid #e5e7eb'
          }}>
            <h3 style={{
              margin: '0 0 16px 0',
              fontSize: '18px',
              fontWeight: '600',
              color: '#374151'
            }}>
              Record New Payment
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '16px'
            }}>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151'
                }}>
                  Patient ID
                </label>
                <input
                  type="text"
                  placeholder="Enter Patient ID"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151'
                }}>
                  Patient Name
                </label>
                <input
                  type="text"
                  placeholder="Enter Patient Name"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151'
                }}>
                  Payment Amount
                </label>
                <input
                  type="number"
                  placeholder="Enter Amount"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151'
                }}>
                  Payment Method
                </label>
                <select style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}>
                  <option value="">Select Payment Method</option>
                  <option value="cash">Cash</option>
                  <option value="gcash">GCash</option>
                  <option value="card">Card</option>
                  <option value="bank">Bank Transfer</option>
                </select>
              </div>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151'
                }}>
                  Payment Date
                </label>
                <input
                  type="date"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>
            <div style={{
              marginTop: '16px',
              display: 'flex',
              gap: '12px'
            }}>
              <button style={{
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                Record Payment
              </button>
              <button
                onClick={() => setShowPaymentForm(false)}
                style={{
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Payment Records Table */}
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
                  Payment ID
                </th>
                <th style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontWeight: '600',
                  color: '#374151',
                  fontSize: '14px'
                }}>
                  Patient ID
                </th>
                <th style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontWeight: '600',
                  color: '#374151',
                  fontSize: '14px'
                }}>
                  Patient Name
                </th>
                <th style={{
                  padding: '12px 16px',
                  textAlign: 'left',
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
                  Payment Method
                </th>
                <th style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontWeight: '600',
                  color: '#374151',
                  fontSize: '14px'
                }}>
                  Payment Date
                </th>
                <th style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontWeight: '600',
                  color: '#374151',
                  fontSize: '14px'
                }}>
                  Status
                </th>
                <th style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontWeight: '600',
                  color: '#374151',
                  fontSize: '14px'
                }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {[
                {
                  id: 'PAY001',
                  patientId: 'P001',
                  patientName: 'Juan Dela Cruz',
                  amount: '₱1,500.00',
                  paymentMethod: 'Cash',
                  paymentDate: '2024-01-15',
                  status: 'Completed'
                },
                {
                  id: 'PAY002',
                  patientId: 'P002',
                  patientName: 'Maria Santos',
                  amount: '₱800.00',
                  paymentMethod: 'Cash',
                  paymentDate: '2024-01-14',
                  status: 'Completed'
                },
                {
                  id: 'PAY003',
                  patientId: 'P003',
                  patientName: 'Pedro Reyes',
                  amount: '₱2,200.00',
                  paymentMethod: 'Cash',
                  paymentDate: '2024-01-13',
                  status: 'Completed'
                },
                {
                  id: 'PAY004',
                  patientId: 'P004',
                  patientName: 'Ana Garcia',
                  amount: '₱1,200.00',
                  paymentMethod: 'Cash',
                  paymentDate: '2024-01-12',
                  status: 'Completed'
                },
              
                
              ].map((payment) => (
                <tr key={payment.id} style={{
                  borderBottom: '1px solid #f3f4f6'
                }}>
                  <td style={{
                    padding: '16px',
                    color: '#374151',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}>
                    {payment.id}
                  </td>
                  <td style={{
                    padding: '16px',
                    color: '#374151',
                    fontSize: '14px'
                  }}>
                    {payment.patientId}
                  </td>
                  <td style={{
                    padding: '16px',
                    color: '#374151',
                    fontSize: '14px'
                  }}>
                    {payment.patientName}
                  </td>
                  <td style={{
                    padding: '16px',
                    color: '#374151',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}>
                    {payment.amount}
                  </td>
                  <td style={{
                    padding: '16px',
                    color: '#374151',
                    fontSize: '14px'
                  }}>
                    {payment.paymentMethod}
                  </td>
                
                  <td style={{
                    padding: '16px',
                    color: '#374151',
                    fontSize: '14px'
                  }}>
                    {payment.paymentDate}
                  </td>
                  <td style={{
                    padding: '16px'
                  }}>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '16px',
                      fontSize: '12px',
                      fontWeight: '500',
                      backgroundColor: payment.status === 'Completed' ? '#d1fae5' : '#fef3c7',
                      color: payment.status === 'Completed' ? '#059669' : '#d97706'
                    }}>
                      {payment.status}
                    </span>
                  </td>
                  <td style={{
                    padding: '16px'
                  }}>
                    <button style={{
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}>
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
{/* 
        Summary Section
        <div style={{
          marginTop: '24px',
          padding: '20px',
          backgroundColor: '#f9fafb',
          borderRadius: '8px',
          border: '1px solid #e5e7eb'
        }}>
          <h3 style={{
            margin: '0 0 16px 0',
            fontSize: '18px',
            fontWeight: '600',
            color: '#374151'
          }}>
            Payment Summary
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px'
          }}>
            <div style={{
              textAlign: 'center',
              padding: '16px',
              backgroundColor: 'white',
              borderRadius: '6px',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#059669',
                marginBottom: '4px'
              }}>
                ₱10,300.00
              </div>
              <div style={{
                fontSize: '14px',
                color: '#6b7280'
              }}>
                Total Payments
              </div>
            </div>
            <div style={{
              textAlign: 'center',
              padding: '16px',
              backgroundColor: 'white',
              borderRadius: '6px',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#3b82f6',
                marginBottom: '4px'
              }}>
                8
              </div>
              <div style={{
                fontSize: '14px',
                color: '#6b7280'
              }}>
                Total Records
              </div>
            </div>
            <div style={{
              textAlign: 'center',
              padding: '16px',
              backgroundColor: 'white',
              borderRadius: '6px',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#d97706',
                marginBottom: '4px'
              }}>
                1
              </div>
              <div style={{
                fontSize: '14px',
                color: '#6b7280'
              }}>
                Pending Payments
              </div>
            </div> */}
          {/* </div> */}
        {/* </div> */}
      </div>
    </div>
  );
};

export default StaffPatientPayments; 