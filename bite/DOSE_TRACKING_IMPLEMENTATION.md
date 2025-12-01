# Dose Tracking Implementation Guide

## Overview
This implementation tracks vaccination doses using the `treatment_records` table, where scheduled dates (d0_date, d3_date, d7_date, d14_date, d28_30_date) are stored. Each dose can be marked as **completed** or **missed**, and the system records who updated each status.

## Database Schema

### Migration Files
1. **migration_add_dose_status_tracking.sql** - Adds status tracking columns for each dose
2. **migration_add_injection_records.sql** - Adds JSONB field for detailed injection records

### New Columns Added to `treatment_records`:

For each dose (d0, d3, d7, d14, d28_30), the following columns are added:

- `{dose}_status` - VARCHAR(20) - Status: 'pending', 'completed', or 'missed'
- `{dose}_updated_by` - UUID - References auth.users(id) - Who updated the status
- `{dose}_updated_at` - TIMESTAMP - When the status was updated

Example:
- `d0_status`, `d0_updated_by`, `d0_updated_at`
- `d3_status`, `d3_updated_by`, `d3_updated_at`
- `d7_status`, `d7_updated_by`, `d7_updated_at`
- `d14_status`, `d14_updated_by`, `d14_updated_at`
- `d28_30_status`, `d28_30_updated_by`, `d28_30_updated_at`

### Additional Field:
- `injection_records` - JSONB - Stores detailed injection records with staff information

## How It Works

### 1. Scheduled Dates
The system uses the scheduled dates from `treatment_records`:
- **Dose 1**: `d0_date`
- **Dose 2**: `d3_date`
- **Dose 3**: `d7_date`
- **Dose 4**: `d14_date`
- **Dose 5**: `d28_30_date` (Booster)

### 2. Status Tracking
Each dose has three possible statuses:
- **pending**: Scheduled but not yet completed or missed
- **completed**: Successfully administered
- **missed**: Patient did not show up or appointment was missed

### 3. Automatic Missed Detection
The system automatically detects missed appointments:
- If a scheduled date (`d0_date`, `d3_date`, etc.) is in the past
- And the status is still `pending`
- The system marks it as `missed` in the UI (though the database status remains `pending` until manually updated)

### 4. Staff Tracking
When a dose is marked as completed or missed:
- `{dose}_updated_by` stores the staff member's user ID
- `{dose}_updated_at` stores the timestamp
- `injection_records` JSONB field stores detailed information including:
  - Staff name
  - Staff user ID
  - Timestamp
  - Dose number
  - Status

## API Functions

### `getPatientsByDose(doseNumber, includeCompleted = false)`
Fetches patients scheduled for a specific dose.

**Parameters:**
- `doseNumber`: 1-5 (corresponds to d0, d3, d7, d14, d28_30)
- `includeCompleted`: Boolean - whether to include completed doses

**Returns:**
- Array of patient objects with dose information and status

### `updateDoseStatus(treatmentRecordId, doseNumber, status, updatedByUserId, updatedByName)`
Updates the status of a dose and records who updated it.

**Parameters:**
- `treatmentRecordId`: ID of the treatment record
- `doseNumber`: 1-5
- `status`: 'completed' or 'missed'
- `updatedByUserId`: UUID of the staff member
- `updatedByName`: Name of the staff member

**Returns:**
- Updated treatment record

### `getDoseCountByStatus(doseNumber, status)`
Gets the count of doses with a specific status.

**Parameters:**
- `doseNumber`: 1-5
- `status`: 'pending', 'completed', or 'missed'

**Returns:**
- Count number

## Usage in UI

### StaffPatientListTracker Component

1. **View Patients by Dose**: Click on any dose card to see patients scheduled for that dose
2. **Mark as Completed**: Click "Mark Completed" button to record successful vaccination
3. **Mark as Missed**: Click "Mark Missed" button if patient didn't show up
4. **View Status**: Each patient card shows:
   - Current status badge (Pending/Completed/Missed)
   - Scheduled date and time
   - Who updated it (if updated)
   - When it was updated

### Statistics Display
The dashboard shows:
- **Pending Count**: Patients awaiting vaccination
- **Completed Count**: Successfully vaccinated
- **Missed Count**: Missed appointments

## Database Setup

### Step 1: Run Migrations
Execute these SQL files in your Supabase SQL Editor:

1. `migration_add_injection_records.sql`
2. `migration_add_dose_status_tracking.sql`

### Step 2: Verify
Check that all columns were added:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'treatment_records' 
AND (column_name LIKE '%_status' OR column_name LIKE '%_updated_by' OR column_name LIKE '%_updated_at')
ORDER BY column_name;
```

## Data Flow

1. **Scheduling**: When a treatment record is created, dose dates are set (d0_date, d3_date, etc.)
2. **Status Initialization**: All doses start with `pending` status (default)
3. **Vaccination Day**: Staff views patients scheduled for that day
4. **Update Status**: Staff marks dose as completed or missed
5. **Tracking**: System records:
   - Who updated it (staff user ID)
   - When it was updated (timestamp)
   - Status (completed/missed)

## Example Data Structure

### Treatment Record with Status Tracking:
```json
{
  "id": 123,
  "patient_name": "John Doe",
  "d0_date": "2024-01-15",
  "d0_status": "completed",
  "d0_updated_by": "uuid-of-staff-member",
  "d0_updated_at": "2024-01-15T10:30:00Z",
  "d3_date": "2024-01-18",
  "d3_status": "pending",
  "d3_updated_by": null,
  "d3_updated_at": null,
  "injection_records": [
    {
      "dose_number": 1,
      "injected_by_user_id": "uuid-of-staff-member",
      "injected_by_name": "Dr. Jane Smith",
      "injected_at": "2024-01-15T10:30:00Z",
      "date_field": "d0_date",
      "status": "completed"
    }
  ]
}
```

## Benefits

1. **Complete Audit Trail**: Every status change is tracked with who and when
2. **Flexible Status Management**: Can mark as completed or missed
3. **Automatic Detection**: System identifies missed appointments
4. **Staff Accountability**: Records which staff member performed each action
5. **Historical Data**: All updates are stored for reporting and analysis

