@echo off
echo ========================================
echo       VoteHub Cloud Deployment
echo ========================================
echo.

:: Check if Vercel CLI is installed
vercel --version >nul 2>&1
if %errorlevel% neq 0 (
    echo 📦 Installing Vercel CLI...
    npm install -g vercel
    if %errorlevel% neq 0 (
        echo ❌ Failed to install Vercel CLI
        echo Please install Node.js first: https://nodejs.org
        pause
        exit /b 1
    )
)

echo ✅ Vercel CLI is ready
echo.

:: Login to Vercel
echo 🔐 Logging into Vercel...
vercel login

:: Deploy the application
echo 🚀 Deploying VoteHub to Vercel...
vercel --prod

echo.
echo ⚙️  Now you need to set environment variables:
echo.
echo Run these commands one by one:
echo.
echo vercel env add MONGODB_URI
echo (Paste your MongoDB connection string)
echo.
echo vercel env add JWT_SECRET
echo (Enter: votehub_super_secret_jwt_key_2024_production_ready)
echo.
echo vercel env add ADMIN_EMAIL
echo (Enter: admin@votehub.com)
echo.
echo vercel env add ADMIN_PASSWORD
echo (Enter: admin123)
echo.
echo vercel env add NODE_ENV
echo (Enter: production)
echo.
echo After setting all variables, run: vercel --prod
echo.
pause
