import { RowDataPacket } from 'mysql2';
import pool from '../config/db.js';
import { Response, Request } from 'express';
import { findById, updateUser } from '../models/userModel.js';

export const changePassword = () => { };


// get the user profile
export const getProfile = async (req: Request, res: Response) => {
    try {
        const userId = req.user.id; // Get ID from token
        const user = await findById(userId)
        if (!user) return res.status(500)
        res.json({ data: user });
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "An error occured", error: error });
    }
};

// update user profile
export const updateProfile = async (req: Request, res: Response) => {
    try {
        const userId = req.user.id;
        const { name, email } = req.body;
        const userUpdate = await updateUser(userId, name, email)
        if (!userUpdate) return res.status(404).json({ error: 'Internal server error' })
        res.status(200).json({ message: "User update was succesful" })
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "An error occured", error: error });
    }
}

