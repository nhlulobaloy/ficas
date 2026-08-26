import { Request, Response } from 'express';
import { getAllUsers } from '../models/userModel.js';

// get all the users
export const getUsers = async (req: Request, res: Response) => {
    try {
        const results = await getAllUsers();
        return res.json(results)
    } catch (error) {
        console.error("DB Error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}
