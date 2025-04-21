import express from 'express';
import cors from 'cors';
import 'dotenv/config'
import job from './crons/cron.js';

// Routes Imports
import { connectDB } from './config/db.js';
import authRoutes from './routes/auth.route.js'
import walletRoutes from './routes/wallet.route.js'
import expenseRoutes from './routes/expense.route.js'
import trackerRoutes from './routes/weeklyTracker.route.js'
import billRoutes from './routes/bill.route.js'


const app = express();
const PORT = process.env.PORT || 3000; // provides default VALUE if first is FALSY(doesnt exist)
const API_URL = process.env.API_URL


// MiddleWare - CronJobs
job.start() 
app.use(express.json({
    limit: '50MB',
  }));

app.use(cors());

app.get('/here', (req,res) => {
    res.send("I am here")
})

app.use('/api/auth', authRoutes)
app.use('/api/wallet', walletRoutes)
app.use('/api/expenses', expenseRoutes);
app.use('/api/weekly', trackerRoutes)
app.use('/api/bills', billRoutes)



const main = async() => {
    app.listen(PORT, () => {console.log(`${API_URL}`)})
    connectDB();
}


main();