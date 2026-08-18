import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

// declare the global interface along with the types
declare global {
    namespace Express {
        interface Request {
            user : {
                id: number,
                name: String,
                role: String,
                email: String
            }
        }
    }
}
// this middleware verifies the token on every request send to the backend
export const authMiddleware= (req: Request, res: Response, next: NextFunction) => {
    // get the token from the authorization
    const authHeader = req.header("Authorization")?.replace("Bearer ", "");
    if(!authHeader) return res.status(401).json({message: 'No token found! check'});
    try {
        const decoded = jwt.verify(authHeader, process.env.SECRET_KEY!) as any 
        req.user = {
            id: decoded.id,
            name: decoded.name,  
           // email: decoded.email,
            role: decoded.role,
            email: decoded.email
        };
        //move from the middleware and continue to what comes after it
        next();
    } catch (error) {
    if (error instanceof Error && error.name === "TokenExpiredError") {
        return res.status(401).json({ message: "Token expired" });
    }
    return res.status(403).json({ message: "Invalid token" });
}
}    