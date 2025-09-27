// src/lib/mongodb.ts
import { MongoClient, Db } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://Vercel-Admin-amana-bookstore:ryVS5nIXX9edpO5k@amana-bookstore.bczae1t.mongodb.net/?retryWrites=true&w=majority";
const MONGODB_DB = process.env.MONGODB_DB || 'amana-bookstore';

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    const db = client.db(MONGODB_DB);
    
    cachedClient = client;
    cachedDb = db;
    
    console.log('✅ Connected to MongoDB');
    return { client, db };
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw error;
  }
}

export async function getDatabase(): Promise<Db> {
  const { db } = await connectToDatabase();
  return db;
}

// Helper function to get collections
export async function getBooksCollection() {
  const db = await getDatabase();
  return db.collection('books');
}

export async function getReviewsCollection() {
  const db = await getDatabase();
  return db.collection('reviews');
}

export async function getCartCollection() {
  const db = await getDatabase();
  return db.collection('cart');
}
