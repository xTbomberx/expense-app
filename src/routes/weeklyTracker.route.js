import express from 'express';

import protectRoute from '../middleware/protectRoute.js';


const router = express.Router();

// Utility function to calculate start and end of the week
const getStartAndEndOfWeek = (date = new Date()) => {
	// Set the Date to start of the week
	const startOfWeek = new Date(date);

	// 1. Sets current day to Sunday
	startOfWeek.setDate(date.getDate() - date.getDay())
	startOfWeek.setHours(0,0,0,0) // Set time to Midnight

	// 2. Set date to end of week
	const endOfWeek = new Date(startOfWeek);
	endOfWeek.setDate(startOfWeek.getDate() + 6) // Add 6 days to get Saturday
	endOfWeek.setHours(23,59,59,999) // Set time to end of day

	return (startOfWeek, endOfWeek)
}




router.get('/getStartOfWeek', protectRoute, async(req, res) => {
	try {
		console.log('Request received at /getStartOfWeek')

		// 1. Grab User from protectRoute
		const userId = req.user.id;

		// 2. Dynamically calculate the start/end of week
		const {startOfWeek, endOfWeek} = getStartAndEndOfWeek();

        // 3. Return the calculated dates as ISO strings
        res.status(200).json({
		success: true,
		startOfWeek: startOfWeek.toISOString(), // Convert to ISO string
		endOfWeek: endOfWeek.toISOString(), // Convert to ISO string
	 });

	} catch(error) {
		console.error('Error retrieving start of week: ',error)
		res.status(500).json({success: false, message: 'Failed to retrieve start of week'})
	}
})

export default router;