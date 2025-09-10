# BiteCare - Healthcare Management System

A comprehensive healthcare management system built with React and Supabase, designed to streamline patient care, appointment scheduling, and staff management for healthcare facilities.

## 🏥 Overview

BiteCare is a modern web application that provides healthcare professionals with tools to manage patients, appointments, staff, and medical records efficiently. The system features role-based access control with separate interfaces for administrators and staff members.

## ✨ Features

### 🔐 Authentication & Authorization
- **Unified Login System**: Single login interface for both admin and staff users
- **Role-Based Access Control**: Different dashboards and permissions for admin vs staff
- **Secure Authentication**: Powered by Supabase Auth with email/password authentication

### 👨‍⚕️ Admin Dashboard
- **Staff Management**: Add, edit, and manage staff accounts
- **Appointment Scheduling**: Create and manage appointment slots
- **Analytics & Reports**: View system analytics and generate reports
- **Vaccine Management**: Track and manage vaccine inventory and administration

### 👩‍⚕️ Staff Dashboard
- **Patient List Tracker**: View assigned patients and their status
- **Appointment Management**: View and manage appointments
- **Patient History**: Access patient medical history and records
- **Dashboard Overview**: Quick access to daily tasks and metrics

### 🗺️ Additional Features
- **Interactive Maps**: Location-based services using Google Maps and Leaflet
- **Data Export**: Export patient data and reports to Excel format
- **Responsive Design**: Mobile-friendly interface for all devices
- **Real-time Updates**: Live data synchronization across all users

## 🛠️ Technology Stack

### Frontend
- **React 19.1.0**: Modern React with hooks and functional components
- **Vite**: Fast build tool and development server
- **React Icons**: Comprehensive icon library
- **CSS3**: Custom styling with responsive design

### Backend & Database
- **Supabase**: Backend-as-a-Service providing:
  - PostgreSQL database
  - Real-time subscriptions
  - Authentication system
  - Row Level Security (RLS)

### Maps & Visualization
- **Google Maps API**: Interactive maps for location services
- **Leaflet**: Open-source mapping library
- **React Leaflet**: React components for Leaflet maps

### Data Processing
- **XLSX**: Excel file generation and processing

## 📁 Project Structure

The BiteCare application is organized into logical modules for maintainability and scalability:

### Core Application (`proj/`)
- **Frontend Application**: React-based user interface
- **Database Configuration**: Supabase setup and schema files
- **Documentation**: Setup guides and debugging resources

### Key Directories

| Directory | Purpose | Key Files |
|-----------|---------|-----------|
| `src/components/` | Reusable UI components | Dashboard, PatientList, Schedule, Maps |
| `src/staff/` | Staff-specific interfaces | Patient tracking, appointment management |
| `src/assets/` | Static resources | Images, logos, icons |
| Root SQL files | Database setup scripts | Schema, migrations, fixes |

### Architecture Overview

- **Modular Design**: Components are organized by functionality
- **Role-Based Structure**: Separate interfaces for admin and staff users
- **Database-First**: SQL scripts handle all database operations
- **Configuration Management**: Environment-based setup for different deployments

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd bite
   ```

2. **Install dependencies**
   ```bash
   cd proj
   npm install
   ```

3. **Set up Supabase**
   - Create a new Supabase project at [supabase.com](https://supabase.com)
   - Copy your project URL and anon key
   - Follow the detailed setup guide in `proj/SUPABASE_SETUP.md`

4. **Configure environment variables**
   ```bash
   cp env.example .env
   ```
   Update `.env` with your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_url_here
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   ```

5. **Set up the database**
   - Run the SQL scripts in the root directory to set up your database schema
   - Start with `proj/supabase_schema.sql` for the main schema
   - Run additional setup scripts as needed

6. **Start the development server**
   ```bash
   npm run dev
   ```

7. **Access the application**
   - Open your browser to `http://localhost:5173`
   - Use the admin setup process to create your first admin account

## 🗄️ Database Setup

The application uses several SQL scripts to set up the database:

- `proj/supabase_schema.sql` - Main database schema with tables and RLS policies
- `staff_table_setup.sql` - Staff-specific table configurations
- `appointment_slots_setup.sql` - Appointment scheduling setup
- `vaccines_table_setup.sql` - Vaccine management tables
- `storage_setup.sql` - File storage configuration
- Various fix and update scripts for database maintenance

## 🔧 Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint

# Database
# Run SQL scripts in order for initial setup
```

## 👥 User Roles

### Admin Users
- Full system access
- Can manage all patients, staff, and appointments
- Access to analytics and reporting
- System configuration capabilities

### Staff Users
- Limited to assigned patients
- Can view and update patient records
- Access to appointment management
- Payment processing capabilities

## 🔒 Security Features

- **Row Level Security (RLS)**: Database-level access control
- **Role-based permissions**: Different access levels for admin vs staff
- **Secure authentication**: Supabase Auth with email verification
- **Data validation**: Client and server-side validation
- **Environment variables**: Secure credential management

## 📱 Responsive Design

The application is fully responsive and works seamlessly across:
- Desktop computers
- Tablets
- Mobile phones
- Various screen sizes and orientations

## 🗺️ Maps Integration

- **Google Maps**: For location-based services and patient addresses
- **Leaflet Maps**: Alternative mapping solution for different use cases
- **Interactive features**: Clickable locations and route planning

## 📊 Data Export

- **Excel export**: Patient data and reports can be exported to Excel format
- **CSV support**: Alternative data export formats
- **Custom reports**: Generate reports based on various criteria

## 🐛 Debugging & Troubleshooting

### Common Issues

1. **Login Problems**
   - Check Supabase credentials in `.env` file
   - Verify email confirmation settings in Supabase dashboard
   - Review browser console for authentication errors

2. **Database Connection Issues**
   - Ensure Supabase project is active
   - Verify RLS policies are correctly configured
   - Check network connectivity

3. **Build Issues**
   - Clear node_modules and reinstall dependencies
   - Check for version conflicts in package.json
   - Verify all environment variables are set

### Debug Tools

- `proj/src/debug-login.js` - Login debugging utilities
- `proj/DEBUG_LOGIN.md` - Debugging guide
- Browser developer tools for client-side debugging
- Supabase dashboard for server-side monitoring

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
1. Check the `SUPABASE_SETUP.md` guide for setup issues
2. Review the debugging documentation
3. Check Supabase documentation for backend issues
4. Open an issue in the repository

## 🔮 Future Enhancements

- [ ] Mobile app development
- [ ] Advanced analytics dashboard
- [ ] Integration with external healthcare systems
- [ ] Automated appointment reminders
- [ ] Multi-language support
- [ ] Advanced reporting features
- [ ] API documentation
- [ ] Unit and integration tests

---

**Built with ❤️ for healthcare professionals**
