'use strict';

const { sign, verify } = require('jsonwebtoken');
const { buildResponse } = require('./utils');
const { getUserByCredentials, createUser, createResult, getResult } = require('./database');

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
  
  const user = await getUserByCredentials(username, password);

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

  const { insertedId } = await createUser(username, password);

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

  const { insertedId } = await createResult(result);

  return buildResponse(201, { resultId: insertedId, username, __hypermedia: { href: `/results.html`, query: { id: insertedId } } });
}

module.exports.getResult = async (event) => {
  const authResult = await this.authorize(event);
  if (authResult.statusCode === 401) return authResult;

  const result = await getResult(event.queryStringParameters.id);

  if (!result) {
    return buildResponse(404, { error: 'Result not found' })
  }

  return buildResponse(200, result);
}