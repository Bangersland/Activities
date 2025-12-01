import React, { useState, useEffect } from 'react';
import { getPatientTreatmentRecordsByUserId, getCurrentUser } from '../supabase';
import BarangayCaseCount from './BarangayCaseCount';

const AuthenticatedPatientRecords = () => {
  const [treatmentRecords, setTreatmentRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchUserAndRecords();
  }, []);

  const fetchUserAndRecords = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Get current authenticated user
      const { user: currentUser, error: userError } = await getCurrentUser();
      
      if (userError || !currentUser) {
        setError('Please log in to view your treatment records.');
        setLoading(false);
        return;
      }
      
      setUser(currentUser);
      
      // Fetch treatment records for authenticated user
      const { data, error: recordsError } = await getPatientTreatmentRecordsByUserId();
      
      if (recordsError) {
        setError('Error fetching your treatment records. Please try again.');
        console.error('Error:', recordsError);
        return;
      }
      
      if (!data || data.length === 0) {
        setError('No treatment records found for your account.');
        setTreatmentRecords([]);
      } else {
        setTreatmentRecords(data);
        setError('');
      }
    } catch (err) {
      setError('An error occurred while fetching your records. Please try again.');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString();
  };

  const formatCheckboxData = (jsonData) => {
    if (!jsonData) return 'Not specified';
    if (typeof jsonData === 'string') return jsonData;
    
    // Handle checkbox object format
    const selected = Object.entries(jsonData)
      .filter(([, value]) => value === true)
      .map(([key]) => key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()));
    
    return selected.length > 0 ? selected.join(', ') : 'Not specified';
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your treatment records...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg">
        <div className="bg-blue-600 text-white p-6 rounded-t-lg">
          <h1 className="text-2xl font-bold">My Treatment Records</h1>
          {user && (
            <p className="mt-2 opacity-90">
              Welcome, {user.email} - View your complete treatment history
            </p>
          )}
        </div>

        <div className="p-6">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {!error && treatmentRecords.length > 0 && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-800">
                  Your Treatment Records ({treatmentRecords.length})
                </h2>
                <button
                  onClick={fetchUserAndRecords}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm"
                >
                  Refresh Records
                </button>
              </div>
              
              {treatmentRecords.map((record, index) => (
                <div key={record.id} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b">
                    <h3 className="text-lg font-medium text-gray-800">
                      Treatment Record #{index + 1}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Created: {formatDate(record.created_at)}
                    </p>
                  </div>
                  
                  <div className="p-4 space-y-6">
                    {/* Patient Information */}
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-blue-800 mb-3">Patient Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div><strong>Name:</strong> {record.patient_name}</div>
                        <div><strong>Contact:</strong> {record.patient_contact}</div>
                        <div><strong>Age:</strong> {record.patient_age}</div>
                        <div><strong>Sex:</strong> {record.patient_sex}</div>
                        <div><strong>Appointment Date:</strong> {formatDate(record.appointment_date)}</div>
                      </div>
                    </div>

                    {/* Bite Information */}
                    <div className="bg-red-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-red-800 mb-3">Bite Incident Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div><strong>Date Bitten:</strong> {formatDate(record.date_bitten)}</div>
                        <div><strong>Time Bitten:</strong> {record.time_bitten || 'Not specified'}</div>
                        <div><strong>Site of Bite:</strong> {record.site_of_bite}</div>
                        <div><strong>Biting Animal:</strong> {record.biting_animal}</div>
                        <div><strong>Animal Status:</strong> {record.animal_status}</div>
                        <div>
                          <div><strong>Place Bitten:</strong> {record.place_bitten_barangay}</div>
                          {record.place_bitten_barangay && (
                            <div style={{ marginTop: '8px' }}>
                              <BarangayCaseCount barangayName={record.place_bitten_barangay} />
                            </div>
                          )}
                        </div>
                        <div><strong>Provoked:</strong> {record.provoked}</div>
                        <div><strong>Local Wound Treatment:</strong> {record.local_wound_treatment}</div>
                      </div>
                    </div>

                    {/* Treatment Details */}
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-green-800 mb-3">Treatment Details</h4>
                      <div className="space-y-3 text-sm">
                        <div><strong>Type of Exposure:</strong> {record.type_of_exposure}</div>
                        <div><strong>Category of Exposure:</strong> {formatCheckboxData(record.category_of_exposure)}</div>
                        <div><strong>Vaccine Brand:</strong> {record.vaccine_brand_name}</div>
                        <div><strong>Treatment Given:</strong> {formatCheckboxData(record.treatment_to_be_given)}</div>
                        <div><strong>Route:</strong> {record.route}</div>
                        <div><strong>RIG:</strong> {record.rig}</div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4">
                          <div><strong>D0 Date:</strong> {formatDate(record.d0_date)}</div>
                          <div><strong>D3 Date:</strong> {formatDate(record.d3_date)}</div>
                          <div><strong>D7 Date:</strong> {formatDate(record.d7_date)}</div>
                          <div><strong>D14 Date:</strong> {formatDate(record.d14_date)}</div>
                          <div><strong>D28/30 Date:</strong> {formatDate(record.d28_30_date)}</div>
                        </div>
                        
                        <div><strong>Animal Status Date:</strong> {formatDate(record.status_of_animal_date)}</div>
                        
                        {record.remarks && (
                          <div>
                            <strong>Remarks:</strong>
                            <p className="mt-1 p-2 bg-white rounded border">{record.remarks}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!error && treatmentRecords.length === 0 && !loading && (
            <div className="text-center py-8">
              <div className="text-gray-400 text-6xl mb-4">📋</div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">No Treatment Records Found</h3>
              <p className="text-gray-500">You don't have any treatment records in our system yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthenticatedPatientRecords;
