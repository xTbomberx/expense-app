import mongoose from 'mongoose';


export const connectDB = async() => {

    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`DB connected ${conn.connection.host}`)
    } catch(e) {
        console.log('DB error: ', e)
        process.exit(1) // exit with failure
    }
}