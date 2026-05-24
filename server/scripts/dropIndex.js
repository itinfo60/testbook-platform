import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const dropIndex = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');
    
    // The collection name is usually "enrollments"
    const db = mongoose.connection.db;
    const collection = db.collection('enrollments');
    
    console.log('Dropping index user_1_course_1');
    await collection.dropIndex('user_1_course_1');
    console.log('Index dropped successfully');
    
  } catch (error) {
    if (error.code === 27) {
      console.log('Index not found, perhaps already dropped.');
    } else {
      console.error('Error dropping index:', error);
    }
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected');
  }
};

dropIndex();
