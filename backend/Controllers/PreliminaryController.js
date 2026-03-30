import pool from '../config/db.js';
import jwt from 'jsonwebtoken'

// Create Preliminary Investigation record
export const createPreli = async (req, res) => {
  try {
    const data = req.body;
    // Destructure the fields
    const {
      incident_id,
      mandate,
      allegations,
      acknowledgement_details,
      case_category,
      case_subcategory,
      domicile_department,
      key_stakeholders,
      incident_scene,
      amount_involved,
      persons_to_notify,
      persons_featured,
      legal_framework,
      preliminary_findings,
      annexures,
      recommendations,
      conducted_by,
      reviewed_by,
      approved_by,
      status,
    } = data;

    // Insert into database
    const [result] = await pool.query(
      `INSERT INTO preliminary_investigations 
      (incident_id, mandate, allegations, acknowledgement_details, case_category, case_subcategory, domicile_department,
      key_stakeholders, incident_scene, amount_involved, persons_to_notify, persons_featured,
      legal_framework, preliminary_findings, annexures, recommendations, conducted_by, reviewed_by, approved_by, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        incident_id,
        mandate,
        allegations,
        acknowledgement_details,
        case_category,
        case_subcategory,
        domicile_department,
        key_stakeholders,
        incident_scene,
        amount_involved,
        persons_to_notify,
        persons_featured,
        legal_framework,
        preliminary_findings,
        annexures,
        recommendations,
        conducted_by,
        reviewed_by,
        approved_by,
        status,
      ]
    );

    res.status(201).json({
      message: 'Preliminary Investigation created',
      id: result.insertId,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Error creating Preliminary Investigation',
      error: error.message,
    });
    //
  }
};


//get a single prelimianary to 
export const getPreli = async (req, res) => {
  try {
    const { incident_id } = req.params;

    let userId;
    const user = req.user;
    try {

      userId = user.id;
    } catch {
      return res.status(401).json({ error: "Invalid token" });
    }

    // Fetch preliminary investigation assigned to this user
    const sql = `
      SELECT pi.*,
             i.incident_number,
             i.complainant_name,
             CONCAT(u.name, ' (', u.email, ')') AS assigned_investigator_name,
             c.name AS case_category,
             sc.name AS case_subcategory,
             d.name AS domicile_department
      FROM preliminary_investigations pi
      INNER JOIN incidents i ON pi.incident_id = i.id AND i.assigned_to = ?
      LEFT JOIN users u ON i.assigned_to = u.id
      LEFT JOIN preli_categories c ON pi.case_category = c.id
      LEFT JOIN preli_subcategories sc ON pi.case_subcategory = sc.id
      LEFT JOIN preli_departments d ON pi.domicile_department = d.id
      WHERE pi.incident_id = ?
      LIMIT 1
    `;

    const [rows] = await pool.query(sql, [userId, incident_id]);

    if (!rows.length) {
      return res
        .status(404)
        .json({ message: "Investigation not found or not assigned to you" });
    }

    const prelim = rows[0];

    // Fetch all comments
    const [comments] = await pool.query(
      `SELECT * FROM preliminary_comments WHERE preliminary_id = ? ORDER BY created_at ASC`,
      [prelim.id]
    );

    prelim.comments = comments || [];

    return res.json({ message: "success", data: prelim });
  } catch (error) {
    console.error("DB Error:", error);
    return res.status(500).json({ error: "Failed to get preliminary investigation" });
  }
};


// updatePreli.js
export const updatePreli = async (req, res) => {
  const data = req.body;
  const incidentId = Number(data.incident_id);
  const user = req.user;
  const userId = user.id;
  const userName = user.name;
  try {
    /* 1️⃣ CHECK INCIDENT + ASSIGNMENT */
    const [incidentRows] = await pool.query(
      `SELECT assigned_to FROM incidents WHERE id = ?`,
      [incidentId]
    );

    if (incidentRows.length === 0)
      return res.status(404).json({ error: "Incident not found" });

    if (incidentRows[0].assigned_to !== userId)
      return res.status(403).json({ error: "You are not assigned to this incident" });

    /* 2️⃣ CHECK PRELI STATUS */
    const [preliRows] = await pool.query(
      `SELECT status FROM preliminary_investigations WHERE incident_id = ?`,
      [incidentId]
    );

    if (preliRows.length === 0)
      return res.status(404).json({ error: "Preliminary investigation not found" });

    if (!["draft", "returned"].includes(preliRows[0].status))
      return res.status(403).json({ error: "Editing not allowed at this stage" });

    /* 3️⃣ UPDATE */
    await pool.query(
      `UPDATE preliminary_investigations
       SET mandate=?, allegations=?, acknowledgement_details=?,
           case_category=?, case_subcategory=?, domicile_department=?,
           key_stakeholders=?, incident_scene=?, amount_involved=?,
           persons_to_notify=?, persons_featured=?, legal_framework=?,
           preliminary_findings=?, annexures=?, recommendations=?,
           conducted_by=?, reviewed_by=?, approved_by=?, status=?
       WHERE incident_id=?`,
      [
        data.mandate,
        data.allegations,
        data.acknowledgement_details,
        data.case_category,
        data.case_subcategory,
        data.domicile_department,
        data.key_stakeholders,
        data.incident_scene,
        data.amount_involved,
        data.persons_to_notify,
        data.persons_featured,
        data.legal_framework,
        data.preliminary_findings,
        data.annexures,
        data.recommendations,
        userName,
        data.reviewed_by,
        data.approved_by,
        data.status,
        incidentId,
      ]
    );

    return res.json({ message: "Updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

//gets a single prelininary for the updating team
export const getPrelis = async (req, res) => {
  try {
    // Base SQL for all preliminaries
    let sql = `
      SELECT 
        pi.*,
        i.incident_number,
        i.complainant_name,
        i.assigned_to,
        CONCAT(u.name, ' (', u.email, ')') as assigned_investigator_name,
        pc.name as case_category,
        psc.name as case_subcategory,
        pd.name as domicile_department
      FROM preliminary_investigations pi
      LEFT JOIN incidents i ON pi.incident_id = i.id
      LEFT JOIN users u ON i.assigned_to = u.id
      LEFT JOIN preli_categories pc ON pi.case_category = pc.id
      LEFT JOIN preli_subcategories psc ON pi.case_subcategory = psc.id
      LEFT JOIN preli_departments pd ON pi.domicile_department = pd.id
      WHERE 1=1
    `;

    const params = [];
    const { status, recommendation } = req.query;

    if (status) {
      sql += ` AND pi.status = ?`;
      params.push(status);
    }
    if (recommendation) {
      sql += ` AND pi.recommendations = ?`;
      params.push(recommendation);
    }

    sql += ` ORDER BY pi.created_at DESC`;

    const [rows] = await pool.query(sql, params);

    return res.json({ message: 'success', data: rows });
  } catch (error) {
    console.error('DB Error:', error);
    return res.status(500).json({ error: 'Failed to get preliminary investigations' });
  }
};

export const referToDepartment = async (req, res) => {
  try {

    const { id } = req.params;
    const { referred_department, recommendations } = req.body;
    const [sql1] = await pool.execute('SELECT id FROM preli_departments WHERE name = ?', [referred_department]);
    if (sql1.length <= 0) return res.status(500).json({ message: 'Not found' })
    const preliId = sql1[0].id;
    const sql = 'UPDATE preliminary_investigations SET referred_department = ?, status = ?, recommendations = ? WHERE id = ?';
    const [getInvestigation] = await pool.execute(sql, [preliId, 'closed', recommendations, id]);

    res.status(200).json({ message: 'Case has been successfully assigned' })

  } catch (error) {
    console.error({ error: error, id: id });
    res.status(500).json(error)
  }
}

export const getPreliReviewTeam = async (req, res) => {
  try {

    //this is the preliminary id not the incident id keep it this way don't change it
    const { incident_id } = req.params;

    // Fetch preliminary investigation without assigned_to restriction
    const sql = `
      SELECT pi.*,
             i.incident_number,
             i.complainant_name,
             CONCAT(u.name, ' (', u.email, ')') AS assigned_investigator_name,
             c.name AS case_category,
             sc.name AS case_subcategory,
             d.name AS domicile_department
      FROM preliminary_investigations pi
      LEFT JOIN incidents i ON pi.incident_id = i.id
      LEFT JOIN users u ON i.assigned_to = u.id
      LEFT JOIN preli_categories c ON pi.case_category = c.id
      LEFT JOIN preli_subcategories sc ON pi.case_subcategory = sc.id
      LEFT JOIN preli_departments d ON pi.domicile_department = d.id
      WHERE pi.id = ?
      LIMIT 1
    `;

    const [rows] = await pool.query(sql, [incident_id]);

    if (!rows.length) {
      return res.status(404).json({ message: "Investigation not found" });
    }

    const prelim = rows[0];

    // Fetch all comments
    const [comments] = await pool.query(
      `SELECT * FROM preliminary_comments WHERE preliminary_id = ? ORDER BY created_at ASC`,
      [prelim.id]
    );

    prelim.comments = comments || [];

    return res.json({ message: "success", data: prelim });
  } catch (error) {
    console.error("DB Error:", error);
    return res.status(500).json({ error: "Failed to get preliminary investigation" });
  }
};

// In PreliminaryController.js
export const getPreliminaryInvestigators = async (req, res) => {
  try {
    const sql = `
      SELECT id, name, email 
      FROM users 
      WHERE role = 'preliminary_investigator'
      ORDER BY name
    `;

    const [rows] = await pool.query(sql);
    return res.json({ message: 'success', data: rows });
  } catch (error) {
    console.error('DB Error:', error);
    return res.status(500).json({ error: 'Failed to get investigators' });
  }
};

// Add to PreliminaryController.js

export const getPreliminaries = async (req, res) => {
  try {

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    //get the total of all the data that are the matches
    const [getTotal] = await pool.query(`SELECT
      COUNT(*) AS total
      FROM preliminary_investigations p
      LEFT JOIN incidents i ON p.incident_id = i.id
      LEFT JOIN users u_assign ON i.assigned_to = u_assign.id
      LEFT JOIN preli_categories c ON p.case_category = c.id
      LEFT JOIN preli_subcategories sc ON p.case_subcategory = sc.id
      LEFT JOIN preli_departments d ON p.domicile_department = d.id
      LEFT JOIN (
      SELECT preliminary_id, comment, user_name
      FROM preliminary_comments
      WHERE id IN (
      SELECT MAX(id) 
      FROM preliminary_comments 
      GROUP BY preliminary_id
       )
       ) pc ON p.id = pc.preliminary_id
      WHERE p.status = 'review' 
      ORDER BY p.created_at DESC
      `)
     
      const total = getTotal[0].total;
    const sql = `
      SELECT 
      p.id,
      p.incident_id,
      i.incident_number,
      i.complainant_name,
      CONCAT(u_assign.name, ' (', u_assign.email, ')') AS assigned_investigator_name,
      p.mandate,
      p.allegations,
      c.name AS case_category,
      sc.name AS case_subcategory,
      d.name AS domicile_department,
      p.preliminary_findings,
      p.recommendations,
      p.status,
      p.created_at,
      p.updated_at,
      pc.comment AS latest_comment,
      pc.user_name AS latest_comment_user
      FROM preliminary_investigations p
      LEFT JOIN incidents i ON p.incident_id = i.id
      LEFT JOIN users u_assign ON i.assigned_to = u_assign.id
      LEFT JOIN preli_categories c ON p.case_category = c.id
      LEFT JOIN preli_subcategories sc ON p.case_subcategory = sc.id
      LEFT JOIN preli_departments d ON p.domicile_department = d.id
      LEFT JOIN (
      SELECT preliminary_id, comment, user_name
      FROM preliminary_comments
      WHERE id IN (
      SELECT MAX(id) 
      FROM preliminary_comments 
      GROUP BY preliminary_id
       )
       ) pc ON p.id = pc.preliminary_id
      WHERE p.status = 'review' 
      ORDER BY p.created_at ASC
      LIMIT ? OFFSET ?
      `;

    const [result] = await pool.query(sql, [limit, offset]);

    // Map fields to match frontend expectations
    // Map fields to match frontend expectations
    const formatted = result.map((item) => ({
      ...item,
      case_category: item.case_category || "N/A",
      case_subcategory: item.case_subcategory || "N/A",
      domicile_department: item.domicile_department || "N/A",
      approved_by: item.approved_by || "N/A",
    }));


    return res.json({ message: 'Success',
      data: formatted,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total/limit),
      totalItems: total,
      itemsPerPage: limit
    }
    });
  } catch (error) {
    console.error("Error returning preliminary investigation:", error);
    res.status(500).json({ error: "Server error" });
  }
};


export const returnPreliminary = async (req, res) => {
  try {
    const { preli_id } = req.params;
    const { comments } = req.body;
    const user = req.user;
    const tokenId = user.id;
    const tokenName = user.name;

    if (!comments || comments.trim() === '') {
      return res.status(400).json({ error: 'Comments are required for returning a case' });
    }
    const connection = await pool.getConnection();
    const sql = 'SELECT id FROM preliminary_investigations WHERE id = ?'
    const [existing] = await connection.execute(sql, [preli_id]);
    //verified preli id
    const preliID = existing[0].id
    if (existing.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Preliminary investigation not found' });
    }

    const sql2 = `UPDATE preliminary_investigations SET status = 'returned' WHERE id = ?`
    const [result2] = await connection.execute(sql2, [preliID]);

    const sql3 = 'INSERT INTO preliminary_comments (preliminary_id, user_id, user_name, comment) VALUES(?, ?, ?, ?)';
    const [result3] = await connection.execute(sql3, [preliID, tokenId, tokenName, comments])
    connection.release();

    res.json({
      message: 'Case returned to investigator successfully',
      data: {
        id: preli_id,
        status: 'returned',
        admin_comments: comments.trim()
      }
    });
  } catch (error) {
    console.error('Error returning preliminary investigation:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const approvePreliminary = async (req, res) => {
  try {
    const { preli_id } = req.params;
    const { approved_by } = req.body;

    const connection = await pool.getConnection();

    const [existing] = await connection.execute(
      'SELECT id FROM preliminary_investigations WHERE id = ?',
      [preli_id]
    );

    if (existing.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Preliminary investigation not found' });
    }

    const [result] = await connection.execute(
      `UPDATE preliminary_investigations 
       SET status = 'approved', 
           approved_by = ?,
           updated_at = NOW()
       WHERE id = ?`,
      [approved_by, preli_id]
    );


    const [check] = await connection.execute('SELECT * FROM forensic_investigation_report WHERE preliminary_id = ?', [preli_id])
    if (check.length > 0) return
    const sql = 'INSERT INTO forensic_investigation_report (preliminary_id) VALUE(?)';
    const [create] = await connection.execute(sql, [preli_id]);

    connection.release();

    res.json({
      message: 'Preliminary investigation approved successfully',
      data: {
        id: preli_id,
        status: 'approved',
        approved_by: approved_by
      }
    });
  } catch (error) {
    console.error('Error approving preliminary investigation:', error);
    res.status(500).json({ error: 'Server error' });
  }
};


export const verifyAccessReviewPreliminary = async (req, res) => {
  try {
    const user = req.user;
    const tokenId = user.id;

    const sql = `SELECT review_preliminary FROM access_rights WHERE user_id = ?`;
    const [result] = await pool.query(sql, [tokenId]);

    if (result.length === 0) {
      return res.status(403).json({ message: 'User not found' });
    }
    if (result[0].review_preliminary == 0) {
      return res.status(403).json({ message: 'access denied' });
    }

    return res.status(200).json({ message: 'access granted', });
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};


export const verifyAccessUpdatePreliminary = async (res, req) => {
  try {
    // No token verification - just get data
    const sql = `
      SELECT pi.*, 
             i.incident_number,
             i.complainant_name,
             i.assigned_to,
             CONCAT(u.name, ' (', u.email, ')') as assigned_investigator_name
      FROM preliminary_investigations pi
      LEFT JOIN incidents i ON pi.incident_id = i.id
      LEFT JOIN users u ON i.assigned_to = u.id
      WHERE pi.status = 'review'
      ORDER BY pi.created_at DESC
    `;

    const [rows] = await pool.query(sql);
    return res.json({ message: 'success', data: rows });
  } catch (error) {
    console.error('DB Error:', error);
    return res.status(500).json({ error: 'Failed to get preliminary investigations for review' });
  }
}




export const closeCase = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const sql =
      "UPDATE preliminary_investigations SET status = ? WHERE id = ?";
    const result = await pool.execute(sql, [status, id]);
    res.status(200).json({ message: "Case successfully closed" });
  } catch (error) {
    console.error({ error: error });
    res.status(500).json(error);
  }
};


//get the incidents assinged to a preliminary
export const getIncidentsAssigned = async (req, res) => {
  try {
    const user = req.user;
    const tokenId = user.id;
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const [getTotal] = await pool.query("SELECT COUNT(*) AS total FROM incidents where assigned_to = ?", [tokenId]);

    const sql = `SELECT i.*, 
       u.name,
       u.email
       FROM incidents i 
       LEFT JOIN users u ON i.assigned_to = u.id
       WHERE u.id = ? 
       ORDER BY u.id ASC
       LIMIT ? OFFSET ?
       `;
    const [result] = await pool.query(sql, [tokenId, limit, offset]);
    const total = getTotal[0].total
    return res.status(200).json({
      message: 'success',
      data: result,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemPerPage: limit
      }

    });
  } catch (error) {
    console.error("DB Error:", error);
    return res.status(500).json({ error: "Failed to get incidents" });
  }
};

export const getForensicInvestigators = async (req, res) => {
  try {
    const sql = `
      SELECT id, name, email 
      FROM users 
      WHERE role = 'forensic_investigator'
      ORDER BY name
    `;

    const [rows] = await pool.query(sql);
    return res.json({ message: "success", data: rows });
  } catch (error) {
    console.error("DB Error:", error);
    return res.status(500).json({ error: "Failed to get investigators" });
  }
};


export const assignInvestigator = async (req, res) => {
  try {
    const { id } = req.params;
    const { assigned_to, assigned_investigator_name, status } = req.body;
    console.log()

    if (!id) {
      return res.status(400).json({ error: "Missing preliminary id" });
    }
    // update preliminary
    const sql =
      "UPDATE preliminary_investigations SET assigned_to = ?, status = ? WHERE id = ?";
    await pool.execute(sql, [assigned_to, status, id]);

    // create forensic ONLY if preliminary exists
    const sql2 = `
      INSERT INTO forensic_investigation_report (preliminary_id, incident_id)
SELECT id, incident_id FROM preliminary_investigations WHERE id = ?
    `;
    await pool.execute(sql2, [id]);

    res.status(200).json({ message: "Investigator assigned successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json(error);
  }
};