# 🔧 Authentication Setup & Troubleshooting Guide

## ✅ What Was Fixed

1. ✅ Created `.env.local` file with environment variables
2. ✅ Improved error handling in auth routes
3. ✅ Better MongoDB connection error messages
4. ✅ Graceful fallback for initialization errors

---

## 🚀 Quick Fix - Option 1: Use Local MongoDB (Recommended for Development)

### Step 1: Install MongoDB Community Edition

**Windows:**
```bash
# Download from https://www.mongodb.com/try/download/community
# Install using the installer
# Default installation path: C:\Program Files\MongoDB\Server\7.0
```

**macOS:**
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get update
sudo apt-get install -y mongodb
sudo systemctl start mongodb
```

### Step 2: Verify MongoDB is Running

```bash
# Test connection
mongosh

# If connected, you'll see: test>
exit
```

### Step 3: Update `.env.local`

The file is already created at root level. Verify it has:

```
MONGODB_URI=mongodb://localhost:27017
JWT_SECRET=your-very-secure-jwt-secret-key-change-this-in-production
NODE_ENV=development
```

### Step 4: Restart Development Server

```bash
# Stop the current server (Ctrl+C)
# Restart
npm run dev
```

### Step 5: Test Login

```
Username: admin
Password: admin123
```

---

## 🚀 Quick Fix - Option 2: Use MongoDB Atlas (Cloud)

### Step 1: Create Free MongoDB Atlas Account

1. Go to https://www.mongodb.com/cloud/atlas
2. Click "Create an account" → Sign up
3. Create a free cluster (M0 tier)

### Step 2: Get Connection String

1. Go to "Database" → "Clusters"
2. Click "Connect"
3. Choose "Drivers" → "Node.js"
4. Copy the connection string

### Step 3: Update `.env.local`

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/exam_audit_system?retryWrites=true&w=majority
JWT_SECRET=your-very-secure-jwt-secret-key-change-this-in-production
NODE_ENV=development
```

Replace:
- `username` - Your MongoDB username
- `password` - Your MongoDB password
- `cluster` - Your cluster name

### Step 4: Restart Development Server

```bash
npm run dev
```

---

## 🐛 Troubleshooting

### Error: "MONGODB_URI not configured"

**Solution:**
1. Ensure `.env.local` exists in project root
2. Ensure it contains: `MONGODB_URI=mongodb://localhost:27017`
3. Restart dev server: `npm run dev`

### Error: "Failed to connect to MongoDB"

**Check MongoDB is running:**

```bash
# Windows (in PowerShell)
Get-Process mongod

# macOS/Linux
ps aux | grep mongod
```

**If not running, start it:**

Windows:
```bash
C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe
```

macOS:
```bash
brew services start mongodb-community
```

Linux:
```bash
sudo systemctl start mongodb
```

### Still Getting 500 Error?

Check browser console for detailed error:

1. Open **Developer Tools** (F12)
2. Go to **Console** tab
3. Look for error messages
4. Check **Network** → **api/auth/login** → **Response**

### Login Button Not Responding

**Solution:**

```bash
# Clear browser cache
# Ctrl+Shift+Delete → Clear all

# Or hard refresh
# Ctrl+Shift+R

# Restart dev server
npm run dev
```

---

## 📝 File Changes Made

### 1. Created `.env.local`
```
MONGODB_URI=mongodb://localhost:27017
JWT_SECRET=your-very-secure-jwt-secret-key
NODE_ENV=development
```

### 2. Improved `lib/mongodb.ts`
- Better error handling for missing URI
- Connection error logging
- Graceful error messages

### 3. Enhanced `app/api/auth/login/route.ts`
- Better error messages
- Admin initialization wrapped in try-catch
- Improved logging

### 4. Enhanced `app/api/auth/me/route.ts`
- Better error messages

---

## ✅ Step-by-Step Test

### Step 1: Verify Environment
```bash
# Terminal output should show:
npm run dev

# You should see:
# ▲ Next.js 15.x.x
# - Local: http://localhost:3000
```

### Step 2: Check MongoDB Connection
```bash
# In new terminal, run:
mongosh

# Result:
# test>

# Type:
exit
```

### Step 3: Test Login

1. Go to http://localhost:3000/login
2. Enter credentials:
   - **Username:** admin
   - **Password:** admin123
3. Click "Login"

**Expected result:** Redirected to dashboard

---

## 🔐 Security Notes

⚠️ **Change Default Credentials:**

After first login:
1. Go to Settings
2. Change admin password from `admin123` to a secure password
3. Change `JWT_SECRET` in `.env.local`

⚠️ **Production Environment:**

Never commit `.env.local` to git:

```bash
# Add to .gitignore
echo ".env.local" >> .gitignore
```

---

## 🆘 Need Help?

### Check Logs

**Browser Console (F12):**
```
Shows client-side errors
```

**Terminal:**
```
Shows server-side errors
```

### Verify Setup

```bash
# Check if .env.local exists
cat .env.local

# Check Node version (should be 18+)
node --version

# Check if MongoDB is installed
mongod --version
```

### Reset Everything

```bash
# Stop dev server (Ctrl+C)

# Clear node modules
rm -rf node_modules

# Reinstall
npm install

# Restart server
npm run dev
```

---

## 📌 Common Credentials

**Default Admin Account:**
```
Username: admin
Password: admin123
```

**Change this after first login!**

---

## 🎉 Success Indicators

✅ No 500 errors in console
✅ Can login with admin/admin123
✅ Redirected to dashboard
✅ User info shows in profile

---

**If still not working after following these steps, check:**

1. MongoDB running? → `mongosh`
2. `.env.local` exists? → `cat .env.local`
3. MONGODB_URI correct? → Check connection string
4. Dev server restarted? → `npm run dev`
5. Browser cache cleared? → Ctrl+Shift+Delete
