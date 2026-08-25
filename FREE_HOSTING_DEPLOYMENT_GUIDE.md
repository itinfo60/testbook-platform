# 🚀 100% Free Complete Platform Hosting & Deployment Guide

This guide gives you the exact blueprint and steps to deploy the entire **CivicsHub / Testbook Platform** (Student Web Portal, Admin Portal, Backend Node.js API, PostgreSQL Database, File Storage, and Redis Cache) **100% FREE forever**.

---

## 🏗️ Architecture Overview

| Component                      | Recommended Free Provider          | Free Tier Specifications                                   | Sleep Prevention                 |
| :----------------------------- | :--------------------------------- | :--------------------------------------------------------- | :------------------------------- |
| **Student Web App** (`client`) | **Vercel** or **Cloudflare Pages** | Unlimited Bandwidth & Requests, Instant Edge CDN, Free SSL | Never Sleeps (Always Online)     |
| **Admin Panel** (`admin`)      | **Vercel** or **Cloudflare Pages** | Unlimited Bandwidth, Instant Edge CDN, Free SSL            | Never Sleeps (Always Online)     |
| **Backend API** (`server`)     | **Render** or **Koyeb**            | 750 Free Hours / Month, Automatic HTTPS, Webhooks          | Keeps awake with free 5-min ping |
| **Database (PostgreSQL)**      | **Supabase**                       | 500 MB PostgreSQL (Already provisioned & working)          | Active automatically             |
| **Storage (PDFs / Images)**    | **Supabase Storage**               | 1 GB Free File Storage, Global CDN URLs                    | Active automatically             |
| **Redis Cache**                | **Upstash**                        | 10,000 commands/day Free Serverless Redis                  | Serverless (No sleep)            |

---

## 📋 Step 1: Deploy Database & Storage (Already Done ✅)

Your database and storage are already configured with Supabase:

- **Connection String:** `postgresql://postgres.adzwarjoradodbdzlldu:lZ8TxQ9pf7Gt9ojk@aws-0-ap-south-1.pooler.supabase.com:6543/postgres`
- **Storage Bucket:** `testbook-storage`

---

## 📋 Step 2: Deploy Backend API on Render (100% Free)

1. Sign up / Log in to [Render.com](https://render.com) (Log in with GitHub).
2. Click **New +** → **Web Service**.
3. Connect your GitHub repository: `testbook-platform`.
4. Configure the settings:
   - **Name:** `civicshub-api`
   - **Root Directory:** `server`
   - **Runtime:** `Node`
   - **Build Command:** `npm install && npx prisma generate`
   - **Start Command:** `npm start`
   - **Instance Type:** `Free`
5. Under **Environment Variables**, add:
   ```env
   NODE_ENV=production
   PORT=10000
   DATABASE_URL=postgresql://postgres.adzwarjoradodbdzlldu:lZ8TxQ9pf7Gt9ojk@aws-0-ap-south-1.pooler.supabase.com:6543/postgres
   DIRECT_URL=postgresql://postgres.adzwarjoradodbdzlldu:lZ8TxQ9pf7Gt9ojk@aws-0-ap-south-1.pooler.supabase.com:5432/postgres
   JWT_SECRET=your-super-secret-production-jwt-key-2026
   SUPABASE_URL=https://adzwarjoradodbdzlldu.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   SUPABASE_BUCKET=testbook-storage
   CLIENT_URL=https://your-student-app.vercel.app
   ADMIN_URL=https://your-admin-app.vercel.app
   ```
6. Click **Create Web Service**.
7. Once deployed, copy your Render URL: e.g. `https://civicshub-api.onrender.com`.

---

## 📋 Step 3: Deploy Student Frontend on Vercel (100% Free)

1. Log in to [Vercel.com](https://vercel.com) with GitHub.
2. Click **Add New...** → **Project**.
3. Import your `testbook-platform` repository.
4. Configure:
   - **Project Name:** `civicshub-portal`
   - **Framework Preset:** `Vite`
   - **Root Directory:** Click Edit and select `client`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. Under **Environment Variables**, add:
   ```env
   VITE_API_URL=https://civicshub-api.onrender.com/api/v1
   ```
6. Click **Deploy**.
   - Your student portal is now live with zero cold starts at `https://civicshub-portal.vercel.app` (or your custom domain).

---

## 📋 Step 4: Deploy Admin Panel on Vercel (100% Free)

1. In Vercel, click **Add New...** → **Project**.
2. Select the same `testbook-platform` repository again.
3. Configure:
   - **Project Name:** `civicshub-admin`
   - **Framework Preset:** `Vite`
   - **Root Directory:** Click Edit and select `admin`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Under **Environment Variables**, add:
   ```env
   VITE_API_URL=https://civicshub-api.onrender.com/api/v1
   ```
5. Click **Deploy**.
   - Your admin portal is now live at `https://civicshub-admin.vercel.app`.

---

## 📋 Step 5: Keep Backend Awake 24/7 For Free (Zero Sleep)

Render Free tier goes to sleep after 15 minutes of inactivity. To keep your backend **100% active 24/7 with zero lag**:

1. Go to [Cron-job.org](https://cron-job.org) or [UptimeRobot.com](https://uptimerobot.com) (100% Free).
2. Create a free monitor/cron job:
   - **URL:** `https://civicshub-api.onrender.com/health`
   - **Interval:** Every 5 minutes (or 10 minutes)
   - **Method:** `GET`
3. This periodically hits the lightweight `/health` endpoint so Render never spins down, giving your students instant responses at all times!

---

## 🔒 Step 6: Custom Domain & Free SSL Setup

You can attach your custom domain for free on Vercel and Render:

- `yourdomain.com` → Vercel (Student Portal)
- `admin.yourdomain.com` → Vercel (Admin Panel)
- `api.yourdomain.com` → Render (Backend API)

Vercel and Render will automatically issue and renew free Let's Encrypt SSL certificates.
