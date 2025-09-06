# VoteHub Cloud Deployment Guide

## 🚀 Deploy to Vercel (Recommended)

### Step 1: Create Vercel Account
- Visit: https://vercel.com/signup
- Sign up with GitHub, GitLab, or email
- Verify your account

### Step 2: Install Vercel CLI
Open Command Prompt/PowerShell and run:
```bash
npm install -g vercel
```

### Step 3: Deploy Your App
In your project directory:
```bash
cd C:\Users\LeaveBROKE\CascadeProjects\VotingSystem
vercel login
vercel --prod
```

Follow the prompts:
- **Set up and deploy?** → Y
- **Which scope?** → Your account
- **Link to existing project?** → N
- **Project name?** → votehub
- **Directory?** → ./
- **Override settings?** → N

### Step 4: Configure Environment Variables
After deployment, set your environment variables:

```bash
vercel env add MONGODB_URI
```
Paste your MongoDB connection string when prompted.

```bash
vercel env add JWT_SECRET
```
Enter: `votehub_super_secret_jwt_key_2024_production_ready`

```bash
vercel env add ADMIN_EMAIL
```
Enter: `admin@votehub.com`

```bash
vercel env add ADMIN_PASSWORD
```
Enter: `admin123`

### Step 5: Redeploy with Environment Variables
```bash
vercel --prod
```

## 🌐 Alternative: Deploy via GitHub

### Option A: GitHub Integration
1. **Push to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial VoteHub deployment"
   git branch -M main
   git remote add origin https://github.com/yourusername/votehub.git
   git push -u origin main
   ```

2. **Import to Vercel**:
   - Go to Vercel dashboard
   - Click "New Project"
   - Import from GitHub
   - Select your repository
   - Add environment variables in dashboard

## 📱 Your Deployed App

After deployment, you'll get:
- **Live URL**: `https://votehub-xyz.vercel.app`
- **Admin Panel**: `https://votehub-xyz.vercel.app` (login with admin credentials)
- **API Endpoints**: `https://votehub-xyz.vercel.app/api/*`

## 🔧 Environment Variables Summary

Set these in Vercel dashboard or CLI:

| Variable | Value |
|----------|-------|
| `MONGODB_URI` | Your MongoDB Atlas connection string |
| `JWT_SECRET` | `votehub_super_secret_jwt_key_2024_production_ready` |
| `ADMIN_EMAIL` | `admin@votehub.com` |
| `ADMIN_PASSWORD` | `admin123` |
| `NODE_ENV` | `production` |

## ✅ Deployment Checklist

- [ ] Vercel account created
- [ ] Vercel CLI installed
- [ ] App deployed successfully
- [ ] Environment variables configured
- [ ] Database connection working
- [ ] Admin login functional
- [ ] HTTPS enabled (automatic)
- [ ] Ready for APK conversion

## 🆘 Troubleshooting

**Build Failed?**
- Check Node.js version compatibility
- Ensure all dependencies in package.json

**Database Connection Error?**
- Verify MongoDB Atlas network access (0.0.0.0/0)
- Check connection string format
- Ensure environment variables are set

**Admin Login Not Working?**
- Run database setup script first
- Check admin credentials in environment variables

Your VoteHub app will be live and ready for APK conversion! 🎉
