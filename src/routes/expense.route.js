import protectRoute from "../middleware/protectRoute.js";
import express from 'express'
import Expense from "../models/Expense.js";
import Wallet from "../models/Wallet.js";

const router = express.Router();


// POST: create new expennse
router.post('/postExpense', async(req, res) => {
	try {
		const { amount, category, date, description, walletId } = req.body;
		console.log('Request received at /postExpense')

		// 1. Validation
		if(!amount || !category || !walletId) {
			return res.status(404).json({ success: false, message: 'Please provide all expense fields'});
		}

		// 2. Extract user Id from the token
		const userId = req.user.id;

		// 3. Create new Expense
		const expense = await Expense.create({
			amount,
			category,
			date,
			description,
			uid: userId,
			walletId,
		})

		// 4. Add new Expense to walletIds(wallets) totalExpense
		const wallet = await Wallet.findById(walletId);

		if(!wallet){
			return res.status(404).json({success: false, message: "Wallet not found"})
		}

		// 4.b. Add to wallet
		wallet.totalExpense += amount;
		wallet.balance -= amount;
		await wallet.save();


		res.status(201).json({succes: true, expense})

	} catch(error){
		console.error('Error creating expense: ', error);
		res.status(500).json({succes: false, message: 'Failed to create expense'})
	}
})

// GET: Retrieve all expenses for the logged-in user
router.get('/getExpenses', protectRoute, async (req, res) => {
	try {
	    const userId = req.user.id; // Extract user ID from the token
 
	    // Find all expenses for the user
	    const expenses = await Expense.find({ uid: userId }).sort({ date: -1 });
 
	    res.status(200).json({ success: true, expenses });
	} catch (error) {
	    console.error('Error retrieving expenses:', error);
	    res.status(500).json({ success: false, message: 'Failed to fetch expenses' });
	}
 });

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