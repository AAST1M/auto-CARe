<!-- markdownlint-disable MD013 MD033 MD041 -->
<div align="center">
  <img width="1200" height="475" alt="Auto-Care AI Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

  # 🚗 Auto-Care AI

  ### *Enterprise-Grade Multimodal AI Automotive Care Ecosystem, Real-Time Emergency Logistics & Smart Workshop Operations*

  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
  [![Node.js](https://img.shields.io/badge/Node.js-v20.x-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
  [![PostgreSQL](https://img.shields.io/badge/PostgreSQL-v16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
  [![Prisma ORM](https://img.shields.io/badge/Prisma_ORM-v5-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
  [![Google Gemini AI](https://img.shields.io/badge/Google_Gemini-2.5_Flash-8E75B2?style=for-the-badge&logo=googlegemini&logoColor=white)](https://ai.google.dev/)
  [![Socket.IO](https://img.shields.io/badge/Socket.io-WebSockets-010101?style=for-the-badge&logo=socketdotio&logoColor=white)](https://socket.io/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v3.4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
  [![Playwright E2E](https://img.shields.io/badge/Playwright-E2E_Testing-2EAD33?style=for-the-badge&logo=playwright&logoColor=white)](https://playwright.dev/)
  [![Docker](https://img.shields.io/badge/Docker-Containerized-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)

  [View Live Architecture](#-system-architecture--engineering-design) • [Explore Multimodal AI](#1-multimodal-ai-auto-doctor-gemini-25) • [Real-Time Rescue Engine](#2-real-time-winch-rescue--dispatch-engine) • [API & Schemas](#-database-schema--domain-model)

</div>

---

## 📌 Executive Overview

**Auto-Care AI** is an enterprise-grade, full-stack automotive technology platform engineered to bridge the gap between AI-driven vehicle diagnostics, real-time emergency roadside assistance, automated workshop repair management, and e-commerce spare parts logistics.

Built as an end-to-end commercial software suite valued at **$60,000+ in production architecture standards**, the platform seamlessly connects **4 primary stakeholder personas** (*Car Owners, Winch Fleet Operators, Workshop Managers, and Platform Administrators*) through high-throughput WebSockets, distributed database transaction pipelines, dynamic geolocation tracking, and multimodal AI inference engines.

---

## 🏗️ System Architecture & Engineering Design

The project is structured as a decoupled monorepo leveraging clean architecture, strict data access layers (Prisma ORM), end-to-end type safety, and real-time state synchronization.

```
                  ┌─────────────────────────────────────────────────────────────┐
                  │                 Vite + React Client (PWA)                   │
                  │        (Car Owner • Winch Driver • Workshop • Admin)        │
                  └──────────────┬──────────────────────────────┬───────────────┘
                                 │ HTTP / REST API              │ WebSockets (Socket.io)
                                 ▼                              ▼
                  ┌─────────────────────────────────────────────────────────────┐
                  │                 Node.js + Express Backend                   │
                  │     (JWT Auth • Rate Limiters • Mutex Locks • Controllers)   │
                  └──────────────┬──────────────────────────────┬───────────────┘
                                 │                              │
          ┌──────────────────────┴─────────────┐  ┌─────────────┴──────────────────────┐
          │                                    │  │                                    │
          ▼                                    ▼  ▼                                    ▼
┌──────────────────┐               ┌──────────────────┐               ┌──────────────────┐
│ PostgreSQL (v16) │               │ Google Gemini AI │               │ Redis Caching    │
│ (Prisma ORM DL)  │               │ (Multimodal SDK) │               │ & Session Store  │
└──────────────────┘               └──────────────────┘               └──────────────────┘
```

---

## 🌟 Core Functional Subsystems

### 🧠 1. Multimodal AI Auto Doctor (Google Gemini API)
* **Vision Inspection Engine:** Users upload high-resolution photos of dashboard warning lights, engine bay components, or damaged body parts. The AI vision model processes image tokens to output structured diagnostic reports, fault codes (OBD-II estimation), severity ratings, and estimated repair costs.
* **Acoustic Engine Audio Analysis:** Processes audio recordings of abnormal engine knocks, squealing belts, or transmission grinding noises, leveraging multimodal embeddings to detect mechanical failures.
* **Persistent Diagnostic State Memory:** Conversations are statefully linked to the user's vehicle profile ID in PostgreSQL, preserving full diagnostic context across web and mobile client sessions.

### 🚜 2. Real-Time Winch Rescue & Geolocation Logistics
* **Dynamic Geolocation Broadcasting:** When a driver requests emergency roadside assistance, spatial coordinates are broadcast over WebSockets to nearby active winch operators within a configurable radius.
* **Live Operator Radar & Routing:** Winch operators receive instant rescue popups with distance calculations, customer details, and vehicle telemetry.
* **Two-Way Live GPS Tracking:** Interactive maps stream real-time driver coordinates via WebSocket events, updating customer screens with dynamic ETAs and route polylines.
* **Atomic Digital Wallet Settlement:** Upon rescue confirmation ("Arrived & Completed"), the platform executes an **isolated database transaction** deducting fees from the customer's wallet, transferring funds to the driver, and logging platform commissions (e.g., 10%) with full audit trail compliance.

### 🛠️ 3. Smart Workshop Directory & Repair Lifecycle Sync
* **Geospatial Discovery:** Filter nearby verified workshops by specialty (*Transmission, Engine Overhaul, Electrical, Brakes, AC System*).
* **Automated Slot Booking:** Conflict-free appointment scheduling preventing double-booking through backend slot locks.
* **Live Garaged Vehicle Progress Kanban:** Workshop owners update repair stages (*Checked-In ➔ Diagnosing ➔ Parts Ordered ➔ Repairing ➔ Ready for Pickup*), immediately pushing push/socket notifications to the vehicle owner's mobile dashboard.

### ⚙️ 4. E-Commerce Spare Parts Marketplace & Compatibility Engine
* **Vehicle Compatibility Filtering:** Automatic VIN/Year/Make/Model filtering ensures car owners purchase only parts compatible with their registered vehicle.
* **Integrated Workshop Delivery:** Customers can purchase parts and route delivery directly to the workshop handling their scheduled repair job.

### 📊 5. Unified Command & Admin Operational Control
* Real-time platform metrics dashboard displaying active winch rescues, total revenue, commission breakdown, pending workshop verifications, and system health telemetry.

---

## 💻 Tech Stack & Engineering Specifications

| Layer | Technologies & Libraries | Architectural Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | React 18, TypeScript, Vite 5, Tailwind CSS | High-performance SPA with client-side routing & full type safety |
| **State & Motion** | Lucide Icons, Context API, Dynamic Modals | Responsive UI micro-interactions & modern dark-mode design system |
| **Backend Core** | Node.js (v20+), Express.js, WebSockets (Socket.io) | Asynchronous event-driven REST API and real-time bidirectional messaging |
| **Database & ORM** | PostgreSQL 16, Prisma ORM, Redis | Relational data persistence, schema migrations, caching, & rate-limiting |
| **Artificial Intelligence** | Google Gemini API (`@google/genai` Multimodal) | Computer vision, audio spectral diagnosis, & conversational mechanics |
| **Quality Assurance** | Playwright E2E, PyTest (API), Jest | Automated regression testing, API integration tests, & socket validation |
| **Containerization** | Docker, Docker Compose, Capacitor (Android) | Reproducible multi-container orchestration & mobile APK generation |

---

## 🗄️ Database Schema & Domain Model

```prisma
model User {
  id            String         @id @default(uuid())
  email         String         @unique
  password      String
  name          String
  role          Role           // CAR_OWNER, WINCH_DRIVER, WORKSHOP_OWNER, ADMIN
  walletBalance Float          @default(0.0)
  vehicles      Vehicle[]
  winchBookings WinchBooking[] @relation("UserWinchBookings")
  driverBookings WinchBooking[] @relation("DriverWinchBookings")
  appointments  Appointment[]
  createdAt     DateTime       @default(now())
}

model WinchBooking {
  id             String        @id @default(uuid())
  userId         String
  driverId       String?
  pickupLat      Float
  pickupLng      Float
  status         WinchStatus   // PENDING, ACCEPTED, IN_PROGRESS, COMPLETED, CANCELLED
  fareAmount     Float
  user           User          @relation("UserWinchBookings", fields: [userId], references: [id])
  driver         User?         @relation("DriverWinchBookings", fields: [driverId], references: [id])
  createdAt      DateTime      @default(now())
}
```

---

## 🚀 Installation & Local Deployment Guide

### Prerequisites
* **Node.js**: v18.0.0 or higher
* **PostgreSQL**: Local instance or Cloud DB (Supabase / Neon)
* **Google Gemini API Key**: [Google AI Studio](https://aistudio.google.com/app/apikey)

### Quick Start (Development Environment)

```bash
# 1. Clone the project repository
git clone https://github.com/AAST1M/auto-CARe.git
cd auto-CARe

# 2. Install all root, backend, and frontend packages
npm run install:all # Or manually run npm install in /, /backend, and /frontend

# 3. Setup backend environment variables
cat <<EOT >> backend/.env
PORT=5001
DATABASE_URL="postgresql://user:password@localhost:5432/autocare_db"
JWT_SECRET="your_jwt_secret_key"
GEMINI_API_KEY="YOUR_GOOGLE_GEMINI_API_KEY"
EOT

# 4. Setup frontend environment variables
cat <<EOT >> frontend/.env
VITE_API_URL=http://localhost:5001
EOT

# 5. Execute PostgreSQL migrations & seed initial database state
cd backend
npx prisma db push
npx prisma generate
cd ..

# 6. Boot development servers concurrently
npm run dev
```

* **Client Web App**: `http://localhost:3000`
* **Express & WebSocket Server**: `http://localhost:5001`

---

## 🧪 Comprehensive Automated Testing

The project includes an extensive Playwright E2E and API test suite verifying mission-critical business flows:

```bash
# Run end-to-end Playwright tests across chromium, firefox, and webkit
npm run test:e2e
```

---

<div align="center">
  <sub>Architected and Developed by Marwan El-Sawy • AASTMT Computer Science & Software Engineering</sub>
</div>
