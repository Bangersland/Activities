import React, { useState } from 'react';
import { verifyPatientAndGetRecords } from '../supabase';

const PatientRecords = () => {
  const [patientName, setPatientName] = useState('');
  const [contactOrEmail, setContactOrEmail] = useState('');
  const [treatmentRecords, setTreatmentRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showRecords, setShowRecords] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!patientName.trim() || !contactOrEmail.trim()) {
      setError('Please enter both your name and contact number');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const { data, error: fetchError } = await verifyPatientAndGetRecords(
        patientName.trim(),
        contactOrEmail.trim()
      );
      
      if (fetchError) {
        setError('Error fetching records. Please try again.');
        console.error('Error:', fetchError);
        return;
      }
      
      if (!data || data.length === 0) {
        setError('No treatment records found. Please check your name and contact number.');
        setTreatmentRecords([]);
        setShowRecords(false);
      } else {
        setTreatmentRecords(data);
        setShowRecords(true);
        setError('');
      }
    } catch (err) {
      setError('An error occurred while searching. Please try again.');
      console.error('Search error:', err);
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
      .filter(([key, value]) => value === true)
      .map(([key]) => key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()));
    
    return selected.length > 0 ? selected.join(', ') : 'Not specified';
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg">
        <div className="bg-blue-600 text-white p-6 rounded-t-lg">
          <h1 className="text-2xl font-bold">Patient Treatment Records</h1>
          <p className="mt-2 opacity-90">Enter your name and contact number to view your treatment history</p>
        </div>

        <div className="p-6">
          <form onSubmit={handleSearch} className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your full name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Number
                </label>
                <input
                  type="text"
                  value={contactOrEmail}
                  onChange={(e) => setContactOrEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your contact number"
                  required
                />
              </div>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Searching...' : 'Search Records'}
            </button>
          </form>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {showRecords && treatmentRecords.length > 0 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Your Treatment Records ({treatmentRecords.length})
              </h2>
              
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
                        <div><strong>Place Bitten:</strong> {record.place_bitten_barangay}</div>
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
        </div>
      </div>
    </div>
  );
};

export default PatientRecords;
