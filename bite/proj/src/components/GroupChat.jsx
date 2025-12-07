import React, { useState, useEffect, useRef } from 'react';
import { FaPaperPlane, FaTimes, FaUser, FaUsers, FaPrescriptionBottle, FaFile } from 'react-icons/fa';
import { 
  getGroupMessages, 
  sendGroupMessage, 
  getGroupMembers,
  getGroupPrescriptions,
  supabase 
} from '../supabase';

const GroupChat = ({ group, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [members, setMembers] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showPrescriptionForm, setShowPrescriptionForm] = useState(false);
  const [prescriptionData, setPrescriptionData] = useState({
    patient_contact: '',
    patient_name: '',
    prescription_text: '',
    medication_details: []
  });
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  useEffect(() => {
    if (group) {
      fetchMessages();
      fetchMembers();
      fetchPrescriptions();
      setupRealtimeSubscription();
    }

    return () => {
      if (group) {
        supabase.removeChannel(`group-${group.id}`);
      }
    };
  }, [group]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const setupRealtimeSubscription = () => {
    if (!group) return;

    const channel = supabase
      .channel(`group-${group.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `group_id=eq.${group.id}`
        },
        (payload) => {
          // Fetch updated messages
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const fetchMessages = async () => {
    if (!group) return;
    
    try {
      setLoading(true);
      const { data, error } = await getGroupMessages(group.id);
      if (!error) {
        setMessages(data || []);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    if (!group) return;
    
    try {
      const { data, error } = await getGroupMembers(group.id);
      if (!error) {
        setMembers(data || []);
      }
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };

  const fetchPrescriptions = async () => {
    if (!group) return;
    
    try {
      const { data, error } = await getGroupPrescriptions(group.id);
      if (!error) {
        setPrescriptions(data || []);
      }
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    try {
      setSending(true);
      const { error } = await sendGroupMessage(group.id, newMessage.trim());
      if (!error) {
        setNewMessage('');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleSendPrescription = async (e) => {
    e.preventDefault();
    if (!prescriptionData.prescription_text.trim() || sending) return;

    try {
      setSending(true);
      const { error } = await sendGroupMessage(
        group.id,
        prescriptionData.prescription_text,
        'prescription',
        prescriptionData
      );
      if (!error) {
        setShowPrescriptionForm(false);
        setPrescriptionData({
          patient_contact: '',
          patient_name: '',
          prescription_text: '',
          medication_details: []
        });
        await fetchPrescriptions();
      }
    } catch (error) {
      console.error('Error sending prescription:', error);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    getUser();
  }, []);

  const getSenderName = (message) => {
    if (message.sender_name) return message.sender_name;
    if (message.profiles) {
      const profile = message.profiles;
      if (profile.first_name && profile.last_name) {
        return `${profile.first_name} ${profile.last_name}`;
      }
      return profile.username || profile.email;
    }
    return 'Unknown';
  };

  const isCurrentUser = (message) => {
    return message.sender_id === currentUser?.id;
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      padding: '20px'
    }} onClick={onClose}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '20px',
        width: '100%',
        maxWidth: '900px',
        height: '90vh',
        maxHeight: '800px',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
      }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
          padding: '20px 24px',
          borderRadius: '20px 20px 0 0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: 'white'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <FaUsers />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '700' }}>
                {group?.name || 'Group Chat'}
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '12px', opacity: 0.9 }}>
                {members.length} member{members.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'white',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.3)';
              e.target.style.transform = 'rotate(90deg)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.2)';
              e.target.style.transform = 'rotate(0deg)';
            }}
          >
            <FaTimes />
          </button>
        </div>

        {/* Messages Container */}
        <div
          ref={messagesContainerRef}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px',
            backgroundColor: '#f8fafc',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}
        >
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
              Loading messages...
            </div>
          ) : messages.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
              <FaUsers style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }} />
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((message, index) => {
              const isCurrent = isCurrentUser(message);
              const showDate = index === 0 || 
                formatDate(messages[index - 1].created_at) !== formatDate(message.created_at);
              
              return (
                <React.Fragment key={message.id}>
                  {showDate && (
                    <div style={{
                      textAlign: 'center',
                      margin: '12px 0',
                      color: '#94a3b8',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      {formatDate(message.created_at)}
                    </div>
                  )}
                  <div style={{
                    display: 'flex',
                    justifyContent: isCurrent ? 'flex-end' : 'flex-start',
                    marginBottom: '4px'
                  }}>
                    <div style={{
                      maxWidth: '70%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isCurrent ? 'flex-end' : 'flex-start',
                      gap: '4px'
                    }}>
                      {!isCurrent && (
                        <span style={{
                          fontSize: '12px',
                          fontWeight: '600',
                          color: '#64748b',
                          padding: '0 8px'
                        }}>
                          {getSenderName(message)}
                        </span>
                      )}
                      <div style={{
                        padding: '12px 16px',
                        borderRadius: isCurrent ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                        background: isCurrent 
                          ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
                          : 'white',
                        color: isCurrent ? 'white' : '#1e293b',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                        wordWrap: 'break-word',
                        lineHeight: '1.5'
                      }}>
                        {message.message_type === 'prescription' && (
                          <div style={{
                            marginBottom: '8px',
                            padding: '8px',
                            background: isCurrent ? 'rgba(255, 255, 255, 0.2)' : '#f0f9ff',
                            borderRadius: '8px',
                            border: `1px solid ${isCurrent ? 'rgba(255, 255, 255, 0.3)' : '#bae6fd'}`
                          }}>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              marginBottom: '4px',
                              fontSize: '12px',
                              fontWeight: '600'
                            }}>
                              <FaPrescriptionBottle />
                              Prescription
                            </div>
                            {message.prescription_data?.patient_name && (
                              <div style={{ fontSize: '12px', marginBottom: '4px' }}>
                                Patient: {message.prescription_data.patient_name}
                              </div>
                            )}
                          </div>
                        )}
                        <div style={{ fontSize: '14px' }}>
                          {message.message_text}
                        </div>
                        <div style={{
                          fontSize: '11px',
                          opacity: 0.7,
                          marginTop: '4px',
                          textAlign: 'right'
                        }}>
                          {formatTime(message.created_at)}
                        </div>
                      </div>
                    </div>
                  </div>
                </React.Fragment>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Prescription Form Modal */}
        {showPrescriptionForm && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10
          }}>
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '24px',
              width: '90%',
              maxWidth: '500px',
              maxHeight: '80vh',
              overflowY: 'auto'
            }} onClick={(e) => e.stopPropagation()}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px'
              }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>
                  Send Prescription
                </h3>
                <button
                  onClick={() => setShowPrescriptionForm(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '20px',
                    cursor: 'pointer',
                    color: '#64748b'
                  }}
                >
                  <FaTimes />
                </button>
              </div>
              <form onSubmit={handleSendPrescription}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '6px',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#374151'
                  }}>
                    Patient Name
                  </label>
                  <input
                    type="text"
                    value={prescriptionData.patient_name}
                    onChange={(e) => setPrescriptionData({
                      ...prescriptionData,
                      patient_name: e.target.value
                    })}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                    required
                  />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '6px',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#374151'
                  }}>
                    Patient Contact
                  </label>
                  <input
                    type="text"
                    value={prescriptionData.patient_contact}
                    onChange={(e) => setPrescriptionData({
                      ...prescriptionData,
                      patient_contact: e.target.value
                    })}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                    required
                  />
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '6px',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#374151'
                  }}>
                    Prescription Details
                  </label>
                  <textarea
                    value={prescriptionData.prescription_text}
                    onChange={(e) => setPrescriptionData({
                      ...prescriptionData,
                      prescription_text: e.target.value
                    })}
                    rows={6}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                      resize: 'vertical'
                    }}
                    placeholder="Enter prescription details, medications, dosages, instructions..."
                    required
                  />
                </div>
                <div style={{
                  display: 'flex',
                  gap: '12px',
                  justifyContent: 'flex-end'
                }}>
                  <button
                    type="button"
                    onClick={() => setShowPrescriptionForm(false)}
                    style={{
                      padding: '10px 20px',
                      background: '#f1f5f9',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={sending}
                    style={{
                      padding: '10px 20px',
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: sending ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: 'white',
                      opacity: sending ? 0.6 : 1
                    }}
                  >
                    {sending ? 'Sending...' : 'Send Prescription'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Input Area */}
        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid #e2e8f0',
          background: 'white',
          borderRadius: '0 0 20px 20px'
        }}>
          <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={() => setShowPrescriptionForm(true)}
              style={{
                padding: '10px 14px',
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '10px',
                cursor: 'pointer',
                color: '#166534',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#dcfce7';
                e.target.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = '#f0fdf4';
                e.target.style.transform = 'scale(1)';
              }}
              title="Send Prescription"
            >
              <FaPrescriptionBottle />
            </button>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              style={{
                flex: 1,
                padding: '12px 16px',
                border: '2px solid #e2e8f0',
                borderRadius: '10px',
                fontSize: '14px',
                outline: 'none',
                transition: 'all 0.2s ease'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#3b82f6';
                e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e2e8f0';
                e.target.style.boxShadow = 'none';
              }}
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || sending}
              style={{
                padding: '12px 20px',
                background: newMessage.trim() && !sending
                  ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
                  : '#cbd5e1',
                border: 'none',
                borderRadius: '10px',
                cursor: newMessage.trim() && !sending ? 'pointer' : 'not-allowed',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (newMessage.trim() && !sending) {
                  e.target.style.transform = 'translateY(-1px)';
                  e.target.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
                }
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              }}
            >
              <FaPaperPlane />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default GroupChat;

