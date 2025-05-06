import protectRoute from "../middleware/protectRoute.js";
import express from 'express'
import Expense from "../models/Expense.js";
import Income from "../models/Income.js";
import Wallet from "../models/Wallet.js";



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

	return {startOfWeek, endOfWeek}
}

const getStartAndEndOfMonth = (date = new Date()) => {

	// Start of the month
	const startOfMonth = new Date(date);
	startOfMonth.setDate(1) // Set date --> to the 1rst
	startOfMonth.setHours(0,0,0,0) // Set time to midnight

	// End of Month
	const endOfMonth = new Date(startOfMonth);
	endOfMonth.setMonth(startOfMonth.getMonth() + 1)// Move to May 1, 2025
	endOfMonth.setDate(0); // Move back one day to April 30, 2025
	endOfMonth.setHours(23,59,59,999) // Set time to end of the dday

	return { startOfMonth, endOfMonth}
}


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
		//console.log('Request received at /getExpenses')
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
		//console.log('Request recieve at /getIncomes')
		const userId = req.user.id

		// Find all incomes for the user
		const incomes = await Income.find({uid: userId}).sort({date: -1});

		res.status(200).json({success: true, incomes});
	} catch(error) {
		console.error('Error retrieving incomes: ', error);
		res.status(500).json({success: false, message: 'Failed to fetch incomes'});
	}
})


router.get('/getTransactions', protectRoute, async(req,res) => {

	try {
		console.log('Req @ all transactions')

		// 1. Grab User
		const userId = req.user.id

		// 2. Grab all transactions (by most recent - descending order)
		const [incomes,expenses] = await Promise.all([
			Income.find({uid: userId}).sort({date: -1}),
			Expense.find({uid: userId}).sort({date: -1})
		])

		// 3. Send back transactions
		res.status(200).json({
			success: true,
			transactions: {
				incomes,
				expenses
			}
		})

	} catch(error) {
		console.error('All transactions error: ', error)
		res.status(500).json({success: false, message: 'Failed to fetch all transactions'})
	}
})
/////////////////////////////
// WEEKLY GET request  
/////////////////////////////
router.get('/getCurrentWeekExpenses', protectRoute, async(req,res) => {
	try{
		//console.log('Request received at /getCurrentWeekExpenses')

		// 1. Find EOW/SOW
		const {startOfWeek, endOfWeek} = getStartAndEndOfWeek();

		// 2.  Fetch expenses for the most recent week
		const expenses = await Expense.find({
			uid: req.user.id,
			date: {$gte: startOfWeek, $lte: endOfWeek},
			category: {$ne: 'bills'} // Excludes 'bills' categories
		})

		// 3. Send Info to frontend
		res.status(200).json({success: true, expenses})

	} catch(error) {
		console.error('Error fetch weekly expenses: ', error)
		res.status(500).json({success: false, message: "Failed to fetch weekly expenses"})
	}
})

// Get: Recent Weekly Incomes
router.get('/getCurrentWeekIncomes', protectRoute, async (req, res) => {
	try {
	    //console.log('Request received at /getCurrentWeekIncomes');
 
		// 1. Find EOW/SOW
		const {startOfWeek, endOfWeek} = getStartAndEndOfWeek();

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


// Get: Weekly transactions(income and expenses)
router.get('/getCurrentWeekTransactions', protectRoute, async(req,res) => {
	try {
		console.log('Req @ /getCurrentWeekTransactions')

		// 1. Find EOW/SOW
		const {startOfWeek, endOfWeek} = getStartAndEndOfWeek();

		// 2. Fetch Incomes and Expenses
		const [incomes, expenses] = await Promise.all([
			Income.find({
				uid: req.user.id,
				date: { $gte: startOfWeek, $lte: endOfWeek}
			}),
			Expense.find({
				uid: req.user.id,
				date: {$gte: startOfWeek, $lte: endOfWeek},
				category: {$ne: 'bills'} // Excludes 'bills' categories
			})
		]);

		// 3. Send combine data to Frontend
		res.status(200).json({
			success: true,
			transactions: {
				incomes,
				expenses
			}
		})
	} catch(error) {
		console.error('Error fetching weekly transactions: ', error);
		res.status(500).json({ succes: false, message: 'Failed to fetch weekly transactions'})
	}
})

router.get('/getCurrentWeeklyBudget', protectRoute, async(req,res) => {
	try {
		console.log('Req @ /getCurrentWeekTransactions')

		// 1. Find EOW/SOW
		const {startOfWeek, endOfWeek} = getStartAndEndOfWeek();

		// 2. Fetch Monthly Bills and Income
		const [exepnses,incomes] = await Promise.all([
			Expense.find({
				uid: req.user.id,
				date: {$gte: startOfWeek, $lte: endOfWeek},
				category: {$ne: 'bills'} // Excludes 'bills' categories
			}),
			Income.find({
				uid: req.user.id,
				date: {$gte: startOfWeek, $lte: endOfWeek},
			})
		])

		// 3. Calc Total Bills and Income
		const weeklyExpenses = exepnses.reduce((sum,bill) => sum + bill.amount, 0);
		const weeklyIncome = incomes.reduce((sum,income) => sum + income.amount, 0)
		
		// 4. Calc Weekly Budget
		const weeklyBudget = weeklyExpenses - weeklyIncome // will return NEGATIVE value (until income is greater)
		const weeklyBudgetPercentage = weeklyIncome > 0 ? (weeklyExpenses / weeklyIncome) : 0


		// 5. Send Response
		res.status(200).json({
			success: true, 
			currentWeeklyBudget: weeklyBudget,
			weeklyBudgetPercentage: weeklyBudgetPercentage.toFixed(2)
		})

	} catch(error) {
		console.error('Error fetching weekly budget: ', error);
		res.status(500).json({ succes: false, message: 'Failed to fetch weekly budget'})
	}
})

/////////////////////////////
// MONTHLY GET request  
/////////////////////////////

router.get('/getCurrentMonthlyExpenses', protectRoute, async(req,res) => {
	try {
		//console.log('Req received at /getCurrentMonthlyExpenses')

		// 1. Find EOM/SOM
		const {startOfMonth , endOfMonth} = getStartAndEndOfMonth()

		// 2. Fetch expenses from current month
		const expenses = await Expense.find({
			uid: req.user.id,
			// Date: greater then start of month (4.1), less then end of month (4.30) = 4.2 -- 4.29
			date: { $gte: startOfMonth, $lte: endOfMonth} 
		})

		// 3. Send back expenses
		res.status(200).json({success: true, expenses})

	} catch(error) {
		console.error('Error fetching current month expenses:', error);
		res.status(500).json({ success: false, message: 'Failed to fetch current month expenses' });
	
	}
})

// router.get('/getCurrentMonthlyIncome', protectRoute, async(req,res))

router.get('/getCurrentMonthlyBudget', protectRoute, async(req,res) => {
	try {
		console.log('Req received @ monthly Budget')

		// 1. Find EOM/SOM
		const {startOfMonth , endOfMonth} = getStartAndEndOfMonth()

		// 2. Fetch Monthly Bills and Income
		const [bills,incomes] = await Promise.all([
			Expense.find({
				uid: req.user.id,
				date: { $gte: startOfMonth, $lte: endOfMonth},
				category: 'bills',
			}),
			Income.find({
				uid: req.user.id,
				date: { $gte: startOfMonth, $lte: endOfMonth}
			})
		])

		// 3. Calc Total Bills and Income
		const monthlyBills = bills.reduce((sum,bill) => sum + bill.amount, 0);
		const monthlyIncome = incomes.reduce((sum,income) => sum + income.amount, 0)
		
		// 4. Calc Monthly Budget
		const monthlyBudget = monthlyBills - monthlyIncome // will return NEGATIVE value (until income is greater)
		const monthlyBudgetPercentage = monthlyIncome > 0 ? (monthlyBills / monthlyIncome) : 0


		// 5. Send Response
		res.status(200).json({
			success: true, 
			currentMonthlyBudget: monthlyBudget,
			monthlyBudgetPercentage: monthlyBudgetPercentage.toFixed(2)
		})

	} catch(error) {
		console.error('Error fetching current month budget:', error);
		res.status(500).json({ success: false, message: 'Failed to fetch current month budget' });
	}
})


router.get('/getCurrentMonthlyTransactions', protectRoute, async(req,res) => {
	try {
		console.log('Req @ /getCurrentMonthTransactions')

		// 1. Find EOM/SOM
		const {startOfMonth , endOfMonth} = getStartAndEndOfMonth()

		// 2. Fetch all transactions from this month
		const [incomes, expenses] = await Promise.all([
			Income.find({
				uid: req.user.id,
				date: {$gte: startOfMonth, $lte: endOfMonth}
			}),,,,,,
			Expense.find({
				uid: req.user.id,
				date: {$gte: startOfMonth, $lte: endOfMonth}
			})
		])

		// 3. Send back transactions
		res.status(200).json({
			success: true,
			transactions: {
				incomes,
				expenses
			}
		})

	} catch(error) {
		console.error('Error fetching current month expenses:', error);
		res.status(500).json({ success: false, message: 'Failed to fetch current month transactions' });
	
	}
})

// PUT: Update an expense
router.put('/updateExpense/:id', protectRoute, async (req, res) => {
	try {
	    const { id } = req.params;
	    const { amount, category, date, description } = req.body;
	    const userId = req.user.id;
         // Debugging logs
	    console.log('Update Expense Request ID:', id);
	    console.log('Update Expense User ID:', userId);
	    console.log('Update Expense Body:', req.body);
	    
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
router.delete('/deleteTransaction/:id', protectRoute, async (req, res) => {
	try {
	     const { id } = req.params;
	     const userId = req.user.id;
		const {type} = req.query // Get type from payload 

		// 2. Error check for TYPE
		if (!type) {
			return res.status(400).json({ success: false, message: 'Transaction type is required' });
		 }
   
		let transaction;
   
		// 3. Check type and delete Appropriate collecction
		if(type === 'expense') {
			// Find and delete the expense
			transaction = await Expense.findOneAndDelete({ _id: id, uid: userId });
		} else if (type === 'income') {
			transaction = await Income.findOneAndDelete({_id: id, uid: userId})
		} else {
			return res.status(400).json({success: false, message: "Invalid transaction ID"})
		}

		// If the transaction does not exist
		if(!transaction) {
			return res.status(404).json({success: false, message: 'Transaction does not exist'})
		}
 
	    res.status(200).json({ success: true, message: 'Transaction deleted successfully' });
	} catch (error) {
	    console.error('Error deleting expense:', error);
	    res.status(500).json({ success: false, message: 'Failed to delete expense' });
	}
 });

export default router