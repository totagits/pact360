import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import Routers
import authRouter from './routes/auth';
import dashboardRouter from './routes/dashboard';
import assetsRouter from './routes/assets';
import maintenanceRouter from './routes/maintenance';
import contractsRouter from './routes/contracts';
import ngoRouter from './routes/ngo';
import systemRouter from './routes/system';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes mounting
app.use('/api/auth', authRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/assets', assetsRouter);
app.use('/api/maintenance', maintenanceRouter);
app.use('/api/contracts', contractsRouter);
app.use('/api/ngo', ngoRouter);
app.use('/api/system', systemRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

// Production Client Hosting (Static asset serving + fallback SPA mapping)
if (process.env.NODE_ENV === 'production') {
  const clientBuildPath = path.join(process.cwd(), '../client/dist');
  console.log(`Hosting production client assets from: ${clientBuildPath}`);
  
  app.use(express.static(clientBuildPath));
  
  app.get('*', (req, res) => {
    // Only intercept requests that do not start with /api
    if (!req.url.startsWith('/api')) {
      res.sendFile(path.join(clientBuildPath, 'index.html'));
    } else {
      res.status(404).json({ error: 'API route not found.' });
    }
  });
} else {
  // Developer stub fallback message
  app.get('/', (req, res) => {
    res.send('PACT360 REST API Server is running in development mode. Start Vite client separately.');
  });
}

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled server exception:', err);
  res.status(500).json({ error: 'An unexpected server error occurred.' });
});

app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(` PACT360 backend initialized on port ${PORT}`);
  console.log(` Running mode: ${process.env.NODE_ENV || 'development'}`);
  console.log(`==================================================`);
});
