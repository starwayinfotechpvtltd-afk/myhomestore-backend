const {
  addToCart,
  getCartItems,
  updateCartItem,
  removeFromCart,
  clearCart,
  getCartCount,
} = require("../controller/cart-controller");
const express=require("express")


const cartRouter=express.Router()

cartRouter.post("/addToCart", addToCart)
cartRouter.get("/allCart", getCartItems)
cartRouter.put("/updateCart/:id", updateCartItem)
cartRouter.delete("/deleteCart/:id", removeFromCart)
cartRouter.delete("/clearCart", clearCart)

module.exports=cartRouter