import pool from '../config/db.js';
import { OkPacketParams, RowDataPacket } from 'mysql2'


interface User {
    id: number,
    name: string,
    email: string,
    //password: string,
    role: string
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
