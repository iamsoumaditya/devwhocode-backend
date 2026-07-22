import bcrypt from 'bcrypt';
const password = '12345678Aa_';
const saltRounds = 12;

bcrypt.hash(password, saltRounds, (err, hash) => {
  console.log(hash);
});
