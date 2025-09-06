const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('./models/User');
const Poll = require('./models/Poll');

async function setupDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB successfully!');

    // Create indexes for better performance
    console.log('Creating database indexes...');
    
    await User.collection.createIndex({ email: 1 }, { unique: true });
    await User.collection.createIndex({ username: 1 }, { unique: true });
    await Poll.collection.createIndex({ creator: 1 });
    await Poll.collection.createIndex({ isActive: 1, isPublic: 1 });
    
    console.log('✅ Database indexes created successfully!');

    // Create default admin user
    console.log('Creating default admin user...');
    
    const adminExists = await User.findOne({ email: 'admin@votehub.com' });
    
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('admin123', 12);
      
      const adminUser = new User({
        username: 'admin',
        email: 'admin@votehub.com',
        password: hashedPassword,
        role: 'admin',
        isActive: true
      });
      
      await adminUser.save();
      console.log('✅ Default admin user created!');
      console.log('   Email: admin@votehub.com');
      console.log('   Password: admin123');
      console.log('   ⚠️  Please change this password after first login!');
    } else {
      console.log('ℹ️  Admin user already exists');
    }

    // Create sample polls for testing
    console.log('Creating sample polls...');
    
    const samplePollExists = await Poll.findOne({ title: 'Favorite Programming Language' });
    
    if (!samplePollExists && adminExists) {
      const samplePoll = new Poll({
        title: 'Favorite Programming Language',
        description: 'Vote for your favorite programming language',
        options: [
          { text: 'JavaScript', votes: 0, voters: [] },
          { text: 'Python', votes: 0, voters: [] },
          { text: 'Java', votes: 0, voters: [] },
          { text: 'C++', votes: 0, voters: [] },
          { text: 'Go', votes: 0, voters: [] }
        ],
        creator: adminExists._id,
        isActive: true,
        isPublic: true,
        category: 'Technology',
        allowMultipleVotes: false,
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      });
      
      await samplePoll.save();
      console.log('✅ Sample poll created!');
    }

    console.log('\n🎉 Database setup completed successfully!');
    console.log('\n📊 Database Statistics:');
    const userCount = await User.countDocuments();
    const pollCount = await Poll.countDocuments();
    console.log(`   Users: ${userCount}`);
    console.log(`   Polls: ${pollCount}`);
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    process.exit(1);
  }
}

// Run setup
setupDatabase();
