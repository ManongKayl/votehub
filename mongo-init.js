// MongoDB initialization script for Docker
db = db.getSiblingDB('voting_system');

// Create admin user
db.createUser({
  user: 'votehub_admin',
  pwd: 'votehub_admin_password',
  roles: [
    {
      role: 'readWrite',
      db: 'voting_system'
    }
  ]
});

// Create collections with indexes
db.createCollection('users');
db.createCollection('polls');
db.createCollection('votes');

// Create indexes for better performance
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ username: 1 }, { unique: true });
db.users.createIndex({ createdAt: -1 });

db.polls.createIndex({ creator: 1 });
db.polls.createIndex({ isActive: 1, isPublic: 1 });
db.polls.createIndex({ category: 1 });
db.polls.createIndex({ createdAt: -1 });
db.polls.createIndex({ endDate: 1 });
db.polls.createIndex({ totalVotes: -1 });

db.votes.createIndex({ poll: 1, user: 1 });
db.votes.createIndex({ poll: 1, createdAt: -1 });
db.votes.createIndex({ user: 1, createdAt: -1 });

print('Database initialization completed successfully!');
