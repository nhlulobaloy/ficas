import pool from '../config/db.js';
import { OkPacket, OkPacketParams, RowDataPacket } from 'mysql2'
import bcrypt from 'bcrypt'


interface User {
    id?: number,
    name: string,
    email: string,
    password: string,
    role?: string
};

// use any for now to remove typescript error
// get all the users with thier access rights(AR)
export const getAllUsersAR = async (): Promise<any[]> => {
    const [results] = await pool.query<RowDataPacket[]>(`SELECT u.*, a.* FROM users u LEFT JOIN access_rights a ON u.id = a.user_id`);
    return results.map(user => {
        delete user.password
        return user;
    })
}

// get all the users 
export const getAllUsers = async (): Promise<User[]> => {
    const [results] = await pool.query<RowDataPacket[]>('SELECT id, name, email, role FROM users') // select and omit the password
    return results as User[];
}


// check if user exists
export const checkUserExists = async (email: string): Promise<boolean> => {
    const [row] = await pool.query<RowDataPacket[]>('SELECT * FROM users WHERE email = ?', [email]);
    return row.length > 0
}

// insert user into the database
export const createUser = async (user: User) => {
    const hashedPassword = await bcrypt.hash(user.password, 12);
    const [result] = await pool.query<OkPacket>("INSERT INTO users (name, email, password) VALUES (?, ?, ?)", [user.name.trim(), user.email.toLowerCase(), hashedPassword]);
    return result.insertId;
}

// find user by email
export const findByEmail = async (email: string): Promise<RowDataPacket[]> => {
    const [result] = await pool.query<RowDataPacket[]>(`SELECT * FROM users WHERE email = ?`, [email]);
    return result;
}

// find the user by id
export const findById = async (id: number): Promise<object> => {
    const [dbUser] = await pool.query<RowDataPacket[]>(`SELECT id, name, email, role FROM users WHERE id = ?`, [id]);
    return dbUser[0]
}

// update the user's name and email using user id
export const updateUser = async (id: number, name: string, email: string): Promise<boolean> => {
const [results] = await pool.query<OkPacket>(`UPDATE users SET name = ? , email = ? WHERE id = ?`, [name, email, id]);
return results.affectedRows > 0;
}

