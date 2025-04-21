import protectRoute from "../middleware/protectRoute.js";
import express from 'express'
import Expense from "../models/Expense.js";
import Income from "../models/Income.js";
import Wallet from "../models/Wallet.js";
import WeeklyTracker from '../models/StartofWeek.js';
import MonthlyTracker from '../models/Monthly.js'

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

// Get: Recent Weekly Expenses
router.get('getCurrentWeekExpenses', protectRoute, async(req,res) => {
	try{
		console.log('Request received at /getCurrentWeekExpenses')

		// 1. Find the most recently weekly tracker for user 
		// payload = (weeklyTracker.startOfWeek, weeklyTracker.id , weeklyTracker.uid)
		const latestWeeklyTracker = await WeeklyTracker.findOne({uid: req.user.id})
			.sort({startOfWeek: -1 }) // Sort the array  of weeks (descending order/ most recent)
			.limit(1) // Get the most recent 1

		if(!latestWeeklyTracker) {
			return res.status(404).json({success: false, message:'No weekly tracker found'})
		}

		// 1.b. grab these two constants from the object latestWeeklyTracker
		const {startOfWeek, endOfWeek} = latestWeeklyTracker;

		// 2.  Fetch expenses for the most recent week
		const expenses = await Expense.find({
			uid: req.user.id,
			date: {$gte: startOfWeek, $lte: endOfWeek}
		})

		// 3. Send Info to frontend
		res.status(200).json({success: true, expense})
	} catch(error) {
		console.error('Error fetch weekly expenses: ', error)
		res.status(500).json({success: false, message: "Failed to fetch weekly expenses"})
	}
})

// Get: Recent Weekly Incomes
router.get('/getCurrentWeekIncomes', protectRoute, async (req, res) => {
	try {
	    console.log('Request received at /getCurrentWeekIncomes');
 
	    // 1. Find the most recent weekly tracker for the user
	    const latestWeeklyTracker = await WeeklyTracker.findOne({ uid: req.user.id })
		   .sort({ startOfWeek: -1 }) // Sort by startOfWeek in descending order
		   .limit(1); // Get the most recent one
 
	    if (!latestWeeklyTracker) {
		   return res.status(404).json({ success: false, message: 'No weekly tracker found' });
	    }
 
	    const { startOfWeek, endOfWeek } = latestWeeklyTracker;
 
	    // 2. Fetch incomes for the most recent week
	    const incomes = await Income.find({
		   uid: req.user.id,
		   date: { $gte: startOfWeek, $lte: endOfWeek },
	    });
 
	    // 3. Send incomes to the frontend
	    res.status(200).json({ success: true, incomes });
	} catch (error) {
	    console.error('Error fetching weekly incomes:', error);
	    res.status(500).json({ success: false, message: 'Failed to fetch weekly incomes' });
	}
 });


router.get('getCurrentMonthlyExpenses', protectRoute, async(req,res) => {
	try {
		console.log('Req received at /getCurrentMonthlyExpenses')

		// 1. Find recent/current month
		const latestMonthlyTracker = await MonthlyTracker.findOne({uid: req.user.id})
			.sort({startOfMonttth: -1}) // Sort Array in descending/recent order
			.limit(1) // Get most recent 1

		// 2. Error Check
		if (!latestMonthlyTracker) {
			return res.status(404).json({ success: false, message: 'No monthly tracker found' });
		}

		// 3. Grab Variables from OBJECT
		const {startOfMonth , endOfMonth} = latestMonthlyTracker;

		// 4. Fetch expenses from current month
		const expenses = await Expense.find({
			uid: req.user.id,
			// Date: greater then start of month (4.1), less then end of month (4.30) = 4.2 -- 4.29
			date: { $gte: startOfMonth, $lte: endOfMonth} 
		})

		// 5. Send back expenses
		res.status(200).json({success: true, expenses})
	} catch(error) {
		console.error('Error fetching current month expenses:', error);
		res.status(500).json({ success: false, message: 'Failed to fetch current month expenses' });
	
	}
})

// Get: Current Month Incomes
router.get('/getCurrentMonthIncomes', protectRoute, async (req, res) => {
	try {
	    console.log('Request received at /getCurrentMonthIncomes');
 
	    // 1. Find the most recent monthly tracker for the user
	    const latestMonthlyTracker = await MonthlyTracker.findOne({ uid: req.user.id })
		   .sort({ startOfMonth: -1 }) // Sort by startOfMonth in descending order
		   .limit(1); // Get the most recent one
 
	    if (!latestMonthlyTracker) {
		   return res.status(404).json({ success: false, message: 'No monthly tracker found' });
	    }
 
	    const { startOfMonth, endOfMonth } = latestMonthlyTracker;
 
	    // 2. Fetch incomes for the current month
	    const incomes = await Income.find({
		   uid: req.user.id,
		   date: { $gte: startOfMonth, $lte: endOfMonth },
	    });
 
	    // 3. Send incomes to the frontend
	    res.status(200).json({ success: true, incomes });
	} catch (error) {
	    console.error('Error fetching current month incomes:', error);
	    res.status(500).json({ success: false, message: 'Failed to fetch current month incomes' });
	}
 });

// Get: Current Month Bills
router.get('/getCurrentMonthBills', protectRoute, async (req, res) => {
	try {
	    console.log('Request received at /getCurrentMonthBills');
 
	    // Find the most recent monthly tracker for the user
	    const latestMonthlyTracker = await MonthlyTracker.findOne({ uid: req.user.id })
		   .sort({ startOfMonth: -1 }) // Sort by startOfMonth in descending order
		   .limit(1); // Get the most recent one
 
	    if (!latestMonthlyTracker) {
		   return res.status(404).json({ success: false, message: 'No monthly tracker found' });
	    }
 
	    const { startOfMonth, endOfMonth } = latestMonthlyTracker;
 
	    // Fetch bills (expenses with category "bills") for the current month
	    const bills = await Expense.find({
		   uid: req.user.id,
		   category: 'bills', // Filter by category "bills"
		   date: { $gte: startOfMonth, $lte: endOfMonth },
	    });
 
	    res.status(200).json({ success: true, bills });
	} catch (error) {
	    console.error('Error fetching current month bills:', error);
	    res.status(500).json({ success: false, message: 'Failed to fetch current month bills' });
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