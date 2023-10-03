function buildResponse(statusCode, body, headers) {
    return {
        statusCode,
        body: JSON.stringify(body),
        headers: {
            'Content-Type': 'application/json',
            ...headers,
        },
    };
}

module.exports = {
    buildResponse,
};