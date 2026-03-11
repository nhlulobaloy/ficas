import pool from "../config/db.js";
import jwt from "jsonwebtoken";

export const referToDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { referred_department, status, recommendations } = req.body;
    const sql =
      "UPDATE forensic_investigation_report SET referred_department = ?, status = ? WHERE id = ?";
    const [getInvestigation] = await pool.execute(sql, [
      referred_department,
      'refer',
      id,
    ]);

    res.status(200).json({ message: "Case has been successfully referred" });
  } catch (error) {
    console.error({ error: error });
    res.status(500).json(error);
  }
};



//export const closeForensicCase = async (req, res) => {
//try {
//   const { id } = req.params;
//   const { status } = req.body;
//   const sql = 'UPDATE forensic_investigation_report SET status = ? WHERE id = ?';
//   const result = await pool.execute(sql, ['closed', id]); // Use 'closed' status
//    res.status(200).json({ message: 'Forensic case successfully closed' })
// } catch (error) {
//     console.error({ error: error });
//     res.status(500).json(error)
// }
//}

export const closeCase = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const sql =
      "UPDATE forensic_investigation_report SET status = ? WHERE id = ?";
    const result = await pool.execute(sql, [status, id]);
    res.status(200).json({ message: "Case successfully closed" });
  } catch (error) {
    console.error({ error: error });
    res.status(500).json(error);
  }
};
//
export const returnPreliminary = async (req, res) => {
  try {
    const { id } = req.params; // Changed from preli_id to id
    const { comments, status } = req.body;
    const token = req.header("Authorization")?.replace("Bearer ", "");
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    const tokenId = decoded.id;
    const tokenName = decoded.name;

    if (!comments || comments.trim() === "") {
      return res
        .status(400)
        .json({ error: "Comments are required for returning a case" });
    }

    const connection = await pool.getConnection();

    // First, get the forensic investigation by ID
    const getForensicSql =
      "SELECT id, preliminary_id FROM forensic_investigation_report WHERE id = ?";
    const [forensicRows] = await connection.execute(getForensicSql, [id]);

    if (forensicRows.length === 0) {
      connection.release();
      return res
        .status(404)
        .json({ error: "Forensic investigation not found" });
    }

    const forensicId = forensicRows[0].id;
    const preliminaryId = forensicRows[0].preliminary_id;

    // Update forensic investigation status (use status from body or default to 'review')
    const updateStatus = status || "review";
    const updateSql = `UPDATE forensic_investigation_report SET status = ? WHERE id = ?`;
    const [updateResult] = await connection.execute(updateSql, [
      updateStatus,
      forensicId,
    ]);

    // Insert comment into forensic_comments table
    const insertCommentSql =
      "INSERT INTO forensic_comments (forensic_id, user_id, user_name, comment) VALUES(?, ?, ?, ?)";
    const [commentResult] = await connection.execute(insertCommentSql, [
      forensicId,
      tokenId,
      tokenName,
      comments.trim(),
    ]);

    connection.release();

    res.json({
      message: "Forensic case returned successfully",
      data: {
        id: forensicId,
        preliminary_id: preliminaryId,
        status: updateStatus,
        admin_comments: comments.trim(),
      },
    });
  } catch (error) {
    console.error("Error returning forensic investigation:", error);
    res.status(500).json({ error: "Server error" });
  }
};
//get a forensic case
export const getForensic = async (req, res) => {
  const { id } = req.params; // This is forensic report id from frontend

  try {
    // 1️⃣ Get preliminary_id for this forensic report
    const [getPreliIdResult] = await pool.execute(
      "SELECT preliminary_id FROM forensic_investigation_report WHERE id = ?",
      [id]
    );

    if (!getPreliIdResult || getPreliIdResult.length === 0) {
      return res.status(404).json({ message: "Forensic report not found" });
    }

    const preliminaryId = getPreliIdResult[0].preliminary_id;

    // 2️⃣ Fetch forensic report using preliminary_id
    const [result] = await pool.execute(
      "SELECT * FROM forensic_investigation_report WHERE preliminary_id = ?",
      [preliminaryId]
    );

    if (result.length === 0)
      return res.status(404).json({ message: "Forensic case not found" });

    const forensic = result[0];

    // 3️⃣ Fetch comments
    const [comments] = await pool.execute(
      "SELECT * FROM forensic_comments WHERE forensic_id = ? ORDER BY created_at ASC",
      [preliminaryId]
    );

    forensic.comments = comments || [];

    res.status(200).json({ message: "Success", data: [forensic] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};




export const updateForensic = async (req, res) => {
  const { id } = req.params; // forensic report id
  const {
    background,
    abbreviations,
    annexures,
    individuals_featured,
    mandate,
    purpose_and_objective,
    scope_of_investigation,
    restrictions_and_limitations,
    legislative_policy_framework,
    investigation,
    interviews,
    financial_exposure,
    findings,
    recommendations,
    referred_department,
    general,
    conducted_by,
    status,
  } = req.body;

  try {
    // 1️⃣ Get the preliminary_id for this forensic report
    const [getPreliIdResult] = await pool.execute(
      "SELECT preliminary_id FROM forensic_investigation_report WHERE id = ?",
      [id]
    );

    if (!getPreliIdResult || getPreliIdResult.length === 0) {
      return res.status(404).json({ error: "Forensic report not found" });
    }

    const preliminaryId = getPreliIdResult[0].preliminary_id;

    // 2️⃣ Update using preliminary_id
    const updateSql = `
      UPDATE forensic_investigation_report
      SET
        background = ?,
        abbreviations = ?,
        annexures = ?,
        individuals_featured = ?,
        mandate = ?,
        purpose_and_objective = ?,
        scope_of_investigation = ?,
        restrictions_and_limitations = ?,
        legislative_policy_framework = ?,
        investigation = ?,
        interviews = ?,
        financial_exposure = ?,
        findings = ?,
        recommendations = ?,
        referred_department = ?,
        general = ?,
        conducted_by = ?,
        status = ?,
        updated_at = NOW()
      WHERE preliminary_id = ?;
    `;

    const values = [
      background ?? null,
      abbreviations ?? null,
      annexures ?? null,
      individuals_featured ?? null,
      mandate ?? null,
      purpose_and_objective ?? null,
      scope_of_investigation ?? null,
      restrictions_and_limitations ?? null,
      legislative_policy_framework ?? null,
      investigation ?? null,
      interviews ?? null,
      financial_exposure ?? null,
      findings ?? null,
      recommendations ?? null,
      referred_department ?? null,
      general ?? null,
      conducted_by ?? null,
      status ?? null,
      preliminaryId,
    ];

    await pool.execute(updateSql, values);

    // 3️⃣ Return the updated row using preliminary_id
    const [updatedRow] = await pool.execute(
      "SELECT * FROM forensic_investigation_report WHERE preliminary_id = ?",
      [preliminaryId]
    );

    res.json({ data: updatedRow });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Server error" });
  }
};


export const verifyAccessReviewForensic = async (req, res) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ message: "Token missing" });

    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    const tokenId = decoded.id;
    const sql = `SELECT review_forensic FROM access_rights WHERE user_id = ?`;
    const [result] = await pool.query(sql, [tokenId]);
    if (result.length === 0) {
      return res.status(403).json({ message: "User not found" });
    }

    if (result[0].review_preliminary == 0) {
      return res.status(403).json({ message: "access denied" });
    }

    return res.status(200).json({ message: "access granted" });
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};


export const getPreliminary = async (req, res) => {


  try {
    const user = req.user;
    const tokenId = user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit

    const sql = `
      SELECT 
        f.id,
        f.preliminary_id,
        p.incident_id,
        p.mandate,
        p.allegations,
        p.preliminary_findings,
        i.incident_number,
        i.complainant_name,
        CONCAT(u_assign.name, ' (', u_assign.email, ')') AS assigned_investigator_name,
        c.name AS case_category,
        sc.name AS case_subcategory,
        d.name AS domicile_department,
        f.findings,
        f.recommendations,
        f.status,
        f.created_at,
        f.updated_at,
        fc.comment AS latest_comment,
        fc.user_name AS latest_comment_user
      FROM forensic_investigation_report f
      LEFT JOIN preliminary_investigations p ON f.preliminary_id = p.id
      LEFT JOIN incidents i ON p.incident_id = i.id
      LEFT JOIN users u_assign ON p.assigned_to = u_assign.id
      LEFT JOIN preli_categories c ON p.case_category = c.id
      LEFT JOIN preli_subcategories sc ON p.case_subcategory = sc.id
      LEFT JOIN preli_departments d ON p.domicile_department = d.id
      LEFT JOIN (
        SELECT forensic_id, comment, user_name
        FROM forensic_comments
        WHERE id IN (
          SELECT MAX(id)  
          FROM forensic_comments 
          GROUP BY forensic_id
        )
      ) fc ON f.id = fc.forensic_id
      WHERE p.status = 'approved' OR p.status = 'returned'
      AND p.assigned_to = ? 
      AND f.status = 'draft'
      ORDER BY f.created_at DESC
      LIMIT ? OFFSET ?
    `;


    const sqlTotal = `
select count(*) as total
      FROM forensic_investigation_report f
      LEFT JOIN preliminary_investigations p ON f.preliminary_id = p.id
      LEFT JOIN incidents i ON p.incident_id = i.id
      LEFT JOIN users u_assign ON p.assigned_to = u_assign.id
      LEFT JOIN preli_categories c ON p.case_category = c.id
      LEFT JOIN preli_subcategories sc ON p.case_subcategory = sc.id
      LEFT JOIN preli_departments d ON p.domicile_department = d.id
      LEFT JOIN (
        SELECT forensic_id, comment, user_name
        FROM forensic_comments
        WHERE id IN (
          SELECT MAX(id)  
          FROM forensic_comments 
          GROUP BY forensic_id
        )
      ) fc ON f.id = fc.forensic_id
      WHERE p.status = 'approved' OR p.status = 'returned'
      AND p.assigned_to = 4 
      AND f.status = 'draft'
      ORDER BY f.created_at DESC
    `;


    const [totalInDb] = await pool.query(sqlTotal)
    const total = totalInDb[0].total;
    const [result] = await pool.query(sql, [tokenId, limit, offset]);

    // 🔥 ADD FULL COMMENTS ARRAY
    for (let item of result) {
      const [comments] = await pool.query(
        `SELECT id, forensic_id, user_id, user_name, comment, created_at
         FROM forensic_comments
         WHERE forensic_id = ?
         ORDER BY created_at ASC`,
        [item.id]
      );

      item.comments = comments || [];
    }

    const formatted = result.map((item) => ({
      ...item,
      case_category: item.case_category || "N/A",
      case_subcategory: item.case_subcategory || "N/A",
      domicile_department: item.domicile_department || "N/A",
    }));

    return res.json({
      data: formatted,
      pagination: {
        currentPage: page,
        itemsPerPage: limit,
        totalItems: total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error("Error returning forensic investigation:", error);
    res.status(500).json({ error: "Server error" });
  }
};



export const getForensicReview = async (req, res) => {
  try {
    const { id } = req.params;
    const authHeader = req.header("Authorization");

    if (!authHeader) return res.status(401).json({ error: "No token" });
    const token = authHeader?.replace("Bearer ", "");
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    const tokenId = decoded.id;

    // Fetch ONLY forensic data, no preliminary joins
    const sql = `
    SELECT f.*
    FROM forensic_investigation_report f
    INNER JOIN preliminary_investigations p ON f.preliminary_id = p.id
    WHERE f.id = ?
    LIMIT 1;
    `;
    const [rows] = await pool.query(sql, [id]);
    if (!rows.length) {
      return res
        .status(404)
        .json({ message: "Forensic investigation not found gg" });
    }

    const forensic = rows[0];
    // Fetch all comments
    const [comments] = await pool.query(
      `SELECT * FROM forensic_comments WHERE forensic_id = ? ORDER BY created_at ASC`,
      [forensic.id],
    );

    forensic.comments = comments || [];

    return res.json({ message: "success", data: forensic });
  } catch (error) {
    console.error("DB Error:", error);
    return res
      .status(500)
      .json({ error: "Failed to get forensic investigation" });
  }
};

export const getForensics = async (req, res) => {
  let connection;
  try {

    connection = await pool.getConnection();

    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;
    const [resultTotal] = await connection.execute("SELECT COUNT(*) AS total FROM `forensic_investigation_report` WHERE 1");
    const total = resultTotal[0].total;
    const [cases] = await connection.query("SELECT * FROM forensic_investigation_report WHERE status = 'review' ORDER BY created_at DESC LIMIT ? OFFSET ?", [limit, offset]);

    // Fetch comments for all cases
    for (let c of cases) {
      const [comments] = await connection.execute(
        "SELECT * FROM forensic_investigation_report WHERE preliminary_id = ? ORDER BY created_at ASC",
        [c.preliminary_id]
      );
      c.comments = comments || [];
    }

    res.status(200).json({
      message: "Success",
      data: cases,
      pagination: {
        totalPages: Math.ceil(total / limit),
        page: page,
        totalItems: total,
        currentPage: page
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

export const getInvestigators = async (req, res) => {
  try {
    const sql = `SELECT id, name, email FROM users WHERE role = 'fraud_prevention_investigator'`;
    const [results] = await pool.execute(sql);

    res.status(200).json({ message: "Success", data: results })

  } catch (error) {

  }
}

// Controllers/ForensicController.js

export const assignInvestigator = async (req, res) => {
  const { id } = req.params; // forensic investigation ID
  const { assigned_to } = req.body; // investigator to assign
  const userName = req.user?.name || "System"; // assuming you set req.user from middleware

  if (!assigned_to) {
    return res.status(400).json({ message: "Investigator ID is required" });
  }

  try {
    // Check if investigation exists
    const investigationQuery = `
      SELECT * FROM forensic_investigation_report WHERE id = ?
    `;
    const [investigationResult] = await pool.execute(investigationQuery, [id]);
    if (investigationResult.length === 0) {
      return res.status(404).json({ message: "Investigation not found" });
    }

    // Check if investigator exists
    const investigatorQuery = `
      SELECT * FROM users WHERE id = ?
    `;
    const [investigatorResult] = await pool.execute(investigatorQuery, [assigned_to]);
    if (investigatorResult.length === 0) {
      return res.status(404).json({ message: "Investigator not found" });
    }

    const investigatorName = investigatorResult[0].name;

    // Update the investigation with assigned investigator
    const updateQuery = `
      UPDATE forensic_investigation_report
      SET assigned_to = ?,
          conducted_by = ?,
          status = 'approved',
          updated_at = NOW()
      WHERE id = ?
    `;

    const [updatedResult] = await pool.execute(updateQuery, [assigned_to, investigatorName, id]);
    //create a fraud prevention case
    const sqlCreate = 'INSERT INTO fraud_prevention (forensic_id, assigned_to) VALUES(?,?)';
    const [create] = await pool.query(sqlCreate, [id, assigned_to]);

    return res.status(200).json({
      message: "Investigator assigned successfully and forensic prevetion created succesfully",
      data: {
        id,
        assigned_to: assigned_to,
        conducted_by: investigatorName,
      },
    });
  } catch (err) {
    console.error("Assign investigator error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};


