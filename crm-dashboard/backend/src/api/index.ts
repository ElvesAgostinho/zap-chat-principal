import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import routes from './routes';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api', routes);

// Health Check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'CRM Backend is running' });
});

app.listen(port, () => {
    console.log(`[server]: CRM Backend is running at http://localhost:${port}`);
});

export default app;
