const {
  addToCart,
  getCartItems,
  updateCartItem,
  removeFromCart,
  clearCart,
  getCartCount,
  mergeCart
} = require("../controller/cart-controller");
const express=require("express")


const cartRouter=express.Router()

cartRouter.post("/addToCart", addToCart)
cartRouter.post("/merge", mergeCart); 
cartRouter.get("/allCart", getCartItems)
cartRouter.put("/updateCart/:id", updateCartItem)
cartRouter.delete("/deleteCart/:id", removeFromCart)
cartRouter.delete("/clearCart", clearCart)
cartRouter.get("/count", getCartCount);

module.exports=cartRouter 