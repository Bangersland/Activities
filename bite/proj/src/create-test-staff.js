// Create Test Staff Account Script
// Run this in browser console to create a test staff account

import { createStaffAccount } from './supabase.js';

export const createTestStaffAccount = async () => {
  console.log('👨‍⚕️ Creating test staff account...');
  
  const testStaffData = {
    username: 'teststaff',
    email: 'teststaff@bitecare.com',
    password: 'test123456',
    userData: {
      first_name: 'Test',
      last_name: 'Staff',
      role: 'staff',
      sex: 'Male',
      date_of_birth: '1990-01-01',
      contact_number: '+639123456789',
      address: 'Test Address, Bogo City',
      position: 'Nurse',
      date_hired: '2024-01-01'
    }
  };
  
  try {
    console.log('📝 Test staff data:', testStaffData);
    
    const result = await createStaffAccount(
      testStaffData.username,
      testStaffData.email,
      testStaffData.password,
      testStaffData.userData
    );
    
    if (result.error) {
      console.error('❌ Failed to create test staff account:', result.error);
      return { success: false, error: result.error };
    } else {
      console.log('✅ Test staff account created successfully!');
      console.log('📋 Login credentials:');
      console.log(`   Username: ${testStaffData.username}`);
      console.log(`   Email: ${testStaffData.email}`);
      console.log(`   Password: ${testStaffData.password}`);
      return { success: true, credentials: testStaffData };
    }
    
  } catch (error) {
    console.error('❌ Error creating test staff account:', error);
    return { success: false, error: error.message };
  }
};

// Export for use in browser console
if (typeof window !== 'undefined') {
  window.createTestStaffAccount = createTestStaffAccount;
  console.log('🔧 Test staff creation function loaded.');
  console.log('Use createTestStaffAccount() to create a test account.');
}

