import express from 'express';
import WeeklyTracker from '../models/StartofWeek.js';
import protectRoute from '../middleware/protectRoute.js';


const router = express.Router();

router.get('/getStartOfWeek', protectRoute, async(req, res) => {
	try {
		console.log('Request received at /getStartOfWeek')
		// 1. Grab User from protectRoute
		const userId = req.user.id;

		// 2. Search for latest Week
		const latestWeek = await WeeklyTracker.findOne({
			uid:userId
		}).sort({startOfWeek: -1});

		// Error Check
		if (!latestWeek) {
			return res.status(404).json({ success: false, message: 'No weekly tracker found' });
		 }

		// 3. return the data
		res.status(200).json({
			success: true,
			startOfWeek: latestWeek.startOfWeek
		})
	} catch(error) {
		console.error('Error retrieving start of week: ',error)
		res.status(500).json({success: false, message: 'Failed to retrieve start of week'})
	}
})

export default router;