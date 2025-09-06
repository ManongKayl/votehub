# VoteHub Complete Setup Guide

## 🎯 Overview
This guide will help you:
1. Set up MongoDB database (cloud)
2. Deploy to cloud service
3. Convert to APK for mobile

---

## 📊 Step 1: Database Setup (MongoDB Atlas)

### 1.1 Create MongoDB Atlas Account
1. Visit: https://www.mongodb.com/cloud/atlas/register
2. Sign up with your email
3. Choose **FREE M0 Sandbox** (512MB storage)
4. Select cloud provider (AWS recommended)
5. Choose region closest to you

### 1.2 Create Database Cluster
1. Click "Create Cluster"
2. Choose "Shared" (Free tier)
3. Keep default settings
4. Click "Create Cluster" (takes 3-5 minutes)

### 1.3 Configure Database Access
1. Go to "Database Access" in left sidebar
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Username: `votehub_user`
5. Password: Generate secure password (save it!)
6. Database User Privileges: "Read and write to any database"
7. Click "Add User"

### 1.4 Configure Network Access
1. Go to "Network Access" in left sidebar
2. Click "Add IP Address"
3. Choose "Allow Access from Anywhere" (0.0.0.0/0)
4. Click "Confirm"

### 1.5 Get Connection String
1. Go to "Clusters" in left sidebar
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Copy the connection string (looks like):
   ```
   mongodb+srv://votehub_user:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. Replace `<password>` with your actual password
6. Add database name at the end: `/voting_system`

**Final connection string example:**
```
mongodb+srv://votehub_user:yourpassword@cluster0.xxxxx.mongodb.net/voting_system?retryWrites=true&w=majority
```

### 1.6 Update Environment Variables
Run this command with your connection string:
```bash
node update-env.js "your-mongodb-connection-string-here"
```

### 1.7 Initialize Database
```bash
node setup-database.js
```

This creates:
- Database indexes for performance
- Default admin user (admin@votehub.com / admin123)
- Sample poll for testing

---

## ☁️ Step 2: Cloud Deployment

### Option A: Deploy to Vercel (Recommended)

#### 2.1 Install Vercel CLI
```bash
npm install -g vercel
```

#### 2.2 Deploy
```bash
vercel --prod
```

Follow the prompts:
- Link to existing project? **N**
- Project name: **votehub**
- Directory: **.**
- Override settings? **N**

#### 2.3 Set Environment Variables
```bash
vercel env add MONGODB_URI
vercel env add JWT_SECRET
vercel env add ADMIN_EMAIL
vercel env add ADMIN_PASSWORD
```

### Option B: Deploy to Netlify

#### 2.1 Install Netlify CLI
```bash
npm install -g netlify-cli
```

#### 2.2 Deploy
```bash
netlify deploy --prod --dir=public
```

#### 2.3 Set Environment Variables
Go to Netlify dashboard → Site settings → Environment variables

### Option C: Deploy to Railway

#### 2.1 Install Railway CLI
```bash
npm install -g @railway/cli
```

#### 2.2 Deploy
```bash
railway login
railway init
railway up
```

---

## 📱 Step 3: Convert to APK

### Option A: PWA Builder (Easiest)

#### 3.1 Deploy Your App First
Make sure your app is deployed and accessible via HTTPS.

#### 3.2 Generate APK
1. Visit: https://www.pwabuilder.com
2. Enter your deployed app URL
3. Click "Start"
4. Review PWA score (should be high)
5. Click "Package For Stores"
6. Choose "Android"
7. Configure app details:
   - Package ID: `com.votehub.app`
   - App name: `VoteHub`
   - Version: `1.0.0`
8. Click "Generate Package"
9. Download the APK file

### Option B: Capacitor (Advanced)

#### 3.1 Install Capacitor
```bash
npm install @capacitor/core @capacitor/cli @capacitor/android
```

#### 3.2 Initialize Capacitor
```bash
npx cap init VoteHub com.votehub.app --web-dir=public
```

#### 3.3 Add Android Platform
```bash
npx cap add android
```

#### 3.4 Copy Web Assets
```bash
npx cap copy
```

#### 3.5 Open in Android Studio
```bash
npx cap open android
```

#### 3.6 Build APK in Android Studio
1. Install Android Studio if not installed
2. Open the project when Android Studio launches
3. Go to Build → Generate Signed Bundle/APK
4. Choose APK
5. Follow the signing wizard
6. Build APK

---

## 🚀 Quick Start Commands

After completing database setup:

```bash
# Install dependencies (if not done)
npm install

# Start development server
npm run dev

# Start production server
npm start

# Setup database
node setup-database.js

# Update environment variables
node update-env.js "your-mongodb-uri"
```

---

## 🔧 Default Credentials

**Admin Login:**
- Email: `admin@votehub.com`
- Password: `admin123`

⚠️ **Change these credentials after first login!**

---

## 📋 Checklist

### Database Setup
- [ ] MongoDB Atlas account created
- [ ] Cluster created and running
- [ ] Database user configured
- [ ] Network access configured
- [ ] Connection string obtained
- [ ] Environment variables updated
- [ ] Database initialized with setup script

### Cloud Deployment
- [ ] Deployment platform chosen
- [ ] App deployed successfully
- [ ] Environment variables configured
- [ ] HTTPS enabled
- [ ] App accessible via web

### APK Conversion
- [ ] PWA score verified (90+)
- [ ] APK generated successfully
- [ ] APK tested on Android device
- [ ] App installs and works offline

---

## 🆘 Troubleshooting

### Database Issues
- **Connection timeout**: Check network access settings
- **Authentication failed**: Verify username/password
- **Database not found**: Ensure database name in connection string

### Deployment Issues
- **Build failed**: Check Node.js version compatibility
- **Environment variables**: Ensure all required vars are set
- **HTTPS required**: Most platforms auto-enable HTTPS

### APK Issues
- **PWA score low**: Check manifest.json and service worker
- **Install failed**: Enable "Unknown sources" on Android
- **App crashes**: Check console logs in web version

---

## 📞 Support

If you encounter issues:
1. Check the console logs
2. Verify all environment variables
3. Test locally first
4. Check deployment platform documentation

Your VoteHub app is now ready for production! 🎉
