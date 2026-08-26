import pool from "../config/db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import validator from "validator";
import { NextFunction, Request, Response } from "express";
import { RowDataPacket } from "mysql2";
import { checkUserExists, createUser, findByEmail } from "../models/userModel.js";


export const SignUp = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    // Input Validation
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

    // Check Existing User
    const user = await checkUserExists(email);
    if (user) {
      return res.status(409).json({
        success: false,
        message: "Email already registered."
      });
    }

    // Insert User into the db
    const newUser = await createUser({ name, email, password });
    // check if the user is return
    if (!newUser) return res.status(500).json({ message: 'Internal server error' })

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

// refresh token
export const refreshToken = async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies.refreshToken; // get the refresh token from the cookie
    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh token required" });
    }
    const refreshKey = process.env.REFRESH_SECRET
    // Verify refresh token and generate a new one at the same time
    const tokenData = await generateToken(refreshToken, refreshKey!, 15)

    // Check if the refresh token exists in the DB
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM refresh_tokens WHERE refreshToken = ? AND user_id = ?",
      [refreshToken, tokenData.id]
    );

    if (rows.length === 0) return res.status(403).json({ message: "Invalid refresh token" });

    // return the new token if all the check are passed
    res.json({ token: tokenData.token });
  } catch (error) {
    res.status(403).json({ message: "Invalid refresh token" });
  }
};

/**
 * Verifies refresh token and generates a new access token
 * @param token - Refresh token stored in HTTP-only cookie
 * @param secretKey - Secret key for JWT verification and signing
 * @param expireTime - Expiration time in minutes
 * @returns New access token + decoded user data (id, name, email, role)
 */
const generateToken = async (token: string, secretKey: string, expireTime: number) => {

  const decoded = jwt.verify(token, secretKey!) as any
  const newToken = jwt.sign(
    { id: decoded.id, name: decoded.name, email: decoded.email, role: decoded.role },
    secretKey!,
    { expiresIn: `${expireTime}m` }
  );

  // return an object with all possible data that might be needed from the token
  return { token: newToken, id: decoded.id, name: decoded.name, email: decoded.email, role: decoded.role };
}

export const Login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    const findUserByEmail = await findByEmail(email) 
    if (findUserByEmail.length === 0)
      return res.status(401).json({ message: "Invalid credentials" });

    const user = findUserByEmail[0];
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword)
      return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      process.env.SECRET_KEY!,
      { expiresIn: "15m" },
    );

    const refreshToken = jwt.sign(
      { id: user.id },  // Only ID needed
      process.env.REFRESH_SECRET!,  // Different secret
      { expiresIn: "7d" }  // 7 days
    );

    await pool.query(
      "INSERT INTO refresh_tokens (user_id, refreshToken) VALUES (?, ?)",
      [user.id, refreshToken]
    );

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true, // cannot be accesed by javascript
      secure: process.env.NODE_ENV === 'production', // false - still in development
      sameSite: 'strict', // cookie can allow from this site
      maxAge: 7 * 24 * 60 * 60 * 1000 // seven day
    })

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

// verify user token
export const VerifyToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) res.json({ valid: "false" });
    const decoded = jwt.verify(token!, process.env.SECRET_KEY!);
    return res.json({ valid: true, user: decoded });
  } catch (error) {
    console.error(`An error occured: ${error}`);
    return res.json({ valid: false });
  }
};

export const getUser = async (req: Request, res: Response) => {
  const user = req.user;
  res.status(200).json({ user: user })
}

// handle user logout request
export const logout = async (req: Request, res: Response) => {

  try {
    const user = req.user;
    // check if token exists
    if (!user) return res.status(401).json({ "message": "invalid token" })
    // delete the user refresh token from the database using the user id
    const [result] = await pool.execute('DELETE FROM refresh_tokens WHERE user_id = ?', [user.id])
    // clear the cookie in the browser
    res.clearCookie("refreshToken")
    return res.status(200).json({ "message": 'Logout succesfull!!' })
  } catch (error) {
    console.log(error);
    res.status(500)
  }

}