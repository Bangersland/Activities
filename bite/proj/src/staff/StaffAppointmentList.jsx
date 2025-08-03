import React, { useState } from 'react';

const StaffAppointmentList = () => {
  const [activeTab, setActiveTab] = useState('upcoming');

  const appointments = [
    {
      id: 1,
      date: 'Sep 1, 2025',
      time: '10:00 AM',
      patient: 'John Doe',
      dose: 1,
      status: 'Upcoming',
     
    },
    {
      id: 2,
      date: 'Aug 7, 2025',
      time: '11:30 AM',
      patient: 'Jane Smith',
      dose: 1,
      status: 'Upcoming',
      payment: 'Partial'
    },
    {
      id: 3,
      date: 'Aug 4, 2025',
      time: '9:15 AM',
      patient: 'Robert Johnson',
      dose: 1,
      status: 'Upcoming',
      payment: 'Unpaid'
    },
    {
      id: 4,
      date: 'Aug 17, 2025',
      time: '3:45 PM',
      patient: 'David Kim',
      dose: 1,
      status: 'Upcoming',
      payment: 'Partial'
    }
  ];

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
            { id: 'upcoming', label: 'Upcoming', count: 4 },
            { id: 'completed', label: 'Completed', count: 1 },
            { id: 'cancelled', label: 'Cancelled/Missed', count: 0 }
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
                {['Date & Time', 'Patient', 'Dose #', 'Status', 'Actions'].map((header) => (
                  <th key={header} style={{
                    padding: '16px 12px',
                    textAlign: 'left',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#374151',
                    backgroundColor: '#f9fafb'
                  }}>
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {appointments.map((appointment) => (
                <tr key={appointment.id} style={{
                  borderBottom: '1px solid #f3f4f6',
                  '&:hover': {
                    backgroundColor: '#f9fafb'
                  }
                }}>
                  <td style={{
                    padding: '16px 12px',
                    fontSize: '14px',
                    color: '#1f2937'
                  }}>
                    <div style={{ fontWeight: '500' }}>{appointment.date}</div>
                    <div style={{ color: '#6b7280', fontSize: '13px' }}>{appointment.time}</div>
                  </td>
                  <td style={{
                    padding: '16px 12px',
                    fontSize: '14px',
                    color: '#1f2937',
                    fontWeight: '500'
                  }}>
                    {appointment.patient}
                  </td>
                  <td style={{
                    padding: '16px 12px',
                    fontSize: '14px',
                    color: '#1f2937',
                    fontWeight: '500'
                  }}>
                    {appointment.dose}
                  </td>
                  <td style={{
                    padding: '16px 12px'
                  }}>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '500',
                      ...getStatusColor(appointment.status)
                    }}>
                      {appointment.status}
                    </span>
                  </td>
                 
                  <td style={{
                    padding: '16px 12px'
                  }}>
                    <button style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '16px',
                      color: '#6b7280',
                      padding: '4px'
                    }}>
                      ⋯
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StaffAppointmentList; 