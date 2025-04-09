import express from 'express';
import Wallet from '../models/Wallet.js';
import protectRoute from '../middleware/protectRoute.js';
import cloudinary from '../config/cloudinary.js';

const router = express.Router();

// Create a new wallet
router.post('/postWallet', protectRoute, async (req, res) => {
    try {
        console.log('Request received at /postWallet'); // Log when the route is hit
        const { name, image } = req.body;


        const userId = req.user.id; // Extract the logged-in user's ID from the token
        console.log('User ID:', userId); // Log the user ID

        // 2. Update 
        let imageUrl = null
        if(image){
            const uploadResponse = await cloudinary.uploader.upload(image);
            imageUrl = uploadResponse.secure_url;
            console.log('Image uploaded successfully:', imageUrl);

        }

        console.log('Creating wallet in the database...');
        const wallet = await Wallet.create({
            name,
            image: imageUrl,
            uid: userId,
        });

        console.log('Wallet created:', wallet); // Log the created wallet

        res.status(201).json({ success: true, wallet });
    } catch (error) {
        console.error('Error in /postWallet:', error); // Log the error
        res.status(500).json({ success: false, message: 'Failed to create wallet' });
    }
});


// Get all wallets for the logged-in user
router.get('/getWallets', protectRoute, async (req, res) => {
    console.log('Request received at /getWallets'); 
    try {
        const userId = req.user.id; // Extract the logged-in user's ID from the token
        const wallets = await Wallet.find({ uid: userId });

        console.log(wallets) //debug statement
        
        res.status(200).json({ success: true, wallets });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to fetch wallets' });
    }
});


router.put('/updateWallet/:id' , protectRoute, async(req, res) => {
    try {
        const { id } = req.params;
        const { name, image } = req.body
        const userId = req.user.id

        // 1. Check if Wallet exists and belongs to USER
        const wallet = await Wallet.findOne({ _id: id, uid: userId});
        if(!wallet) {
            return res.status(404).json({ success: false, message: 'Wallet not found'});
        }

        // 2. Handle image upload if a new image is provided
        if (image) {
            const uploadResponse = await cloudinary.uploader.upload(image);
            imageUrl = uploadResponse.secure_url;
        }

        // 3. Update Wallet in MONGO
        wallet.name = name || wallet.name
        wallet.image = imageUrl;
        await wallet.save();

        // 4. Send JSON object to frontend
        res.status(200).json({success: true,  wallet})
    }catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to fetch wallets' });
    }
})



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