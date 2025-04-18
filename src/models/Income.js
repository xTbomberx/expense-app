import mongoose from 'mongoose';


const IncomeSchema = new mongoose.Schema({
	amount: {
		type: Number,
		required: true
	},
	date: {
		type: Date,
		default: Date.now,
	},
	descpription: {
		type: String,
		default: '',
	},
	uid: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User', 
		required: true
	},
	walletId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Wallet', // Reference to the Wallet model
		required: true,
	}
})

const Income = mongoose.model('Income', IncomeSchema)
export default Income;