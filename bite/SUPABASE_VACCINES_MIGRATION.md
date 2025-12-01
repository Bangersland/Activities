# Supabase Vaccines Table Migration Guide

## Adding `people_per_vaccine` Column to Existing Vaccines Table

This guide will help you add the new `people_per_vaccine` column to your existing vaccines table in Supabase.

---

## 🚀 **Method 1: Using Supabase SQL Editor (Recommended)**

### Step 1: Open Supabase Dashboard
1. Go to [supabase.com](https://supabase.com) and log in
2. Select your project
3. Navigate to **SQL Editor** in the left sidebar

### Step 2: Run the Migration Script
Copy and paste the following SQL script into the SQL Editor:

```sql
-- Add the people_per_vaccine column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'vaccines' 
        AND column_name = 'people_per_vaccine'
    ) THEN
        ALTER TABLE public.vaccines 
        ADD COLUMN people_per_vaccine INTEGER NOT NULL DEFAULT 1;
        
        RAISE NOTICE 'Column people_per_vaccine added successfully';
    ELSE
        RAISE NOTICE 'Column people_per_vaccine already exists';
    END IF;
END $$;
```

### Step 3: Execute the Script
1. Click the **Run** button (or press `Ctrl+Enter` / `Cmd+Enter`)
2. You should see a success message in the results panel

### Step 4: Verify the Column
Run this query to verify the column was added:

```sql
SELECT 
    column_name, 
    data_type, 
    column_default, 
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'vaccines' 
AND column_name = 'people_per_vaccine';
```

You should see:
- `column_name`: `people_per_vaccine`
- `data_type`: `integer`
- `column_default`: `1`
- `is_nullable`: `NO`

---

## 🔧 **Method 2: Using Supabase Table Editor**

### Step 1: Open Table Editor
1. In your Supabase dashboard, go to **Table Editor**
2. Select the **vaccines** table

### Step 2: Add New Column
1. Click on **Add Column** button
2. Fill in the column details:
   - **Name**: `people_per_vaccine`
   - **Type**: `int4` (Integer)
   - **Default Value**: `1`
   - **Is Nullable**: ❌ (Unchecked - NOT NULL)
3. Click **Save**

---

## ✅ **Verification Steps**

After adding the column, verify it works:

### 1. Check Existing Records
```sql
SELECT id, vaccine_brand, stock_quantity, people_per_vaccine 
FROM public.vaccines 
LIMIT 5;
```

All existing records should show `people_per_vaccine = 1` (the default value).

### 2. Test Insert
```sql
INSERT INTO public.vaccines (vaccine_brand, stock_quantity, expiry_date, people_per_vaccine)
VALUES ('Test Vaccine', 100, '2025-12-31', 2)
RETURNING *;
```

### 3. Test Update
```sql
UPDATE public.vaccines 
SET people_per_vaccine = 3 
WHERE vaccine_brand = 'Test Vaccine'
RETURNING *;
```

---

## 📋 **Complete Updated Table Schema**

If you want to see the complete table structure:

```sql
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'vaccines'
ORDER BY ordinal_position;
```

Expected columns:
- `id` (uuid)
- `vaccine_brand` (varchar)
- `stock_quantity` (integer)
- `expiry_date` (date)
- `people_per_vaccine` (integer) ← **NEW COLUMN**
- `status` (varchar)
- `created_at` (timestamp)
- `updated_at` (timestamp)

---

## 🎯 **After Migration**

Once the column is added:

1. **Your React app will automatically work** - The `VaccineManagement` component already includes the field in the form
2. **Existing records** will have `people_per_vaccine = 1` by default
3. **New records** can specify any number of people per vaccine
4. **The field is required** in the UI, so users must enter a value (minimum 1)

---

## 🚨 **Troubleshooting**

### Error: "Column already exists"
- This is fine! The column was already added. You can skip the migration.

### Error: "Permission denied"
- Make sure you're logged in as a project owner or have database admin permissions
- Check your Row Level Security (RLS) policies

### Error: "Relation does not exist"
- Make sure the `vaccines` table exists
- Check that you're using the correct schema (`public`)

### Existing records show NULL
- Run this update query:
```sql
UPDATE public.vaccines 
SET people_per_vaccine = 1 
WHERE people_per_vaccine IS NULL;
```

---

## 📝 **Notes**

- The migration is **safe to run multiple times** - it checks if the column exists first
- **No data loss** - existing records will automatically get the default value of 1
- The column is **NOT NULL** with a default, so it's safe for existing data
- All existing vaccines will default to 1 person per vaccine, which you can update later if needed

---

## 🔄 **Rollback (If Needed)**

If you need to remove the column (not recommended):

```sql
ALTER TABLE public.vaccines 
DROP COLUMN IF EXISTS people_per_vaccine;
```

**⚠️ Warning:** This will permanently delete the column and all its data!

---

## ✅ **Success Checklist**

- [ ] Column `people_per_vaccine` added to vaccines table
- [ ] Column has type `INTEGER`
- [ ] Column has default value `1`
- [ ] Column is `NOT NULL`
- [ ] Existing records show `people_per_vaccine = 1`
- [ ] Can insert new records with custom `people_per_vaccine` value
- [ ] React app form includes the new field
- [ ] No errors in browser console when using Vaccine Management

---

**Need Help?** Check the Supabase documentation or review the migration script in `migration_add_people_per_vaccine.sql`

