import pool from '../config/db.js';

export const getCategoryPreli = async (req, res) => {
  try {
    const sql = `SELECT * FROM preli_categories`;
    const rows = await pool.query (sql);
    return res.json (rows[0]);
  } catch (error) {
    console.error (`Error occured: ${error}`);
    return res.json ({message: 'Error'});
  }
};

export const getSubCategoryPreli = async (req, res) => {
  try {
    const {category} = req.query;

    const sql = `SELECT * FROM preli_subcategories WHERE category_id = ?`;
    const rows = await pool.query (sql, [category]);
    return res.json (rows[0]);
  } catch (error) {
    console.error (`Error occured: ${error}`);
    return res.json ({message: 'Error'});
  }
};

export const getDepartmentsPreli = async (req, res) => {
  try {
    const sql = 'SELECT * FROM preli_departments';
    const rows = await pool.query (sql);
    return res.json (rows[0]);
  } catch (error) {
    console.error (`Error occured: ${error}`);
    return res.json ({message: 'Error'});
  }
};
