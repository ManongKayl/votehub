@echo off
echo ========================================
echo       VoteHub Setup Script
echo ========================================
echo.

:: Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed!
    echo Please install Node.js from: https://nodejs.org
    echo Then run this script again.
    pause
    exit /b 1
)

echo ✅ Node.js is installed
echo.

:: Install dependencies
echo 📦 Installing dependencies...
npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)
echo ✅ Dependencies installed successfully
echo.

:: Check if .env file exists
if not exist .env (
    echo ⚠️  No .env file found. Creating from template...
    copy .env.example .env
    echo ✅ .env file created from template
    echo.
    echo 🔧 Please update your MongoDB connection string in .env file
    echo    Then run: node setup-database.js
    echo.
) else (
    echo ✅ .env file exists
    echo.
)

:: Ask if user wants to setup database
set /p setup_db="Do you want to setup the database now? (y/n): "
if /i "%setup_db%"=="y" (
    echo.
    echo 🗄️  Setting up database...
    node setup-database.js
    if %errorlevel% neq 0 (
        echo ❌ Database setup failed
        echo Please check your MongoDB connection string in .env file
        pause
        exit /b 1
    )
    echo ✅ Database setup completed
    echo.
)

:: Ask if user wants to start the server
set /p start_server="Do you want to start the server now? (y/n): "
if /i "%start_server%"=="y" (
    echo.
    echo 🚀 Starting VoteHub server...
    echo Server will be available at: http://localhost:3000
    echo Press Ctrl+C to stop the server
    echo.
    npm start
) else (
    echo.
    echo 🎉 Setup completed successfully!
    echo.
    echo To start the server later, run: npm start
    echo Server will be available at: http://localhost:3000
    echo.
    echo 📖 Check SETUP_GUIDE.md for deployment and APK conversion instructions
)

pause
