const crypto = require('crypto');

// Generate a 32-byte (256-bit) random secret
const secret = crypto.randomBytes(32).toString('hex');

console.log('Generated JWT Secret:', secret);
console.log('Copy this secret and update your .env file with it');

// Generate a base64 URL-safe version if needed
const secretBase64 = crypto.randomBytes(32).toString('base64');
console.log('\nAlternative Base64 version:', secretBase64);
