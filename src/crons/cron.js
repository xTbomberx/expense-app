import cron from 'cron'
import WeeklyTracker from '../models/StartofWeek.js'
import User from '../models/User.js'


// Create a new CronJob to run every Sunday at Midnight
// 0 0 * * 0
// minute hours day-of-month month day-of-week
const job = new cron.CronJob('0 0 * * 0', async() => {
	try {
		console.log('Running every weekly tracker cron job')

		// Get all Users (need to do this for every User)
		const users = await User.find();

		// Get the start of the current week (Sunday)
		const startOfWeek = newDate();
		startOfWeek.setDate(startOfWeek.getDate()- startOfWeek.getDay()); // Set to Previous Sunday
		startOfWeek.setHours(0,0,0,0) // Set to Midnight

		// Create weekly trackers for all Users
		const weeklyTrackers = users.map((user) => ({
			uid: user._id,
			startOfWeek,
		}))

		// Insert the weekly trackers into the DB
		await WeeklyTracker.insertMany(weeklyTrackers);

		console.log('Weekly trackers created for all users: ', startOfWeek);
	} catch(error) {
		console.error('Error running weekly cron job: ', error);
	}
})

export default job;