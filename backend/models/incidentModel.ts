import { OkPacket, OkPacketParams } from 'mysql2';
import pool from '../config/db.js';


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

interface InsertResult {
    id: number,
    incidentNumber: string
}

export const insertIncident = async (data: IncidentData): Promise<InsertResult>=> {
    // 1. Insert incident
    const sql = `
      INSERT INTO incidents (
        complainant_name, complainant_email, complainant_contact,
        incident_date, incident_time, location, category,
        details, suspect_details, ssaps_case_number
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.query <OkPacket>(sql, [
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
    const today = new Date ();
    const year = today.getFullYear ();
    const month = String (today.getMonth () + 1).padStart (2, '0');
    const day = String (today.getDate ()).padStart (2, '0');
    const incidentNumber = `INC-${year}${month}${day}-${result.insertId}`;

    // 3. Update with incident number
    await pool.query ('UPDATE incidents SET incident_number = ? WHERE id = ?', [
      incidentNumber,
      result.insertId,
    ]);

    // 4. Automatically insert a preliminary investigation row
    await pool.query (
      `INSERT INTO preliminary_investigations (incident_id) VALUES (?)`,
      [result.insertId]
    );

    return ({
        incidentNumber,
        id: result.insertId
    })
}