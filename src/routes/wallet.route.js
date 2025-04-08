import express from 'express';
import Wallet from '../models/Wallet.js';
import protectRoute from '../middleware/protectRoute.js';

const router = express.Router();

// Create a new wallet
router.post('/postWallet', protectRoute, async (req, res) => {
    try {
        const { name, image } = req.body;
        console.log(req.body)
        
	   // 1. Grab Logged In User
        const userId = req.user.id; // Extract the logged-in user's ID from the token

       // 2. Upload Base64 Image to CLoudinary
       let imageUrl = null;
       
       if(image) {
            const uploadResponse = await cloudinary.uploader.upload(image);
            imageUrl = uploadResponse.secure_url;
       }


        const wallet = await Wallet.create({
            name,
            image: imageUrl,
            uid: userId, // Associate the wallet with the logged-in user
        });

        res.status(201).json({ success: true, wallet });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to create wallet' });
    }
});



// Get all wallets for the logged-in user
router.get('/getWallets', protectRoute, async (req, res) => {
    try {
        const userId = req.user.id; // Extract the logged-in user's ID from the token
        const wallets = await Wallet.find({ uid: userId });

        res.status(200).json({ success: true, wallets });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to fetch wallets' });
    }
});




// Delete a wallet
router.delete('/deleteWallet/:id', protectRoute, async (req, res) => {
	try {
	    const { id } = req.params;
	    const userId = req.user.id; // Extract the logged-in user's ID from the token
 
	    // Find and delete the wallet
	    const wallet = await Wallet.findOneAndDelete({ _id: id, uid: userId });
	    if (!wallet) {
		   return res.status(404).json({ success: false, message: 'Wallet not found' });
	    }
 
	    res.status(200).json({ success: true, message: 'Wallet deleted successfully' });
	} catch (error) {
	    console.error('Delete Wallet Error:', error);
	    res.status(500).json({ success: false, message: 'Failed to delete wallet' });
	}
 });
 
 export default router;