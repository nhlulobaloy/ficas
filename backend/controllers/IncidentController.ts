import { RowDataPacket } from 'mysql2';
import pool from '../config/db.js';
import { Response, Request, NextFunction } from 'express';
import { insertIncident } from '../models/incidentModel.js';


export const createIncident = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      name,
      contact,
      date,
      time,
      location,
      email,
      selectedCategory,
      details,
      suspectDetails,
      sapsNumber,
    } = req.body;

    const newIncident = await insertIncident(req.body);

    // 5. Response
    return res.status (201).json ({
      message: 'Incident created',
      incident_number: newIncident.incidentNumber,
      id: newIncident.id,
    });
  } catch (error) {
    console.error ('DB Error:', error);
    return res.status (500).json ({error: 'Database insert failed'});
  }
};

// In incidentController.js
export const getIncident = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {incident_id} = req.params;

    // Fetch incident with joins
    const sqlIncident = `
      SELECT 
        i.*,
        c.name AS category_name,
        CONCAT(u.name, ' (', u.email, ')') AS assigned_investigator_name,
        u.email AS assigned_investigator_email,
        d.name AS referred_department_name
      FROM incidents i
      LEFT JOIN categories c ON i.category = c.id
      LEFT JOIN users u ON i.assigned_to = u.id
      LEFT JOIN preli_departments d ON i.referred_department = d.id
      WHERE i.id = ?
    `;

    const [incidentRows] = await pool.query<RowDataPacket[]> (sqlIncident, [incident_id]);
    if (incidentRows.length === 0)
      return res.status (404).json ({error: 'Incident not found'});

    const incident = incidentRows[0];

    // Fetch the preliminary investigation for this incident
    const [
      preliRows,
    ] = await pool.query <RowDataPacket[]>(
      `SELECT id, status FROM preliminary_investigations WHERE incident_id = ?`,
      [incident_id]
    );

    if (preliRows.length > 0) {
      const preliId = preliRows[0].id;

      // Fetch all comments linked to this preliminary investigation
      const [
        commentRows,
      ] = await pool.query (
        `SELECT id, preliminary_id, user_id, user_name, comment, created_at
         FROM preliminary_comments
         WHERE preliminary_id = ?
         ORDER BY created_at ASC`,
        [preliId]
      );

      incident.preliminary_id = preliId;
      incident.preliminary_status = preliRows[0].status;
      incident.comments = commentRows;
    } else {
      incident.preliminary_id = null;
      incident.preliminary_status = null;
      incident.comments = [];
    }

    return res.json ({message: 'success', data: incident});
  } catch (error) {
    console.error ('DB Error:', error);
    return res.status (500).json ({error: 'Failed to get incident'});
  }
};

//get the incidents assinged to a preliminary
export const getIncidents = async (req: Request, res: Response, next: NextFunction) => {
  const page = parseInt (String(req.query.page)) || 1; //get the query from the req
  const limit = parseInt (String(req.query.limit)) || 10;
  const offset = (page - 1) * limit;

  try {
    const countSql = `SELECT COUNT(*) as total from incidents`;
    const [countResult] = await pool.query<RowDataPacket[]> (countSql);
    const total = countResult[0].total;

    const sql = `
      SELECT 
        i.*,
        c.name as category_name,
        CONCAT(u.name, ' (', u.email, ')') as assigned_investigator_name,
        u.email as assigned_investigator_email,
        d.name as referred_department_name
      FROM incidents i
      LEFT JOIN categories c ON i.category = c.id
      LEFT JOIN users u ON i.assigned_to = u.id
      LEFT JOIN preli_departments d ON i.referred_department = d.id
      ORDER BY i.created_at ASC
      LIMIT ? OFFSET ?
    `;

    const [rows] = await pool.query (sql, [limit, offset]);



    return res.json ({
      message: 'success',
      data: rows,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil (total / limit),
        totalItems: total,
        itemsPerPage: limit,
      },
    });
  } catch (error) {
    console.error ('DB Error:', error);
    return res.status (500).json ({error: 'Failed to get incidents'});
  }
};

export const getIncidentsAssigned = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    const tokenId = user.id;
    const sql = `SELECT i.*,
       u.name,
       u.email
       FROM incidents i 
       LEFT JOIN users u ON i.assigned_to = u.id
       WHERE u.id = ? 
       ORDER BY u.id`;
    const [result] = await pool.query (sql, [tokenId]);

    return res.status (200).json ({data: result});
  } catch (error) {
    console.error ('DB Error:', error);
    return res.status (500).json ({error: 'Failed to get incidents'});
  }
};

export const updateIncident = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {incident_id} = req.params;
    const {recommendations, assigned_to, referred_department} = req.body;

    const validRecommendations = [
      'pending',
      'close',
      'refer to preliminary',
      'refer to department',
    ];
    if (recommendations && !validRecommendations.includes (recommendations)) {
      return res.status (400).json ({error: 'Invalid recommendation value'});
    }

    let updateFields = [];
    let updateValues = [];

    if (recommendations) {
      updateFields.push ('recommendations = ?');
      updateValues.push (recommendations);
    }

    if (assigned_to !== undefined) {
      updateFields.push ('assigned_to = ?');
      updateValues.push (assigned_to === '' ? null : assigned_to);

      if (assigned_to && assigned_to !== '') {
        updateFields.push ('assigned_at = NOW()');
      } else {
        updateFields.push ('assigned_at = NULL');
      }
    }

    if (referred_department !== undefined) {
      updateFields.push ('referred_department = ?');
      updateValues.push (
        referred_department === '' ? null : referred_department
      );
    }

    if (updateFields.length === 0) {
      return res.status (400).json ({error: 'No fields to update'});
    }

    updateValues.push (incident_id);

    const sql = `UPDATE incidents SET ${updateFields.join (', ')} WHERE id = ?`;
    const [result] = await pool.query <any>(sql, updateValues);

    if (result.affectedRows === 0) {
      return res.status (404).json ({error: 'Incident not found'});
    }

    res.json ({message: 'Incident updated successfully'});
  } catch (error) {
    console.error ('Error updating incident:', error);
    res.status (500).json ({error: 'Server error'});
  }
};

export const verifyAccessCreate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    const userIdFromToken = user.id;
    const roleFromToken = user.role;

    const sql = `
      SELECT a.user_id, a.create_incident, u.role
      FROM access_rights a
      INNER JOIN users u ON a.user_id = u.id
      WHERE u.id = ?;
    `;
    const [result] = await pool.query<RowDataPacket[]> (sql, [userIdFromToken]);
    if (!result || result.length === 0)
      return res.status (404).json ({message: 'User not found'});

    const data = result[0];
    if (data.create_incident !== '1' || data.role !== roleFromToken) {
      return res.status (403).json ({message: 'Authorization denied'});
    }
    return res.status (200).json ({success: 'true', message: 'access granted'});
  } catch (err) {
    console.error (err);
    return next (err);
  }
};

export const verifyAccessAssign = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    const userIdFromToken = user.id;
    const roleFromToken = user.role;

    const sql = `
      SELECT a.user_id, a.assign_incident, u.role
      FROM access_rights a
      INNER JOIN users u ON a.user_id = u.id
      WHERE u.id = ?;
    `;
    const [result] = await pool.query <RowDataPacket[]>(sql, [userIdFromToken]);

    if (!result || result.length === 0)
      return res.status (404).json ({message: 'User not found'});

    const data = result[0];

    if (data.assign_incident !== '1' || data.role !== roleFromToken) {
      return res.status (403).json ({message: 'Authorization denied'});
    }

    return res.status (200).json ({success: 'true', message: 'access granted'});
  } catch (err) {
    console.error (err);
    return res.status (401).json ({message: 'Invalid token'});
  }
};

export const getIncidentInvestigators = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sql = `
      SELECT id, name, email 
      FROM users 
      WHERE role = 'preliminary_investigator'
      ORDER BY name
    `;

    const [rows] = await pool.query (sql);
    return res.json ({message: 'success', data: rows});
  } catch (error) {
    console.error ('DB Error:', error);
    return res.status (500).json ({error: 'Failed to get investigators'});
  }
};

export const assignInvestigator = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {id} = req.params;
    const {assigned_to, assigned_investigator_name, status} = req.body;
    const sql =
      'UPDATE preliminary_investigations SET assigned_to = ?, status = ? WHERE id = ?';
    //Create a new preliminary investigation when a user is assigned to one
    const sql2 =
      'INSERT INTO forensic_investigation_report preliminary_id VALUES(?)';
    const resultCreate = await pool.execute (sql2, [id]);
    const result = await pool.execute (sql, [assigned_to, status, id]);
    res.status (200).json ({message: 'Investigater assigned successfully'});
  } catch (error) {
    console.error ({error: error});
    res.status (500).json (error); //draft, revies, approve, review, close
  }
};
