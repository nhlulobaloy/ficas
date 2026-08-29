import pool from '../config/db.js';
import { Request, Response } from 'express';

export const getCategoryPreli = async (req: Request, res: Response) => {
  try {
    const sql = `SELECT * FROM preli_categories`;
    const rows = await pool.query (sql);
    return res.json (rows[0]);
  } catch (error) {
    console.error (`Error occured: ${error}`);
    return res.json ({message: 'Error'});
  }
};

export const getSubCategoryPreli = async (req: Request, res: Response) => {
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

export const getDepartmentsPreli = async (req: Request, res: Response) => {
  try {
    const sql = 'SELECT * FROM preli_departments';
    const rows = await pool.query (sql);
    return res.json (rows[0]);
  } catch (error) {
    console.error (`Error occured: ${error}`);
    return res.json ({message: 'Error'});
  }
};
