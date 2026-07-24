<!-- markdownlint-disable MD013 MD033 MD041 -->
<div align="center">
  <img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

  # 🚗 Auto-Care AI

  **Next-Generation Multimodal AI Automotive Care Ecosystem & Emergency Rescue Logistics**

  [![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
  [![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
  [![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
  [![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
  [![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
  [![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
  [![Gemini AI](https://img.shields.io/badge/Google_Gemini-8E75B2?style=for-the-badge&logo=googlegemini&logoColor=white)](https://ai.google.dev/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
  [![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)

</div>

---

## 💻 Tech Stack & Engineering Skills

```
  Frontend   │  React • TypeScript • Vite • Tailwind CSS • Lucide Icons • Socket.io Client
  Backend    │  Node.js • Express • WebSockets (Socket.io) • Prisma ORM • JWT Auth
  Database   │  PostgreSQL • Redis (Caching/Rate Limiting)
  AI / ML    │  Google Gemini Multimodal API (@google/genai)
  Testing    │  Playwright (E2E & API Testing) • Jest • PyTest
  DevOps     │  Docker • Docker Compose • Capacitor (Android/Mobile)
```

---

## 🌟 Key Features

### 🤖 1. The AI Auto Doctor (Multimodal Diagnostics)
Powered by the **Google Gemini API**, our virtual mechanic instantly diagnoses vehicle troubles:
* **Text Analysis:** Describe symptoms in plain natural language.
* **Visual Inspection:** Upload photos of dashboard warning lights, engine bays, or damaged parts.
* **Audio Diagnostic:** Record and submit strange engine/transmission noises for AI audio processing.
* **Persistent Diagnostic History:** Diagnostic conversations are stored and resumed across user sessions.

### 🚜 2. Real-Time Winch Rescue & Emergency Dispatch
* **Live Dispatch:** One-tap emergency request broadcasting to nearby winch operators.
* **Interactive Live GPS Tracking:** Watch driver movement in real time on interactive maps.
* **Automated Digital Wallet:** Instant commission-handled wallet transfers upon arrival and job completion.

### 🛠️ 3. Smart Workshop Directory & Progress Sync
* Discover top-rated mechanics and garages categorized by specialty (*Brakes, Engine, AC, Transmission*).
* Book appointments instantly and track live vehicle repair progress step-by-step.

### ⚙️ 4. Spare Parts Marketplace & Vehicle Compatibility
* E-commerce inventory with stock checking, price comparison, and vehicle compatibility verification.
* Direct ordering to workshops for upcoming repair appointments.

### 👥 5. Multi-Role Operating System
* **Car Owners:** Diagnostics, winch requests, workshop booking, and parts purchasing.
* **Winch Drivers:** Online status toggle, live rescue radar, and real-time wallet payout dashboard.
* **Workshop Owners:** Garaged car workflow management, mechanic assignments, and repair status updates.
* **Admins:** Centralized analytics command center monitoring active rescue jobs, revenue, and system metrics.

---

## 🛠️ Getting Started (Local Setup)

### Prerequisites
* **Node.js** (v18+)
* **PostgreSQL** Database
* **Gemini API Key** ([Google AI Studio](https://aistudio.google.com/app/apikey))

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/AAST1M/auto-CARe.git
cd auto-CARe

# Install root, backend, and frontend dependencies
npm install
cd backend && npm install
cd ../frontend && npm install
cd ..
```

### 2. Environment Configuration

**Backend (`backend/.env`):**
```env
PORT=5001
DATABASE_URL="postgresql://user:password@localhost:5432/autocare_db"
JWT_SECRET="your_jwt_secret"
GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
```

**Frontend (`frontend/.env`):**
```env
VITE_API_URL=http://localhost:5001
```

### 3. Database Migration & Start Server
```bash
cd backend
npx prisma db push
npx prisma generate
cd ..

# Start both frontend and backend concurrently
npm run dev
```
* **Frontend:** `http://localhost:3000`
* **Backend API:** `http://localhost:5001`

---

<div align="center">
  <i>Designed for Marwan El-Sawy • AASTMT Computer Science & Software Engineering</i>
</div>
