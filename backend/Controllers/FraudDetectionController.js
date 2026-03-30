import pool from '../config/db.js';
import jwt from 'jsonwebtoken';

export const getPrevention = async (req, res) => {

  try {
    //get fraud prevention cases assinged to this investigator
    const user = req.user;
    const tokenId = user.id;

    const limit = parseInt(req.query.limit);
    const page = parseInt(req.query.page);
    const offset = (page - 1) * limit;

    const [result] = await pool.query(`SELECT COUNT(*) AS total FROM fraud_prevention WHERE assigned_to = ? `, [tokenId]);
    const total = result[0].total

    const sql = 'SELECT * FROM fraud_prevention WHERE assigned_to = ? LIMIT ? OFFSET ?';
    const [results] = await pool.query(sql, [tokenId, limit, offset]);
    res.json({ results,
      pagination: {
        totalPages: Math.ceil(total/limit)
      }
     });
  } catch (error) {
    console.log(error);
    res.json({ error: error });
  }
}

//get the detection case for the updating team
export const getDetectionCase = async (req, res) => {
  const { id } = req.params;

  try {
    const [getDetectionId] = await pool.execute(
      'SELECT id FROM fraud_detection WHERE fraud_prevention_id = ?',
      [id]
    );
    //if case not found return not found error 
    if (getDetectionId.length <= 0) return res.sendStatus(404) 

    const DetectionId = getDetectionId[0].id;

    // 2. Fetch the main fraud detection record
    const [detectionRows] = await pool.execute(
      `SELECT 
          fraud_prevention_id,
          background,
          findings,
          conclusion,
          abbreviations_terms_definitions,
          annexures,
          mandate,
          review_objective,
          approach_and_procedures_performed,
          restrictions_and_limitations,
          data_analyst_methodology,
          applicable_legislation_policies,
          observations,
          recommendations,
          general,
          status,
          conducted_by,
          referred_department,
          assigned_to,
          created_at,
          updated_at
       FROM fraud_detection
       WHERE id = ?`,
      [DetectionId]
    );

    if (!detectionRows || detectionRows.length === 0) {
      return res.status(404).json({ error: 'Detection case not found' });
    }

    const detectionData = detectionRows[0];
    // 3. Fetch related comments
    const [
      commentRows,
    ] = await pool.execute(
      `SELECT fc.id, fc.comment, fc.user_id, fc.user_name, fc.created_at
       FROM fraud_detection_comments fc
       WHERE fc.fraud_detection_id = ?
       ORDER BY fc.created_at ASC`,
      [DetectionId]
    );

    // 4. Return combined result
    return res.json({
      results: [detectionData],
      comments: commentRows,
    });
  } catch (error) {
    console.error('Error fetching detection case:', error);
    return res.status(500).json({ error: 'Server error' });
  }
};

export const updateCase = async (req, res) => {
  const { id } = req.params; // id here is fraud_prevention_id
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) return res.status(401).json({ error: "No token provided" });

  let DetectionId;
  let currentStatus;

  try {
    // Get primary id and current status using fraud_prevention_id
    const [getDetectionId] = await pool.execute(
      'SELECT id, status FROM fraud_detection WHERE fraud_prevention_id = ?',
      [id]
    );

    if (!getDetectionId.length) {
      return res.status(404).json({ error: "Fraud detection case not found" });
    }

    DetectionId = getDetectionId[0].id;
    currentStatus = getDetectionId[0].status;

    // Reject updates if status is not draft or returned
    if (!["draft", "returned"].includes(currentStatus)) {
      return res.status(403).json({
        error: "Update denied: This case is currently under review or approved and cannot be modified at this moment."
      });
    }

    // Decode token to get user id
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    const userId = decoded.id;

    const {
      background,
      findings,
      conclusion,
      abbreviations_terms_definitions,
      annexures,
      mandate,
      review_objective,
      approach_and_procedures_performed,
      restrictions_and_limitations,
      data_analyst_methodology,
      applicable_legislation_policies,
      observations,
      recommendations,
      general,
      status, // frontend can still send draft or review
      assigned_to,
      referred_department
    } = req.body;

    // Update the case
    await pool.query(
      `UPDATE fraud_detection SET
        background = ?,
        findings = ?,
        conclusion = ?,
        abbreviations_terms_definitions = ?,
        annexures = ?,
        mandate = ?,
        review_objective = ?,
        approach_and_procedures_performed = ?,
        restrictions_and_limitations = ?,
        data_analyst_methodology = ?,
        applicable_legislation_policies = ?,
        observations = ?,
        recommendations = ?,
        general = ?,
        status = ?,
        conducted_by = ?,
        assigned_to = ?,
        referred_department = ?,
        updated_at = NOW()
      WHERE id = ?`,
      [
        background,
        findings,
        conclusion,
        abbreviations_terms_definitions,
        annexures,
        mandate,
        review_objective,
        approach_and_procedures_performed,
        restrictions_and_limitations,
        data_analyst_methodology,
        applicable_legislation_policies,
        observations,
        recommendations,
        general,
        status || "draft", // default to draft if missing
        userId,
        assigned_to,
        referred_department,
        DetectionId,
      ]
    );

    return res.json({ message: "Fraud detection case updated successfully" });

  } catch (error) {
    console.error("Error updating fraud detection case:", error);
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Invalid token" });
    }
    return res.status(500).json({ error: "Server error" });
  }
};