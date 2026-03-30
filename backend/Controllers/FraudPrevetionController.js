import e from 'express';
import pool from '../config/db.js';
import jwt from 'jsonwebtoken';

export const getForensic = async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    //get the data from the query
    const limit = parseInt(req.query.limit);
    const page = parseInt(req.query.page);
    const offset = (page - 1) * limit;
    //get the data from the user here
    const user = req.user
    const tokenId = user.id;
    const [getTotal] = await connection.execute(`SELECT COUNT(*) AS total FROM forensic_investigation_report WHERE assigned_to = ?`, [tokenId]);
    const total = getTotal[0].total
    const sql = 'SELECT * FROM forensic_investigation_report WHERE assigned_to = ? LIMIT ? OFFSET ?';
    const [results] = await connection.query(sql, [tokenId, limit, offset]);
    res.json({ results,
      pagination: {
        totalPages: Math.ceil(total/limit)
      }
     });
  } catch (error) {
    console.log(error);
    res.json({ error: error });
  } finally {
    if(connection) connection.release();
  }
};

export const getFraudCase = async (req, res) => {
  const { id } = req.params;

  try {

    const [
      getFraudId,
    ] = await pool.execute(
      'SELECT id FROM fraud_prevention WHERE forensic_id = ?',
      [id]
    );
    const FraudId = getFraudId[0].id;



    // 2. Fetch the main fraud prevention record
    const [fraudRows] = await pool.execute(
      `SELECT
          forensic_id,
          executive_summary,
          abbreviations,
          annexures,
          individuals_featured,
          mandate,
          purpose_and_objective,
          scope_of_investigation,
          restrictions_and_limitations,
          legislative_policy_framework,
          review_methodology,
          tone_at_the_top,
          review_details,
          sequence_of_events,
          findings,
          conclusions,
          recommendations,
          general,
          fraud_prevention
       FROM fraud_prevention
       WHERE id = ?`,
      [FraudId]
    );

    if (!fraudRows || fraudRows.length === 0) {
      return res.status(404).json({ error: 'Fraud case not found' });
    }

    const fraudData = fraudRows[0];

    // 3. Fetch related comments
    const [
      commentRows,
    ] = await pool.execute(
      `SELECT fc.id, fc.comment, fc.user_id, fc.user_name, fc.created_at
       FROM fraud_prevention_comments fc
       WHERE fc.fraud_id = ?
       ORDER BY fc.created_at ASC`,
      [FraudId]
    );

    // 4. Return combined result
    return res.json({
      results: [fraudData],
      comments: commentRows,
    });
  } catch (error) {
    console.error('Error fetching fraud case:', error);
    return res.status(500).json({ error: 'Server error' });
  }
};

export const updateCase = async (req, res) => {
  const { id } = req.params; // id here is forensic_id
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) return res.status(401).json({ error: "No token provided" });

  let FraudId;
  let currentStatus;

  try {
    // Get primary id and current status using forensic_id
    const [getFraudId] = await pool.execute(
      'SELECT id, status FROM fraud_prevention WHERE forensic_id = ?',
      [id]
    );

    if (!getFraudId.length) {
      return res.status(404).json({ error: "Fraud prevention case not found" });
    }

    FraudId = getFraudId[0].id;
    currentStatus = getFraudId[0].status;

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
      executive_summary,
      abbreviations,
      annexures,
      individuals_featured,
      mandate,
      purpose_and_objective,
      scope_of_investigation,
      restrictions_and_limitations,
      legislative_policy_framework,
      review_methodology,
      tone_at_the_top,
      review_details,
      sequence_of_events,
      findings,
      conclusions,
      recommendations,
      general,
      fraud_prevention,
      status, // frontend can still send draft or review
      assigned_to,
    } = req.body;

    // Update the case
    await pool.query(
      `UPDATE fraud_prevention SET
        executive_summary = ?,
        abbreviations = ?,
        annexures = ?,
        individuals_featured = ?,
        mandate = ?,
        purpose_and_objective = ?,
        scope_of_investigation = ?,
        restrictions_and_limitations = ?,
        legislative_policy_framework = ?,
        review_methodology = ?,
        tone_at_the_top = ?,
        review_details = ?,
        sequence_of_events = ?,
        findings = ?,
        conclusions = ?,
        recommendations = ?,
        general = ?,
        fraud_prevention = ?,
        status = ?,
        conducted_by = ?,
        assigned_to = ?,
        updated_at = NOW()
      WHERE id = ?`,
      [
        executive_summary,
        abbreviations,
        annexures,
        individuals_featured,
        mandate,
        purpose_and_objective,
        scope_of_investigation,
        restrictions_and_limitations,
        legislative_policy_framework,
        review_methodology,
        tone_at_the_top,
        review_details,
        sequence_of_events,
        findings,
        conclusions,
        recommendations,
        general,
        fraud_prevention,
        status || "draft", // default to draft if missing
        userId,
        assigned_to,
        FraudId,
      ]
    );

    return res.json({ message: "Fraud prevention case updated successfully" });

  } catch (error) {
    console.error("Error updating fraud prevention case:", error);
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Invalid token" });
    }
    return res.status(500).json({ error: "Server error" });
  }
};

export const getInvestigators = async (req, res) => {
  const sql = `SELECT * FROM users WHERE role = 'fraud_prevention_investigator'`;
  const [results] = await pool.query(sql)
  res.status(200).json({ results: results })
}


export const getFraudCases = async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;

    //get the total number of items
    const [getTotal] = await connection.query(`SELECT COUNT(*) AS total FROM fraud_prevention fp LEFT JOIN users u ON fp.assigned_to = u.id`);
    const total = getTotal[0].total;

    // 1. Get all fraud prevention cases
    const [cases] = await connection.query(`
      SELECT 
        fp.*,
        u.name AS assigned_investigator_name
      FROM fraud_prevention fp
      LEFT JOIN users u ON fp.assigned_to = u.id
      LIMIT ? OFFSET ?
    `, [limit, offset]);

    // 2. Get comments for all cases in one query
    const [comments] = await connection.query(`
      SELECT 
        fc.id,
        fc.fraud_id,
        fc.user_id,
        u.name AS user_name,
        fc.comment,
        fc.created_at
      FROM fraud_prevention_comments fc
      LEFT JOIN users u ON fc.user_id = u.id 
    `);

    // 3. Attach comments to their respective case
    const results = cases.map((c) => ({
      ...c,
      comments: comments.filter((com) => com.fraud_id === c.id) || [],
    }));

    res.status(200).json({ results,
      pagination: {
        totalPages: Math.ceil(total/limit)
      }
     });
  } catch (error) {
    console.error("Error fetching fraud cases:", error);
    res.status(500).json({ error: "Server error" });
  }
};

export const getFraudReview = async (req, res) => {
  try {
    const { id } = req.params;



    // 1. Get the fraud prevention case by ID
    const [cases] = await pool.query(
      `SELECT 
         fp.*,
         u.name AS assigned_investigator_name
       FROM fraud_prevention fp
       LEFT JOIN users u ON fp.assigned_to = u.id
       WHERE fp.id = ?`,
      [id]
    );


    if (!cases.length) {
      return res.status(404).json({ error: "Fraud prevention case not found" });
    }

    const fraudCase = cases[0];

    // 2. Get comments for this case
    const [comments] = await pool.query(
      `SELECT 
         fc.id,
         fc.fraud_id,
         fc.user_id,
         u.name AS user_name,
         fc.comment,
         fc.created_at
       FROM fraud_prevention_comments fc
       LEFT JOIN users u ON fc.user_id = u.id
       WHERE fc.fraud_id = ?`,
      [id]
    );

    // 3. Attach comments
    fraudCase.comments = comments || [];

    res.status(200).json({ results: fraudCase });
  } catch (error) {
    console.error("Error fetching fraud case:", error);
    res.status(500).json({ error: "Server error" });
  }
};


export const closeCase = async (req, res) => {
  try {
    const { id } = req.params;
    const sql = `UPDATE fraud_prevention SET status = 'closed' WHERE id = ?`;
    const [result] = await pool.execute(sql, [id]);
    res.json({ message: 'success' })

  } catch (error) {
    console.error("Error fetching fraud case:", error);
    res.status(500).json({ error: "Server error" });
  }

}

export const referCase = async (req, res) => {
  try {
    const { id } = req.params;
    const { referred_department, status, recommendations } = req.body;
    const sql = 'UPDATE fraud_prevention SET referred_department = ?, status = ?, recommendations = ? WHERE id = ?';
    const [result] = await pool.execute(sql, [referred_department, status, recommendations, id]);
    res.status(200).json({ success: 'success' });
  } catch (error) {
    console.error("Error fetching fraud case:", error);
    res.status(500).json({ error: "Server error" });
  }
}

export const returnCase = async (req, res) => {
  try {
    const { id } = req.params;
    const { comments, status } = req.body;
    const [insertComment] = await pool.execute('INSERT INTO fraud_prevention_comments (fraud_id, comment) VALUES(?,?)', [id, comments]);
    const [updateStatus] = await pool.execute('UPDATE fraud_prevention SET status = ? WHERE id = ?', [status, id])
    res.status(200).json({ success: 'success' });
  } catch (error) {
    console.error("Error fetching fraud case:", error);
    res.status(500).json({ error: "Server error" });
  }
}


export const assignInvestigator = async (req, res) => {
  try {
    const { id } = req.params
    const { assigned_to, conducted_by, status } = req.body;
    const [updateFraudPreventionStatus] = await pool.execute('UPDATE fraud_prevention SET status = ? WHERE  id = ?', ['approved', id]);

    //first check for duplicates
    const [duplicates] = await pool.execute("SELECT * FROM  fraud_detection WHERE fraud_prevention_id = ?", [id]);
    console.log(duplicates.length)
    if(duplicates.length > 0) {
      const [updateCase] = await pool.query("UPDATE fraud_detection SET assigned_to = ? WHERE fraud_prevention_id = ?", [assigned_to, id]);
     return res.status(200).json({ success: 'success' });
    }

    //if no duplicates now you can insert into the db as a new row
    const [createCase] = await pool.execute('INSERT INTO fraud_detection (fraud_prevention_id, status, assigned_to) VALUES (?,?,?)', [id, 'draft', assigned_to]);
    res.status(200).json({ success: 'success' });
  } catch (error) {
    console.error("Error fetching fraud case:", error);
    res.status(500).json({ error: "Server error" });
  }
}  

export const verifyReview = async (req, res) => {
  try {
    const user = req.user;
    const [verify] = await pool.execute('SELECT fraud_prevention_review FROM access_rights WHERE user_id = ?', [user.id])
if (verify.length <= 0) return res.sendStatus(401);
if (verify[0].fraud_prevention_review == 0) return res.sendStatus(403);
    return res.sendStatus(200)
  } catch (error) {
    console.error("Error fetching fraud case:", error);
    res.status(500).json({ error: "Server error" });
  }
}

export const verifyDraft = async (req, res) => {
  try {
    const user = req.user;
    const [verify] = await pool.execute('SELECT fraud_prevention_draft FROM access_rights WHERE user_id = ?', [user.id])
    if (verify[0].fraud_prevention_draft == 0) return res.sendStatus(403);
    if (verify.length <= 0) return res.sendStatus(401)
    return res.sendStatus(200)
  } catch (error) {
    console.error("Error fetching fraud case:", error);
    res.status(500).json({ error: "Server error" });
  }
}



