import React, { useState, useEffect, useCallback } from 'react';
import { FaUsers, FaCalendarAlt, FaExclamationTriangle, FaSyringe } from 'react-icons/fa';
import { getAllAppointments, getTreatmentRecords } from '../supabase';

const StaffDashboardOverview = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [patientBookings, setPatientBookings] = useState({});
  const [loading, setLoading] = useState(true);
  
  // Dashboard statistics
  const [totalPatients, setTotalPatients] = useState(0);
  const [totalAppointments, setTotalAppointments] = useState(0);
  const [missedAppointments, setMissedAppointments] = useState(0);
  const [completedVaccinations, setCompletedVaccinations] = useState(0);
  const [statsLoading, setStatsLoading] = useState(true);

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    return { daysInMonth, startingDay };
  };

  const formatDate = (year, month, day) => {
    const monthStr = (month + 1).toString().padStart(2, '0');
    const dayStr = day.toString().padStart(2, '0');
    return `${year}-${monthStr}-${dayStr}`;
  };

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Fetch appointments and count bookings per date
  useEffect(() => {
    fetchAppointments();
    fetchDashboardStats();
  }, []);

  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await getAllAppointments();
      
      if (error) {
        console.error('Error fetching appointments:', error);
        setPatientBookings({});
      } else {
        processAppointmentData(data || []);
      }
    } catch (err) {
      console.error('Error:', err);
      setPatientBookings({});
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch dashboard statistics
  const fetchDashboardStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      
      // Fetch all data in parallel
      const [
        appointmentsResult,
        treatmentRecordsResult
      ] = await Promise.all([
        getAllAppointments(),
        getTreatmentRecords()
      ]);

      // Total Appointments
      const appointments = appointmentsResult.data || [];
      setTotalAppointments(appointments.length);

      // Missed Appointments (appointments with status 'missed' or 'cancelled')
      const missed = appointments.filter(apt => 
        apt.status === 'missed' || apt.status === 'cancelled'
      ).length;
      setMissedAppointments(missed);

      // Total Patients (from treatment records)
      const treatmentRecords = treatmentRecordsResult.data || [];
      setTotalPatients(treatmentRecords.length);

      // Completed Vaccinations (treatment records where all 5 doses are completed)
      const completed = treatmentRecords.filter(record => {
        const doses = [
          record.d0_status,
          record.d3_status,
          record.d7_status,
          record.d14_status,
          record.d28_30_status
        ];
        return doses.every(status => status === 'completed');
      }).length;
      setCompletedVaccinations(completed);

    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const processAppointmentData = (appointments) => {
    const bookings = {};
    
    appointments.forEach(apt => {
      if (apt.appointment_date) {
        // Format date as YYYY-MM-DD
        const date = new Date(apt.appointment_date);
        if (!isNaN(date.getTime())) {
          const year = date.getFullYear();
          const month = date.getMonth();
          const day = date.getDate();
          const dateKey = formatDate(year, month, day);
          bookings[dateKey] = (bookings[dateKey] || 0) + 1;
        }
      }
    });
    
    setPatientBookings(bookings);
  };



  const { daysInMonth, startingDay } = getDaysInMonth(currentDate);
  const monthName = currentDate.toLocaleString('default', { month: 'long' });
  const year = currentDate.getFullYear();

  const renderCalendarDays = () => {
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = formatDate(year, currentDate.getMonth(), day);
      const patientCount = patientBookings[dateKey] || 0;
      const isToday = new Date().toDateString() === new Date(year, currentDate.getMonth(), day).toDateString();
      
      days.push(
        <div key={day} className={`calendar-day ${isToday ? 'today' : ''} ${patientCount === 0 ? 'no-bookings' : ''}`}>
          <div className="day-content">
            <span className="day-number">{day}</span>
            {patientCount > 0 && (
              <div className="patient-count" style={{
                fontSize: '12px',
                fontWeight: '600',
                color: '#3b82f6',
                backgroundColor: '#eff6ff',
                padding: '4px 6px',
                borderRadius: '4px',
                marginTop: '4px',
                textAlign: 'center'
              }}>
                {patientCount} {patientCount === 1 ? 'booked' : 'booked'}
              </div>
            )}
          </div>
        </div>
      );
    }
    
    return days;
  };
  return (
    <div className="content-section">
      {/* Dashboard Cards Section */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        marginTop: '24px',
        marginBottom: '24px'
      }}>
        <h2 style={{
          margin: '0 0 20px 0',
          fontSize: '24px',
          fontWeight: '700',
          color: '#1f2937'
        }}>
          Dashboard Overview
        </h2>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          width: '100%'
        }}>
                     <div style={{
             backgroundColor: '#3b82f6',
             padding: '16px',
             borderRadius: '12px',
             display: 'flex',
             flexDirection: 'column',
             alignItems: 'center',
             textAlign: 'center',
             color: 'white',
             minHeight: '120px',
             justifyContent: 'center'
           }}>
             <div style={{
               fontSize: '32px',
               marginBottom: '8px',
               color: '#3b82f6',
               backgroundColor: 'white',
               borderRadius: '50%',
               width: '50px',
               height: '50px',
               display: 'flex',
               alignItems: 'center',
               justifyContent: 'center'
             }}>
               <FaUsers size={20} />
             </div>
             <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', color: 'white' }}>Total Patients</h3>
             <p style={{ margin: '0', fontSize: '20px', fontWeight: 'bold', color: 'white' }}>
               {statsLoading ? '...' : totalPatients.toLocaleString()}
             </p>
           </div>
          
                     <div style={{
             backgroundColor: '#3b82f6',
             padding: '16px',
             borderRadius: '12px',
             display: 'flex',
             flexDirection: 'column',
             alignItems: 'center',
             textAlign: 'center',
             color: 'white',
             minHeight: '120px',
             justifyContent: 'center'
           }}>
             <div style={{
               fontSize: '32px',
               marginBottom: '8px',
               color: '#3b82f6',
               backgroundColor: 'white',
               borderRadius: '50%',
               width: '50px',
               height: '50px',
               display: 'flex',
               alignItems: 'center',
               justifyContent: 'center'
             }}>
               <FaCalendarAlt size={20} />
             </div>
             <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', color: 'white' }}>Total Appointments</h3>
             <p style={{ margin: '0', fontSize: '20px', fontWeight: 'bold', color: 'white' }}>
               {statsLoading ? '...' : totalAppointments.toLocaleString()}
             </p>
           </div>
          
                     <div style={{
             backgroundColor: '#3b82f6',
             padding: '16px',
             borderRadius: '12px',
             display: 'flex',
             flexDirection: 'column',
             alignItems: 'center',
             textAlign: 'center',
             color: 'white',
             minHeight: '120px',
             justifyContent: 'center'
           }}>
             <div style={{
               fontSize: '32px',
               marginBottom: '8px',
               color: '#3b82f6',
               backgroundColor: 'white',
               borderRadius: '50%',
               width: '50px',
               height: '50px',
               display: 'flex',
               alignItems: 'center',
               justifyContent: 'center'
             }}>
               <FaExclamationTriangle size={20} />
             </div>
             <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', color: 'white' }}>Missed Appointments</h3>
             <p style={{ margin: '0', fontSize: '20px', fontWeight: 'bold', color: 'white' }}>
               {statsLoading ? '...' : missedAppointments.toLocaleString()}
             </p>
           </div>
          
                     <div style={{
             backgroundColor: '#3b82f6',
             padding: '16px',
             borderRadius: '12px',
             display: 'flex',
             flexDirection: 'column',
             alignItems: 'center',
             textAlign: 'center',
             color: 'white',
             minHeight: '120px',
             justifyContent: 'center'
           }}>
             <div style={{
               fontSize: '32px',
               marginBottom: '8px',
               color: '#3b82f6',
               backgroundColor: 'white',
               borderRadius: '50%',
               width: '50px',
               height: '50px',
               display: 'flex',
               alignItems: 'center',
               justifyContent: 'center'
             }}>
               <FaSyringe size={20} />
             </div>
             <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', color: 'white' }}>Completed Vaccination</h3>
             <p style={{ margin: '0', fontSize: '20px', fontWeight: 'bold', color: 'white' }}>
               {statsLoading ? '...' : completedVaccinations.toLocaleString()}
             </p>
           </div>
        </div>
      </div>

      {/* Calendar Section */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        marginTop: '24px'
      }}>
        <div style={{
          position: 'relative'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)'
            }}>
              <button
                onClick={goToPreviousMonth}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                &lt;
              </button>
              <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#374151' }}>
                {monthName} {year}
              </span>
              <button
                onClick={goToNextMonth}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                &gt;
              </button>
            </div>
          </div>
          
          {/* Calendar Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '8px'
          }}>
            {/* Day Headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} style={{
                padding: '12px',
                textAlign: 'center',
                fontWeight: 'bold',
                color: '#6b7280',
                fontSize: '14px'
              }}>
                {day}
              </div>
            ))}
            
            {/* Calendar Days */}
            {renderCalendarDays()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffDashboardOverview; 