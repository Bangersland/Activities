// Debug Login Script - Run this in browser console to diagnose login issues
import { supabase } from './supabase.js';

export const debugLogin = async () => {
  console.log('🔍 Starting Login Debug...');
  
  try {
    // 1. Test Supabase connection
    console.log('1. Testing Supabase connection...');
    const { error: testError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.error('❌ Database connection failed:', testError);
      return { success: false, error: 'Database connection failed' };
    }
    
    console.log('✅ Database connection successful');
    
    // 2. Check if profiles table exists and has data
    console.log('2. Checking profiles table...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(5);
    
    if (profilesError) {
      console.error('❌ Profiles table error:', profilesError);
      return { success: false, error: 'Profiles table not accessible' };
    }
    
    console.log('✅ Profiles table accessible');
    console.log('📊 Found profiles:', profiles?.length || 0);
    
    if (profiles && profiles.length > 0) {
      console.log('👥 Sample profiles:', profiles);
    }
    
    // 3. Check if staff_details table exists
    console.log('3. Checking staff_details table...');
    const { data: staffDetails, error: staffError } = await supabase
      .from('staff_details')
      .select('*')
      .limit(5);
    
    if (staffError) {
      console.error('❌ Staff details table error:', staffError);
      return { success: false, error: 'Staff details table not accessible' };
    }
    
    console.log('✅ Staff details table accessible');
    console.log('👨‍⚕️ Found staff records:', staffDetails?.length || 0);
    
    // 4. Check for any existing users
    console.log('4. Checking for existing users...');
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.log('⚠️ Cannot list users (admin access required)');
      console.log('This is normal for non-admin users');
    } else {
      console.log('✅ Found users:', users?.length || 0);
      if (users && users.length > 0) {
        console.log('👤 Sample users:', users.slice(0, 3));
      }
    }
    
    return { 
      success: true, 
      profilesCount: profiles?.length || 0,
      staffCount: staffDetails?.length || 0
    };
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
    return { success: false, error: error.message };
  }
};

// Test specific username/email
export const testLoginCredentials = async (username) => {
  console.log(`🔐 Testing login for: ${username}`);
  
  try {
    // Check if username exists in profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username)
      .single();
    
    if (profileError) {
      console.log('❌ Username not found in profiles:', profileError.message);
      
      // Try to find by email
      const { data: emailProfile, error: emailError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', username)
        .single();
      
      if (emailError) {
        console.log('❌ Email not found in profiles:', emailError.message);
        return { success: false, error: 'Username/email not found' };
      } else {
        console.log('✅ Found by email:', emailProfile);
        return { success: true, foundBy: 'email', profile: emailProfile };
      }
    } else {
      console.log('✅ Found by username:', profile);
      return { success: true, foundBy: 'username', profile: profile };
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return { success: false, error: error.message };
  }
};

// Export for use in browser console
if (typeof window !== 'undefined') {
  window.debugLogin = debugLogin;
  window.testLoginCredentials = testLoginCredentials;
  console.log('🔧 Debug functions loaded. Use:');
  console.log('- debugLogin() to check database status');
  console.log('- testLoginCredentials("username", "password") to test specific credentials');
}

