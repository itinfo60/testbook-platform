# 🚀 CivicsEdu Production Deployment Guide (100% Free Stack)

A complete, production-tested manual for deploying and maintaining the **CivicsEdu** platform across **Render**, **Vercel**, **Supabase**, **Upstash**, and **Cloudflare** with **$0/month infrastructure costs**.

---

## 🏗️ Architecture Overview

```mermaid
graph TD
    User["👨‍🎓 Student / User"] -->|civicsedu.com| CF["Cloudflare DNS & SSL Edge"]
    AdminUser["🛡️ Institute Admin"] -->|admin.civicsedu.com| CF

    CF -->|Frontend Assets| VercelClient["Vercel (Student App - client/)"]
    CF -->|Admin Assets| VercelAdmin["Vercel (Admin Panel - admin/)"]
    CF -->|API Traffic & WebSockets| RenderAPI["Render (Backend API - server/)"]

    RenderAPI -->|PostgreSQL Queries (Port 6543)| SupabaseDB[("Supabase PostgreSQL")]
    RenderAPI -->|Caching & BullMQ Queues| UpstashRedis[("Upstash Redis (TLS)")]
    RenderAPI -->|PDF & Image Storage| SupabaseStorage["Supabase Storage Bucket"]
    RenderAPI -->|Payment Verification| Razorpay["Razorpay Gateway"]
    RenderAPI -->|Live Interactive Classes| LiveKit["LiveKit Cloud"]
```

---

## 📋 Infrastructure & Free Tier Breakdown

| Component              | Provider       | Free Tier Allowance                        | Purpose                                        |
| :--------------------- | :------------- | :----------------------------------------- | :--------------------------------------------- |
| **Backend API**        | **Render.com** | 512 MB RAM, 0.1 CPU, 750 free hrs/mo       | REST API, WebSockets, BullMQ background jobs   |
| **Student Web App**    | **Vercel**     | Unlimited static hosting, 100 GB bandwidth | Student portal & Mock test interface           |
| **Admin Dashboard**    | **Vercel**     | Unlimited static hosting, 100 GB bandwidth | Management console for teachers & admins       |
| **Database & Storage** | **Supabase**   | 500 MB DB, 1 GB Storage, 50,000 MAU        | Relational PostgreSQL database & media storage |
| **Cache & Job Broker** | **Upstash**    | 10,000 commands/day, 256 MB storage        | Redis caching, Rate-limiting & queue broker    |
| **DNS & Security**     | **Cloudflare** | Free DDoS protection, Global Anycast DNS   | SSL certificates, Custom domain routing        |

---

## 📑 Step-by-Step Deployment Procedure

---

### Step 1: Database & Storage Setup (Supabase)

1. Go to **[supabase.com](https://supabase.com)** and create a new project (e.g. `adzwarjoradodbdzlldu`).
2. **Get Connection Strings** (**Project Settings > Database**):
   - **Connection Pooling URL (Port 6543)**:
     ```text
     postgresql://postgres.adzwarjoradodbdzlldu:[YOUR_PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true
     ```
   - **Direct Connection URL (Port 5432)**:
     ```text
     postgresql://postgres.adzwarjoradodbdzlldu:[YOUR_PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:5432/postgres
     ```
3. **Get API Keys** (**Project Settings > API**):
   - `Project URL`: `https://[PROJECT_ID].supabase.co`
   - `anon public key`: Used in frontend Vercel projects.
   - `service_role secret`: Used exclusively in backend Render environment.
4. **Storage Bucket**:
   - Navigate to **Storage** ➔ Create a new public bucket named: `CivicsEdu_files`.
5. **Auth URL Configuration** (**Authentication > URL Configuration**):
   - **Site URL**: `https://civicsedu.com`
   - **Redirect URLs**:
     ```text
     https://civicsedu.com/**
     https://civicsedu.com/login
     https://civicsedu.com/register
     https://www.civicsedu.com/**
     ```

---

### Step 2: Redis Setup (Upstash)

1. Go to **[console.upstash.com](https://console.upstash.com)**.
2. Click **Create Database**:
   - Name: `civicsedu-redis`
   - Region: Select region closest to your DB (e.g. `ap-south-1` / Mumbai or Singapore).
   - TLS: **Enabled** (Required).
3. **Get Connection URL**:
   - Copy the **`rediss://`** connection string (Notice the double `ss` for TLS encryption):
     ```text
     rediss://default:[PASSWORD]@[ENDPOINT].upstash.io:6379
     ```

---

### Step 3: Backend Deployment (Render.com)

1. Go to **[dashboard.render.com](https://dashboard.render.com)**.
2. Click **New + > Web Service** ➔ Connect your GitHub repository `itinfo60/testbook-platform`.
3. Configure the service:
   - **Name**: `civicsedu-api`
   - **Region**: Singapore or Frankfurt
   - **Branch**: `CourseApp`
   - **Root Directory**: `server`
   - **Runtime**: `Node`
   - **Build Command**:
     ```bash
     npm install --include=dev && npx prisma generate
     ```
   - **Start Command**:
     ```bash
     npm start
     ```
   - **Instance Type**: `Free`

4. **Add Environment Variables in Render**:

```env
NODE_ENV=production
PORT=10000
API_VERSION=v1

# Database
DATABASE_URL=postgresql://postgres.adzwarjoradodbdzlldu:[PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.adzwarjoradodbdzlldu:[PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:5432/postgres

# Redis Cache & Queues (Upstash TLS)
REDIS_URL=rediss://default:[PASSWORD]@[ENDPOINT].upstash.io:6379

# Supabase SDK
SUPABASE_URL=https://adzwarjoradodbdzlldu.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_STORAGE_BUCKET=CivicsEdu_files

# JWT Secrets
JWT_SECRET=8f9c0e2a4b1d7f6e3a5c9b8d2e4f1a7b0c3e5d7f9a1b2c4e6f8a0d2c4e6f8a0d
JWT_ACCESS_EXPIRY=7d
JWT_REFRESH_EXPIRY=30d
JWT_RESET_PASSWORD_EXPIRY=10m
JWT_VERIFY_EMAIL_EXPIRY=24h

# Allowed Frontend Origins (CORS)
CLIENT_URL=https://civicsedu.com
ADMIN_URL=https://admin.civicsedu.com

# Email Delivery (Gmail SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
EMAIL_FROM=CivicsEdu <your_email@gmail.com>

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Payments (Razorpay)
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
ALLOW_MOCK_PAYMENTS=false

# Live Streaming (LiveKit)
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=10000
```

5. **Set Custom Domain in Render**:
   - Go to **Settings > Custom Domains** ➔ Add: `api.civicsedu.com`.

---

### Step 4: Student Client Deployment (Vercel)

1. Go to **[vercel.com](https://vercel.com/dashboard)**.
2. Click **Add New... > Project** ➔ Import `itinfo60/testbook-platform`.
3. Configure Project:
   - **Project Name**: `civicsedu-client`
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click **Edit** ➔ Select **`client`**
4. **Environment Variables**:
   ```env
   VITE_API_URL=https://api.civicsedu.com/api/v1
   VITE_SOCKET_URL=https://api.civicsedu.com
   VITE_TENANT_ID=your_tenant_id
   VITE_RAZORPAY_KEY_ID=your_razorpay_key_id
   VITE_ALLOW_MOCK_PAYMENTS=false
   VITE_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
   VITE_SUPABASE_URL=https://adzwarjoradodbdzlldu.supabase.co
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
5. Click **Deploy**.
6. **Set Domains in Vercel**:
   - Go to **Settings > Domains** ➔ Add: `civicsedu.com` and `www.civicsedu.com`.

---

### Step 5: Admin Dashboard Deployment (Vercel)

1. In Vercel, click **Add New... > Project** ➔ Import `itinfo60/testbook-platform` a second time.
2. Configure Project:
   - **Project Name**: `civicsedu-admin`
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click **Edit** ➔ Select **`admin`**
3. **Environment Variables**:
   ```env
   VITE_API_URL=https://api.civicsedu.com/api/v1
   VITE_TENANT_ID=6a82a18008198c8684413371
   VITE_SUPABASE_URL=https://adzwarjoradodbdzlldu.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
4. Click **Deploy**.
5. **Set Domain in Vercel**:
   - Go to **Settings > Domains** ➔ Add: `admin.civicsedu.com`.

---

### Step 6: DNS Configuration (Cloudflare)

In your Cloudflare DNS table for `civicsedu.com`, ensure the following records exist:

| Type      | Name / Host  | Target / Value                                         | Proxy Status              | Purpose                     |
| :-------- | :----------- | :----------------------------------------------------- | :------------------------ | :-------------------------- |
| **CNAME** | `@` _(root)_ | `25d7be4a30357c88.vercel-dns-017.com`                  | **DNS only** (Grey cloud) | Student Web App (Vercel)    |
| **CNAME** | `www`        | `25d7be4a30357c88.vercel-dns-017.com`                  | **DNS only** (Grey cloud) | www Redirection (Vercel)    |
| **CNAME** | `admin`      | `25d7be4a30357c88.vercel-dns-017.com`                  | **DNS only** (Grey cloud) | Admin Portal (Vercel)       |
| **CNAME** | `api`        | `civicsedu-api.onrender.com`                           | **DNS only** (Grey cloud) | Backend API Server (Render) |
| **MX**    | `@`          | `eforward1.registrar-servers.com`                      | **DNS only**              | Namecheap Email Forwarding  |
| **TXT**   | `@`          | `"v=spf1 include:spf.efwd.registrar-servers.com ~all"` | **DNS only**              | SPF Anti-Spam Record        |

---

### Step 7: Google Cloud Console OAuth Setup

1. Go to **[console.cloud.google.com/apis/credentials](https://console.cloud.google.com/apis/credentials)**.
2. Click your OAuth 2.0 Web Client ID.
3. **Authorized JavaScript origins**:
   ```text
   https://civicsedu.com
   https://www.civicsedu.com
   https://admin.civicsedu.com
   https://adzwarjoradodbdzlldu.supabase.co
   ```
4. **Authorized redirect URIs**:
   ```text
   https://adzwarjoradodbdzlldu.supabase.co/auth/v1/callback
   ```
5. Click **Save**.

---

## 🔍 Verification & Health Check Endpoints

| Verification Test       | Command / URL                                                                                    | Expected Output                                                        |
| :---------------------- | :----------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------- |
| **Backend Live Status** | `GET https://api.civicsedu.com/health`                                                           | `{"success":true,"status":"healthy","version":"2.0.0"}`                |
| **API Endpoints List**  | `GET https://api.civicsedu.com/api/v1`                                                           | `{"success":true,"message":"CivicsEdu API v1"}`                        |
| **Student Web App**     | Open `https://civicsedu.com`                                                                     | Homepage loads with course catalog and video player                    |
| **Admin Login**         | Open `https://admin.civicsedu.com`                                                               | Admin login page with credentials form                                 |
| **CORS Check**          | `curl -i -X OPTIONS https://api.civicsedu.com/api/v1/courses -H "Origin: https://civicsedu.com"` | `HTTP/2 204` with `Access-Control-Allow-Origin: https://civicsedu.com` |

---

## 🛠️ Maintenance & Common Troubleshooting

### 1. Free Tier Render Spin-Down (Cold Starts)

- **Behavior**: Render free services go to sleep after 15 minutes of inactivity and take ~25 seconds to wake up on the first request.
- **Solution (100% Free)**: Use a free cron ping tool like **[cron-job.org](https://cron-job.org)** or **[UptimeRobot](https://uptimerobot.com)** to ping `https://api.civicsedu.com/health` every 10 minutes to keep the instance warm 24/7.

### 2. Redeploying After Code Updates

- Pushing commits to the `CourseApp` branch on GitHub triggers automatic deployments on:
  1. Render (Backend API)
  2. Vercel (`civicsedu-client`)
  3. Vercel (`civicsedu-admin`)
- If you update environment variables in Vercel, remember to trigger a **Manual Redeploy** with "Use existing Build Cache" **unchecked** so the new variables are compiled into Vite.

### 3. Database Schema Changes

To update Prisma database schema in production:

```bash
npx prisma db push
```

_(Render's build command automatically executes `npx prisma generate` to keep Prisma client types in sync)._

---

**© 2026 CivicsEdu Platform. All rights reserved.**
