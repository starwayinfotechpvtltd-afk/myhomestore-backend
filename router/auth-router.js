const {login, register}=require("../controller/auth-controller")
const express=require('express')

const authRouter=express.Router()

authRouter.post("/login", login)
authRouter.post("/register", register)

module.exports=authRouter