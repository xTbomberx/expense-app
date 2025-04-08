import express from 'express';
import User from '../models/User.js'
import jwt from 'jsonwebtoken'
import cloudinary from '../config/cloudinary.js'
import protectRoute from '../middleware/protectRoute.js';

const router = express.Router();

// UTIL - Function
const generateToken = (userId) => {
	return jwt.sign({ userId }, process.env.JWT_SECRET, {expiresIn: '2d'})
 }


// REGISTER
router.post('/register', async(req, res) => {
	try {
		const {email, username, password} = req.body
  
		console.log(req.body)
  
		// Validation: check all fields
		if(!email || !username, !password) {
		    return res.status(400).json({message: "All fields are required"})
		}
  
		// Error Check - username length
		if (username.length < 3) {
		    return res.status(400).json({message: "Username must be greater then 3 characters"})
		}
  
		// Error Check - Username - Email --> Exists
		const existingEmail = await User.findOne({ email });
		if(existingEmail) {
		    return res.status(400).json({message: "Email already exists"})
		}
  
		const existingUser = await User.findOne({ username });
		if(existingUser){
		    return res.status(400).json({message: "User already exists in here"})
		}
  
		// Error Check - PWD length
		if(password.length < 3) {
		    return res.status(400).json({message: "Password must be greater then 3 characters"})
		}

		// CREATE USER //
		const user = new User({
		    email,
		    username,
		    password,
		    // profileImage
		})
  
		await user.save();
  
		const token = generateToken(user._id);
  
		res.status(201).json({
		    token,
		    user: {
			   id: user._id,
			   username: user.username,
			   email: user.email,
			   profileImage: user.profileImage,
			   createdAt: user.createdAt,
		    }
		})

	 } catch(error){
		console.log('Register Error: ', error)
  
		// Send the error message if it's a custom error, otherwise send a generic message
		res.status(500).json({
		    message: error instanceof Error ? error.message : "Internal Server Error",
		});
  }
})

// Login

router.post('/login', async(req,res) => {
    
	try{
	    const {email, password} = req.body;
 
	    if(!email || !password) return res.status(400).json({message: "Need all login fields"})
 
	    // Check if User exists
	    const user = await User.findOne({email})
	    if(!user) return res.status(400).json({message: 'Invalid credentials here'})
 
	    // Check password
	    const correctPassword = await user.checkPassword(password);
	    if(!correctPassword) return res.status(400).json({message: 'Invalid credentials here'})
	
 
	    const token = generateToken(user._id);
 
	    res.status(201).json({
		   token,
		   user: {
			  id: user._id,
			  username: user.username,
			  email: user.email,
			  profileImage: user.profileImage,
			  createdAt: user.createdAt,
		   }
	    })
	} catch(e){
	    console.log('Login Error: ', e)
	    res.status(500).json({message: 'Interal Server Error'})
	}
 })


// UPDATE
router.put('/update' , protectRoute, async(req,res) => {

	try {
		// FROM MOBILE FRONTEND
		const { username, profileImage } = req.body;

		// Authenticated User
		const user = req.user;

		// 1. Update Username (if provided)
		if(username) {
			if (username.length < 3){
				return res.status(400).json({message: "Username must be at least 3 characters"})
			}
			user.username = username
		}


		// 2. Update profileImage (if provided)
		if(profileImage){
			const uploadResponse = await cloudinary.uploader.upload(profileImage);
			const imageUrl = uploadResponse.secure_url;
	  
			if (imageUrl) {
			    user.profileImage = imageUrl;
			}
		}
		
		// Save Updated  User
		await user.save()

		res.status(200).json({
			message: "User Updated successfully",
			user: {
				id: user._id,
				username: user.username,
				email: user.email,
				profileImage: user.profileImage,
				createdAt: user.createdAt,
			 },
		})
	} catch(e) {
		console.log('Update Error: ', e)
		res.status(500).json({message: 'Interal Server Error'})
	}

})

export default router