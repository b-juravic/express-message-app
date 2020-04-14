const express = require("express");
const jwt = require("jsonwebtoken");
const { SECRET_KEY, BAD_REQUEST } = require("../config");
const router = new express.Router();
const User = require("../models/user");
const ExpressError = require("../expressError");
const { authenticateJWT } = require("../middleware/auth");

/** POST /login - login: {username, password} => {token}
 *
 * Make sure to update their last-login!
 *
 **/
router.post("/login", async function (req, res, next) {
  try {
    const { username, password } = req.body;
    let userAuthenticated = await User.authenticate(username, password);

    if (userAuthenticated) {
      let token = jwt.sign({ username }, SECRET_KEY);
      User.updateLoginTimestamp(username);
      return res.json({ token });
    }

    throw new ExpressError("Invalid uername/password", BAD_REQUEST);
  } catch (err) {
    return next(err);
  }
});

/** POST /register - register user: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 *
 *  Make sure to update their last-login!
 */

router.post("/register", async function (req, res, next) {
  try {
    const { username, password, first_name, last_name, phone } = req.body;

    let registeredUser = await User.register({
      username,
      password,
      first_name,
      last_name,
      phone,
    });

    let token = jwt.sign({ username }, SECRET_KEY);

    User.updateLoginTimestamp(username);

    return res.json({ token });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
