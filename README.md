# TaskFlow ⚡

> Multi-tenant Task Management SaaS Platform

Aplikasi Task Management berbasis cloud dengan implementasi SaaS dan multi-tenancy, dibangun untuk Tugas Kelompok Cloud Computing.

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-blue.svg)](https://postgresql.org)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://docker.com)
[![AWS](https://img.shields.io/badge/AWS-EC2-orange.svg)](https://aws.amazon.com)

## 👥 Tim Pengembang

**Kelompok:** [Isi Nama Kelompok]

**Anggota:**
1. [Nama Lengkap - NIM]
2. [Nama Lengkap - NIM]
3. [Nama Lengkap - NIM]
4. [Nama Lengkap - NIM]
5. [Nama Lengkap - NIM]

**Mata Kuliah:** Cloud Computing
**Dosen:** [Nama Dosen]
**Tahun:** 2024

## 📖 Deskripsi Aplikasi

TaskFlow adalah aplikasi manajemen tugas berbasis cloud yang menerapkan model Software as a Service (SaaS). Setiap organisasi dapat mendaftar, membuat workspace, mengelola tim, dan mengatur task dengan sistem multi-tenancy yang aman.

### ✨ Fitur Utama

- 🏢 **Multi-Tenancy** - Isolasi data per organisasi dengan shared infrastructure
- 👥 **User Management** - Register, login, role-based access control
- 📁 **Workspace Management** - Organize tasks by project/category
- ✅ **Task Management** - CRUD operations dengan assignment & priority
- 🤝 **Team Collaboration** - Multiple users per organization
- 🔌 **RESTful API** - Complete backend API untuk integrasi
- 🎨 **Modern UI/UX** - Futuristic design dengan gradient colors
- 🔒 **Security** - JWT authentication, data isolation, HTTPS ready

## 🚀 Quick Start

### Menggunakan Docker (Recommended)

```bash
# Clone repository
git clone <repository-url>
cd saas-tk-kowan

# Copy environment file
cp .env.example .env

# Start all services
docker-compose up -d

# Access application
# Frontend: http://localhost
# Backend: http://localhost:5000
# Health: http://localhost:5000/health
```

### Manual Setup

Lihat [QUICK-START.md](QUICK-START.md) untuk instruksi lengkap.

## 📚 Dokumentasi

- **[QUICK-START.md](QUICK-START.md)** - Panduan cepat memulai development
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Panduan deploy ke AWS EC2
- **[LAPORAN.md](LAPORAN.md)** - Laporan lengkap tugas kelompok
- **[PRESENTATION-GUIDE.md](PRESENTATION-GUIDE.md)** - Panduan video presentasi

## 🎥 Video Presentasi

[Link YouTube / Google Drive akan diisi setelah upload]

**Durasi:** 10 menit
**Isi:** Demo aplikasi, arsitektur, teknologi, deployment

## 📸 Screenshots

### Landing & Authentication
[Screenshots akan ditambahkan setelah deployment]

### Dashboard
[Screenshots akan ditambahkan setelah deployment]

### Task Management
[Screenshots akan ditambahkan setelah deployment]

## Arsitektur Sistem
```
┌─────────────┐
│   Client    │ (React Frontend)
└──────┬──────┘
       │ HTTPS
┌──────▼──────────────────────┐
│   Load Balancer (Nginx)     │
└──────┬──────────────────────┘
       │
┌──────▼──────────────────────┐
│  Application Server         │
│  (Node.js + Express)        │
└──────┬──────────────────────┘
       │
┌──────▼──────────────────────┐
│  Database (PostgreSQL)      │
│  Multi-tenant Schema        │
└─────────────────────────────┘
```

## Teknologi yang Digunakan

### Backend
- **Node.js & Express**: Runtime dan framework web yang ringan dan scalable
- **PostgreSQL**: Database relational dengan dukungan JSONB untuk fleksibilitas
- **JWT**: Autentikasi stateless untuk SaaS
- **bcrypt**: Hash password yang aman

### Frontend
- **React**: Library UI yang modular dan reusable
- **Axios**: HTTP client untuk API calls
- **React Router**: Client-side routing

### DevOps & Cloud
- **Docker**: Containerization untuk portability
- **Docker Compose**: Orchestration multi-container
- **AWS EC2**: Cloud hosting
- **Nginx**: Reverse proxy dan load balancer

## Alasan Pemilihan Teknologi

### Mengapa Node.js?
- Non-blocking I/O cocok untuk aplikasi SaaS dengan banyak concurrent users
- Ecosystem npm yang kaya
- JavaScript full-stack (frontend & backend)

### Mengapa PostgreSQL?
- ACID compliance untuk data integrity
- Dukungan multi-tenancy dengan schema isolation
- Open source dan mature

### Mengapa Docker?
- Konsistensi environment (dev = production)
- Easy deployment dan scaling
- Isolasi dependencies

### Mengapa AWS EC2?
- Flexibility dalam konfigurasi
- Pay-as-you-go pricing cocok untuk SaaS
- Integrasi dengan services AWS lainnya

## Model Multi-Tenancy
Aplikasi ini menggunakan **Shared Database with Tenant Identifier** pattern:
- Satu database untuk semua tenant
- Setiap tabel memiliki kolom `organization_id`
- Query selalu di-filter berdasarkan tenant yang sedang login
- Cost-effective untuk skala kecil-menengah

## Instalasi Lokal

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Docker & Docker Compose (optional)

### Setup Manual
```bash
# Clone repository
git clone <repo-url>
cd saas-tk-kowan

# Setup Backend
cd backend
npm install
cp .env.example .env
# Edit .env dengan konfigurasi database
npm run migrate
npm run dev

# Setup Frontend (terminal baru)
cd frontend
npm install
npm start
```

### Setup dengan Docker
```bash
docker-compose up -d
```

## Deployment ke AWS EC2

### 1. Persiapan EC2 Instance
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2. Deploy Aplikasi
```bash
# Clone repository
git clone <repo-url>
cd saas-tk-kowan

# Setup environment
cp .env.example .env
nano .env  # Edit dengan konfigurasi production

# Run dengan Docker Compose
docker-compose -f docker-compose.prod.yml up -d
```

### 3. Konfigurasi Security Group AWS
- Port 80 (HTTP)
- Port 443 (HTTPS)
- Port 22 (SSH)

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register organization & user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Organizations
- `GET /api/organizations` - Get organization details
- `PUT /api/organizations` - Update organization

### Tasks
- `GET /api/tasks` - List all tasks (filtered by org)
- `POST /api/tasks` - Create new task
- `GET /api/tasks/:id` - Get task detail
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### Users
- `GET /api/users` - List users in organization
- `POST /api/users/invite` - Invite new user

## Testing
```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## Monitoring & Logging
- Application logs: `/var/log/taskflow/`
- Database logs: PostgreSQL logs
- Container logs: `docker-compose logs -f`

## Karakteristik SaaS yang Diterapkan

1. **Multi-Tenancy**: Satu instance aplikasi melayani multiple organizations
2. **Subscription Model**: Ready untuk integrasi payment gateway
3. **Centralized Management**: Admin dashboard untuk monitoring
4. **Automatic Updates**: Deploy sekali, semua tenant ter-update
5. **Scalability**: Horizontal scaling dengan container orchestration
6. **API-First**: RESTful API untuk integrasi dengan aplikasi lain

## Roadmap & Future Enhancements
- [ ] Payment integration (Stripe/Midtrans)
- [ ] Real-time notifications (WebSocket)
- [ ] Advanced analytics & reporting
- [ ] Mobile app (React Native)
- [ ] Kubernetes deployment
- [ ] Multi-region deployment

## Lisensi
MIT License

## Kontak
[Email/Contact Information]
