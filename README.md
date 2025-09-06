# VoteHub - Democratic Voting Platform

A comprehensive, full-stack voting system built with Node.js, Express, MongoDB, and vanilla JavaScript. Features real-time updates, PWA capabilities, and can be converted to an APK for mobile deployment.

## 🚀 Features

### Core Functionality
- **User Authentication & Authorization**: Secure JWT-based authentication with role-based access control
- **Poll Creation & Management**: Create polls with multiple options, categories, and expiration dates
- **Real-time Voting**: Live vote updates using Socket.IO
- **Advanced Poll Options**: Public/private polls, multiple votes per user, poll categories
- **Data Visualization**: Interactive charts showing poll results and analytics
- **Admin Dashboard**: Comprehensive admin panel for user and poll management

### Technical Features
- **Progressive Web App (PWA)**: Installable app with offline functionality
- **Responsive Design**: Mobile-first design that works on all devices
- **Real-time Updates**: WebSocket integration for live poll updates
- **Offline Support**: Service worker for offline voting and poll creation
- **Cloud Ready**: Configured for deployment on Netlify, Vercel, and Docker
- **Security**: Rate limiting, input validation, and secure authentication

## 🛠️ Technology Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database with Mongoose ODM
- **Socket.IO** - Real-time communication
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing

### Frontend
- **Vanilla JavaScript** - No framework dependencies
- **CSS3** - Modern styling with CSS Grid and Flexbox
- **Chart.js** - Data visualization
- **Service Worker** - PWA functionality
- **WebSocket** - Real-time updates

### DevOps & Deployment
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **Netlify/Vercel** - Serverless deployment options
- **MongoDB Atlas** - Cloud database option

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- MongoDB 4.4+
- npm or yarn

### Local Development

1. **Clone the repository**
```bash
git clone <repository-url>
cd VotingSystem
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Start MongoDB**
```bash
# If using local MongoDB
mongod

# Or use Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

5. **Run the application**
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

6. **Access the application**
- Open http://localhost:3000 in your browser
- Default admin credentials: admin@votingsystem.com / admin123

### Docker Deployment

1. **Using Docker Compose (Recommended)**
```bash
docker-compose up -d
```

2. **Using Docker only**
```bash
# Build the image
docker build -t votehub .

# Run with MongoDB
docker run -d --name votehub-app -p 3000:3000 \
  -e MONGODB_URI=mongodb://your-mongodb-host:27017/voting_system \
  votehub
```

### Cloud Deployment

#### Netlify
1. Connect your GitHub repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `public`
4. Add environment variables in Netlify dashboard

#### Vercel
1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel`
3. Follow the prompts to deploy

#### MongoDB Atlas Setup
1. Create account at https://cloud.mongodb.com
2. Create a cluster
3. Get connection string
4. Update MONGODB_URI in environment variables

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/voting_system` |
| `JWT_SECRET` | Secret key for JWT tokens | Required |
| `JWT_EXPIRES_IN` | JWT token expiration | `7d` |
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment mode | `development` |
| `ADMIN_EMAIL` | Default admin email | `admin@votingsystem.com` |
| `ADMIN_PASSWORD` | Default admin password | `admin123` |

### Database Configuration

The application uses MongoDB with three main collections:
- **users**: User accounts and authentication
- **polls**: Poll data and configuration
- **votes**: Individual vote records

## 📱 PWA & APK Conversion

### PWA Features
- **Offline Support**: Cache polls and allow offline voting
- **Install Prompt**: Users can install the app on their devices
- **Push Notifications**: Real-time notifications for poll updates
- **Background Sync**: Sync offline actions when connection restored

### Converting to APK

#### Method 1: Using PWA Builder (Recommended)
1. Visit https://www.pwabuilder.com
2. Enter your deployed app URL
3. Click "Build My PWA"
4. Download the Android package

#### Method 2: Using Capacitor
1. Install Capacitor:
```bash
npm install @capacitor/core @capacitor/cli
npm install @capacitor/android
```

2. Initialize Capacitor:
```bash
npx cap init VoteHub com.votehub.app
```

3. Build and add Android platform:
```bash
npm run build
npx cap add android
npx cap sync
```

4. Open in Android Studio:
```bash
npx cap open android
```

## 🎯 Usage Guide

### For Users
1. **Register/Login**: Create an account or sign in
2. **Browse Polls**: View all public polls on the polls page
3. **Vote**: Click on a poll and select your choice
4. **Create Polls**: Use the create page to make new polls
5. **Manage**: View your created polls in "My Polls"

### For Administrators
1. **Access Admin Panel**: Login with admin credentials
2. **User Management**: View, activate/deactivate, or delete users
3. **Poll Management**: Monitor, moderate, or remove polls
4. **Analytics**: View usage statistics and trends

### API Endpoints

#### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PATCH /api/auth/updateMe` - Update profile
- `PATCH /api/auth/updatePassword` - Change password

#### Polls
- `GET /api/polls` - Get all polls
- `GET /api/polls/:id` - Get specific poll
- `POST /api/polls` - Create new poll
- `PATCH /api/polls/:id` - Update poll
- `DELETE /api/polls/:id` - Delete poll

#### Votes
- `POST /api/votes` - Cast a vote
- `GET /api/votes/my-votes` - Get user's votes
- `GET /api/votes/poll/:pollId` - Get poll votes (admin)

#### Admin
- `GET /api/admin/dashboard` - Dashboard statistics
- `GET /api/admin/users` - Manage users
- `GET /api/admin/polls` - Manage polls
- `GET /api/admin/analytics` - Usage analytics

## 🔒 Security Features

- **Input Validation**: All inputs are validated and sanitized
- **Rate Limiting**: Prevents spam and abuse
- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt for secure password storage
- **CORS Protection**: Configured for secure cross-origin requests
- **Helmet.js**: Security headers and protection
- **MongoDB Injection Prevention**: Mongoose schema validation

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test

# Run linting
npm run lint

# Check for security vulnerabilities
npm audit
```

## 📊 Performance

### Optimization Features
- **Lazy Loading**: Components loaded on demand
- **Caching**: Service worker caches for offline performance
- **Compression**: Gzip compression for faster loading
- **CDN Ready**: Static assets can be served from CDN
- **Database Indexing**: Optimized MongoDB queries

### Monitoring
- Health check endpoint: `/api/health`
- Performance metrics in admin dashboard
- Real-time connection status

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

### Development Guidelines
- Follow ESLint configuration
- Write meaningful commit messages
- Add comments for complex logic
- Test new features thoroughly
- Update documentation as needed

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Troubleshooting

### Common Issues

**MongoDB Connection Error**
```bash
# Check if MongoDB is running
sudo systemctl status mongod

# Start MongoDB
sudo systemctl start mongod
```

**Port Already in Use**
```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>
```

**PWA Not Installing**
- Ensure HTTPS is enabled (required for PWA)
- Check manifest.json is accessible
- Verify service worker is registered

**Real-time Updates Not Working**
- Check WebSocket connection in browser dev tools
- Verify Socket.IO is properly initialized
- Check firewall settings for WebSocket connections

### Support

For support and questions:
- Create an issue on GitHub
- Check existing documentation
- Review the troubleshooting section

## 🚀 Roadmap

### Planned Features
- [ ] Email notifications for poll results
- [ ] Poll templates and themes
- [ ] Advanced analytics and reporting
- [ ] Social media integration
- [ ] Multi-language support
- [ ] Poll scheduling and automation
- [ ] Advanced user roles and permissions
- [ ] API rate limiting per user
- [ ] Webhook integrations
- [ ] Export poll results to PDF/Excel

### Version History
- **v1.0.0** - Initial release with core voting functionality
- **v1.1.0** - PWA support and offline functionality (planned)
- **v1.2.0** - Advanced analytics and reporting (planned)

---

Built with ❤️ for democratic decision making
