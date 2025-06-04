// test-mongo.js
const { MongoClient } = require('mongodb');

const uri = "mongodb+srv://Sebastian:Sebastianilink@cluster0.a1a5tq2.mongodb.net/?retryWrites=true&w=majority&appName=Cluster";

async function testConnection() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log("Connected successfully to MongoDB!");
  } catch (error) {
    console.error("Connection failed:", error);
  } finally {
    await client.close();
  }
}

testConnection();
