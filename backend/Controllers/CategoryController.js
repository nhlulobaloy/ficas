import pool from '../config/db.js';

export const getCategory = async (req, res) => {
    try {
        const sql = `SELECT * FROM CATEGORIES`;
        const rows = await pool.query(sql);
        return res.json(rows[0])
    } catch (error) {
    console.error(`Error occured: ${error}`)
    return res.json({message: 'Error'}) 
    }
}