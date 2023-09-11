'use strict'

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
  res.status(201).json({
    resultId,
    __hypermedia: {
      href: `/results.html`,
      query: { id: resultId }
    }
  })
}