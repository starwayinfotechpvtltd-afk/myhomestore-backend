const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      require: true,
      trim: true,
    },
    password: {
      type: String,
      require: true,
      trim: true,
    },
    phone: {
      type: String,
    },
    address: String,
    cart: [
      {
        type: mongoose.Schema.Types.ObjectId,
        addedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true },
);


const User=mongoose.model("User", userSchema);

module.exports=User