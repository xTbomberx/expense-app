import protectRoute from "../middleware/protectRoute.js";
import express from 'express'
import Expense from "../models/Expense.js";
import Income from "../models/Income.js";
import Wallet from "../models/Wallet.js";
import User from "../models/User.js";



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
		// console.log('Request received at /postExpense')
		
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

router.get('/getSavings', protectRoute, async(req,res) => {
	try {

		// 1. Get User
		const userId = req.user.id

		// 2. Find all savings & goal for the User
		const [user, savings] = await Promise.all([
			User.findById(userId),
			Expense.find({
				uid: userId,
				category: 'savings'
			})
		])

		// 3. Calculate Total Savings
		const totalSavings = savings.reduce((sum,saving) => sum + saving.amount, 0)

		// 4. Calculate Savings Percentage
		const savingsGoal = user.savingsGoal || 0; // Default to Zero if None
		const savingsPercentage = savingsGoal > 0 ? (totalSavings / savingsGoal) * 100 : 0;

		console.log('total savings: ', totalSavings)
		console.log('Savings Goal: ', savingsGoal)
		console.log('Savings Percentage: ', savingsPercentage)

		
		// 5. Send Response
		res.status(200).json({
			success: true,
			totalSavings: totalSavings.toFixed(2),
			savingsGoal: savingsGoal.toFixed(2),
			savingsPercentage: savingsPercentage.toFixed(2),
		});

	} catch (error) {
        console.error('Error fetching savings:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch savings' });
    }
})

router.get('/getTransactions', protectRoute, async(req,res) => {

	try {
		// console.log('Req @ all transactions')

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
		//console.log('Req @ /getCurrentWeekTransactions')

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
		// console.log('Req @ /getCurrentWeekTransactions')

		// 1. Find EOW/SOW
		const {startOfWeek, endOfWeek} = getStartAndEndOfWeek();
		const {startOfMonth , endOfMonth} = getStartAndEndOfMonth()

		// 2. Fetch Monthly Bills and Income
		const [weeklyExpensesData, monthlyBillsData, weeklyIncomeData ] = await Promise.all([
			Expense.find({
				uid: req.user.id,
				date: {$gte: startOfWeek, $lte: endOfWeek},
				category: {$ne: 'bills'} // Excludes 'bills' categories
			}),
			Expense.find({
				uid: req.user.id,
				date: {$gte: startOfMonth, $lte: endOfMonth},
				category: 'bills'
			}),
			Income.find({
				uid: req.user.id,
				date: {$gte: startOfWeek, $lte: endOfWeek},
			})
		])

		// 3. Calc Total Bills and Income
		const weeklyExpenses = weeklyExpensesData.reduce((sum, expense) => sum + expense.amount, 0);
		const monthlyBills = monthlyBillsData.reduce((sum, bill) => sum + bill.amount, 0);
		const weeklyIncome = weeklyIncomeData.reduce((sum, income) => sum + income.amount, 0);
  

		// 4. Calc Weekly Budget
		// Negative if Income is Less then Expenses
		const weeklyTarget = weeklyExpenses + (monthlyBills / 4);

		const weeklyBudget = weeklyIncome  - weeklyTarget
		const weeklyBudgetPercentage = weeklyTarget > 0 ? (weeklyIncome / weeklyTarget) * 100 : 0;

		// console.log('Weekly Expenses:', weeklyExpenses);
		// console.log('Monthly Bills (Weekly Portion):', monthlyBills / 4);
		// console.log('Weekly Target:', weeklyTarget);
		// console.log('Weekly Income:', weeklyIncome);
		// console.log('Weekly Budget Percentage:', weeklyBudgetPercentage);

		// 5. Send Response
		res.status(200).json({
			success: true, 
			currentWeeklyBudget: weeklyBudget.toFixed(2),
			weeklyBudgetPercentage: weeklyBudgetPercentage.toFixed(2),
			weeklyTarget: weeklyTarget
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

router.get('/getCurrentMonthlyTransactions', protectRoute, async(req,res) => {
	try {
		// console.log('Req @ /getCurrentMonthTransactions')

		// 1. Find EOM/SOM
		const {startOfMonth , endOfMonth} = getStartAndEndOfMonth()

		// 2. Fetch all transactions from this month
		const [incomes, expenses] = await Promise.all([
			Income.find({
				uid: req.user.id,
				date: {$gte: startOfMonth, $lte: endOfMonth}
			}),
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


router.get('/getCurrentMonthlyBudget', protectRoute, async(req,res) => {
	try {
		//  console.log('Req received @ monthly Budget')

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
		// will return NEGATIVE value (until income is greater)
		const monthlyBudget = monthlyIncome - monthlyBills // will return NEGATIVE value (until income is greater)
		const monthlyBudgetPercentage = monthlyIncome > 0 ? (monthlyIncome / monthlyBills) * 100 : 0;

		// 5. Send Response
		res.status(200).json({
			success: true, 
			currentMonthlyBudget: monthlyBudget.toFixed(2),
			monthlyBudgetPercentage: monthlyBudgetPercentage.toFixed(2),
			monthlyBills: monthlyBills,

		})

	} catch(error) {
		console.error('Error fetching current month budget:', error);
		res.status(500).json({ success: false, message: 'Failed to fetch current month budget' });
	}
})


////////////////////
// PUT: Update an expense
///////////////////
router.put('/updateExpense/:id', protectRoute, async (req, res) => {
	try {
	    const { id } = req.params;
	    const { amount, category, date, description } = req.body;
	    const userId = req.user.id;

         // Debugging logs
	//     console.log('Update Expense Request ID:', id);
	//     console.log('Update Expense User ID:', userId);
	//     console.log('Update Expense Body:', req.body);
	    
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

//////////////////////////
// DELETE: Delete an expense
//////////////////////////
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

		// 4. Update the Wallet
		const wallet = await Wallet.findById(transaction.walletId)

		if(!wallet) {
			   return res.status(404).json({ success: false, message: 'Wallet not found' });
		}
			 
		if(type === 'expense') {
			wallet.totalExpense -= transaction.amount;
			wallet.balance += transaction.amount; // Refund the expense amount
		} else if (type=== 'income') {
			wallet.totalIncome -= transaction.amount;
			wallet.balance -= transaction.amount // Deduct the income amount
		}

		await wallet.save()

		// 5. Send back response
 		// res.status(200).json({ success: true, message: 'Transaction deleted successfully' });
		res.status(200).json({ success: true, message: 'Transaction deleted successfully', wallet });
	
	} catch (error) {
	    console.error('Error deleting expense:', error);
	    res.status(500).json({ success: false, message: 'Failed to delete expense' });
	}
 });

export default router


// router.delete('/deleteTransaction/:id', protectRoute, async (req, res) => {
// 	try {
// 	    const { id } = req.params;
// 	    const userId = req.user.id;
// 	    const { type } = req.query; // Get type from payload
 
// 	    // 1. Error check for TYPE
// 	    if (!type) {
// 		   return res.status(400).json({ success: false, message: 'Transaction type is required' });
// 	    }
 
// 	    let transaction;
 
// 	    // 2. Check type and delete the appropriate collection
// 	    if (type === 'expense') {
// 		   // Find and delete the expense
// 		   transaction = await Expense.findOneAndDelete({ _id: id, uid: userId });
// 	    } else if (type === 'income') {
// 		   // Find and delete the income
// 		   transaction = await Income.findOneAndDelete({ _id: id, uid: userId });
// 	    } else {
// 		   return res.status(400).json({ success: false, message: 'Invalid transaction type' });
// 	    }
 
// 	    // 3. If the transaction does not exist
// 	    if (!transaction) {
// 		   return res.status(404).json({ success: false, message: 'Transaction does not exist' });
// 	    }
 
// 	    // 4. Update the wallet's balance and totals
// 	    const wallet = await Wallet.findById(transaction.walletId);
 
// 	    if (!wallet) {
// 		   return res.status(404).json({ success: false, message: 'Wallet not found' });
// 	    }
 
// 	    if (type === 'expense') {
// 		   wallet.totalExpense -= transaction.amount;
// 		   wallet.balance += transaction.amount; // Refund the expense amount to the balance
// 	    } else if (type === 'income') {
// 		   wallet.totalIncome -= transaction.amount;
// 		   wallet.balance -= transaction.amount; // Deduct the income amount from the balance
// 	    }
 
// 	    await wallet.save();
 
// 	    // 5. Send success response
// 	    res.status(200).json({ success: true, message: 'Transaction deleted successfully', wallet });
// 	} catch (error) {
// 	    console.error('Error deleting transaction:', error);
// 	    res.status(500).json({ success: false, message: 'Failed to delete transaction' });
// 	}
//  });