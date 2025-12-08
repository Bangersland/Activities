# System Architecture

## FRONTEND

### Web
- **React** (v19.1.0) - UI Framework
- **Vite** (v7.0.4) - Build Tool & Dev Server
- **CSS** - Custom CSS files (App.css, LoginForm.css, AdminDashboard.css, etc.)
- **HTML** - Standard HTML

### UI Libraries
- **React Icons** - Icon library (Font Awesome icons)
- **XLSX (SheetJS)** - Excel export functionality

### App
- **Flutter** - Mobile application (if applicable)

## BACKEND

### Services & Storage
- **Supabase** - Backend-as-a-Service
      - **Supabase Auth API** - User authentication & authorization
  - **Supabase Database API** - PostgreSQL database operations (CRUD)
  - **Supabase Storage API** - File storage (staff profile photos)
  - Real-time subscriptions

## INFRASTRUCTURE

- **GitHub** - Version control & repository
- **Vercel** - Deployment & hosting (for frontend)

## API'S

### Mapping Services
- **Google Maps API** - Mapping and location services
- **Leaflet API** - Open-source mapping library

### Payment Processing
- **Paymongo API** - Payment processing (verify implementation)

## Development Tools

- **ESLint** - Code linting
- **@vitejs/plugin-react** - React plugin for Vite

---

## Architecture Flow

```
User
  ↓
FRONTEND (React + Vite)
  ├─→ BACKEND (Supabase)
  │     └─→ API'S (Google Maps, Leaflet, Paymongo)
  └─→ INFRASTRUCTURE (GitHub, Vercel)
```

