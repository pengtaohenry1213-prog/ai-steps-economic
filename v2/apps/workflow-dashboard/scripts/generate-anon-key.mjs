import jwt from 'jsonwebtoken';

const secret = 'super-secret-jwt-token-with-at-least-32-characters-long';
const payload = {
  iss: 'supabase',
  ref: 'localhost',
  role: 'anon',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 31536000 // 1 year
};

const token = jwt.sign(payload, secret);
console.log('New Anon Key:');
console.log(token);
