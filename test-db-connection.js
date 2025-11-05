const mongoose = require('mongoose');

const testConnection = async () => {
    const database = "mongodb://localhost:27017/Web";
    
    console.log('🔍 Testing MongoDB Connection...\n');
    console.log('Database URL:', database);
    
    try {
        await mongoose.connect(database);
        console.log('✅ Successfully connected to database!');
        
        // List all collections
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('\n📁 Collections in database:');
        collections.forEach(col => {
            console.log('  -', col.name);
        });
        
        // Count documents in each collection
        console.log('\n📊 Document counts:');
        for (const col of collections) {
            const count = await mongoose.connection.db.collection(col.name).countDocuments();
            console.log(`  - ${col.name}: ${count} documents`);
        }
        
        // Check if users collection exists and has data
        const UserModel = require('./models/UserModel');
        const userCount = await UserModel.countDocuments();
        
        if (userCount === 0) {
            console.log('\n⚠️  WARNING: No users found in database!');
            console.log('   You need to register a user first.');
            console.log('   Visit: http://localhost:3000/users/register');
        } else {
            console.log('\n👥 Users in database:');
            const users = await UserModel.find({}, 'username role');
            users.forEach(user => {
                console.log(`  - ${user.username} (${user.role})`);
            });
        }
        
        await mongoose.connection.close();
        console.log('\n✅ Test completed successfully!');
        process.exit(0);
        
    } catch (error) {
        console.error('\n❌ Connection failed!');
        console.error('Error:', error.message);
        console.log('\n💡 Solutions:');
        console.log('  1. Make sure MongoDB is running:');
        console.log('     - Windows: net start MongoDB');
        console.log('     - Or run: mongod');
        console.log('  2. Check if MongoDB is listening on port 27017');
        console.log('  3. Verify database name is correct: Web');
        process.exit(1);
    }
};

testConnection();
