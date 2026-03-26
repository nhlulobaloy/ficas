import pool from '../config/db.js';

export const changePassword = () => {};

export const getProfile = async (req, res) => {
try {
    const user = req.user; // Get ID from token
    const [dbUser] = await pool.query(
        `SELECT id, name, email, role FROM users WHERE id = ?`, 
        [user.id]
    );
    res.json({ data: dbUser[0] });
} catch (error) {
    console.log(error)
    res.status(500).json({message: "An error occured", error: error});
}
};

export const updateProfile = async (req, res) => {
  const user = req.user;
  console.log(user.id)
  const { name, email } = req.body;
  const [results] = await pool.query(`UPDATE users SET name = ? , email = ? WHERE id = ?`, [name, email, user.id]);
  res.status(200).json({message: "User update was succesful"})
}
