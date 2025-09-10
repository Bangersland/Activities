# BiteCare - Healthcare Management System

A modern, web-based healthcare management platform designed to streamline patient care, appointment scheduling, and staff management for healthcare facilities.

## 🎯 Project Purpose

BiteCare addresses the critical needs of healthcare facilities by providing:

- **Centralized Patient Management**: Complete patient records and history tracking
- **Efficient Appointment Scheduling**: Streamlined booking and calendar management
- **Staff Coordination**: Role-based access for administrators and healthcare staff
- **Medical Record Management**: Secure storage and access to patient data
- **Payment Processing**: Integrated billing and payment tracking
- **Vaccine Management**: Inventory tracking and administration records

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn package manager
- Supabase account (free tier available)

### Installation

1. **Clone and Setup**
   ```bash
   git clone <repository-url>
   cd bite/proj
   npm install
   ```

2. **Configure Environment**
   ```bash
   cp env.example .env
   ```
   Update `.env` with your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. **Database Setup**
   - Create a new project at [supabase.com](https://supabase.com)
   - Run the SQL scripts in order:
     ```sql
     -- 1. Main schema
     proj/supabase_schema.sql
     
     -- 2. Additional tables
     staff_table_setup.sql
     appointment_slots_setup.sql
     vaccines_table_setup.sql
     ```

4. **Start Development**
   ```bash
   npm run dev
   ```
   Open [http://localhost:5173](http://localhost:5173)

5. **Create Admin Account**
   - Follow the setup guide in `proj/SUPABASE_SETUP.md`
   - Or use the admin setup component in the application

## 👥 User Roles & Features

### Administrator Access
- **Patient Management**: Add, edit, and view all patient records
- **Staff Management**: Create and manage staff accounts
- **System Analytics**: View reports and system metrics
- **Appointment Oversight**: Manage all appointments and schedules
- **Vaccine Inventory**: Track and manage vaccine stock
- **Payment Monitoring**: View all payment transactions

### Staff Access
- **Assigned Patients**: View and update assigned patient records
- **Appointment Management**: Handle daily appointment schedules
- **Patient History**: Access medical records and history
- **Payment Processing**: Process patient payments
- **Daily Dashboard**: Quick overview of daily tasks

## 🛠️ Technology Stack

| Category | Technology | Purpose |
|----------|------------|---------|
| **Frontend** | React 19.1.0 | User interface and components |
| **Build Tool** | Vite | Fast development and building |
| **Backend** | Supabase | Database, authentication, real-time |
| **Database** | PostgreSQL | Data storage with RLS security |
| **Maps** | Google Maps API, Leaflet | Location services |
| **Styling** | CSS3 | Responsive design |
| **Icons** | React Icons | UI iconography |

## 📁 Project Organization

### Core Application Structure
- **`src/components/`** - Reusable UI components (Dashboard, PatientList, Schedule)
- **`src/staff/`** - Staff-specific interfaces and workflows
- **`src/assets/`** - Images, logos, and static resources
- **Database Scripts** - SQL files for schema and data management

### Key Files
- **`App.jsx`** - Main application component with routing
- **`UnifiedLogin.jsx`** - Authentication interface
- **`AdminDashboard.jsx`** - Administrator interface
- **`StaffDashboard.jsx`** - Staff member interface
- **`supabase.js`** - Database configuration

## 🔧 Available Commands

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run code linting

# Database
# Run SQL scripts in Supabase SQL Editor for setup
```

## 🔒 Security Features

- **Row Level Security (RLS)**: Database-level access control
- **Role-Based Authentication**: Separate permissions for admin/staff
- **Secure Data Storage**: Encrypted patient information
- **Environment Variables**: Secure credential management
- **Input Validation**: Client and server-side data validation

## 📱 Usage Guide

### For Administrators
1. **Login** with admin credentials
2. **Navigate** through the admin dashboard
3. **Manage** patients, staff, and appointments
4. **View** analytics and generate reports
5. **Configure** system settings

### For Staff Members
1. **Login** with staff credentials
2. **Access** assigned patient list
3. **Update** patient records and appointments
4. **Process** payments and billing
5. **View** daily schedule and tasks

### Key Workflows
- **Patient Registration**: Add new patients through the admin interface
- **Appointment Booking**: Schedule appointments with available time slots
- **Payment Processing**: Handle billing and payment collection
- **Record Updates**: Maintain accurate patient medical records

## 🐛 Troubleshooting

### Common Issues

**Login Problems**
- Verify Supabase credentials in `.env` file
- Check email confirmation in Supabase dashboard
- Review browser console for authentication errors

**Database Connection**
- Ensure Supabase project is active
- Verify RLS policies are configured
- Check network connectivity

**Build Issues**
- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check for version conflicts in `package.json`
- Verify all environment variables are set

### Debug Resources
- **`proj/DEBUG_LOGIN.md`** - Login troubleshooting guide
- **`proj/SUPABASE_SETUP.md`** - Detailed setup instructions
- **Browser Console** - Client-side error checking
- **Supabase Dashboard** - Server-side monitoring

## 📊 Data Management

### Export Capabilities
- **Excel Export**: Patient data and reports
- **CSV Support**: Alternative data formats
- **Custom Reports**: Generate based on criteria

### Backup & Recovery
- **Supabase Backups**: Automatic database backups
- **Data Export**: Manual data export capabilities
- **Version Control**: Code and configuration tracking

## 🚀 Deployment

### Production Setup
1. **Build** the application: `npm run build`
2. **Deploy** to your hosting platform
3. **Configure** production environment variables
4. **Set up** Supabase production project
5. **Run** database migration scripts

### Recommended Hosting
- **Vercel** - Easy React deployment
- **Netlify** - Static site hosting
- **Supabase Hosting** - Integrated backend hosting

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -m 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For assistance:
1. Check the troubleshooting section above
2. Review `proj/SUPABASE_SETUP.md` for setup issues
3. Consult `proj/DEBUG_LOGIN.md` for login problems
4. Open an issue in the repository

## 🔮 Roadmap

- [ ] Mobile application development
- [ ] Advanced analytics dashboard
- [ ] Integration with external healthcare systems
- [ ] Automated appointment reminders
- [ ] Multi-language support
- [ ] API documentation
- [ ] Comprehensive testing suite

---

**Built for healthcare professionals who care about efficient patient management**