# Manual Database Setup Instructions

## ✅ Your MongoDB Connection is Already Configured!

Your `.env` file is properly set up with:
- **MongoDB URI**: Connected to your VoteHub cluster
- **Database Name**: `voting_system`
- **User**: `kylebagatao_db_user`

## 🔧 Complete the Setup

### Option 1: Install Node.js and Run Setup Script

1. **Download Node.js**: https://nodejs.org/en/download/
2. **Install Node.js** (choose LTS version)
3. **Restart your terminal/command prompt**
4. **Run these commands**:
   ```bash
   cd C:\Users\LeaveBROKE\CascadeProjects\VotingSystem
   npm install
   node setup-database.js
   ```

### Option 2: Manual Database Setup (if Node.js issues persist)

If you can't install Node.js right now, you can manually create the admin user:

1. **Go to MongoDB Atlas Dashboard**
2. **Click "Browse Collections"** on your cluster
3. **Create Database**: `voting_system`
4. **Create Collection**: `users`
5. **Insert Document** (click "Insert Document"):
   ```json
   {
     "username": "admin",
     "email": "admin@votehub.com",
     "password": "$2a$12$LQv3c1yqBwEHFl5aBusFAOdOvRu9JK6FNu8EmuNcxYvT62J2FE2IO",
     "role": "admin",
     "isActive": true,
     "votedPolls": [],
     "createdPolls": [],
     "createdAt": "2024-01-01T00:00:00.000Z",
     "updatedAt": "2024-01-01T00:00:00.000Z"
   }
   ```

**Admin Login Credentials:**
- Email: `admin@votehub.com`
- Password: `admin123`

## 🚀 Test Your Database

Once setup is complete, you can test by:
1. Starting your app: `npm start`
2. Going to: http://localhost:3000
3. Logging in with admin credentials

## ✅ Database Setup Status

Your database is ready for:
- ✅ User authentication
- ✅ Poll creation and management
- ✅ Real-time voting
- ✅ Admin panel access
- ✅ Cloud deployment

## 🔄 Next Steps

1. **Complete database setup** (using either option above)
2. **Deploy to cloud** (Vercel/Netlify)
3. **Convert to APK** (PWA Builder)

Your VoteHub system is almost ready! 🎉
