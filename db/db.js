const mongoose=require("mongoose");


const connectDb=async()=>{
    try {
        await mongoose.connect(process.env.MONGODB_URI)
        console.log("Mongodb successfully connected")
    } catch (error) {
        console.log("Mongodb connection failed")
    }
}

module.exports=connectDb