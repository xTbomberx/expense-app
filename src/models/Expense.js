const mongoose = require('mongoose');


const ExpenseSchema = new mongoose.Schema({
	amount: {
		type: Number,
		required: true
	},
	category: {
		type: String,
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

const Expense = mongoose.model('Expense', ExpenseSchema)
export default Expense;