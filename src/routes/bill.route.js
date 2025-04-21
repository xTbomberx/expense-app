import protectRoute from "../middleware/protectRoute.js";
import express from 'express'
import Bill from "../models/Bill.js";


const router = express.Router();


// POST: create new Bill
// POST: Create a new bill
router.post('/postBill', protectRoute, async (req, res) => {
	try {
	    const { amount,  description} = req.body;
	    const userId = req.user.id;
 
	    if (!amount || !dueDate) {
		   return res.status(400).json({ success: false, message: 'Please provide all required fields' });
	    }
 
	    const bill = await Bill.create({
		   uid: userId,
		   amount,
		   //dueDate,
		   description,
		   //recurring,
	    });
 
	    res.status(201).json({ success: true, bill });
	} catch (error) {
	    console.error('Error creating bill:', error);
	    res.status(500).json({ success: false, message: 'Failed to create bill' });
	}
 });

 // GET: Retrieve all bills for the logged-in user
router.get('/getBills', protectRoute, async (req, res) => {
	try {
	    const userId = req.user.id;
 
	    const bills = await Bill.find({ uid: userId }).sort({ dueDate: 1 });
 
	    res.status(200).json({ success: true, bills });
	} catch (error) {
	    console.error('Error retrieving bills:', error);
	    res.status(500).json({ success: false, message: 'Failed to fetch bills' });
	}
 });
 

 // PUT: Update a bill
router.put('/updateBill/:id', protectRoute, async (req, res) => {
	try {
	    const { id } = req.params;
	    const { amount, description } = req.body;
	    const userId = req.user.id;
 
	    const bill = await Bill.findOne({ _id: id, uid: userId });
 
	    if (!bill) {
		   return res.status(404).json({ success: false, message: 'Bill not found' });
	    }
	    
	    // default to current value if not changed
	    bill.amount = amount || bill.amount;
	    bill.description = description || bill.description;

 
	    await bill.save();
 
	    res.status(200).json({ success: true, bill });
	} catch (error) {
	    console.error('Error updating bill:', error);
	    res.status(500).json({ success: false, message: 'Failed to update bill' });
	}
 });


 // DELETE: Delete a bill
router.delete('/deleteBill/:id', protectRoute, async (req, res) => {
	try {
	    const { id } = req.params;
	    const userId = req.user.id;
 
	    const bill = await Bill.findOneAndDelete({ _id: id, uid: userId });
 
	    if (!bill) {
		   return res.status(404).json({ success: false, message: 'Bill not found' });
	    }
 
	    res.status(200).json({ success: true, message: 'Bill deleted successfully' });
	} catch (error) {
	    console.error('Error deleting bill:', error);
	    res.status(500).json({ success: false, message: 'Failed to delete bill' });
	}
 });

 
 export default router;