const Product = require("../module/product-module");
const mongoose = require("mongoose");
const User = require("../module/auth-module");

// Helper function to get or create session cart
const getSessionCart = (req) => {
  if (!req.session.cart) {
    req.session.cart = [];
  }
  return req.session.cart;
};

// Helper function to merge guest cart to user cart after login
const mergeGuestCartToUser = async (userId, guestCart) => {
  if (!guestCart || guestCart.length === 0) return;

  const user = await User.findById(userId);
  if (!user) return;

  if (!user.cartProduct) {
    user.cartProduct = [];
  }

  // Merge guest cart items with user cart
  guestCart.forEach((guestItem) => {
    const existingItem = user.cartProduct.find(
      (item) => item.productId.toString() === guestItem.productId.toString()
    );

    if (existingItem) {
      // Merge quantities if product already exists
      existingItem.quantity += guestItem.quantity;
      existingItem.totalPrice = existingItem.quantity * existingItem.price;
    } else {
      // Add new product to user cart
      user.cartProduct.push(guestItem);
    }
  });

  await user.save();
};



const addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const isAuthenticated = req.user && req.user._id;

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    if (isAuthenticated) {
      const user = await User.findById(req.user._id);
      if (!user) return res.status(404).json({ message: "User not found" });

      if (!user.cartProduct) user.cartProduct = [];

      const existing = user.cartProduct.find(
        (item) => item.productId.toString() === productId
      );

      if (existing) {
        existing.quantity += quantity;
      } else {
        // ✅ Fixed: push to cartProduct, not cart
        user.cartProduct.push({ productId: product._id, quantity, addedAt: new Date() });
      }

      await user.save();
      return res.status(200).json({ cart: user.cartProduct, isGuest: false });
    }

    // Guest: session-based fallback (server-side backup, not primary)
    const sessionCart = req.session.cart || [];
    const existing = sessionCart.find((i) => i.productId.toString() === productId);
    if (existing) {
      existing.quantity += quantity;
    } else {
      sessionCart.push({ productId: product._id, quantity, addedAt: new Date() });
    }
    req.session.cart = sessionCart;

    return res.status(200).json({ cart: sessionCart, isGuest: true });
  } catch (error) {
    console.error("Add to cart error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Merge guest cart into user DB cart on login
const mergeCart = async (req, res) => {
  try {
    const { guestCart } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.cartProduct) user.cartProduct = [];

    guestCart.forEach((guestItem) => {
      const existing = user.cartProduct.find(
        (item) => item.productId.toString() === guestItem.productId.toString()
      );
      if (existing) {
        existing.quantity += guestItem.quantity;
      } else {
        user.cartProduct.push(guestItem);
      }
    });

    await user.save();
    res.status(200).json({ message: "Cart merged successfully", cart: user.cartProduct });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};



// Get cart items
const getCartItems = async (req, res) => {
  try {
    const isAuthenticated = req.user && req.user._id;

    if (isAuthenticated) {
      const userId = req.user._id;
      const user = await User.findById(userId).populate("cartProduct.productId");
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      return res.status(200).json({
        cart: user.cartProduct || [],
        totalItems: user.cartProduct ? user.cartProduct.length : 0,
        isGuest: false,
      });
    }

    // Guest user - return session cart
    const sessionCart = getSessionCart(req);
    
    res.status(200).json({
      cart: sessionCart,
      totalItems: sessionCart.length,
      isGuest: true,
    });
  } catch (error) {
    console.error("Get cart error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update cart item quantity
const updateCartItem = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const isAuthenticated = req.user && req.user._id;

    if (!productId || quantity === undefined) {
      return res.status(400).json({ 
        message: "Product ID and quantity are required" 
      });
    }

    if (quantity < 1) {
      return res.status(400).json({ 
        message: "Quantity must be at least 1" 
      });
    }

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    // Handle authenticated users
    if (isAuthenticated) {
      const userId = req.user._id;
      const user = await User.findById(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const cartItem = user.cartProduct.find(
        (item) => item.productId.toString() === productId
      );

      if (!cartItem) {
        return res.status(404).json({ 
          message: "Product not found in cart" 
        });
      }

      cartItem.quantity = quantity;
      cartItem.totalPrice = cartItem.price * quantity;

      await user.save();

      return res.status(200).json({
        message: "Cart updated successfully",
        cart: user.cartProduct,
        isGuest: false,
      });
    }

    // Handle guest users
    const sessionCart = getSessionCart(req);
    const cartItem = sessionCart.find(
      (item) => item.productId.toString() === productId
    );

    if (!cartItem) {
      return res.status(404).json({ 
        message: "Product not found in cart" 
      });
    }

    cartItem.quantity = quantity;
    cartItem.totalPrice = cartItem.price * quantity;
    req.session.cart = sessionCart;

    res.status(200).json({
      message: "Cart updated successfully",
      cart: sessionCart,
      isGuest: true,
    });
  } catch (error) {
    console.error("Update cart error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Remove item from cart
const removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;
    const isAuthenticated = req.user && req.user._id;

    if (!productId) {
      return res.status(400).json({ message: "Product ID is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    // Handle authenticated users
    if (isAuthenticated) {
      const userId = req.user._id;
      const user = await User.findById(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      user.cartProduct = user.cartProduct.filter(
        (item) => item.productId.toString() !== productId
      );

      await user.save();

      return res.status(200).json({
        message: "Product removed from cart successfully",
        cart: user.cartProduct,
        isGuest: false,
      });
    }

    // Handle guest users
    let sessionCart = getSessionCart(req);
    sessionCart = sessionCart.filter(
      (item) => item.productId.toString() !== productId
    );
    req.session.cart = sessionCart;

    res.status(200).json({
      message: "Product removed from cart successfully",
      cart: sessionCart,
      isGuest: true,
    });
  } catch (error) {
    console.error("Remove from cart error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


// Clear cart
const clearCart = async (req, res) => {
  try {
    const isAuthenticated = req.user && req.user._id;

    if (isAuthenticated) {
      const userId = req.user._id;
      const user = await User.findById(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      user.cartProduct = [];
      await user.save();

      return res.status(200).json({
        message: "Cart cleared successfully",
        cart: [],
        isGuest: false,
      });
    }

    // Guest user
    req.session.cart = [];

    res.status(200).json({
      message: "Cart cleared successfully",
      cart: [],
      isGuest: true,
    });
  } catch (error) {
    console.error("Clear cart error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get cart count
const getCartCount = async (req, res) => {
  try {
    const isAuthenticated = req.user && req.user._id;

    if (isAuthenticated) {
      const userId = req.user._id;
      const user = await User.findById(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const cartCount = user.cartProduct ? user.cartProduct.length : 0;

      return res.status(200).json({ 
        cartCount,
        isGuest: false 
      });
    }

    // Guest user
    const sessionCart = getSessionCart(req);
    
    res.status(200).json({ 
      cartCount: sessionCart.length,
      isGuest: true 
    });
  } catch (error) {
    console.error("Get cart count error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  addToCart,
  getCartItems,
  updateCartItem,
  removeFromCart,
  clearCart,
  getCartCount,
  mergeGuestCartToUser,
};
