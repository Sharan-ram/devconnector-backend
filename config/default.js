module.exports = {
  mongoURI: `mongodb+srv://SharanRam:${process.env.MONGODB_PASSWORD}@cluster0-x2ow4.mongodb.net/test?retryWrites=true&w=majority`,
  jwtSecret: process.env.JWT_SECRET,
  githubClientId: process.env.GITHUB_CLIENT_ID,
  githubSecret: process.env.GITHUB_SECRET
};
