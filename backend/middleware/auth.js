import jwt from 'jsonwebtoken';

export const authMiddleware= (req, res, next) => {
    //get the token from the authorization
    const authHeader = req.header("Authorization")?.replace("Bearer ", "");
    if(!authHeader) return res.status(401).json({message: 'No token found! check'});
    try {
        const decoded = jwt.verify(authHeader, process.env.SECRET_KEY)
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
        return res.status(403).json({message: error})
    }
}