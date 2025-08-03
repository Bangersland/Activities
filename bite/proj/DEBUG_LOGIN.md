# Login Debugging Guide

## 🚨 **Common Issues & Solutions**

### **Issue 1: Database Schema Not Set Up**

**Problem:** The `profiles` table doesn't exist, so username lookup fails.

**Solution:** 
1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Run the SQL from `supabase_schema.sql`
4. Check if the `profiles` table exists in **Table Editor**

### **Issue 2: Username Not Found in Profiles Table**

**Problem:** User was created but not added to profiles table.

**Solution:**
1. Check if user exists in `auth.users` table
2. Check if corresponding record exists in `profiles` table
3. If missing, manually insert the profile record

### **Issue 3: Email Confirmation Issues**

**Problem:** User account exists but email is not confirmed.

**Solution:**
1. Check user's `email_confirmed_at` field in `auth.users`
2. If null, update it manually in Supabase dashboard

## 🔧 **Manual Database Checks**

### **Check 1: Verify User Exists**
```sql
-- Check if user exists in auth.users
SELECT id, email, raw_user_meta_data, email_confirmed_at 
FROM auth.users 
WHERE email = 'your_email@example.com';
```

### **Check 2: Verify Profile Exists**
```sql
-- Check if profile exists
SELECT * FROM profiles 
WHERE username = 'your_username' 
OR email = 'your_email@example.com';
```

### **Check 3: Manual Profile Creation**
```sql
-- If profile is missing, create it manually
INSERT INTO profiles (id, username, email, first_name, last_name, role)
VALUES (
  'user_id_from_auth_users',
  'your_username',
  'your_email@example.com',
  'First',
  'Last',
  'admin'
);
```

## 🛠️ **Quick Fix: Simplified Login**

If username login is causing issues, you can temporarily use email-only login:

```javascript
// In UnifiedLogin.jsx, replace the login logic with:
const handleSubmit = async (e) => {
  e.preventDefault();
  setIsLoading(true);
  setError('');

  if (credentials.username && credentials.password) {
    try {
      // Try email login first (treat username as email)
      const { data, error } = await signInAdmin(
        credentials.username, // Treat as email
        credentials.password
      );

      if (error) {
        setError('Invalid email or password');
      } else {
        const userRole = data.user?.user_metadata?.role || 'staff';
        onLogin(userRole);
      }
    } catch (error) {
      setError('Login failed. Please try again.');
    }
  } else {
    setError('Please enter both email and password');
  }
  
  setIsLoading(false);
};
```

## 📋 **Testing Steps**

1. **Create a test admin account:**
   - Use AdminSetup component
   - Use a simple username like "admin"
   - Use a simple email like "admin@test.com"

2. **Check database records:**
   - Verify user exists in `auth.users`
   - Verify profile exists in `profiles`

3. **Test login:**
   - Try username login first
   - Try email login as fallback
   - Check browser console for errors

## 🐛 **Debug Console Logs**

Add these console logs to `supabase.js`:

```javascript
// In signInWithUsername function
console.log('Looking for username:', username);
console.log('Profiles query result:', users, fetchError);
console.log('Email found:', users?.email);
```

## 🔄 **Alternative: Email-Only Login**

If username login continues to fail, you can switch to email-only login:

1. Update `UnifiedLogin.jsx` to use email login only
2. Remove username lookup logic
3. Use email addresses for all logins

## 📞 **Next Steps**

1. Run the SQL schema in Supabase
2. Create a test admin account
3. Check database records
4. Test login with both username and email
5. Check browser console for errors 