import React from 'react';

const StaffPatientListTracker = () => {
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
            Patients
          </h2>
          <p style={{
            margin: '0',
            color: '#6b7280',
            fontSize: '16px'
          }}>
            Manage patient records and vaccination status
          </p>
        </div>

        {/* Vaccination Tracker */}
        <div style={{
          marginBottom: '30px'
        }}>
          <h3 style={{
            margin: '0 0 20px 0',
            fontSize: '20px',
            fontWeight: '600',
            color: '#374151'
          }}>
            Vaccination Tracker
          </h3>
          
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            {[
              { dose: 1, status: "Awaiting 1st Dose", pendingCount: 1, completedCount: 0 },
              { dose: 2, status: "Awaiting 2nd Dose", pendingCount: 1, completedCount: 0 },
              { dose: 3, status: "Awaiting 3rd Dose", pendingCount: 2, completedCount: 0 },
              { dose: 4, status: "Awaiting 4th Dose", pendingCount: 1, completedCount: 0 },
              { dose: 5, status: "Booster", pendingCount: 1, completedCount: 0 }
            ].map((dose) => (
              <div key={dose.dose} style={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#f8fafc';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'white';
              }}
              >
                {/* Left side - Dose info */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px'
                }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    backgroundColor: '#dbeafe',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#1e40af',
                    fontSize: '18px',
                    fontWeight: '600'
                  }}>
                    {dose.dose}
                  </div>
                  
                  <div>
                    <div style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#1f2937',
                      marginBottom: '4px'
                    }}>
                      {dose.status}
                    </div>
                    <div style={{
                      fontSize: '14px',
                      color: '#6b7280'
                    }}>
                      {dose.pendingCount} patients pending
                    </div>
                  </div>
                </div>

                {/* Right side - Completion status and actions */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '20px'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: '#059669',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}>
                    <span style={{ fontSize: '16px' }}>✔</span>
                    {dose.completedCount} completed
                  </div>
                  
                  <button
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = '#2563eb';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = '#3b82f6';
                    }}
                  >
                    <span style={{ fontSize: '12px' }}>🕐</span>
                    Schedule
                  </button>
                  
                  <div style={{
                    color: '#9ca3af',
                    fontSize: '16px',
                    cursor: 'pointer'
                  }}>
                    →
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffPatientListTracker; 