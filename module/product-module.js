const { Schema, model } = require("mongoose");

const productSchema = new Schema(
  {
    category: {
      type: String,
      require: true,
      index: true,
    },
    type: {
      type: String,
      require: true,
      index: true,
    },
    brand: {
      type: String,
      require: true,   
      index: true,
    },
    productImage: [
      {
        url: String,
        public_id: String,
      },
    ],
    functionsImage: [
      {
        url: String,
        public_id: String,
      },
    ],
    thickness: [String],
    pattern: String,
    color: [String],
    productName: String,
    description: String,
    sku: String,
    price: String,
    packSize: String,
    dimensions: String,
    range: String,
    productDetails: String,
    petfriendly: String,
    waterresistant: String,
    scratchresistant: String,
    supplyPrice: String,
    supplyInstallPrice: String,
    specifications: {
      type: Map,
      of: String,
      default: {},
    },
    brochurelink: String,
  },
  { timestamps: true },
);

const Product = model("Product", productSchema);
module.exports = Product;
