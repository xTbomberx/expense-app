import protectRoute from "../middleware/protectRoute.js";
import express from 'express'
import Expense from "../models/Expense.js";
import Income from "../models/Income.js";
import Wallet from "../models/Wallet.js";



const router = express.Router();


// POST: create new transaction
router.post('/postTransaction', protectRoute, async(req, res) => {
	try {
		const { amount, category, date, description, walletId, type } = req.body;
		console.log('Request received at /postExpense')
		console.log(req.body)
		// 1. Validation - CHECK for CATEGORY ONLY WHEN TYPE = exepnse
		// if(!amount || !category || !walletId) {
		if (!amount || !walletId || (type === 'expense' && !category)) {
			return res.status(404).json({ success: false, message: 'Please provide all expense fields'});
		}

		// 2. Extract user Id from the token
		const userId = req.user.id;

		// 3. Create new Expense or Income based upon type
		let transaction;
		if (type === 'expense') {
			transaction = await Expense.create({
				amount,
				category,
				date,
				description,
				uid: userId,
				walletId,
			})
		} else if (type === 'income') {
			transaction = await Income.create({
				amount,
				date,
				description,
				uid: userId,
				walletId,
			})
		} else {
			return res.status(400).json({ success: false, message: 'Invalid transaction type' });
		}

		// 4. Add new Expense/Income to walletIds(wallets) totalExpense
		const wallet = await Wallet.findById(walletId);

		if(!wallet){
			return res.status(404).json({success: false, message: "Wallet not found"})
		}

		// 4.b. Add to wallet
		if (type === 'expense') {
			wallet.totalExpense += amount;
			wallet.balance -= amount;
		 } else if (type === 'income') {
			wallet.totalIncome += amount;
			wallet.balance += amount;
		 }

		await wallet.save();

		res.status(201).json({succes: true, transaction})

	} catch(error){
		console.error('Error creating expense: ', error);
		res.status(500).json({succes: false, message: 'Failed to create expense'})
	}
})

// GET: Retrieve all expenses for the logged-in user
router.get('/getExpenses', protectRoute, async (req, res) => {
	try {
		console.log('Request received at /getExpenses')
	    const userId = req.user.id; // Extract user ID from the token
 
	    // Find all expenses for the user
	    const expenses = await Expense.find({ uid: userId }).sort({ date: -1 });
 
	    res.status(200).json({ success: true, expenses });
	} catch (error) {
	    console.error('Error retrieving expenses:', error);
	    res.status(500).json({ success: false, message: 'Failed to fetch expenses' });
	}
 });


// Get: Retrieve all incomes for the logged-in user
router.get('/getIncomes', protectRoute, async(req,res) => {
	try {
		console.log('Request recieve at /getIncomes')
		const userId = req.user.id

		// Find all incomes for the user
		const incomes = await Income.find({uid: userId}).sort({date: -1});

		res.status(200).json({success: true, incomes});
	} catch(error) {
		console.error('Error retrieving incomes: ', error);
		res.status(500).json({success: false, message: 'Failed to fetch incomes'});
	}
})



// PUT: Update an expense
router.put('/updateExpense/:id', protectRoute, async (req, res) => {
	try {
	    const { id } = req.params;
	    const { amount, category, date, description } = req.body;
	    const userId = req.user.id;
 
	    // Find the expense and ensure it belongs to the user
	    const expense = await Expense.findOne({ _id: id, uid: userId });

	    // If check - doesnt exist
	    if (!expense) {
		   return res.status(404).json({ success: false, message: 'Expense not found' });
	    }
 
	    // Update the expense fields
	    expense.amount = amount || expense.amount;
	    expense.category = category || expense.category;
	    expense.date = date || expense.date;
	    expense.description = description || expense.description;
 
	    await expense.save();
 
	    res.status(200).json({ success: true, expense });
	} catch (error) {
	    console.error('Error updating expense:', error);
	    res.status(500).json({ success: false, message: 'Failed to update expense' });
	}
 });


 
 // DELETE: Delete an expense
router.delete('/deleteExpense/:id', protectRoute, async (req, res) => {
	try {
	    const { id } = req.params;
	    const userId = req.user.id;
 
	    // Find and delete the expense
	    const expense = await Expense.findOneAndDelete({ _id: id, uid: userId });

	    // If check - doesnt exist
	    if (!expense) {
		   return res.status(404).json({ success: false, message: 'Expense not found' });
	    }
 
	    res.status(200).json({ success: true, message: 'Expense deleted successfully' });
	} catch (error) {
	    console.error('Error deleting expense:', error);
	    res.status(500).json({ success: false, message: 'Failed to delete expense' });
	}
 });
export default router