import pool from "../config/db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import validator from "validator";
import env from "dotenv";

env.config();

export const SignUp = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    /* -------------------- Input Validation -------------------- */

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required."
      });
    }

    if (typeof name !== "string" || name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: "Invalid name."
      });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format."
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters."
      });
    }

    /* -------------------- Check Existing User -------------------- */

    const [existingUser] = await pool.query(
      "SELECT id FROM users WHERE email = ? LIMIT 1",
      [email]
    );

    if (existingUser.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Email already registered."
      });
    }

    /* -------------------- Hash Password -------------------- */

    const hashedPassword = await bcrypt.hash(password, 12);

    /* -------------------- Insert User -------------------- */

    await pool.query(
      "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
      [name.trim(), email.toLowerCase(), hashedPassword]
    );

    return res.status(201).json({
      success: true,
      message: "User created successfully."
    });

  } catch (error) {
    console.error("SignUp Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error."
    });
  }
};
export const Login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const sql = `SELECT * FROM users WHERE email = ?`;
    const [result] = await pool.query(sql, [email]);
    if (result.length === 0)
      return res.status(401).json({ message: "Invalid credentials" });

    const user = result[0];
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword)
      return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      process.env.SECRET_KEY,
      { expiresIn: "100000h" },
    );

    return res.json({
      message: "successful",
      token,
      name: user.name,
      role: user.role,
      id: user.id,
      email: user.email
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const VerifyToken = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) res.json({ valid: "false" });
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    return res.json({ valid: true, user: decoded });
  } catch (error) {
    console.error(`An error occured: ${error}`);
    return res.json({ valid: false });
  }
};

export const getUser = async (req, res) => {
   const user = req.user;
   res.status(200).json({user: user})
}
