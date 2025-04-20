import mongoose from "mongoose";

const WeeklyTrackerSchema = new mongoose.Schema({
		uid: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User', 
			required: true
		},
		startOfWeek: {
			type: Date,
			required: true
		},
		createdAt: {
			type: Date, 
			default: Date.now
		}
})

const StartOfWeek = mongoose.model('StartOfWeek', WeeklyTrackerSchema)
export default StartOfWeek;