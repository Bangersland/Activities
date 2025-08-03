# Supabase Admin Account Setup Guide

## 🚀 **Quick Setup**

### **1. Supabase Project Setup**

1. **Create a Supabase Project:**
   - Go to [supabase.com](https://supabase.com)
   - Sign up/Login and create a new project
   - Note down your **Project URL** and **anon public key**

2. **Configure Supabase Settings:**
   - In your Supabase dashboard, go to **Authentication > Settings**
   - Disable **"Enable email confirmations"** for admin accounts
   - Set **"Secure email change"** to false (optional)

### **2. Update Configuration**

Edit `src/supabase.js` and replace the placeholder values:

```javascript
const supabaseUrl = 'YOUR_SUPABASE_URL'        // Replace with your project URL
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY' // Replace with your anon key
```

### **3. Run the Admin Setup**

1. **Start your development server:**
   ```bash
   npm run dev
   ```

2. **Access the admin setup page:**
   - Navigate to `http://localhost:5173/admin-setup` (you'll need to add this route)
   - Or temporarily replace the login component with AdminSetup

## 🔧 **Manual Database Setup (Alternative)**

If you prefer to create admin accounts directly in Supabase:

### **1. Using Supabase Dashboard:**

1. Go to **Authentication > Users**
2. Click **"Add User"**
3. Enter email and password
4. **Important:** Set `email_confirmed_at` to current timestamp
5. Add custom metadata: `{"role": "admin"}`

### **2. Using SQL (Advanced):**

```sql
-- Create admin user directly
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@bitecare.com',
  crypt('your_password_here', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"],"role":"admin"}',
  '{"first_name":"Admin","last_name":"User"}',
  false,
  '',
  '',
  '',
  ''
);
```

## 🔒 **Security Considerations**

### **⚠️ Important Security Notes:**

1. **Email Verification Disabled:** Admin accounts bypass email verification
2. **Strong Passwords:** Use complex passwords for admin accounts
3. **Secure Environment:** Only use this setup in secure, controlled environments
4. **Access Control:** Limit admin account creation to authorized personnel only

### **🔐 Recommended Security Practices:**

1. **Environment Variables:** Store Supabase credentials in `.env` files
2. **Role-Based Access:** Implement proper role checking in your app
3. **Audit Logging:** Log admin account creation and access
4. **Regular Review:** Periodically review admin accounts

## 📝 **Environment Variables Setup**

Create a `.env` file in your project root:

```env
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

Then update `src/supabase.js`:

```javascript
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
```

## 🎯 **Usage Examples**

### **Creating Admin Account via Component:**

```jsx
import AdminSetup from './AdminSetup';

// In your App.jsx or router
<AdminSetup />
```

### **Creating Admin Account Programmatically:**

```javascript
import { createAdminAccount } from './supabase';

const createAdmin = async () => {
  const { data, error } = await createAdminAccount(
    'admin@bitecare.com',
    'secure_password_123',
    {
      first_name: 'Admin',
      last_name: 'User',
      role: 'admin'
    }
  );
  
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Admin created:', data);
  }
};
```

## 🚨 **Troubleshooting**

### **Common Issues:**

1. **"Email not confirmed" error:**
   - Check that `email_confirmed_at` is set in user metadata
   - Verify email confirmation is disabled in Supabase settings

2. **"Invalid credentials" error:**
   - Ensure Supabase URL and key are correct
   - Check network connectivity

3. **"User already exists" error:**
   - Delete existing user from Supabase dashboard
   - Or use a different email address

### **Debug Steps:**

1. Check browser console for errors
2. Verify Supabase credentials
3. Test connection with simple query
4. Check Supabase logs in dashboard

## 📞 **Support**

If you encounter issues:
1. Check Supabase documentation
2. Review browser console errors
3. Verify all configuration steps
4. Test with a simple user creation first

---

**⚠️ Remember:** This setup bypasses email verification for admin accounts. Use only in secure, controlled environments! 