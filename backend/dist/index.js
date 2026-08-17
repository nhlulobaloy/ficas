import 'dotenv/config';
//dotenv.config(); // call and declare the dotenv file
// import express and declare the cors
import express from 'express';
import cors from 'cors';
import incidentRoutes from './routes/incidentRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import authRoutes from './routes/authRoutes.js';
import categoryPreliRoutes from './routes/categoryPreliRoutes.js';
import preliminaryRoutes from './routes/preliminaryRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import forensicRoutes from './routes/forensicRoutes.js';
import fraudPreventionRoutes from './routes/fraudPrevetionRoutes.js';
import fraudDetectionRoutes from './routes/fraudDetectionRoutes.js';
import userManagement from './routes/userManagementRoutes.js';
import pool from './config/db.js';
const app = express();
app.use(express.json());
app.use(cors({ origin: 'http://localhost:5173' })); // only allow this domain to send requests to this server
// test the db connection
try {
    (async () => {
        await pool.getConnection();
        console.log('Database connected successfully!!!');
    })();
}
catch (error) {
    console.log('error connectiong database', error);
}
// declare routes 
app.use("/api/incidents", incidentRoutes);
app.use("/api/categories", categoryRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/preli', categoryPreliRoutes);
app.use('/api/preliminary', preliminaryRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/forensic', forensicRoutes);
app.use('/api/fraud/prevention', fraudPreventionRoutes);
app.use('/api/fraud/detection', fraudDetectionRoutes);
app.use('/api/user/management', userManagement);
// app,use('/api/preli/subcategories', subPreli)
app.listen(process.env.PORT, () => { console.log(`listining to port ${process.env.PORT}`); });
