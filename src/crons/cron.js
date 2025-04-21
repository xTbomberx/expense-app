import cron from 'cron'
import WeeklyTracker from '../models/StartofWeek.js'
import MonthlyTracker from '../models/Monthly.js'
import User from '../models/User.js'


// Create a new CronJob to run every Sunday at Midnight
// 0 0 * * 0
// minute hours day-of-month month day-of-week
const weeklyJob = new cron.CronJob('0 0 * * 0', async() => {
	try {
		console.log('Running every weekly tracker cron job')

		// Get all Users (need to do this for every User)
		const users = await User.find();

		// Get the start of the current week (Sunday)
		const startOfWeek = newDate();
		startOfWeek.setDate(startOfWeek.getDate()- startOfWeek.getDay()); // Set to Previous Sunday
		startOfWeek.setHours(0,0,0,0) // Set to Midnight

		// Get the end of the current week (Saturday Night)
		const endOfWeek = new Date(startOfWeek);
		endOfWeek.setDate(startOfWeek.getDate() + 6) // Add 6 days to get Saturday
		endOfWeek.setHours(23, 59, 59, 999) // Set hours to end of day

		// Create weekly trackers for all Users
		const weeklyTrackers = users.map((user) => ({
			uid: user._id,
			startOfWeek,
			endOfWeek
		}))

		// Insert the weekly trackers into the DB
		await WeeklyTracker.insertMany(weeklyTrackers);

		console.log('Weekly trackers created for all users: ', startOfWeek);
	} catch(error) {
		console.error('Error running weekly cron job: ', error);
	}
})

// Monthly Tracker Cron Job (Runs on the 1st of every month at midnight)
const monthlyJob = new cron.CronJob('0 0 1 * *', async () => {
	try {
	    console.log('Running monthly tracker cron job...');
 
	    // Get all Users
	    const users = await User.find();
 
	    // Get the start of the current month
	    const startOfMonth = new Date();
	    startOfMonth.setDate(1); // Set to the first day of the month
	    startOfMonth.setHours(0, 0, 0, 0); // Set to Midnight
 
	    // Get the end of the current month
	    const endOfMonth = new Date(startOfMonth);
	    endOfMonth.setMonth(startOfMonth.getMonth() + 1); // Move to the next month
	    endOfMonth.setDate(0); // Set to the last day of the current month
	    endOfMonth.setHours(23, 59, 59, 999); // Set to the end of the day
 
	    // Create monthly trackers for all Users
	    const monthlyTrackers = users.map((user) => ({
		   uid: user._id,
		   startOfMonth,
		   endOfMonth,
	    }));
 
	    // Insert the monthly trackers into the DB
	    await MonthlyTracker.insertMany(monthlyTrackers);
 
	    console.log('Monthly trackers created for all users: ', startOfMonth);
	} catch (error) {
	    console.error('Error running monthly cron job: ', error);
	}
});


 // Export both jobs
export { weeklyJob, monthlyJob };