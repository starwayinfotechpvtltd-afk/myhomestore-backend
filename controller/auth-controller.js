const { mergeGuestCartToUser } = require("./cart-controller");
const User=require("../module/auth-module")
const bcrypt=require("bcryptjs")
const jwt=require("jsonwebtoken")

const login = async (req, res) => {
  try {
    const {email, password}=req.body

    // Check user exists or not
    const user = await User.findOne({ email});
    // Return response if user not exists
    if(!user){
        return res.status(500).json({success: false, message: "User not find"})
    }
    
    // Check password match or not
    const verifyPass=await bcrypt.compare(password, user.password)

    // Return if password does not match
    if(!verifyPass){
        return res.status(500).json({success: false, message: "Password does not match"})
    }

    // Generate token
    const token=jwt.sign(
        {_id: user._id, email: user.email},
        process.env.JWT_SECRECT,
        {expiresIn: "1d"}
    )


    // Merge guest cart to user cart
    if (req.session.cart && req.session.cart.length > 0) {
      await mergeGuestCartToUser(user._id, req.session.cart);
      req.session.cart = []; // Clear session cart after merge
    }

    res.status(200).json({
      success: true,
      token,
      user,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const register = async (req, res) => {
  try {
    const {email, password}=req.body

    // Check user is exists or not
    const iseUserExists=await User.findOne({email})
    if(iseUserExists){
        return res.status(500).json({success: true, message: "User already exists"})
    }

    // Hash password
    const hashPassword=await bcrypt.hash(password, 10)

    // Create user
    const user=await User.create({email, password: hashPassword})

    // Generate token
    const token=jwt.sign(
        {_id: user._id, email: user.email},
        process.env.JWT_SECRECT,
        {expiresIn: "1d"}
    )

    // Merge guest cart to newly registered user
    if (req.session.cart && req.session.cart.length > 0) {
      await mergeGuestCartToUser(user._id, req.session.cart);
      req.session.cart = []; // Clear session cart after merge
    }

    res.status(201).json({
      success: true,
      token,
      user
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


module.exports={login, register}