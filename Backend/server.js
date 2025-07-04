import express from 'express';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import userRoutes from './routes/userRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import locationRoutes from './routes/locationRoutes.js';
import approveRoute from './routes/approveRoute.js';
import cors from 'cors';
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import path from 'path';
import { fileURLToPath } from 'url';
import expressListEndpoints from 'express-list-endpoints';
import analyticsRoutes from './routes/analytics.routes.js';


dotenv.config();

import emailRoutes  from './routes/email.routes.js';


const app = express();
const PORT = process.env.PORT || 5000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


connectDB();

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Happenin APIs',
      version: '1.0.0',
      description: 'API documentation for your MEAN project'
    },
    servers: [
      { url: 'http://localhost:5000/api' },
      { url: 'https://happenin-byma.onrender.com/api' }
      
    ]
  },
  apis: ['./routes/*.js'],  // path where your routes exist
};

const swaggerSpec = swaggerJSDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/health-check', (req, res) => {
  res.status(200).send('OK');
});

// Middleware
app.use(express.json());
app.use(cors({
  origin: ['http://localhost:4200', 'https://happeninfrontend.onrender.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Routes
app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/approval' , approveRoute);
app.use('/api/email', emailRoutes);
app.use('/api/analytics',analyticsRoutes);

app.get('/', (req, res) => {
  res.send('API is running...');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});



const endpoints = expressListEndpoints(app);
// console.log(endpoints);