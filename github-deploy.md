# GitHub + Vercel Deployment Guide

## 🚀 Deploy VoteHub via GitHub (Recommended Alternative)

Since CLI installation may have issues, let's use GitHub integration for deployment.

### Step 1: Create GitHub Repository

1. **Go to GitHub**: https://github.com/new
2. **Repository name**: `votehub`
3. **Description**: `Cloud-based voting system with real-time updates`
4. **Set to Public** (or Private if you prefer)
5. **Don't initialize** with README (we have files already)
6. **Click "Create repository"**

### Step 2: Upload Your Project to GitHub

**Option A: GitHub Web Interface (Easiest)**
1. **Download your project** as ZIP
2. **Go to your new GitHub repository**
3. **Click "uploading an existing file"**
4. **Drag and drop all files** from your VotingSystem folder
5. **Commit message**: "Initial VoteHub deployment"
6. **Click "Commit changes"**

**Option B: Git Commands (if Git is installed)**
```bash
git init
git add .
git commit -m "Initial VoteHub deployment"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/votehub.git
git push -u origin main
```

### Step 3: Deploy to Vercel

1. **Go to Vercel**: https://vercel.com/dashboard
2. **Click "New Project"**
3. **Import Git Repository**
4. **Select your `votehub` repository**
5. **Configure Project**:
   - Framework Preset: **Other**
   - Root Directory: `./`
   - Build Command: `npm run build` (or leave default)
   - Output Directory: `public`
   - Install Command: `npm install`

### Step 4: Add Environment Variables

In Vercel dashboard, go to your project → Settings → Environment Variables:

| Name | Value |
|------|-------|
| `MONGODB_URI` | `mongodb+srv://kylebagatao_db_user:mdVCHE3XHnQxQjRB@votehub-cluster.0vz3oc2.mongodb.net/voting_system?retryWrites=true&w=majority&appName=VoteHub-Cluster` |
| `JWT_SECRET` | `votehub_super_secret_jwt_key_2024_production_ready` |
| `ADMIN_EMAIL` | `admin@votehub.com` |
| `ADMIN_PASSWORD` | `admin123` |
| `NODE_ENV` | `production` |
| `PORT` | `3000` |

### Step 5: Deploy

1. **Click "Deploy"**
2. **Wait for build to complete**
3. **Get your live URL**: `https://votehub-xyz.vercel.app`

## 🌐 Alternative: Netlify Deployment

### Netlify Option
1. **Go to Netlify**: https://app.netlify.com/start
2. **Connect to Git provider** (GitHub)
3. **Select your repository**
4. **Build settings**:
   - Build command: `npm run build`
   - Publish directory: `public`
5. **Add same environment variables**
6. **Deploy**

## 📱 Railway Deployment (Another Alternative)

1. **Go to Railway**: https://railway.app
2. **Deploy from GitHub**
3. **Select repository**
4. **Add environment variables**
5. **Deploy**

## ✅ Deployment Checklist

- [ ] GitHub repository created
- [ ] Code uploaded to GitHub
- [ ] Vercel account created
- [ ] Project imported to Vercel
- [ ] Environment variables added
- [ ] Deployment successful
- [ ] Live URL working
- [ ] Database connection verified
- [ ] Admin login functional

## 🔗 Your Live URLs

After deployment, you'll have:
- **Main App**: `https://your-app.vercel.app`
- **Admin Panel**: `https://your-app.vercel.app` (login with admin@votehub.com)
- **API**: `https://your-app.vercel.app/api/health`

## 🎯 Next: APK Conversion

Once deployed, use your live URL for APK conversion:
1. **PWA Builder**: https://www.pwabuilder.com
2. **Enter your live URL**
3. **Generate APK**

Your VoteHub is ready for the cloud! 🚀
