const { initializeTables } = require('../config/database');
require('dotenv').config();

async function initDatabase() {
    try {
        console.log('🚀 Initializing Oro India database...');
        await initializeTables();
        console.log('✅ Database initialization completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Database initialization failed:', error);
        process.exit(1);
    }
}

initDatabase();