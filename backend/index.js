import express from 'express';
import cors from 'cors';
import incidentRoutes from './Routes/incidentRoutes.js';
import categoryRoutes from './Routes/categoryRoutes.js';
import authRoutes from './Routes/authRoutes.js';
import categoryPreliRoutes from './Routes/categoryPreliRoutes.js';
import preliminaryRoutes from './Routes/preliminaryRoutes.js';
import profileRoutes from './Routes/profileRoutes.js';
import forensicRoutes from './Routes/forensicRoutes.js';
import fraudPreventionRoutes from './Routes/fraudPrevetionRoutes.js';
import fraudDetectionRoutes from './Routes/fraudDetectionRoutes.js';
import userManagement from './Routes/userManagementRoutes.js';

import 'dotenv/config';

const app = express();
app.use(express.json());
app.use(cors())


//Declare routes 
app.use("/api/incidents", incidentRoutes);
app.use("/api/categories", categoryRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/preli', categoryPreliRoutes);
app.use('/api/preliminary', preliminaryRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/forensic', forensicRoutes);
app.use('/api/fraud/prevention', fraudPreventionRoutes)
app.use('/api/fraud/detection', fraudDetectionRoutes)
app.use('/api/user/management', userManagement);     
//app,use('/api/preli/subcategories', subPreli)

app.listen(process.env.PORT ,()=> {console.log(`listining to port ${process.env.PORT}`)});