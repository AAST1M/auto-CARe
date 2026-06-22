<!-- markdownlint-disable MD013 MD033 MD041 -->
<div align="center">
  <img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Auto-Care AI

Auto-Care AI is a next-generation, all-in-one automotive care ecosystem. It leverages cutting-edge artificial intelligence to diagnose vehicle issues and connects drivers seamlessly with emergency winch operators, workshop owners, and spare part merchants.

## 🌟 Key Features

### 1. The AI Auto Doctor (Multimodal Diagnostics)

Powered by the Gemini API, our AI mechanic can instantly diagnose car troubles.

- **Text:** Describe your breakdown.
- **Image:** Snap a photo of your dashboard warning lights or a broken part.
- **Audio:** Record your engine's strange noises.
- **Persistent Memory:** Your entire diagnostic conversation history is securely saved and loaded upon returning.

### 2. Live Winch Rescue (Real-Time Logistics)

- **Live Dispatch:** Request a winch truck when stranded. Available drivers in the area receive instant alerts.
- **Live GPS Tracking:** Once a driver accepts, watch them drive to your exact location in real-time on an interactive map.
- **Automated Digital Wallet:** When the driver clicks "Arrived / Complete," funds are automatically transferred from the user's wallet to the driver's wallet (minus a 10% platform commission) with a full transaction receipt.

### 3. Smart Workshop Directory

- Find the nearest top-rated mechanics and garages.
- Filter by specialty (Transmission, Brakes, AC, Engine).
- Book scheduled appointments instantly and check in to see live repair progress.

### 4. Spare Parts Marketplace

- Browse an extensive e-commerce inventory of car parts.
- Check stock levels, compare prices, and order parts directly to your trusted workshop for installation.

### 5. Multi-Role Ecosystem

- **Car Owners:** Manage vehicles, book appointments, request winches, and buy parts.
- **Winch Drivers:** Dedicated dashboard to toggle "Online", accept rescue requests, and track earnings.
- **Workshop Owners:** Track active cars in the garage, manage mechanic workflows, and update repair statuses.
- **Admins:** A centralized command center monitoring live platform stats, revenue, and active jobs.

---

## 🚀 How to Run the App Locally

This project is a monorepo consisting of a modern React **frontend** and a secure Node.js/Express **backend** equipped with Prisma and PostgreSQL.

### Prerequisites

1. **Node.js** (v18+)
2. **PostgreSQL** Database (Local or Cloud like Supabase/Neon)
3. **Gemini API Key** (Get one from [Google AI Studio](https://aistudio.google.com/app/apikey))

### Step-by-Step Setup

#### 1. Clone the repository and install dependencies

From the root folder, the install script will install the root packages, but you also need to install the subdirectories:

```bash
npm install
cd backend && npm install
cd ../frontend && npm install
cd ..
```

#### 2. Configure the Backend Environment

Navigate to the `backend/` directory and create a `.env` file (if one doesn't exist):

```env
PORT=5001
DATABASE_URL="postgresql://<USER>:<PASSWORD>@localhost:5432/autocare_db"
JWT_SECRET="your_super_secret_jwt_key_here"
GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
```

#### 3. Configure the Frontend Environment

Navigate to the `frontend/` directory and create a `.env` file:

```env
VITE_API_URL=http://localhost:5001
```

#### 4. Initialize the Database

In the `backend/` directory, push the Prisma schema to your PostgreSQL database to create all the necessary tables (Users, WinchBookings, ChatHistory, Transactions, etc.):

```bash
cd backend
npx prisma db push
npx prisma generate
```

#### 5. Start the Application

From the **root** folder, run the development script. This uses `concurrently` to spin up both the Vite frontend and the Node.js backend simultaneously:

```bash
npm run dev
```

- **Frontend:** Available at `http://localhost:3000` (or `3001` if busy).
- **Backend API:** Available at `http://localhost:5001`.

---

## 🛠️ Tech Stack

- **Frontend:** React, Vite, Tailwind CSS, Lucide Icons, Socket.IO Client.
- **Backend:** Node.js, Express, Socket.IO (WebSockets), Prisma ORM, JSON Web Tokens (JWT).
- **Database:** PostgreSQL.
- **AI Engine:** Google Gemini API (`@google/genai`).
- **Mobile (Optional):** Expo / React Native (`mobile/` directory).

## 💡 Troubleshooting

- **Missing Prisma Types Error?** If your code editor highlights `prisma.chatHistory` or other database models as errors, you need to clear the TypeScript cache. Open your Command Palette (`Cmd + Shift + P`) and run **TypeScript: Restart TS server**.
- **Port Conflicts?** If port `5001` or `3000` is already in use by another app, you can change them in the `.env` files and `package.json`. Make sure the frontend `VITE_API_URL` always points to the backend's port!
