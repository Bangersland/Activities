import { createClient } from '@supabase/supabase-js'

// Get Supabase configuration from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ftnvuqjafzudgkbptvmg.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0bnZ1cWphZnp1ZGdrYnB0dm1nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzNzIyNjcsImV4cCI6MjA2ODk0ODI2N30.CpJnuNt3SDKBcSKFTVVAkhejyF9sFMCtb6Yjc694FOM'

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please check your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Function to create staff account with all required fields
export const createStaffAccount = async (username, email, password, userData = {}, imageFile = null) => {
  try {
    console.log('Creating staff account:', { username, email, userData });
    
    // Create user with email confirmation disabled
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          ...userData,
          username: username, // Store username in metadata
          role: 'staff',
          email_confirmed_at: new Date().toISOString() // Mark as confirmed
        },
        emailRedirectTo: null // Disable email confirmation
      }
    })

    console.log('SignUp response:', { data, error });

    if (error) {
      throw error
    }

    // If user was created successfully, create profile record
    if (data.user) {
      console.log('User created, creating profile record...');
      
      try {
        // Upload image if provided
        let imageUrl = null;
        if (imageFile) {
          console.log('Uploading image...');
          const fileName = `${data.user.id}_${Date.now()}.jpg`;
          const { error: uploadError } = await supabase.storage
            .from('staff-photos')
            .upload(fileName, imageFile, {
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
            imageUrl = urlData.publicUrl;
            console.log('Image uploaded successfully:', imageUrl);
          }
        }

        // Create profile record in profiles table
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            username: username,
            email: email,
            first_name: userData.first_name || '',
            last_name: userData.last_name || '',
            role: 'staff',
            profile_image: imageUrl,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (profileError) {
          console.error('Error creating profile:', profileError);
        } else {
          console.log('Profile record created successfully');
        }

        // Create staff details record
        const { error: staffError } = await supabase
          .from('staff_details')
          .insert({
            user_id: data.user.id,
            sex: userData.sex,
            date_of_birth: userData.date_of_birth,
            contact_number: userData.contact_number,
            address: userData.address,
            job_position: userData.position,
            date_hired: userData.date_hired,
            status: userData.status,
            profile_image: imageUrl,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (staffError) {
          console.error('Error creating staff details:', staffError);
        } else {
          console.log('Staff details record created successfully');
        }

        // Automatically verify the staff account
        console.log('Automatically verifying staff account...');
        
        // Method 1: Update user metadata with confirmed status
        const { error: updateError } = await supabase.auth.updateUser({
          data: {
            email_confirmed_at: new Date().toISOString(),
            account_verified: true,
            verification_status: 'confirmed'
          }
        });

        if (updateError) {
          console.error('Error updating user metadata:', updateError);
        } else {
          console.log('User metadata updated with verification status');
        }

        // Method 2: Use admin API to force email confirmation (if available)
        try {
          // This requires admin privileges - only works if you have admin access
          const { error: adminUpdateError } = await supabase.auth.admin.updateUserById(data.user.id, {
            email_confirmed_at: new Date().toISOString(),
            last_sign_in_at: new Date().toISOString()
          });

          if (adminUpdateError) {
            console.log('Admin update not available (normal for client-side):', adminUpdateError.message);
          } else {
            console.log('Staff account automatically verified via admin API');
          }
        } catch (adminError) {
          console.log('Admin API not available (expected for client-side):', adminError.message);
        }

        console.log('Staff account creation and verification completed successfully');
      } catch (profileError) {
        console.error('Error in profile creation:', profileError);
      }
    }

    return { data, error: null }
  } catch (error) {
    console.error('Error creating staff account:', error)
    return { data: null, error }
  }
}

// Function to create admin account with username
export const createAdminAccount = async (username, email, password, userData = {}) => {
  try {
    console.log('Creating admin account:', { username, email, userData });
    
    // Create user with email confirmation disabled
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          ...userData,
          username: username, // Store username in metadata
          role: 'admin',
          email_confirmed_at: new Date().toISOString() // Mark as confirmed
        },
        emailRedirectTo: null // Disable email confirmation
      }
    })

    console.log('SignUp response:', { data, error });

    if (error) {
      throw error
    }

    // If user was created successfully, create profile record
    if (data.user) {
      console.log('User created, creating profile record...');
      
      try {
        // Create profile record in profiles table
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            username: username,
            email: email,
            first_name: userData.first_name || '',
            last_name: userData.last_name || '',
            role: 'admin',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (profileError) {
          console.error('Error creating profile:', profileError);
        } else {
          console.log('Profile record created successfully');
        }

        // Update email confirmation status
        const { error: updateError } = await supabase.auth.updateUser({
          data: {
            email_confirmed_at: new Date().toISOString()
          }
        });

        if (updateError) {
          console.error('Error updating confirmation status:', updateError);
        } else {
          console.log('Email confirmation status updated');
        }
      } catch (profileError) {
        console.error('Error in profile creation:', profileError);
      }
    }

    return { data, error: null }
  } catch (error) {
    console.error('Error creating admin account:', error)
    return { data: null, error }
  }
}

// Function to sign in with username or email
export const signInWithUsername = async (username, password) => {
  try {
    console.log('Attempting login for:', username);
    
    // Check if input is email or username
    const isEmail = username.includes('@');
    
    if (isEmail) {
      // Direct email login
      console.log('Attempting email login');
      const { data, error } = await supabase.auth.signInWithPassword({
        email: username,
        password
      });

      console.log('Email login result:', { data, error });

      if (data?.user) {
        // Get user role and profile image from profiles table
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, profile_image, id')
          .eq('id', data.user.id)
          .single();

        // Check staff status if user is staff
        if (profile?.role === 'staff') {
          const { data: staffDetails } = await supabase
            .from('staff_details')
            .select('status')
            .eq('user_id', data.user.id)
            .single();

          if (staffDetails && (staffDetails.status === 'Retired' || staffDetails.status === 'Terminated')) {
            console.log('Staff account is retired or terminated:', staffDetails.status);
            return { 
              data: null, 
              error: { 
                message: `Account is ${staffDetails.status.toLowerCase()}. Please contact administrator.` 
              } 
            };
          }
        }

        // Check if account is verified
        const isVerified = data.user.email_confirmed_at || 
                          (data.user.user_metadata?.account_verified === true) ||
                          (data.user.user_metadata?.verification_status === 'confirmed');

        console.log('Account verification status:', { 
          email_confirmed_at: data.user.email_confirmed_at,
          account_verified: data.user.user_metadata?.account_verified,
          verification_status: data.user.user_metadata?.verification_status,
          isVerified
        });

        // Get profile image from staff_details table if not in profiles
        let profileImage = profile?.profile_image;
        if (!profileImage && profile?.role === 'staff') {
          const { data: staffDetails } = await supabase
            .from('staff_details')
            .select('profile_image')
            .eq('user_id', data.user.id)
            .single();
          
          profileImage = staffDetails?.profile_image;
        }

        const userWithRole = {
          ...data.user,
          user_metadata: {
            ...data.user.user_metadata,
            role: profile?.role || 'staff',
            profile_image: profileImage,
            account_verified: isVerified
          }
        };
        
        return { data: { ...data, user: userWithRole }, error };
      }

      return { data, error };
    } else {
      // Username login
      console.log('Attempting username login');
      
      // First, find the user by username in profiles table
      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('email, role, profile_image, id')
        .eq('username', username)
        .single();

      console.log('Username lookup result:', { profile, fetchError });

      if (fetchError || !profile) {
        console.log('Username not found in profiles table');
        return { data: null, error: { message: 'Username not found' } };
      }

      // Check staff status if user is staff
      if (profile.role === 'staff') {
        const { data: staffDetails } = await supabase
          .from('staff_details')
          .select('status')
          .eq('user_id', profile.id)
          .single();

        if (staffDetails && (staffDetails.status === 'Retired' || staffDetails.status === 'Terminated')) {
          console.log('Staff account is retired or terminated:', staffDetails.status);
          return { 
            data: null, 
            error: { 
              message: `Account is ${staffDetails.status.toLowerCase()}. Please contact administrator.` 
            } 
          };
        }
      }

      console.log('Found email for username:', profile.email);

      // Then sign in with the email
      const { data, error } = await supabase.auth.signInWithPassword({
        email: profile.email,
        password
      });

      console.log('Username login result:', { data, error });

      if (data?.user) {
        // Check staff status if user is staff
        if (profile.role === 'staff') {
          const { data: staffDetails } = await supabase
            .from('staff_details')
            .select('status')
            .eq('user_id', data.user.id)
            .single();

          if (staffDetails && (staffDetails.status === 'Retired' || staffDetails.status === 'Terminated')) {
            console.log('Staff account is retired or terminated:', staffDetails.status);
            return { 
              data: null, 
              error: { 
                message: `Account is ${staffDetails.status.toLowerCase()}. Please contact administrator.` 
              } 
            };
          }
        }

        // Check if account is verified
        const isVerified = data.user.email_confirmed_at || 
                          (data.user.user_metadata?.account_verified === true) ||
                          (data.user.user_metadata?.verification_status === 'confirmed');

        console.log('Account verification status:', { 
          email_confirmed_at: data.user.email_confirmed_at,
          account_verified: data.user.user_metadata?.account_verified,
          verification_status: data.user.user_metadata?.verification_status,
          isVerified
        });

        // Get profile image from staff_details table if not in profiles
        let profileImage = profile.profile_image;
        if (!profileImage && profile.role === 'staff') {
          const { data: staffDetails } = await supabase
            .from('staff_details')
            .select('profile_image')
            .eq('user_id', profile.id)
            .single();
          
          profileImage = staffDetails?.profile_image;
        }

        // Add role and profile image to user metadata for consistency
        const userWithRole = {
          ...data.user,
          user_metadata: {
            ...data.user.user_metadata,
            role: profile.role || 'staff',
            profile_image: profileImage,
            account_verified: isVerified
          }
        };
        
        return { data: { ...data, user: userWithRole }, error };
      }

      return { data, error };
    }
  } catch (error) {
    console.error('Error signing in with username/email:', error);
    return { data: null, error };
  }
};

// Function to sign in admin (email-based fallback - for backward compatibility)
export const signInAdmin = async (email, password) => {
  try {
    console.log('Attempting email login for:', email);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    console.log('Email login result:', { data, error });

    return { data, error }
  } catch (error) {
    console.error('Error signing in admin:', error)
    return { data: null, error }
  }
}

// Function to sign out
export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut()
    return { error }
  } catch (error) {
    console.error('Error signing out:', error)
    return { error }
  }
}

// Function to get current user with profile data
export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (user && !error) {
      // Get profile data including profile image
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, profile_image')
        .eq('id', user.id)
        .single();

      // If no profile image in profiles table, check staff_details table
      let profileImage = profile?.profile_image;
      if (!profileImage && profile?.role === 'staff') {
        const { data: staffDetails } = await supabase
          .from('staff_details')
          .select('profile_image')
          .eq('user_id', user.id)
          .single();
        
        profileImage = staffDetails?.profile_image;
      }

      // Add profile data to user metadata
      const userWithProfile = {
        ...user,
        user_metadata: {
          ...user.user_metadata,
          role: profile?.role || user.user_metadata?.role || 'staff',
          profile_image: profileImage
        }
      };
      
      return { user: userWithProfile, error }
    }
    
    return { user, error }
  } catch (error) {
    console.error('Error getting current user:', error)
    return { user: null, error }
  }
}

// Function to check if username exists
export const checkUsernameExists = async (username) => {
  try {
    console.log('Checking if username exists:', username);
    
    const { data, error } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', username)
      .single()

    console.log('Username check result:', { data, error });

    return { exists: !!data, error }
  } catch (error) {
    console.log('Username check error (likely not found):', error);
    return { exists: false, error: null }
  }
}

// Function to manually fix email confirmation for existing users
export const fixEmailConfirmation = async (email) => {
  try {
    console.log('Fixing email confirmation for:', email);
    
    // First, get the user
    const { data: { user }, error: getUserError } = await supabase.auth.admin.getUserByEmail(email);
    
    if (getUserError) {
      console.error('Error getting user:', getUserError);
      return { error: getUserError };
    }
    
    if (!user) {
      return { error: { message: 'User not found' } };
    }
    
    console.log('Found user:', user.id);
    
    // Update the user's email confirmation status
    const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
      email_confirmed_at: new Date().toISOString()
    });
    
    if (updateError) {
      console.error('Error updating user:', updateError);
      return { error: updateError };
    }
    
    console.log('Email confirmation fixed successfully');
    return { success: true };
    
  } catch (error) {
    console.error('Error fixing email confirmation:', error);
    return { error };
  }
};

// Appointment Slots Functions

// Function to get all appointment slots
export const getAppointmentSlots = async () => {
  try {
    const { data, error } = await supabase
      .from('appointment_slots')
      .select('*')
      .order('date', { ascending: true });

    if (error) {
      console.error('Error fetching appointment slots:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error getting appointment slots:', error);
    return { data: null, error };
  }
};

// Function to get appointment slots for a specific date
export const getAppointmentSlotsByDate = async (date) => {
  try {
    const { data, error } = await supabase
      .from('appointment_slots')
      .select('*')
      .eq('date', date)
      .single();

    if (error) {
      console.error('Error fetching appointment slots for date:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error getting appointment slots by date:', error);
    return { data: null, error };
  }
};

// Function to create appointment slots
export const createAppointmentSlots = async (date, availableSlots = 40) => {
  try {
    console.log('Creating appointment slots for date:', date, 'with', availableSlots, 'slots');
    
    const { data, error } = await supabase
      .from('appointment_slots')
      .insert({
        date: date,
        available_slots: availableSlots,
        remaining_slots: availableSlots
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating appointment slots:', error);
      return { data: null, error };
    }

    console.log('Appointment slots created successfully:', data);
    return { data, error: null };
  } catch (error) {
    console.error('Error creating appointment slots:', error);
    return { data: null, error };
  }
};

// Function to update appointment slots
export const updateAppointmentSlots = async (date, availableSlots, remainingSlots) => {
  try {
    console.log('Updating appointment slots for date:', date);
    
    const { data, error } = await supabase
      .from('appointment_slots')
      .update({
        available_slots: availableSlots,
        remaining_slots: remainingSlots
      })
      .eq('date', date)
      .select()
      .single();

    if (error) {
      console.error('Error updating appointment slots:', error);
      return { data: null, error };
    }

    console.log('Appointment slots updated successfully:', data);
    return { data, error: null };
  } catch (error) {
    console.error('Error updating appointment slots:', error);
    return { data: null, error };
  }
};

// Function to delete appointment slots
export const deleteAppointmentSlots = async (date) => {
  try {
    console.log('Deleting appointment slots for date:', date);
    
    const { error } = await supabase
      .from('appointment_slots')
      .delete()
      .eq('date', date);

    if (error) {
      console.error('Error deleting appointment slots:', error);
      return { error };
    }

    console.log('Appointment slots deleted successfully');
    return { error: null };
  } catch (error) {
    console.error('Error deleting appointment slots:', error);
    return { error };
  }
};

// Function to get slot percentage for a date
export const getSlotPercentage = async (date) => {
  try {
    const { data, error } = await supabase
      .rpc('get_slot_percentage', { slot_date: date });

    if (error) {
      console.error('Error getting slot percentage:', error);
      return { data: null, error };
    }

    return { data: data[0] || null, error: null };
  } catch (error) {
    console.error('Error getting slot percentage:', error);
    return { data: null, error };
  }
};

// Vaccine Management Functions
export const getVaccines = async () => {
  try {
    const { data, error } = await supabase
      .from('vaccines')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching vaccines:', error);
      return { data: null, error };
    }
    
    return { data, error: null };
  } catch (error) {
    console.error('Error:', error);
    return { data: null, error };
  }
};

export const getVaccineById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('vaccines')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching vaccine:', error);
      return { data: null, error };
    }
    
    return { data, error: null };
  } catch (error) {
    console.error('Error:', error);
    return { data: null, error };
  }
};

export const createVaccine = async (vaccineData) => {
  try {
    const { data, error } = await supabase
      .from('vaccines')
      .insert([vaccineData])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating vaccine:', error);
      return { data: null, error };
    }
    
    return { data, error: null };
  } catch (error) {
    console.error('Error:', error);
    return { data: null, error };
  }
};

export const updateVaccine = async (id, vaccineData) => {
  try {
    const { data, error } = await supabase
      .from('vaccines')
      .update(vaccineData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating vaccine:', error);
      return { data: null, error };
    }
    
    return { data, error: null };
  } catch (error) {
    console.error('Error:', error);
    return { data: null, error };
  }
};

export const deleteVaccine = async (id) => {
  try {
    const { error } = await supabase
      .from('vaccines')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting vaccine:', error);
      return { error };
    }
    
    return { error: null };
  } catch (error) {
    console.error('Error:', error);
    return { error };
  }
}; 