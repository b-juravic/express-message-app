const { BCRYPT_WORK_FACTOR, CURRENT_TIME } = require("../config.js");
const db = require("../db");
const ExpressError = require("../expressError");
const bcrypt = require("bcrypt");
// const moment = require("moment-timezone");

/** User class for message.ly */

/** User of the site. */

class User {
  /** register new user -- returns
   *    {username, password, first_name, last_name, phone}
   */

  static async register({ username, password, first_name, last_name, phone }) {
    const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);
    const result = await db.query(
      `INSERT INTO users (username, password, first_name, last_name, phone, join_at, last_login_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING username, password, first_name, last_name, phone`,
      [
        username,
        hashedPassword,
        first_name,
        last_name,
        phone,
        CURRENT_TIME,
        CURRENT_TIME,
      ]
    );

    if (result.rows.length === 0) {
      throw new ExpressError("Invalid Inputs");
    }

    return result.rows[0];
  }

  /** Authenticate: is this username/password valid? Returns boolean. */

  static async authenticate(username, password) {
    const result = await db.query(
      `SELECT password
       FROM users
       WHERE username = $1`,
      [username]
    );

    const user = result.rows[0];

    if (user) {
      if ((await bcrypt.compare(password, user.password)) === true) {
        return true;
      }
    }

    return false;
  }

  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) {
    const result = await db.query(
      `UPDATE users
      SET last_login_at = $1
      WHERE username = $2
      RETURNING username, last_login_at`,
      [CURRENT_TIME, username]
    );

    if (result.rows.length === 0) {
      throw new ExpressError("Invalid Inputs");
    }

    return result.rows[0];
  }

  /** All: basic info on all users:
   * [{username, first_name, last_name}, ...] */

  static async all() {
    const result = await db.query(
      `SELECT username, first_name, last_name
      FROM users`
    );

    return result.rows;
  }

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */

  static async get(username) {
    const result = await db.query(
      `SELECT username, first_name, last_name, phone, join_at, last_login_at
      FROM users
      WHERE username = $1`,
      [username]
    );

    if (result.rows.length === 0) {
      throw new ExpressError("User not found");
    }

    return result.rows[0];
  }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  // [{id, {username, first_name, last_name, phone}, body, sent_at, read_at}]

  static async messagesFrom(username) {
    const result = await db.query(
      `SELECT m.id, u.username, u.first_name, u.last_name, u.phone, m.to_username, m.body, m.sent_at, m.read_at
      FROM messages as m
      JOIN users as u
      ON m.to_username = u.username
      WHERE m.from_username = $1`,
      [username]
    );

    if (result.rows.length === 0) {
      throw new ExpressError("Messages not found");
    }

    let messages = result.rows.map((item) => {
      return {
        id: item.id,
        to_user: {
          username: item.username,
          first_name: item.first_name,
          last_name: item.last_name,
          phone: item.phone,
        },
        body: item.body,
        sent_at: item.sent_at,
        read_at: item.read_at,
      };
    });

    return messages;
  }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {id, first_name, last_name, phone}
   */

  static async messagesTo(username) {
    const result = await db.query(
      `SELECT m.id, u.username, u.first_name, u.last_name, u.phone, m.from_username, m.body, m.sent_at, m.read_at
      FROM messages as m
      JOIN users as u
      ON m.from_username = u.username
      WHERE m.to_username = $1`,
      [username]
    );

    if (result.rows.length === 0) {
      throw new ExpressError("Messages not found");
    }

    let messages = result.rows.map((item) => {
      return {
        id: item.id,
        from_user: {
          username: item.username,
          first_name: item.first_name,
          last_name: item.last_name,
          phone: item.phone,
        },
        body: item.body,
        sent_at: item.sent_at,
        read_at: item.read_at,
      };
    });

    return messages;
  }
}

module.exports = User;
