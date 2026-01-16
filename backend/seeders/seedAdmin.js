import { User } from '../models/index.js';
import { sequelize } from '../config/database.js';

export const seedAdmin = async () => {
  try {
    // Check if admin already exists
    const adminExists = await User.findOne({ where: { username: 'admin' } });
    
    if (!adminExists) {
      await User.create({
        username: 'admin',
        password: 'admin123', // Will be hashed by the beforeCreate hook
        email: 'admin@example.com',
        role: 'admin',
        active: true
      });
      console.log('✅ Admin user created: username=admin, password=admin123');
    } else {
      console.log('ℹ️  Admin user already exists');
    }

    // Create a default user
    const userExists = await User.findOne({ where: { username: 'user' } });
    
    if (!userExists) {
      await User.create({
        username: 'user',
        password: 'user123', // Will be hashed by the beforeCreate hook
        email: 'user@example.com',
        role: 'user',
        active: true
      });
      console.log('✅ Default user created: username=user, password=user123');
    } else {
      console.log('ℹ️  Default user already exists');
    }
  } catch (error) {
    console.error('❌ Error seeding users:', error);
  }
};

// Run seeder if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  sequelize.authenticate()
    .then(() => seedAdmin())
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Error:', error);
      process.exit(1);
    });
}
