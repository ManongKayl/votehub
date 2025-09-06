const fs = require('fs');

// Your MongoDB connection string
const mongoUri = 'mongodb+srv://kylebagatao_db_user:mdVCHE3XHnQxQjRB@votehub-cluster.0vz3oc2.mongodb.net/voting_system?retryWrites=true&w=majority&appName=VoteHub-Cluster';

// Environment configuration
const envConfig = `# Database Configuration
MONGODB_URI=${mongoUri}

# JWT Configuration
JWT_SECRET=votehub_super_secret_jwt_key_2024_production_ready
JWT_EXPIRES_IN=7d

# Server Configuration
PORT=3000
NODE_ENV=development

# Admin Configuration
ADMIN_EMAIL=admin@votehub.com
ADMIN_PASSWORD=admin123

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
`;

// Write .env file
fs.writeFileSync('.env', envConfig);
console.log('✅ Environment file (.env) created successfully!');
console.log('✅ MongoDB connection string configured');
console.log('✅ JWT secret and admin credentials set');
