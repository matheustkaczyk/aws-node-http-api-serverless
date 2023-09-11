'use strict'

const { randomUUID } = require('crypto');

const previousResults = new Map()

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

module.exports.sendResponse = async (event) => {
  const { name, answers } = extractBody(event);
  const correctAnswers = answers.reduce((acc, answer, index) => {
    if (answer === correctQuestions[index]) {
      acc++
    }
    return acc
  }, 0)

  const result = {
    name,
    correctAnswers,
    totalAnswers: answers.length
  }

  const resultId = randomUUID()
  previousResults.set(resultId, { response: req.body, result })
  console.log(previousResults)

  return {
    statusCode: 201,
    body: JSON.stringify({
      resultId,
    __hypermedia: {
      href: `/results.html`,
      query: { id: resultId }
    }
  }),
  headers: {
    'Content-Type': 'application/json',
  }
  }
}

module.exports.getResult = async (event) => {
  const result = previousResults.get(event.pathParams.id)

  if (!result) {
    return {
      statusCode: 404,
      body: JSON.stringify({ error: 'Result not found' }),
      headers: {
        'Content-Type': 'application/json',
      }
    }
  }
  
  return {
    statusCode: 200,
    body: JSON.stringify(result),
    headers: {
      'Content-Type': 'application/json',
    }
  }
}