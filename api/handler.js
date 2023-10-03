'use strict';

const { pbkdf2Sync } = require('crypto');
const { MongoClient, ObjectId } = require('mongodb');
const { sign, verify } = require('jsonwebtoken');
const { buildResponse } = require('./utils');

let connectionPool = null;

async function connectDatabase() {
  if (connectionPool)  return connectionPool;
  
  const client = new MongoClient(process.env.MONGODB_CONNECTION_STRING);

  const connection = await client.connect();

  connectionPool = connection.db(process.env.MONGODB_DB_NAME);

  return connectionPool;
}

function extractBody(event) {
  const body = event?.body;

  if (body) {
    return JSON.parse(body);
  }

  return {
    statusCode: 422,
    body: JSON.stringify({ error: 'Invalid request' })
  };
}

module.exports.authorize = async (event) => {
  const [type, token] = event.headers.Authorization.split(' ');

  if (type !== 'Bearer') {
    return buildResponse(401, { error: 'Invalid token type' })
  }

  if(!token) {
    return buildResponse(401, { error: 'Token not provided' })
  }

  const decodedToken = verify(token, process.env.JWT_SECRET);

  if (!decodedToken) {
    return buildResponse(401, { error: 'Invalid token' })
  }

  return decodedToken;
}

module.exports.login = async (event) => {
  const { username, password } = extractBody(event);
  const hashedPass = pbkdf2Sync(password, process.env.SALT, 100000, 64, 'sha512').toString('hex');

  const client = await connectDatabase();
  const collection = await client.collection('users');
  const user = await collection.findOne({ username, password: hashedPass });

  if (!user) {
    return buildResponse(401, { error: 'Invalid credentials' })
  }

  const token = sign({ id: user._id, username }, process.env.JWT_SECRET, { expiresIn: '1h' });

  return buildResponse(200, { token });
}

module.exports.createUser = async (event) => {
  const { username, password } = extractBody(event);

  if (!username || !password) {
    return buildResponse(422, { error: 'Invalid request' })
  }

  const hashedPass = pbkdf2Sync(password, process.env.SALT, 100000, 64, 'sha512').toString('hex');

  const client = await connectDatabase();
  const collection = await client.collection('users');
  const { insertedId } = await collection.insertOne({ username, password: hashedPass });

  return buildResponse(201, { id: insertedId, username });
}

module.exports.sendResponse = async (event) => {
  const authResult = await this.authorize(event);
  if (authResult.statusCode === 401) return authResult;

  const { name, answers } = extractBody(event);
  const correctQuestions = [3, 1, 0, 2];

  const totalCorrectAnswers = answers.reduce((acc, answer, index) => {
    if (answer === correctQuestions[index]) {
      acc++
    }
    return acc
  }, 0)

  const result = {
    name,
    answers,
    totalCorrectAnswers,
    totalAnswers: answers.length
  }

  const client = await connectDatabase();
  const collection = await client.collection('results');
  const { insertedId } = await collection.insertOne(result);

  return buildResponse(201, { resultId: insertedId, username, __hypermedia: { href: `/results.html`, query: { id: insertedId } } });
}

module.exports.getResult = async (event) => {
  const authResult = await this.authorize(event);
  if (authResult.statusCode === 401) return authResult;

  const client = await connectDatabase();
  const collection = await client.collection('results');
  const result = await collection.findOne({ _id: new ObjectId(event.pathParameters.id) });

  if (!result) {
    return buildResponse(404, { error: 'Result not found' })
  }

  return buildResponse(200, result);
}