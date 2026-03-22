# JuanHR v3 — Windows Setup Guide

## Prerequisites (install in this order)
1. Node.js 20+ → https://nodejs.org
2. MySQL 8 → https://dev.mysql.com/downloads/installer/
3. Git → https://git-scm.com

---

## Step 1: Create the MySQL Database
Open MySQL Workbench or MySQL CLI and run:
```sql
CREATE DATABASE juanhr_v3 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'juanhr'@'localhost' IDENTIFIED BY 'juanhr_password';
GRANT ALL PRIVILEGES ON juanhr_v3.* TO 'juanhr'@'localhost';
FLUSH PRIVILEGES;
```

---

## Step 2: Setup Backend
```bash
cd backend
npm install
copy .env.example .env
# Edit .env with your MySQL credentials
npx prisma migrate dev --name init
npx prisma db seed
npm run start:dev
```
Backend runs at: http://localhost:3001

---

## Step 3: Setup Frontend
```bash
cd frontend
npm install
copy .env.example .env.local
npm run dev
```
Frontend runs at: http://localhost:3000

---

## Default Login (after seed)
- Email: admin@juanhr.com
- Password: Admin@123

---

## Folder Structure
```
juanhr/
├── backend/    ← NestJS API
├── frontend/   ← Next.js UI
└── SETUP.md
```
