# Group Chat and Prescription Sharing Setup Guide

## Overview
This feature allows staff to create groups, add patients, send prescriptions, and chat with patients. Patients can view their groups and participate in chats.

## Database Setup

1. **Run the SQL script** in your Supabase SQL Editor:
   - Open `proj/group_chat_setup.sql`
   - Copy and paste the entire content into Supabase SQL Editor
   - Click "Run" to create all necessary tables and policies

## Features Implemented

### For Staff:
1. **Group Management**
   - Create new groups with name and description
   - Add multiple patients to groups
   - Search and select patients from appointments
   - Delete groups
   - View all groups

2. **Group Chat**
   - Real-time messaging
   - Send text messages
   - Send prescriptions with patient details
   - View message history
   - See group members

3. **Prescription Sharing**
   - Create prescriptions with patient name, contact, and details
   - Share prescriptions in group chats
   - Prescriptions are stored and linked to messages

### For Patients:
- Patients can view groups they're added to (via their contact number)
- Patients can view and participate in group chats
- Patients can see prescriptions sent to them
- **Note**: Patient access requires either:
  - A user account (if patient has registered/login)
  - A contact-based access system (to be implemented if needed)

## How to Use

### Creating a Group:
1. Click "Group Chat" button in Staff Appointment List
2. Click "Create New Group"
3. Enter group name and optional description
4. Search and select patients to add
5. Click "Create Group"

### Sending Messages:
1. Click on a group to open the chat
2. Type a message and click send
3. Messages appear in real-time

### Sending Prescriptions:
1. In the group chat, click the prescription icon (green button)
2. Fill in patient name, contact, and prescription details
3. Click "Send Prescription"
4. The prescription will appear as a special message in the chat

## Database Tables Created

1. **groups** - Stores group information
2. **group_members** - Links users/patients to groups
3. **messages** - Stores chat messages
4. **prescriptions** - Stores prescription details

## Security

- Row Level Security (RLS) is enabled on all tables
- Staff can create groups and add members
- Users can only view groups they belong to
- Messages are only visible to group members
- Prescriptions are linked to specific patients

## Notes

- Patients without user accounts are identified by their contact number
- Real-time updates use Supabase subscriptions
- Prescriptions are stored both as messages and in the prescriptions table for easy retrieval

