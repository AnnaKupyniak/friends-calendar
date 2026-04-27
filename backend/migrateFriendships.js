const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'config/.env') }); 
const Friendship = require('./models/Friendship');

async function migrate() {
  try {
    const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/friends-calendar";
    await mongoose.connect(uri);
    console.log("Connected to MongoDB for migration...");

    // 1. Старі дружби (без поля status) робимо 'accepted'
    const res1 = await Friendship.updateMany(
      { status: { $exists: false } },
      { $set: { status: 'accepted' } }
    );
    console.log(`Updated ${res1.modifiedCount} old friendships to 'accepted'.`);

    // 2. Якщо є записи 'pending' без поля 'requester', видалимо їх або полагодимо
    // Найкраще видалити конфліктні "завислі" записи, щоб почати з чистого листа
    const res2 = await Friendship.deleteMany({
      status: 'pending',
      requester: { $exists: false }
    });
    console.log(`Deleted ${res2.deletedCount} invalid pending requests (missing requester).`);

    console.log("Migration completed successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

migrate();
