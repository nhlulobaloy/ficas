import { userInfo } from 'node:os';
import pool from '../config/db.js';

export const getUsers = async (req, res) => {
    const [results] = await pool.query(
        'SELECT u.*, a.* FROM users u LEFT JOIN access_rights a ON u.id = a.user_id'
    );
    results.forEach(user => delete user.password);

    res.status(200).json({ results });
};

export const updateUser = async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();

    const { selectedUser } = req.body;

    if (!selectedUser) {
      return res.status(400).json({ error: "No selectedUser provided" });
    }

    // Convert all permission fields to Strings
const StringUser = {
  ...selectedUser,
  create_incident: selectedUser.create_incident ? String(selectedUser.create_incident) : '0',
  assign_incident: selectedUser.assign_incident ? String(selectedUser.assign_incident) : '0',
  update_preliminary: selectedUser.update_preliminary ? String(selectedUser.update_preliminary) : '0',
  review_preliminary: selectedUser.review_preliminary ? String(selectedUser.review_preliminary) : '0',
  review_forensic: selectedUser.review_forensic ? String(selectedUser.review_forensic) : '0',
  fraud_prevention_draft: selectedUser.fraud_prevention_draft ? String(selectedUser.fraud_prevention_draft) : '0',
  fraud_prevention_review: selectedUser.fraud_prevention_review ? String(selectedUser.fraud_prevention_review) : '0',
  fraud_detection_draft: selectedUser.fraud_detection_draft ? String(selectedUser.fraud_detection_draft) : '0',
  fraud_detection_review: selectedUser.fraud_detection_review ? String(selectedUser.fraud_detection_review) : '0',
};

    const {
      id,
      name,
      role,
      user_id,
      create_incident,
      assign_incident,
      update_preliminary,
      review_preliminary,
      review_forensic,
      fraud_prevention_draft,
      fraud_prevention_review,
      fraud_detection_draft,
      fraud_detection_review,
    } = StringUser;

    // Validate user exists
    const [validateUser] = await connection.query(
      `SELECT user_id FROM access_rights WHERE user_id = ?`,
      [user_id]
    );

    if (!validateUser.length) {
      return res.status(404).json({ error: "User not found in access_rights" });
    }

    // Update query
    const sql = `
      UPDATE access_rights
      SET create_incident = ?,
          assign_incident = ?,
          update_preliminary = ?,
          review_preliminary = ?,
          review_forensic = ?,
          fraud_prevention_draft = ?,
          fraud_prevention_review = ?,
          fraud_detection_draft = ?,
          fraud_detection_review = ?
      WHERE user_id = ?
    `;

    await connection.query(sql, [
      create_incident,
      assign_incident,
      update_preliminary,
      review_preliminary,
      review_forensic,
      fraud_prevention_draft,
      fraud_prevention_review,
      fraud_detection_draft,
      fraud_detection_review,
      user_id,
    ]);

    res.status(200).json({ message: "User permissions updated successfully" });

  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Server error" });
  } finally {
    if (connection) connection.release();
  }
}; 