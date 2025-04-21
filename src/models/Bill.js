import mongoose from 'mongoose';


const BillSchema = new mongoose.Schema({
	uid: { 
		type: mongoose.Schema.Types.ObjectId, 
		ref: 'User', required: true },
	amount: { 
		type: Number, 
		required: true 
	},
	description: { 
		type: String 
	},
	// recurring: { 
	// 	type: Boolean, // For recurring bills
	// 	default: false 
	// }, 
	createdAt: { 
		type: Date, 
		default: Date.now },
 });
 
const Bill = mongoose.model('Bill', BillSchema)

export default Bill;