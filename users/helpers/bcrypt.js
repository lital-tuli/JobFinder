import bcrypt from "bcryptjs";

const generatePassword = (password) => bcrypt.hashSync(password, 10);

const comparePasswords = (password, cryptPassword) => {
  return bcrypt.compareSync(password, cryptPassword);
};

export { generatePassword, comparePasswords };