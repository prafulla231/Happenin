// scripts/backup.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs/promises';

dotenv.config();

const collections = ['users', 'events', 'locations']; // collection names from your DB
const backupFolder = './backups';

async function backupDatabase() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    await fs.mkdir(backupFolder, { recursive: true });

    for (const name of collections) {
      const data = await mongoose.connection.db.collection(name).find({}).toArray();
      await fs.writeFile(`${backupFolder}/${name}.json`, JSON.stringify(data, null, 2));
      console.log(`✅ Backed up ${name}`);
    }

    console.log('🎉 All backups completed!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Backup failed:', err);
    process.exit(1);
  }
}

backupDatabase();
