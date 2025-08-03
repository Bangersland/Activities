import React, { useState, useEffect } from 'react';
import { FaCalendarAlt, FaPlus, FaTimes, FaInfoCircle, FaEdit, FaTrash } from 'react-icons/fa';
import { 
  getAppointmentSlots, 
  getAppointmentSlotsByDate, 
  createAppointmentSlots, 
  updateAppointmentSlots, 
  deleteAppointmentSlots,
  getSlotPercentage 
} from '../supabase';

const Schedule = () => {
  const [selectedDate, setSelectedDate] = useState('2025-08-15');
  const [currentDate, setCurrentDate] = useState(new Date(2025, 7, 1)); // August 2025
  const [appointmentSlots, setAppointmentSlots] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedSlotData, setSelectedSlotData] = useState(null);
  const [slotPercentage, setSlotPercentage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [formData, setFormData] = useState({
    availableSlots: 40
  });
  const [editFormData, setEditFormData] = useState({
    availableSlots: 40
  });

  // Fetch all appointment slots on component mount
  useEffect(() => {
    fetchAppointmentSlots();
  }, []);

  const fetchAppointmentSlots = async () => {
    try {
      setLoading(true);
      const { data, error } = await getAppointmentSlots();
      
      if (error) {
        console.error('Error fetching appointment slots:', error);
        setMessage('Error loading appointment slots');
      } else {
        setAppointmentSlots(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
      setMessage('Error loading appointment slots');
    } finally {
      setLoading(false);
    }
  };

  const handleDateClick = async (date) => {
    setSelectedDate(date);
    
    // Check if slots exist for this date
    const { data: existingSlot } = await getAppointmentSlotsByDate(date);
    
    if (existingSlot) {
      // Show details modal
      setSelectedSlotData(existingSlot);
      
      // Get percentage data
      const { data: percentageData } = await getSlotPercentage(date);
      setSlotPercentage(percentageData);
      
      setIsDetailsModalOpen(true);
    }
    // Remove the automatic modal opening - only show when "Add Slots" is clicked
  };

  const handleAddSlots = async () => {
    try {
      setLoading(true);
      const { data, error } = await createAppointmentSlots(selectedDate, formData.availableSlots);
      
      if (error) {
        setMessage(`Error creating slots: ${error.message}`);
      } else {
        setMessage('✅ Slots created successfully!');
        await fetchAppointmentSlots();
        setIsModalOpen(false);
        setFormData({ availableSlots: 40 });
        
        // Auto-close success message
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSlots = async () => {
    try {
      setLoading(true);

      const { data, error } = await updateAppointmentSlots(
        selectedSlotData.date,
        editFormData.availableSlots,
        selectedSlotData.remaining_slots // Keep existing remaining slots
      );
      
      if (error) {
        setMessage(`Error updating slots: ${error.message}`);
      } else {
        setMessage('✅ Slots updated successfully!');
        await fetchAppointmentSlots();
        setIsEditModalOpen(false);
        setSelectedSlotData(null);
        
        // Auto-close success message
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSlots = async () => {
    try {
      setLoading(true);
      const { error } = await deleteAppointmentSlots(selectedSlotData.date);
      
      if (error) {
        setMessage(`Error deleting slots: ${error.message}`);
      } else {
        setMessage('✅ Slots deleted successfully!');
        await fetchAppointmentSlots();
        setIsDetailsModalOpen(false);
        
        // Auto-close success message
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (slotData) => {
    setSelectedSlotData(slotData);
    setEditFormData({
      availableSlots: slotData.available_slots
    });
    setIsEditModalOpen(true);
    setIsDetailsModalOpen(false);
  };

  // Month navigation functions
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDate(today.toISOString().split('T')[0]);
  };

  const generateCalendarDays = () => {
    const days = [];
    const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    
    // Add previous month's days
    const firstDayOfWeek = startDate.getDay();
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(startDate.getFullYear(), startDate.getMonth() - 1, startDate.getDate() - i - 1);
      days.push({ date, isCurrentMonth: false, isSelected: false });
    }
    
    // Add current month's days
    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      const isSelected = date.toISOString().split('T')[0] === selectedDate;
      days.push({ date: new Date(date), isCurrentMonth: true, isSelected });
    }
    
    // Add next month's days to complete the grid
    const lastDayOfWeek = endDate.getDay();
    for (let i = 1; i <= 6 - lastDayOfWeek; i++) {
      const date = new Date(endDate.getFullYear(), endDate.getMonth() + 1, i);
      days.push({ date, isCurrentMonth: false, isSelected: false });
    }
    
    return days;
  };

  const calendarDays = generateCalendarDays();

  // Helper functions for appointment slots
  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };

  const hasSlots = (date) => {
    const dateStr = formatDate(date);
    return appointmentSlots.some(slot => slot.date === dateStr);
  };

  const getSlotInfo = (date) => {
    const dateStr = formatDate(date);
    return appointmentSlots.find(slot => slot.date === dateStr);
  };

  const isToday = (date) => {
    const today = new Date();
    return date.getDate() === today.getDate() && 
           date.getMonth() === today.getMonth() && 
           date.getFullYear() === today.getFullYear();
  };

  const getCurrentMonthName = () => {
    return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="content-section">
        <div className="header-content">
          <h2>Slot Management</h2>
          <p>Configure and manage appointment slots and capacity</p>
      </div>

      {/* Success/Error Messages */}
      {message && (
        <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      <div className="slot-management-container">
        {/* Left Panel - Calendar */}
        <div className="calendar-panel">
          <h3>Select Date</h3>
          <div className="calendar-component">
            <div className="calendar-header">
              <button onClick={goToPreviousMonth} className="calendar-nav-btn">◀</button>
              <h4>{getCurrentMonthName()}</h4>
              <button onClick={goToNextMonth} className="calendar-nav-btn">▶</button>
            </div>
            <div className="calendar-grid">
              <div className="calendar-weekdays">
                <span>Su</span>
                <span>Mo</span>
                <span>Tu</span>
                <span>We</span>
                <span>Th</span>
                <span>Fr</span>
                <span>Sa</span>
              </div>
              <div className="calendar-days">
                {calendarDays.map((day, index) => {
                  const hasSlot = hasSlots(day.date);
                  const slotInfo = getSlotInfo(day.date);
                  const today = isToday(day.date);
                  
                  return (
                  <button
                    key={index}
                    className={`calendar-day ${
                      !day.isCurrentMonth ? 'other-month' : ''
                    } ${day.isSelected ? 'selected' : ''} ${
                        hasSlot ? 'has-slots' : ''
                      } ${today ? 'today' : ''}`}
                      onClick={() => handleDateClick(day.date.toISOString().split('T')[0])}
                  >
                    {day.date.getDate()}
                      {hasSlot && slotInfo && (
                        <div className="slot-indicator">
                          <FaInfoCircle size={10} />
                        </div>
                      )}
                  </button>
                  );
                })}
              </div>
            </div>
            <div className="calendar-legend">
              <div className="legend-item">
                <div className="legend-color today"></div>
                <span>Today</span>
              </div>
              <div className="legend-item">
                <div className="legend-color has-slots"></div>
                <span>Has Slots</span>
              </div>
              <div className="legend-item">
                <div className="legend-color selected"></div>
                <span>Selected</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Slots Display */}
        <div className="slots-panel">
          <h3>Slots for {selectedDate}</h3>
          {(() => {
            const slotInfo = getSlotInfo(new Date(selectedDate));
            if (slotInfo) {
              return (
                <div className="slots-details">
                  <div className="slot-percentage">
                    <h4>Capacity: {slotInfo.available_slots - slotInfo.remaining_slots}/{slotInfo.available_slots} slots filled</h4>
                    <div className="percentage-display">
                      {Math.round(((slotInfo.available_slots - slotInfo.remaining_slots) / slotInfo.available_slots) * 100)}%
                    </div>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${((slotInfo.available_slots - slotInfo.remaining_slots) / slotInfo.available_slots) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="slot-info">
                    <div className="info-item">
                      <label>Available Slots:</label>
                      <span>{slotInfo.available_slots}</span>
                    </div>
                    <div className="info-item">
                      <label>Remaining Slots:</label>
                      <span>{slotInfo.remaining_slots}</span>
                    </div>
                    <div className="info-item">
                      <label>Filled Slots:</label>
                      <span>{slotInfo.available_slots - slotInfo.remaining_slots}</span>
                    </div>
                  </div>
                  <div className="slot-actions">
                                         <button 
                       className="btn-primary"
                       onClick={() => openEditModal(slotInfo)}
                       disabled={loading}
                     >
                       <FaEdit style={{ color: 'white' }} />
                       Edit Slots
                     </button>
                     <button 
                       className="btn-danger"
                       onClick={handleDeleteSlots}
                       disabled={loading}
                     >
                       {loading ? 'Deleting...' : <><FaTrash style={{ color: 'white' }} /> Delete Slots</>}
                     </button>
                  </div>
                </div>
              );
            } else {
              return (
          <div className="empty-slots-state">
            <div className="empty-icon">🕐</div>
            <h4>No slots configured</h4>
            <p>Create appointment slots for this date to allow scheduling.</p>
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              marginTop: '20px'
            }}>
                                         <button 
                       className="btn-primary"
                       onClick={() => setIsModalOpen(true)}
                     >
                       <FaPlus style={{ color: 'white' }} />
                Add Slots
                     </button>
                  </div>
                </div>
              );
            }
          })()}
        </div>
      </div>

      {/* Add Slots Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-container">
              <div className="modal-header">
                <div className="modal-title">
                  <div className="title-icon">
                    <FaCalendarAlt />
                  </div>
                  <div>
                    <h3>Add Appointment Slots</h3>
                    <p className="modal-subtitle">Configure available slots for the selected date</p>
                  </div>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="close-btn">
                  <FaTimes />
                </button>
              </div>
              <div className="modal-body">
                <div className="date-info">
                  <div className="date-badge">
                    <FaCalendarAlt />
                    <span>{selectedDate}</span>
                  </div>
                </div>
                <div className="form-group">
                  <label>Available Slots</label>
                  <div className="input-wrapper">
                    <input
                      type="number"
                      value={formData.availableSlots}
                      onChange={(e) => setFormData({ ...formData, availableSlots: parseInt(e.target.value) })}
                      min="1"
                      max="100"
                      placeholder="Enter number of slots"
                    />
                    <div className="input-hint">Maximum 100 slots per day</div>
                  </div>
                </div>
                <div className="info-box">
                  <div className="info-icon">ℹ️</div>
                  <div className="info-content">
                    <strong>Note:</strong> This will create {formData.availableSlots} appointment slots for {selectedDate}. 
                    All slots will be initially available for booking.
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button onClick={() => setIsModalOpen(false)} className="cancel-btn">
                  Cancel
                </button>
                <button 
                  onClick={handleAddSlots} 
                  disabled={loading}
                  className="save-btn"
                >
                                     {loading ? (
                     <>
                       <div className="spinner"></div>
                       Creating...
                     </>
                   ) : (
                     <>
                       <FaPlus style={{ color: 'white' }} />
                       Add Slots
                     </>
                   )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Slots Modal */}
      {isEditModalOpen && selectedSlotData && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-container">
              <div className="modal-header">
                                 <div className="modal-title">
                   <div className="title-icon edit">
                     <FaEdit style={{ color: 'white' }} />
                   </div>
                   <div>
                     <h3>Edit Appointment Slots</h3>
                     <p className="modal-subtitle">Update available slots for {selectedSlotData.date}</p>
                   </div>
                 </div>
                <button onClick={() => setIsEditModalOpen(false)} className="close-btn">
                  <FaTimes />
                </button>
              </div>
              <div className="modal-body">
                <div className="date-info">
                  <div className="date-badge">
                    <FaCalendarAlt />
                    <span>{selectedSlotData.date}</span>
                  </div>
                </div>
                                 <div className="form-group">
                   <label>Available Slots</label>
                   <div className="input-wrapper">
                     <input
                       type="number"
                       value={editFormData.availableSlots}
                       onChange={(e) => setEditFormData({ 
                         ...editFormData, 
                         availableSlots: parseInt(e.target.value)
                       })}
                       min="1"
                       max="100"
                       placeholder="Enter total available slots"
                     />
                     <div className="input-hint">Total slots available for this date</div>
                   </div>
                 </div>
                                 <div className="slot-summary">
                   <div className="summary-item">
                     <span>Current Remaining Slots:</span>
                     <span className="remaining-count">{selectedSlotData.remaining_slots}</span>
                   </div>
                   <div className="summary-item">
                     <span>Filled Slots:</span>
                     <span className="filled-count">{selectedSlotData.available_slots - selectedSlotData.remaining_slots}</span>
                   </div>
                 </div>
                                 <div className="info-box">
                   <div className="info-icon">ℹ️</div>
                   <div className="info-content">
                     <strong>Note:</strong> Only the total available slots can be modified. 
                     Remaining slots will be automatically adjusted based on current bookings.
                   </div>
                 </div>
              </div>
              <div className="modal-footer">
                <button onClick={() => setIsEditModalOpen(false)} className="cancel-btn">
                  Cancel
                </button>
                <button 
                  onClick={handleUpdateSlots} 
                  disabled={loading}
                  className="save-btn"
                >
                                     {loading ? (
                     <>
                       <div className="spinner"></div>
                       Updating...
                     </>
                   ) : (
                     <>
                       <FaEdit style={{ color: 'white' }} />
                       Update Slots
                     </>
                   )}
              </button>
            </div>
          </div>
        </div>
      </div>
      )}

      <style jsx>{`
        .message {
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 16px;
          font-weight: 500;
        }

        .message.success {
          background: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        }

        .message.error {
          background: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }

        .calendar-nav-btn {
          background: #f3f4f6;
          border: none;
          border-radius: 6px;
          padding: 8px 12px;
          cursor: pointer;
          font-size: 16px;
          color: #374151;
          transition: all 0.2s ease;
        }

        .calendar-nav-btn:hover {
          background: #e5e7eb;
        }

        .calendar-day.has-slots {
          background: linear-gradient(135deg, #dbeafe, #bfdbfe) !important;
          position: relative;
        }

        .calendar-day.today {
          background: linear-gradient(135deg, #dcfce7, #bbf7d0) !important;
          font-weight: 600;
          color: #166534;
        }

        .calendar-day.selected {
          background: linear-gradient(135deg, #3b82f6, #1d4ed8) !important;
          color: white;
          font-weight: 600;
        }

        .slot-indicator {
          position: absolute;
          top: 4px;
          right: 4px;
          color: #3b82f6;
        }

        .calendar-legend {
          display: flex;
          gap: 16px;
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid #e5e7eb;
          flex-wrap: wrap;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: #6b7280;
        }

        .legend-color {
          width: 12px;
          height: 12px;
          border-radius: 3px;
        }

        .legend-color.today {
          background: linear-gradient(135deg, #dcfce7, #bbf7d0);
        }

        .legend-color.has-slots {
          background: linear-gradient(135deg, #dbeafe, #bfdbfe);
        }

        .legend-color.selected {
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
        }

        .slots-details {
          padding: 20px;
        }

        .slot-percentage {
          margin-bottom: 20px;
          padding: 16px;
          background: #f9fafb;
          border-radius: 8px;
        }

        .slot-percentage h4 {
          margin: 0 0 12px 0;
          font-size: 16px;
          color: #374151;
        }

        .percentage-display {
          font-size: 24px;
          font-weight: 700;
          color: #3b82f6;
          text-align: center;
          margin-bottom: 12px;
        }

        .progress-bar {
          width: 100%;
          height: 8px;
          background: #e5e7eb;
          border-radius: 4px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #3b82f6, #1d4ed8);
          transition: width 0.3s ease;
        }

        .slot-info {
          margin-bottom: 20px;
        }

        .info-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid #f3f4f6;
        }

        .info-item label {
          font-weight: 500;
          color: #374151;
        }

        .info-item span {
          color: #6b7280;
        }

        .slot-actions {
          display: flex;
          gap: 12px;
          margin-top: 20px;
        }

        .btn-primary {
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 6px;
          padding: 10px 20px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          flex: 1;
          transition: all 0.2s ease;
        }

        .btn-primary:hover {
          background: #2563eb;
          transform: translateY(-1px);
        }

        .btn-danger {
          background: #ef4444;
          color: white;
          border: none;
          border-radius: 6px;
          padding: 10px 20px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          flex: 1;
          transition: all 0.2s ease;
        }

        .btn-danger:hover {
          background: #dc2626;
          transform: translateY(-1px);
        }

        .slot-summary {
          background: #f8fafc;
          border-radius: 8px;
          padding: 16px;
          margin: 20px 0;
          border: 1px solid #e2e8f0;
        }

        .summary-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
        }

        .summary-item span:first-child {
          font-weight: 500;
          color: #374151;
        }

                 .filled-count {
           color: #dc2626;
           font-weight: 600;
         }

         .remaining-count {
           color: #059669;
           font-weight: 600;
         }

        .title-icon.edit {
          background: linear-gradient(135deg, #f59e0b, #d97706);
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
          padding: 20px;
        }

        .modal {
          background: white;
          border-radius: 16px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          max-width: 480px;
          width: 100%;
          max-height: 90vh;
          overflow: hidden;
          animation: modalSlideIn 0.3s ease-out;
        }

        .modal-container {
          padding: 24px;
          max-height: 90vh;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
        }

        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 24px;
          border-bottom: 1px solid #f3f4f6;
          padding-bottom: 20px;
          flex-shrink: 0;
        }

        .modal-title {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          flex: 1;
        }

        .title-icon {
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          color: white;
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
        }

        .modal-title h3 {
          margin: 0 0 4px 0;
          font-size: 20px;
          font-weight: 700;
          color: #1f2937;
          line-height: 1.2;
        }

        .modal-subtitle {
          margin: 0;
          font-size: 14px;
          color: #6b7280;
          line-height: 1.4;
        }

        .close-btn {
          background: #f9fafb;
          border: none;
          border-radius: 8px;
          font-size: 18px;
          cursor: pointer;
          color: #6b7280;
          padding: 8px;
          transition: all 0.2s ease;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .close-btn:hover {
          background: #f3f4f6;
          color: #374151;
        }

        .modal-body {
          margin-bottom: 24px;
          flex: 1;
          overflow-y: auto;
        }

        .date-info {
          margin-bottom: 24px;
        }

        .date-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
          color: #0369a1;
          padding: 8px 16px;
          border-radius: 20px;
          font-weight: 600;
          font-size: 14px;
          border: 1px solid #bae6fd;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
          color: #374151;
          font-size: 14px;
        }

        .input-wrapper {
          position: relative;
        }

        .form-group input {
          width: 100%;
          padding: 12px 16px;
          border: 2px solid #e5e7eb;
          border-radius: 10px;
          font-size: 16px;
          transition: all 0.2s ease;
          background: #fafafa;
        }

        .form-group input:focus {
          outline: none;
          border-color: #3b82f6;
          background: white;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .input-hint {
          margin-top: 6px;
          font-size: 12px;
          color: #6b7280;
          font-style: italic;
        }

        .info-box {
          display: flex;
          gap: 12px;
          padding: 16px;
          background: linear-gradient(135deg, #fef3c7, #fde68a);
          border: 1px solid #f59e0b;
          border-radius: 10px;
          margin-top: 16px;
        }

        .info-icon {
          font-size: 16px;
          flex-shrink: 0;
        }

        .info-content {
          font-size: 14px;
          color: #92400e;
          line-height: 1.5;
        }

        .modal-footer {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          border-top: 1px solid #f3f4f6;
          padding-top: 20px;
          flex-shrink: 0;
          margin-top: auto;
        }

        .cancel-btn {
          padding: 12px 24px;
          background: #f3f4f6;
          color: #374151;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          transition: all 0.2s ease;
        }

        .cancel-btn:hover {
          background: #e5e7eb;
        }

        .save-btn {
          padding: 12px 24px;
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          color: white;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .save-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }

        .save-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Schedule; 