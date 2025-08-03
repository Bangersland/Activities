import React, { useState, useEffect } from 'react';
import { FaEdit, FaTrash, FaTimes, FaUpload, FaUser, FaEye } from 'react-icons/fa';
import { createStaffAccount, supabase } from '../supabase';

const Staff = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState({});
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [staffData, setStaffData] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    sex: '',
    dateOfBirth: '',
    contactNumber: '',
    address: '',
    position: '',
    dateHired: '',
    status: 'Active'
  });

  // Fetch staff data from database
  const fetchStaffData = async () => {
    try {
      setLoading(true);
      
      // First, get staff details
      const { data: staffDetails, error: staffError } = await supabase
        .from('staff_details')
        .select('*')
        .order('created_at', { ascending: false });

      if (staffError) {
        console.error('Error fetching staff details:', staffError);
        setMessage(`❌ Error loading staff data: ${staffError.message}`);
        return;
      }

      // Then, get profiles for staff members
      if (staffDetails && staffDetails.length > 0) {
        const userIds = staffDetails.map(staff => staff.user_id);

        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, username, email, first_name, last_name, profile_image')
          .in('id', userIds);

        if (profilesError) {
          console.error('Error fetching profiles:', profilesError);
          setMessage(`❌ Error loading profiles: ${profilesError.message}`);
          return;
        }

        // Combine the data
        const combinedData = staffDetails.map(staff => {
          const profile = profiles?.find(p => p.id === staff.user_id);
          return {
            ...staff,
            profiles: profile || null
          };
        });

        setStaffData(combinedData);
      } else {
        setStaffData([]);
      }
    } catch (error) {
      console.error('Error:', error);
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({
          ...prev,
          image: 'Please select a valid image file'
        }));
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({
          ...prev,
          image: 'Image size must be less than 5MB'
        }));
        return;
      }

      setSelectedImage(file);
      setErrors(prev => ({
        ...prev,
        image: ''
      }));

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Required fields
    if (!formData.username) newErrors.username = 'Username is required';
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.fullName) newErrors.fullName = 'Full name is required';
    if (!formData.sex) newErrors.sex = 'Sex is required';
    if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
    if (!formData.contactNumber) newErrors.contactNumber = 'Contact number is required';
    if (!formData.address) newErrors.address = 'Address is required';
    if (!formData.position) newErrors.position = 'Position is required';
    if (!formData.dateHired) newErrors.dateHired = 'Date hired is required';

    // Email validation
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation (only required for new staff)
    if (!isUpdateModalOpen) {
      if (!formData.password) newErrors.password = 'Password is required';
      if (!formData.confirmPassword) newErrors.confirmPassword = 'Please confirm password';
      
      if (formData.password && formData.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
      }

      if (formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    } else {
      // For updates, validate password only if provided
      if (formData.password && formData.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
      }

      if (formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    // Username validation
    if (formData.username && formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      if (isUpdateModalOpen && selectedStaff) {
        // Update existing staff
        await updateStaffAccount();
      } else {
        // Create new staff
        await createNewStaffAccount();
      }
    } catch (error) {
      setMessage(`❌ Error: ${error.message}`);
    }

    setIsLoading(false);
  };

  const createNewStaffAccount = async () => {
    const userData = {
      first_name: formData.fullName.split(' ')[0] || formData.fullName,
      last_name: formData.fullName.split(' ').slice(1).join(' ') || '',
      sex: formData.sex,
      date_of_birth: formData.dateOfBirth,
      contact_number: formData.contactNumber,
      address: formData.address,
      position: formData.position,
      date_hired: formData.dateHired,
      status: formData.status
    };

    const { error } = await createStaffAccount(
      formData.username,
      formData.email,
      formData.password,
      userData,
      selectedImage
    );

    if (error) {
      setMessage(`❌ Error creating staff account: ${error.message}`);
    } else {
      setMessage('✅ Staff account created successfully!');
      resetForm();
      await fetchStaffData();
      setTimeout(() => {
        setIsModalOpen(false);
        setMessage('');
      }, 2000);
    }
  };

  const updateStaffAccount = async () => {
    try {
      // Update staff details
      const { error: staffError } = await supabase
        .from('staff_details')
        .update({
          sex: formData.sex,
          date_of_birth: formData.dateOfBirth,
          contact_number: formData.contactNumber,
          address: formData.address,
          job_position: formData.position,
          date_hired: formData.dateHired,
          status: formData.status,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', selectedStaff.user_id);

      if (staffError) {
        throw new Error(`Error updating staff details: ${staffError.message}`);
      }

      // Update profile information
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          username: formData.username,
          email: formData.email,
          first_name: formData.fullName.split(' ')[0] || formData.fullName,
          last_name: formData.fullName.split(' ').slice(1).join(' ') || '',
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedStaff.user_id);

      if (profileError) {
        throw new Error(`Error updating profile: ${profileError.message}`);
      }

      // Handle image upload if new image is selected
      if (selectedImage) {
        const fileName = `${selectedStaff.user_id}_${Date.now()}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from('staff-photos')
          .upload(fileName, selectedImage, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('Error uploading image:', uploadError);
        } else {
          // Get public URL
          const { data: urlData } = supabase.storage
            .from('staff-photos')
            .getPublicUrl(fileName);
          
          // Update profile with new image URL
          await supabase
            .from('profiles')
            .update({
              profile_image: urlData.publicUrl
            })
            .eq('id', selectedStaff.user_id);
        }
      }

      setMessage('✅ Staff account updated successfully!');
      resetForm();
      await fetchStaffData();
      setTimeout(() => {
        setIsUpdateModalOpen(false);
        setMessage('');
      }, 2000);
    } catch (error) {
      setMessage(`❌ Error updating staff account: ${error.message}`);
    }
  };

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      fullName: '',
      sex: '',
      dateOfBirth: '',
      contactNumber: '',
      address: '',
      position: '',
      dateHired: '',
      status: 'Active'
    });
    setSelectedImage(null);
    setImagePreview(null);
  };

  const openModal = () => {
    setIsModalOpen(true);
    setMessage('');
    setErrors({});
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      fullName: '',
      sex: '',
      dateOfBirth: '',
      contactNumber: '',
      address: '',
      position: '',
      dateHired: '',
      status: 'Active'
    });
    setSelectedImage(null);
    setImagePreview(null);
    setMessage('');
    setErrors({});
  };

  const openViewModal = (staff) => {
    setSelectedStaff(staff);
    setIsViewModalOpen(true);
  };

  const closeViewModal = () => {
    setIsViewModalOpen(false);
    setSelectedStaff(null);
  };

  const openUpdateModal = (staff) => {
    setSelectedStaff(staff);
    setFormData({
      username: staff.profiles?.username || '',
      email: staff.profiles?.email || '',
      password: '',
      confirmPassword: '',
      fullName: `${staff.profiles?.first_name || ''} ${staff.profiles?.last_name || ''}`.trim(),
      sex: staff.sex || '',
      dateOfBirth: staff.date_of_birth || '',
      contactNumber: staff.contact_number || '',
      address: staff.address || '',
      position: staff.job_position || '',
      dateHired: staff.date_hired || '',
      status: staff.status || 'Active'
    });
    setIsUpdateModalOpen(true);
  };

  const closeUpdateModal = () => {
    setIsUpdateModalOpen(false);
    setSelectedStaff(null);
    setFormData({
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      fullName: '',
      sex: '',
      dateOfBirth: '',
      contactNumber: '',
      address: '',
      position: '',
      dateHired: '',
      status: 'Active'
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const getFullName = (staff) => {
    const firstName = staff.profiles?.first_name || '';
    const lastName = staff.profiles?.last_name || '';
    return `${firstName} ${lastName}`.trim() || 'N/A';
  };

  // Filter staff data based on search term
  const filteredStaffData = staffData.filter(staff => {
    const fullName = getFullName(staff).toLowerCase();
    const username = staff.profiles?.username?.toLowerCase() || '';
    const email = staff.profiles?.email?.toLowerCase() || '';
    const position = staff.job_position?.toLowerCase() || '';
    const status = staff.status?.toLowerCase() || '';
    const contactNumber = staff.contact_number?.toLowerCase() || '';
    
    const searchLower = searchTerm.toLowerCase();
    
    return fullName.includes(searchLower) ||
           username.includes(searchLower) ||
           email.includes(searchLower) ||
           position.includes(searchLower) ||
           status.includes(searchLower) ||
           contactNumber.includes(searchLower);
  });

  return (
    <div className="content-section">
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        margin: '20px'
      }}>
        {/* Header */}
        <div style={{
          marginBottom: '24px'
        }}>
          <h2 style={{
            margin: 0,
            marginBottom: '16px',
            fontSize: '24px',
            fontWeight: '700',
            color: '#1f2937'
          }}>
            List of Staff
          </h2>
          
          {/* Search and Action Buttons Row */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '16px'
          }}>
            {/* Search Bar */}
            <div style={{
              position: 'relative',
              flex: 1,
              maxWidth: '500px',
              minWidth: '300px'
            }}>
              <input
                type="text"
                placeholder="Search staff by name, username, email, position, status, or contact number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  paddingLeft: '40px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  backgroundColor: 'white',
                  transition: 'all 0.2s ease',
                  outline: 'none'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#3b82f6';
                  e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#d1d5db';
                  e.target.style.boxShadow = 'none';
                }}
              />
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
            </div>

            {/* Action Buttons */}
            <div style={{ 
              display: 'flex', 
              gap: '12px',
              alignItems: 'center',
              minWidth: 'fit-content'
            }}>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  style={{
                    padding: '8px 12px',
                    backgroundColor: '#f3f4f6',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    color: '#6b7280',
                    cursor: 'pointer',
                    fontSize: '12px',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#e5e7eb';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#f3f4f6';
                  }}
                >
                  Clear
                </button>
              )}
              <button 
                onClick={fetchStaffData}
                style={{
                  padding: '10px 20px',
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
                  transition: 'all 0.2s ease'
                }}
              >
                🔄 Refresh
              </button>
              <button 
                onClick={openModal}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease'
                }}
              >
                <span style={{ fontSize: '16px' }}>+</span>
                Add New
              </button>
            </div>
          </div>
        </div>

        {/* Success/Error Messages */}
        {message && (
           <div style={{
             padding: '12px 16px',
             borderRadius: '8px',
             marginBottom: '16px',
             backgroundColor: message.includes('❌') ? '#f8d7da' : '#d4edda',
             color: message.includes('❌') ? '#721c24' : '#155724',
             border: `1px solid ${message.includes('❌') ? '#f5c6cb' : '#c3e6cb'}`
           }}>
             {message}
           </div>
         )}

        {/* Staff Table */}
        <div style={{
          overflowX: 'auto'
        }}>
          {loading ? (
            <div style={{
              textAlign: 'center',
              padding: '40px',
              color: '#6b7280'
            }}>
              Loading staff data...
            </div>
          ) : (
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '14px'
          }}>
            <thead>
              <tr style={{
                backgroundColor: '#3b82f6',
                color: 'white'
              }}>
                <th style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontWeight: '600',
                  fontSize: '14px'
                }}>
                    Photo
                </th>
                <th style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontWeight: '600',
                  fontSize: '14px'
                }}>
                  Full Name
                </th>
                <th style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontWeight: '600',
                  fontSize: '14px'
                }}>
                  Position
                </th>
                <th style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontWeight: '600',
                  fontSize: '14px'
                }}>
                  Email
                </th>
                <th style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontWeight: '600',
                  fontSize: '14px'
                }}>
                  Contact Number
                </th>
                <th style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontWeight: '600',
                  fontSize: '14px'
                }}>
                  Status
                </th>
                <th style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontWeight: '600',
                  fontSize: '14px'
                }}>
                    Actions
                </th>
              </tr>
            </thead>
            <tbody>
                {filteredStaffData.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{
                      padding: '40px',
                      textAlign: 'center',
                      color: '#6b7280',
                      fontSize: '14px'
                    }}>
                      {searchTerm ? 
                        `No staff members found matching "${searchTerm}". Try a different search term.` : 
                        'No staff members found. Click "Add New" to create the first staff account.'
                      }
                    </td>
                  </tr>
                ) : (
                  filteredStaffData.map((staff) => (
                <tr key={staff.id} style={{
                  borderBottom: '1px solid #f3f4f6',
                  backgroundColor: 'white'
                }}>
                  <td style={{
                    padding: '16px',
                        textAlign: 'center'
                      }}>
                        {staff.profiles?.profile_image ? (
                          <img
                            src={staff.profiles.profile_image}
                            alt="Profile"
                            style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '50%',
                              objectFit: 'cover'
                            }}
                          />
                        ) : (
                          <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            backgroundColor: '#e5e7eb',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#9ca3af'
                          }}>
                            <FaUser size={16} />
                          </div>
                        )}
                  </td>
                  <td style={{
                    padding: '16px',
                    color: '#374151',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}>
                        {getFullName(staff)}
                  </td>
                  <td style={{
                    padding: '16px',
                    color: '#374151',
                    fontSize: '14px'
                  }}>
                        {staff.job_position || 'N/A'}
                  </td>
                  <td style={{
                    padding: '16px',
                    color: '#374151',
                    fontSize: '14px'
                  }}>
                        {staff.profiles?.email || 'N/A'}
                  </td>
                  <td style={{
                    padding: '16px',
                    color: '#374151',
                    fontSize: '14px'
                  }}>
                        {staff.contact_number || 'N/A'}
                  </td>
                  <td style={{
                    padding: '16px',
                    color: '#374151',
                    fontSize: '14px'
                  }}>
                    <span style={{
                          backgroundColor: staff.status === 'Active' ? '#10b981' : '#ef4444',
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}>
                          {staff.status || 'N/A'}
                    </span>
                  </td>
                  <td style={{
                    padding: '16px'
                  }}>
                    <div style={{
                      display: 'flex',
                      gap: '8px',
                      alignItems: 'center'
                    }}>
                          <button
                            onClick={() => openViewModal(staff)}
                            style={{
                              padding: '6px 10px',
                              backgroundColor: '#3b82f6',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '12px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <FaEye size={12} />
                            View
                          </button>
                          <button
                            onClick={() => openUpdateModal(staff)}
                            style={{
                        padding: '6px 10px',
                        backgroundColor: '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                            }}
                          >
                        <FaEdit size={12} />
                            Edit
                      </button>
                     
                    </div>
                  </td>
                </tr>
                  ))
                )}
            </tbody>
          </table>
          )}
        </div>

        {/* Footer */}
        <div style={{
          marginTop: '20px',
          color: '#6b7280',
          fontSize: '14px'
        }}>
          Showing {staffData.length} of {staffData.length} entries
        </div>
      </div>

      {/* View Modal */}
      {isViewModalOpen && selectedStaff && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
              borderBottom: '1px solid #e5e7eb',
              paddingBottom: '16px'
            }}>
              <h3 style={{
                margin: 0,
                fontSize: '20px',
                fontWeight: '600',
                color: '#1f2937'
              }}>
                Staff Details
              </h3>
              <button
                onClick={closeViewModal}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  color: '#6b7280',
                  padding: '4px'
                }}
              >
                <FaTimes />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ fontWeight: '600', color: '#374151' }}>Profile Photo</label>
                <div style={{ marginTop: '8px' }}>
                  {selectedStaff.profiles?.profile_image ? (
                    <img
                      src={selectedStaff.profiles.profile_image}
                      alt="Profile"
                      style={{
                        width: '100px',
                        height: '100px',
                        borderRadius: '50%',
                        objectFit: 'cover'
                      }}
                    />
                  ) : (
                    <div style={{
                      width: '100px',
                      height: '100px',
                      borderRadius: '50%',
                      backgroundColor: '#e5e7eb',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#9ca3af'
                    }}>
                      <FaUser size={32} />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label style={{ fontWeight: '600', color: '#374151' }}>Full Name</label>
                <p style={{ margin: '8px 0', color: '#374151' }}>{getFullName(selectedStaff)}</p>
              </div>

              <div>
                <label style={{ fontWeight: '600', color: '#374151' }}>Username</label>
                <p style={{ margin: '8px 0', color: '#374151' }}>{selectedStaff.profiles?.username || 'N/A'}</p>
              </div>

              <div>
                <label style={{ fontWeight: '600', color: '#374151' }}>Email</label>
                <p style={{ margin: '8px 0', color: '#374151' }}>{selectedStaff.profiles?.email || 'N/A'}</p>
              </div>

              <div>
                <label style={{ fontWeight: '600', color: '#374151' }}>Position</label>
                <p style={{ margin: '8px 0', color: '#374151' }}>{selectedStaff.job_position || 'N/A'}</p>
              </div>

              <div>
                <label style={{ fontWeight: '600', color: '#374151' }}>Status</label>
                <p style={{ margin: '8px 0', color: '#374151' }}>{selectedStaff.status || 'N/A'}</p>
              </div>

              <div>
                <label style={{ fontWeight: '600', color: '#374151' }}>Sex</label>
                <p style={{ margin: '8px 0', color: '#374151' }}>{selectedStaff.sex || 'N/A'}</p>
              </div>

              <div>
                <label style={{ fontWeight: '600', color: '#374151' }}>Date of Birth</label>
                <p style={{ margin: '8px 0', color: '#374151' }}>{formatDate(selectedStaff.date_of_birth)}</p>
              </div>

              <div>
                <label style={{ fontWeight: '600', color: '#374151' }}>Contact Number</label>
                <p style={{ margin: '8px 0', color: '#374151' }}>{selectedStaff.contact_number || 'N/A'}</p>
              </div>

              <div>
                <label style={{ fontWeight: '600', color: '#374151' }}>Date Hired</label>
                <p style={{ margin: '8px 0', color: '#374151' }}>{formatDate(selectedStaff.date_hired)}</p>
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontWeight: '600', color: '#374151' }}>Address</label>
                <p style={{ margin: '8px 0', color: '#374151' }}>{selectedStaff.address || 'N/A'}</p>
              </div>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              marginTop: '24px',
              paddingTop: '16px',
              borderTop: '1px solid #e5e7eb'
            }}>
              <button
                onClick={closeViewModal}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {(isModalOpen || isUpdateModalOpen) && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '700px',
            width: '90%',
            maxHeight: '90vh',
            overflowY: 'auto',
            position: 'relative'
          }}>
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
              borderBottom: '1px solid #e5e7eb',
              paddingBottom: '16px'
            }}>
              <h3 style={{
                margin: 0,
                fontSize: '20px',
                fontWeight: '600',
                color: '#1f2937'
              }}>
                {isUpdateModalOpen ? 'Update Staff Member' : 'Add New Staff Member'}
              </h3>
              <button
                onClick={isUpdateModalOpen ? closeUpdateModal : closeModal}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  color: '#6b7280',
                  padding: '4px'
                }}
              >
                <FaTimes />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit}>
              {message && (
                <div style={{
                  padding: '12px 16px',
                  borderRadius: '8px',
                  marginBottom: '16px',
                  backgroundColor: message.includes('✅') ? '#d4edda' : '#f8d7da',
                  color: message.includes('✅') ? '#155724' : '#721c24',
                  border: `1px solid ${message.includes('✅') ? '#c3e6cb' : '#f5c6cb'}`
                }}>
                  {message}
                </div>
              )}

              {/* Image Upload Section */}
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                marginBottom: '24px',
                padding: '20px',
                border: '2px dashed #d1d5db',
                borderRadius: '8px',
                backgroundColor: '#f9fafb'
              }}>
                <div style={{ textAlign: 'center' }}>
                  {imagePreview ? (
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                      <img
                        src={imagePreview}
                        alt="Preview"
                        style={{
                          width: '120px',
                          height: '120px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          border: '3px solid #3b82f6'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedImage(null);
                          setImagePreview(null);
                        }}
                        style={{
                          position: 'absolute',
                          top: '-8px',
                          right: '-8px',
                          background: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '50%',
                          width: '24px',
                          height: '24px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <div>
                      <FaUser size={48} style={{ color: '#9ca3af', marginBottom: '8px' }} />
                      <p style={{ color: '#6b7280', margin: '8px 0' }}>Upload Profile Photo</p>
                      <label
                        htmlFor="image-upload"
                        style={{
                          display: 'inline-block',
                          padding: '8px 16px',
                          backgroundColor: '#3b82f6',
                          color: 'white',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: '500'
                        }}
                      >
                        <FaUpload style={{ marginRight: '8px' }} />
                        Choose Image
                      </label>
                      <input
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        style={{ display: 'none' }}
                      />
                    </div>
                  )}
                  {errors.image && (
                    <p style={{ color: '#e53e3e', fontSize: '12px', marginTop: '8px' }}>
                      {errors.image}
                    </p>
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {/* Username */}
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                    Username *
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="Enter username"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: `1px solid ${errors.username ? '#e53e3e' : '#d1d5db'}`,
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                  {errors.username && (
                    <span style={{ color: '#e53e3e', fontSize: '12px' }}>{errors.username}</span>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter email address"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: `1px solid ${errors.email ? '#e53e3e' : '#d1d5db'}`,
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                  {errors.email && (
                    <span style={{ color: '#e53e3e', fontSize: '12px' }}>{errors.email}</span>
                  )}
                </div>

                                 {/* Password */}
                 <div>
                   <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                     Password {!isUpdateModalOpen && '*'}
                   </label>
                   <input
                     type="password"
                     name="password"
                     value={formData.password}
                     onChange={handleChange}
                     placeholder={isUpdateModalOpen ? "Leave blank to keep current password" : "Enter password"}
                     style={{
                       width: '100%',
                       padding: '8px 12px',
                       border: `1px solid ${errors.password ? '#e53e3e' : '#d1d5db'}`,
                       borderRadius: '6px',
                       fontSize: '14px'
                     }}
                   />
                   {errors.password && (
                     <span style={{ color: '#e53e3e', fontSize: '12px' }}>{errors.password}</span>
                   )}
                   {isUpdateModalOpen && (
                     <span style={{ color: '#6b7280', fontSize: '11px' }}>
                       Leave blank to keep current password
                     </span>
                   )}
                 </div>

                 {/* Confirm Password */}
                 <div>
                   <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                     Confirm Password {!isUpdateModalOpen && '*'}
                   </label>
                   <input
                     type="password"
                     name="confirmPassword"
                     value={formData.confirmPassword}
                     onChange={handleChange}
                     placeholder={isUpdateModalOpen ? "Leave blank to keep current password" : "Confirm password"}
                     style={{
                       width: '100%',
                       padding: '8px 12px',
                       border: `1px solid ${errors.confirmPassword ? '#e53e3e' : '#d1d5db'}`,
                       borderRadius: '6px',
                       fontSize: '14px'
                     }}
                   />
                   {errors.confirmPassword && (
                     <span style={{ color: '#e53e3e', fontSize: '12px' }}>{errors.confirmPassword}</span>
                   )}
                 </div>

                {/* Full Name */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Enter full name"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: `1px solid ${errors.fullName ? '#e53e3e' : '#d1d5db'}`,
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                  {errors.fullName && (
                    <span style={{ color: '#e53e3e', fontSize: '12px' }}>{errors.fullName}</span>
                  )}
                </div>

                {/* Sex */}
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                    Sex *
                  </label>
                  <select
                    name="sex"
                    value={formData.sex}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: `1px solid ${errors.sex ? '#e53e3e' : '#d1d5db'}`,
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  >
                    <option value="">Select sex</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                  {errors.sex && (
                    <span style={{ color: '#e53e3e', fontSize: '12px' }}>{errors.sex}</span>
                  )}
                </div>

                {/* Date of Birth */}
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                    Date of Birth *
                  </label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: `1px solid ${errors.dateOfBirth ? '#e53e3e' : '#d1d5db'}`,
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                  {errors.dateOfBirth && (
                    <span style={{ color: '#e53e3e', fontSize: '12px' }}>{errors.dateOfBirth}</span>
                  )}
                </div>

                {/* Contact Number */}
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                    Contact Number *
                  </label>
                  <input
                    type="tel"
                    name="contactNumber"
                    value={formData.contactNumber}
                    onChange={handleChange}
                    placeholder="Enter contact number"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: `1px solid ${errors.contactNumber ? '#e53e3e' : '#d1d5db'}`,
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                  {errors.contactNumber && (
                    <span style={{ color: '#e53e3e', fontSize: '12px' }}>{errors.contactNumber}</span>
                  )}
                </div>

                {/* Position */}
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                    Position *
                  </label>
                  <input
                    type="text"
                    name="position"
                    value={formData.position}
                    onChange={handleChange}
                    placeholder="Enter position"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: `1px solid ${errors.position ? '#e53e3e' : '#d1d5db'}`,
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                  {errors.position && (
                    <span style={{ color: '#e53e3e', fontSize: '12px' }}>{errors.position}</span>
                  )}
                </div>

                {/* Date Hired */}
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                    Date Hired *
                  </label>
                  <input
                    type="date"
                    name="dateHired"
                    value={formData.dateHired}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: `1px solid ${errors.dateHired ? '#e53e3e' : '#d1d5db'}`,
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                  {errors.dateHired && (
                    <span style={{ color: '#e53e3e', fontSize: '12px' }}>{errors.dateHired}</span>
                  )}
                </div>

                {/* Status */}
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  >
                    <option value="Active">Active</option>
                    <option value="Retired">Retired</option>
                    <option value="Terminated">Terminated</option>
                  </select>
                </div>

                {/* Address */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                    Address *
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Enter complete address"
                    rows="3"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: `1px solid ${errors.address ? '#e53e3e' : '#d1d5db'}`,
                      borderRadius: '6px',
                      fontSize: '14px',
                      resize: 'vertical'
                    }}
                  />
                  {errors.address && (
                    <span style={{ color: '#e53e3e', fontSize: '12px' }}>{errors.address}</span>
                  )}
                </div>
              </div>

              {/* Form Actions */}
              <div style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-end',
                marginTop: '24px',
                paddingTop: '16px',
                borderTop: '1px solid #e5e7eb'
              }}>
                <button
                  type="button"
                  onClick={isUpdateModalOpen ? closeUpdateModal : closeModal}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#6b7280',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    opacity: isLoading ? 0.6 : 1
                  }}
                >
                  {isLoading ? 'Creating...' : (isUpdateModalOpen ? 'Update Staff' : 'Create Staff Account')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Staff; 