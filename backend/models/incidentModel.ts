import { OkPacket, OkPacketParams, QueryResult, RowDataPacket } from 'mysql2';
import pool from '../config/db.js';
import { verify } from 'node:crypto';
import { verifyAccessAssign } from '../controllers/IncidentController.js';
import { ReadOptionsWithBuffer } from 'node:fs';


interface IncidentData {
    name: string;
    contact: string;
    date: string;
    time: string;
    location: string;
    email: string;
    selectedCategory: string;
    details: string;
    suspectDetails?: string;  // Optional
    sapsNumber?: string;      // Optional
}

interface Investigator {
    id: number;
    name: string;
    email: string;
    role: string
}
interface InsertResult {
    id: number,
    incidentNumber: string
}

export const insertIncident = async (data: IncidentData): Promise<InsertResult> => {
    // 1. Insert incident
    const sql = `
      INSERT INTO incidents (
        complainant_name, complainant_email, complainant_contact,
        incident_date, incident_time, location, category,
        details, suspect_details, ssaps_case_number
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.query<OkPacket>(sql, [
        data.name,
        data.email,
        data.contact,
        data.date,
        data.time,
        data.location,
        data.selectedCategory,
        data.details,
        data.suspectDetails,
        data.sapsNumber,
    ]);

    // 2. Generate short incident number with date
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const incidentNumber = `INC-${year}${month}${day}-${result.insertId}`;

    // 3. Update with incident number
    await pool.query('UPDATE incidents SET incident_number = ? WHERE id = ?', [
        incidentNumber,
        result.insertId,
    ]);

    // 4. Automatically insert a preliminary investigation row
    await pool.query(
        `INSERT INTO preliminary_investigations (incident_id) VALUES (?)`,
        [result.insertId]
    );

    return ({
        incidentNumber,
        id: result.insertId
    })
}

// get all the incident investigators and then return then in numerical order
export const getInvestigators = async (): Promise<Investigator[]> => {
    const sql = `
      SELECT id, name, email 
      FROM users 
      WHERE role = 'preliminary_investigator'
      ORDER BY name
    `;
    const [rows] = await pool.query<RowDataPacket[]>(sql);
    return rows as Investigator[];
}

// verify if this user has the access to assign a case
export const verifyAccess = async (userIdFromToken: number): Promise<RowDataPacket[]> => {
    const sql = `
      SELECT a.user_id, a.assign_incident, u.role
      FROM access_rights a
      INNER JOIN users u ON a.user_id = u.id
      WHERE u.id = ?;
    `;
    const [result] = await pool.query<RowDataPacket[]>(sql, [userIdFromToken]);

    return result;
}

// verify if the user has authorization to create a case
export const verifyInsert = async (userIdFromToken: number): Promise<RowDataPacket[]> => {
    const sql = `
      SELECT a.user_id, a.create_incident, u.role
      FROM access_rights a
      INNER JOIN users u ON a.user_id = u.id
      WHERE u.id = ?;
    `;
    const [result] = await pool.query<RowDataPacket[]>(sql, [userIdFromToken]);

    return result;
}


// get incidents assigned to this user

export const getAssignedIncidents = async (tokenId: number) => {
    const sql = `SELECT i.*,
       u.name,
       u.email
       FROM incidents i 
       LEFT JOIN users u ON i.assigned_to = u.id
       WHERE u.id = ? 
       ORDER BY u.id`;
    const [result] = await pool.query(sql, [tokenId]);

    return result;
}

// get incidents assigned to a preliminary 
export const getAssignedToPreliminary = async (limit: number, offset: number): Promise<RowDataPacket[]> => {
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

    const [rows] = await pool.query<RowDataPacket[]>(sql, [limit, offset]);
    return rows;
}