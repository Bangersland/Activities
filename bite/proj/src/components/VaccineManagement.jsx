import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaTimes, FaSyringe } from 'react-icons/fa';
import { getVaccines, createVaccine, updateVaccine, deleteVaccine } from '../supabase';

const VaccineManagement = () => {
  const [vaccines, setVaccines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedVaccine, setSelectedVaccine] = useState(null);
  const [formData, setFormData] = useState({
    vaccine_brand: '',
    stock_quantity: 0,
    expiry_date: ''
  });
  const [alerts, setAlerts] = useState([]);
  const [showAlerts, setShowAlerts] = useState(false);

  useEffect(() => {
    fetchVaccines();
  }, []);

  useEffect(() => {
    checkForAlerts();
  }, [vaccines]);

  const fetchVaccines = async () => {
    try {
      setLoading(true);
      const { data, error } = await getVaccines();
      
      if (error) {
        setMessage(`Error loading vaccines: ${error.message}`);
      } else {
        setVaccines(data || []);
      }
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddVaccine = async () => {
    try {
      setLoading(true);
      const { error } = await createVaccine(formData);
      
      if (error) {
        setMessage(`Error creating vaccine: ${error.message}`);
      } else {
        setMessage('✅ Vaccine added successfully!');
        await fetchVaccines();
        setIsModalOpen(false);
        resetForm();
        
        // Auto-close success message
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateVaccine = async () => {
    try {
      setLoading(true);
      const { error } = await updateVaccine(selectedVaccine.id, formData);
      
      if (error) {
        setMessage(`Error updating vaccine: ${error.message}`);
      } else {
        setMessage('✅ Vaccine updated successfully!');
        await fetchVaccines();
        setIsEditModalOpen(false);
        setSelectedVaccine(null);
        resetForm();
        
        // Auto-close success message
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVaccine = async (id) => {
    if (window.confirm('Are you sure you want to delete this vaccine?')) {
      try {
        setLoading(true);
        const { error } = await deleteVaccine(id);
        
        if (error) {
          setMessage(`Error deleting vaccine: ${error.message}`);
        } else {
          setMessage('✅ Vaccine deleted successfully!');
          await fetchVaccines();
          
          // Auto-close success message
          setTimeout(() => setMessage(''), 3000);
        }
      } catch (error) {
        setMessage(`Error: ${error.message}`);
      } finally {
        setLoading(false);
      }
    }
  };

  const openEditModal = (vaccine) => {
    setSelectedVaccine(vaccine);
    setFormData({
      vaccine_brand: vaccine.vaccine_brand,
      stock_quantity: vaccine.stock_quantity,
      expiry_date: vaccine.expiry_date
    });
    setIsEditModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      vaccine_brand: '',
      stock_quantity: 0,
      expiry_date: ''
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Available':
        return 'status-available';
      case 'Low on Stock':
        return 'status-low-stock';
      case 'Out of Stock':
        return 'status-out-of-stock';
      case 'Expired':
        return 'status-expired';
      default:
        return 'status-default';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isExpiringSoon = (expiryDate) => {
    const expiry = new Date(expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  };

  const isExpired = (expiryDate) => {
    const expiry = new Date(expiryDate);
    const today = new Date();
    return expiry < today;
  };

  const checkForAlerts = () => {
    const newAlerts = [];
    
    vaccines.forEach(vaccine => {
      // Check for low stock (20 or less)
      if (vaccine.stock_quantity <= 20 && vaccine.stock_quantity > 0) {
        newAlerts.push({
          id: `low-stock-${vaccine.id}`,
          type: 'warning',
          message: `⚠️ Low stock alert: ${vaccine.vaccine_brand} has only ${vaccine.stock_quantity} units remaining`,
          vaccine: vaccine
        });
      }
      
      // Check for out of stock
      if (vaccine.stock_quantity === 0) {
        newAlerts.push({
          id: `out-of-stock-${vaccine.id}`,
          type: 'error',
          message: `🚨 Out of stock: ${vaccine.vaccine_brand} has no units available`,
          vaccine: vaccine
        });
      }
      
      // Check for expiring soon (within 30 days)
      const expiry = new Date(vaccine.expiry_date);
      const today = new Date();
      const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
      
      if (daysUntilExpiry <= 30 && daysUntilExpiry > 0) {
        newAlerts.push({
          id: `expiring-${vaccine.id}`,
          type: 'warning',
          message: `⏰ Expiring soon: ${vaccine.vaccine_brand} expires in ${daysUntilExpiry} days`,
          vaccine: vaccine
        });
      }
      
      // Check for expired
      if (isExpired(vaccine.expiry_date)) {
        newAlerts.push({
          id: `expired-${vaccine.id}`,
          type: 'error',
          message: `❌ Expired: ${vaccine.vaccine_brand} has expired`,
          vaccine: vaccine
        });
      }
    });
    
    setAlerts(newAlerts);
  };

  const dismissAlert = (alertId) => {
    setAlerts(prevAlerts => prevAlerts.filter(alert => alert.id !== alertId));
  };

  return (
    <div className="content-section">
      <div className="header-content">
        <div className="header-main">
          <div>
      <h2>Vaccine Management</h2>
            <p>Manage vaccine inventory, stock levels, and expiry dates</p>
          </div>
          {alerts.length > 0 && (
            <div className="alert-notification">
              <button 
                className="alert-trigger"
                onClick={() => setShowAlerts(!showAlerts)}
              >
                <span className="alert-icon">⚠️</span>
                <span className="alert-badge">{alerts.length}</span>
              </button>
              {showAlerts && (
                <div className="alert-dropdown">
                  <div className="alert-dropdown-header">
                    <h4>System Alerts ({alerts.length})</h4>
                    <button 
                      onClick={() => setShowAlerts(false)}
                      className="close-alerts-btn"
                    >
                      <FaTimes />
                    </button>
                  </div>
                  <div className="alert-dropdown-content">
                    {alerts.map((alert) => (
                      <div key={alert.id} className={`alert-item ${alert.type}`}>
                        <div className="alert-item-content">
                          <span className="alert-message">{alert.message}</span>
                          <button 
                            onClick={() => dismissAlert(alert.id)}
                            className="dismiss-alert-btn"
                          >
                            <FaTimes />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
        </div>
          )}
        </div>
      </div>

      {/* Success/Error Messages */}
      {message && (
        <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      {/* Add Vaccine Button */}
      <div className="action-bar">
        <button 
          className="btn-primary"
          onClick={() => setIsModalOpen(true)}
          disabled={loading}
        >
          <FaPlus style={{ color: 'white' }} />
          Add New Vaccine
        </button>
      </div>

      {/* Vaccines Table */}
      <div className="table-container">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading vaccines...</p>
          </div>
        ) : vaccines.length === 0 ? (
          <div className="empty-state">
            <FaSyringe size={48} />
            <h3>No Vaccines Found</h3>
            <p>Add your first vaccine to get started</p>
            <button 
              className="btn-primary"
              onClick={() => setIsModalOpen(true)}
            >
              <FaPlus style={{ color: 'white' }} />
              Add Vaccine
            </button>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
            <thead>
              <tr>
                  <th>Vaccine Brand</th>
                  <th>Stock Quantity</th>
                  <th>Expiry Date</th>
                  <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
                {vaccines.map((vaccine) => (
                  <tr key={vaccine.id} className={isExpired(vaccine.expiry_date) ? 'expired-row' : ''}>
                    <td>
                      <div className="vaccine-brand">
                        <FaSyringe className="vaccine-icon" />
                        <span>{vaccine.vaccine_brand}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`stock-quantity ${vaccine.stock_quantity <= 20 ? 'low-stock' : ''} ${vaccine.stock_quantity === 0 ? 'out-of-stock' : ''}`}>
                        {vaccine.stock_quantity}
                      </span>
                    </td>
                    <td>
                      <span className={`expiry-date ${isExpiringSoon(vaccine.expiry_date) ? 'expiring-soon' : ''} ${isExpired(vaccine.expiry_date) ? 'expired' : ''}`}>
                        {formatDate(vaccine.expiry_date)}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${getStatusColor(vaccine.status)}`}>
                        {vaccine.status}
                      </span>
                </td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="btn-edit"
                          onClick={() => openEditModal(vaccine)}
                          disabled={loading}
                        >
                          <FaEdit style={{ color: 'white' }} />
                        </button>
                        <button 
                          className="btn-delete"
                          onClick={() => handleDeleteVaccine(vaccine.id)}
                          disabled={loading}
                        >
                          <FaTrash style={{ color: 'white' }} />
                        </button>
                      </div>
                </td>
              </tr>
                ))}
            </tbody>
          </table>
          </div>
        )}
        </div>
        
      {/* Add Vaccine Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-container">
              <div className="modal-header">
                <div className="modal-title">
                  <div className="title-icon">
                    <FaSyringe style={{ color: 'white' }} />
                  </div>
                  <div>
                    <h3>Add New Vaccine</h3>
                    <p className="modal-subtitle">Enter vaccine information</p>
                  </div>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="close-btn">
                  <FaTimes />
                </button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>Vaccine Brand</label>
                  <input
                    type="text"
                    value={formData.vaccine_brand}
                    onChange={(e) => setFormData({ ...formData, vaccine_brand: e.target.value })}
                    placeholder="Enter vaccine brand name"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Stock Quantity</label>
                  <input
                    type="number"
                    value={formData.stock_quantity}
                    onChange={(e) => setFormData({ ...formData, stock_quantity: parseInt(e.target.value) })}
                    placeholder="Enter stock quantity"
                    min="0"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Expiry Date</label>
                  <input
                    type="date"
                    value={formData.expiry_date}
                    onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button onClick={() => setIsModalOpen(false)} className="cancel-btn">
                  Cancel
                </button>
                <button 
                  onClick={handleAddVaccine} 
                  disabled={loading}
                  className="save-btn"
                >
                  {loading ? (
                    <>
                      <div className="spinner"></div>
                      Adding...
                    </>
                  ) : (
                    <>
                      <FaPlus style={{ color: 'white' }} />
                      Add Vaccine
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Vaccine Modal */}
      {isEditModalOpen && selectedVaccine && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-container">
              <div className="modal-header">
                <div className="modal-title">
                  <div className="title-icon edit">
                    <FaEdit style={{ color: 'white' }} />
                  </div>
                  <div>
                    <h3>Edit Vaccine</h3>
                    <p className="modal-subtitle">Update vaccine information</p>
                  </div>
                </div>
                <button onClick={() => setIsEditModalOpen(false)} className="close-btn">
                  <FaTimes />
                </button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>Vaccine Brand</label>
                  <input
                    type="text"
                    value={formData.vaccine_brand}
                    onChange={(e) => setFormData({ ...formData, vaccine_brand: e.target.value })}
                    placeholder="Enter vaccine brand name"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Stock Quantity</label>
                  <input
                    type="number"
                    value={formData.stock_quantity}
                    onChange={(e) => setFormData({ ...formData, stock_quantity: parseInt(e.target.value) })}
                    placeholder="Enter stock quantity"
                    min="0"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Expiry Date</label>
                  <input
                    type="date"
                    value={formData.expiry_date}
                    onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button onClick={() => setIsEditModalOpen(false)} className="cancel-btn">
                  Cancel
                </button>
                <button 
                  onClick={handleUpdateVaccine} 
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
                      Update Vaccine
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

        .action-bar {
          margin-bottom: 24px;
        }

        .btn-primary {
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 8px;
          padding: 12px 24px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s ease;
        }

        .btn-primary:hover {
          background: #2563eb;
          transform: translateY(-1px);
        }

        .table-container {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }

        .loading-state, .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          color: #6b7280;
        }

        .empty-state h3 {
          margin: 16px 0 8px 0;
          color: #374151;
        }

        .empty-state p {
          margin-bottom: 24px;
          color: #6b7280;
        }

        .spinner {
          width: 32px;
          height: 32px;
          border: 3px solid #e5e7eb;
          border-top: 3px solid #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 16px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .table-wrapper {
          overflow-x: auto;
        }

        .data-table {
          width: 100%;
          border-collapse: collapse;
        }

        .data-table th {
          background: #f9fafb;
          padding: 16px 12px;
          text-align: left;
          font-weight: 600;
          color: #374151;
          border-bottom: 2px solid #e5e7eb;
        }

        .data-table td {
          padding: 16px 12px;
          border-bottom: 1px solid #f3f4f6;
          vertical-align: middle;
        }

        .data-table tr:hover {
          background: #f9fafb;
        }

        .expired-row {
          background: #fef2f2 !important;
        }

        .vaccine-brand {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 500;
        }

        .vaccine-icon {
          color: #3b82f6;
        }

        .stock-quantity {
          font-weight: 600;
          color: #059669;
        }

        .stock-quantity.low-stock {
          color: #d97706;
          font-weight: 700;
        }

        .stock-quantity.out-of-stock {
          color: #dc2626;
          font-weight: 700;
        }

        .expiry-date {
          font-weight: 500;
        }

        .expiry-date.expiring-soon {
          color: #d97706;
        }

        .expiry-date.expired {
          color: #dc2626;
        }

        .status-badge {
          padding: 6px 16px;
          border-radius: 50px;
          font-size: 12px;
          font-weight: 600;
          text-transform: capitalize;
          display: inline-block;
          border: none;
          white-space: nowrap;
        }

        .status-available {
          background: #E6FFE6;
          color: #228B22;
        }

        .status-low-stock {
          background: #FFFACD;
          color: #FFA500;
        }

        .status-out-of-stock {
          background: #FFE6E6;
          color: #DC143C;
        }

        .status-expired {
          background: #FFE6E6;
          color: #DC143C;
        }

        .status-default {
          background: #F5F5F5;
          color: #666666;
        }

        .action-buttons {
          display: flex;
          gap: 8px;
        }

        .btn-edit, .btn-delete {
          padding: 8px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .btn-edit {
          background: #3b82f6;
        }

        .btn-edit:hover {
          background: #2563eb;
          transform: translateY(-1px);
        }

        .btn-delete {
          background: #ef4444;
        }

        .btn-delete:hover {
          background: #dc2626;
          transform: translateY(-1px);
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

        .title-icon.edit {
          background: linear-gradient(135deg, #f59e0b, #d97706);
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

        /* Header Layout */
        .header-main {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 20px;
        }

        /* Compact Alert Notification */
        .alert-notification {
          position: relative;
        }

        .alert-trigger {
          background: #fef3c7;
          border: 2px solid #f59e0b;
          border-radius: 50px;
          padding: 8px 16px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s ease;
          position: relative;
          min-width: 60px;
          justify-content: center;
        }

        .alert-trigger:hover {
          background: #fde68a;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
        }

        .alert-icon {
          font-size: 16px;
        }

        .alert-badge {
          background: #ef4444;
          color: white;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 700;
          position: absolute;
          top: -6px;
          right: -6px;
          border: 2px solid white;
        }

        .alert-dropdown {
          position: absolute;
          top: 100%;
          right: 0;
          background: white;
          border-radius: 12px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          border: 1px solid #e5e7eb;
          min-width: 400px;
          max-width: 500px;
          z-index: 1000;
          margin-top: 8px;
          animation: dropdownSlideIn 0.2s ease-out;
        }

        .alert-dropdown::before {
          content: '';
          position: absolute;
          top: -8px;
          right: 20px;
          width: 0;
          height: 0;
          border-left: 8px solid transparent;
          border-right: 8px solid transparent;
          border-bottom: 8px solid white;
        }

        .alert-dropdown-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid #f3f4f6;
          background: #f9fafb;
          border-radius: 12px 12px 0 0;
        }

        .alert-dropdown-header h4 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
        }

        .close-alerts-btn {
          background: none;
          border: none;
          color: #6b7280;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          transition: all 0.2s ease;
        }

        .close-alerts-btn:hover {
          background: #f3f4f6;
          color: #374151;
        }

        .alert-dropdown-content {
          max-height: 300px;
          overflow-y: auto;
          padding: 8px 0;
        }

        .alert-item {
          padding: 12px 20px;
          border-bottom: 1px solid #f3f4f6;
          transition: all 0.2s ease;
        }

        .alert-item:last-child {
          border-bottom: none;
        }

        .alert-item:hover {
          background: #f9fafb;
        }

        .alert-item.warning {
          border-left: 4px solid #f59e0b;
          background: #fef3c7;
        }

        .alert-item.error {
          border-left: 4px solid #ef4444;
          background: #fee2e2;
        }

        .alert-item-content {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
        }

        .alert-message {
          flex: 1;
          font-size: 14px;
          font-weight: 500;
          line-height: 1.4;
          color: #374151;
        }

        .alert-item.warning .alert-message {
          color: #92400e;
        }

        .alert-item.error .alert-message {
          color: #991b1b;
        }

        .dismiss-alert-btn {
          background: none;
          border: none;
          color: inherit;
          cursor: pointer;
          padding: 2px;
          border-radius: 4px;
          transition: all 0.2s ease;
          opacity: 0.6;
          font-size: 12px;
          flex-shrink: 0;
        }

        .dismiss-alert-btn:hover {
          opacity: 1;
          background: rgba(0, 0, 0, 0.1);
        }

        @keyframes dropdownSlideIn {
          from {
            opacity: 0;
            transform: translateY(-10px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
};

export default VaccineManagement; 