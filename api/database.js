const { MongoClient, ObjectId } = require('mongodb');
const { hashPassword } = require('./utils');

let connectionPool = null;

async function connectDatabase() {
    if (connectionPool)  return connectionPool;
    
    const client = new MongoClient(process.env.MONGODB_CONNECTION_STRING);
  
    const connection = await client.connect();
  
    connectionPool = connection.db(process.env.MONGODB_DB_NAME);
  
    return connectionPool;
}

async function getUserByCredentials(username, password) {
    const hashedPass = hashPassword(password);

    const client = await connectDatabase();
    const collection = await client.collection('users');
    const user = await collection.findOne({ username, password: hashedPass });

    if (!user) return null;

    return user;
}

async function createUser(username, password) {
    const hashedPass = hashPassword(password);

    const client = await connectDatabase();
    const collection = await client.collection('users');
    const user = await collection.insertOne({ username, password: hashedPass });

    return user;
}

async function createResult(result) {
    const client = await connectDatabase();
    const collection = await client.collection('results');
    const { insertedId } = await collection.insertOne(result);

    return insertedId;
}

async function getResult(id) {
    const client = await connectDatabase();
    const collection = await client.collection('results');
    const result = await collection.findOne({ _id: new ObjectId(id) });

    if (!result) return null;

    return result;
}

module.exports = {
    connectDatabase,
    getUserByCredentials,
    createUser,
    createResult,
    getResult,
}