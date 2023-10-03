const { pbkdf2Sync } = require('crypto');

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

function hashPassword(password) {
    return pbkdf2Sync(password, process.env.SALT, 100000, 64, 'sha512').toString('hex');
}

module.exports = {
    buildResponse,
    hashPassword,
};