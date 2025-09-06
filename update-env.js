const fs = require('fs');
const path = require('path');

function updateEnvironmentFile(mongoUri) {
  const envPath = path.join(__dirname, '.env');
  
  // Read current .env file
  let envContent = '';
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }
  
  // Update MongoDB URI
  const lines = envContent.split('\n');
  let mongoUriUpdated = false;
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('MONGODB_URI=')) {
      lines[i] = `MONGODB_URI=${mongoUri}`;
      mongoUriUpdated = true;
      break;
    }
  }
  
  // If MONGODB_URI not found, add it
  if (!mongoUriUpdated) {
    lines.push(`MONGODB_URI=${mongoUri}`);
  }
  
  // Write updated content back to .env
  fs.writeFileSync(envPath, lines.join('\n'));
  console.log('✅ Environment file updated successfully!');
}

// Get MongoDB URI from command line argument
const mongoUri = process.argv[2];

if (!mongoUri) {
  console.log('Usage: node update-env.js "your-mongodb-connection-string"');
  console.log('Example: node update-env.js "mongodb+srv://username:password@cluster.mongodb.net/voting_system"');
  process.exit(1);
}

updateEnvironmentFile(mongoUri);
