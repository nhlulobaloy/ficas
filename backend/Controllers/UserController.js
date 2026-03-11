import pool from '../config/db.js';
import jwt from "jsonwebtoken";


//get all the user
export const getUsers = async (req, res) => {
    try {
        const sql = `SELECT 
                       id,
                       name,
                       email,
                       role 
                       FROM users`;// do not select the password
        const [results] = await pool.execute(sql)    
        return res.json(results)
    } catch (error) {
        console.error("DB Error:", error);
        return res.status(500).json({ error: "Failed to get users" });
    }
}
