import jwt from 'jsonwebtoken';
import User from '../models/User.js'


// const response = await fetch(`http://localhost:3000/api/books`, {
//   method: "POST",
//   body: JSON.stringify({
//     title,
//     caption
//   }),
//   headers: { Authorization: `Bearer ${token}` },
// });

const protectRoute = async(req,res,next) => {
    try {
        // get token
        const token = req.header('Authorization').replace('Bearer ', '')
        if(!token) return res.status(401).json({message: 'No auth token, access denied chump'})

        // verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // find user
        const user = await User.findById(decoded.userId).select("-password");
        if(!user) {
            return res.status(401).json({ message: 'Token is not valid'})
        }

        req.user = user;

        console.log('Authenticated User:', req.user);
        next();

    } catch(e){
        console.error('Auth error: ', e.message);
        res.status(401).json({message: 'token is not valid '})
    }
}

export default protectRoute;


// Explaination
// METHOD 1 - retrieve token from the cookies
// use-case: Typically stored in broswers cookies for WEB apps
// security: can be secure with the HttpOnly + Secure Flags
//              = prevent client-side scripts and ensure token is sent over only HTTPS
//    const token = req.cookies['jwt-token']

// METHOD 2 - auth header
// use-case: retrieved from an auth header request
// security: typically more secure because the token is not exposed in URLs/cookies
// best practice for restful apis
// 
// METHOD 2 is required for mobile apps where they store the tokens locally


// SECURE/HTTP only flags explaination
// 1. HTTPONLY
// - it becomes inaccessible to JS running in the browser
// - mitiagates the risk of XSS attacks
// 

// 2. Secure
// - will only send the cookies if the req is made over HTTPS
// - not exposed in MITM attacks