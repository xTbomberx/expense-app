import mongoose from "mongoose";

const MonthlyTrackerSchema = new mongoose.Schema({
    uid: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    startOfMonth: {
        type: Date,
        required: true
    },
    endOfMonth: { // Add this field for convenience
        type: Date,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const MonthlyTracker = mongoose.model('MonthlyTracker', MonthlyTrackerSchema);
export default MonthlyTracker;