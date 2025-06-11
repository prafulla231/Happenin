// scripts/restore.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs/promises';

dotenv.config();

const collections = ['users', 'events', 'locations'];
const backupFolder = './backups';

async function restoreDatabase() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    for (const name of collections) {
      const filePath = `${backupFolder}/${name}.json`;
      const raw = await fs.readFile(filePath);
      const data = JSON.parse(raw);

      const collection = mongoose.connection.db.collection(name);
      await collection.deleteMany({});
      await collection.insertMany(data);
      console.log(`✅ Restored ${name}`);
    }

    console.log('🎉 All restores completed!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Restore failed:', err);
    process.exit(1);
  }
}

restoreDatabase();
