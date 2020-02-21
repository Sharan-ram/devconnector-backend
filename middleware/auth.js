const jwt = require("jsonwebtoken");
const config = require("config");

module.exports = async (req, res, next) => {
  const token = req.header("x-auth-token");
  if (!token) {
    return res.status(401).send("No token, authorization denied");
  }

  try {
    const decodedPayload = await jwt.verify(token, config.get("jwtSecret"));
    req.user = decodedPayload.user;

    next();
  } catch (err) {
    console.error(err.message);
    return res.status(401).send("Invalid token, authorization denied");
  }
};
