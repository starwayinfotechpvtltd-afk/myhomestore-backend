const Product = require("../module/product-module");
const uploadToCloudinary = require("../utils/cloudinary");
const csv = require("csv-parser");
const fs = require("fs");



const uploadProduct = async (req, res) => {
  try {
    let {
      category,
      type,
      brand,
      specifications,
      thickness,
      pattern,
      color,
      productName,
      description,
      sku,
      price,
      range,
      productDetails,
      petfriendly,
      waterresistant,
      scratchresistant,
    } = req.body;

    if (!category || !type || !brand) {
      return res.status(400).json({
        success: false,
        message: "Category, type and brand can't be empty",
      });
    }

    if (typeof specifications === "string") {
      specifications = JSON.parse(specifications);
    }

    const productImages = req.files?.productImage || [];
    const functionsImages = req.files?.functionsImage || [];

    if (!productImages.length) {
      return res.status(400).json({
        success: false,
        message: "At least one image is required",
      });
    }

    const [uploadedProductImages, uploadedFunctionsImages] = await Promise.all([
      Promise.all(
        productImages.map((file) =>
          uploadToCloudinary(file.buffer, "Product/images"),
        ),
      ),
      Promise.all(
        functionsImages.map((file) =>
          uploadToCloudinary(file.buffer, "Product/function-images"),
        ),
      ),
    ]);

    const product = await Product.create({
      category,
      type,
      brand,
      thickness,
      pattern,
      color,
      productName,
      description,
      sku,
      price,
      range,
      productDetails,
      petfriendly,
      waterresistant,
      scratchresistant,
      specifications,
      productImage: uploadedProductImages,
      functionsImage: uploadedFunctionsImages,
    });

    res.status(201).json({
      success: true,
      message: "Product uploaded successfully",
      product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Uploading product failed",
      error: error.message,
    });
  }
};


const adminProductUpload= async (req, res) => {
  const products = [];
  const errors = [];

  fs.createReadStream(req.files.csv[0].path)
    .pipe(csv())
    .on("data", (row) => {   
      try {
        if (!row["Product Name"] || !row["SKU"]) {
          errors.push({ row, error: "Missing Product Name or SKU" });
          return;
        }

        // Extract Cloudinary public_id from URL
        const extractPublicId = (url) => {
          if (!url) return null;
          const parts = url.split("/");
          const file = parts[parts.length - 1];
          return file.split(".")[0];
        };

        const product = {
          category: row["Category"] || "Flooring",
          type: row["Type"] || "Hybrid",
          brand: row["Brand Name"] || "",
          productName: row["Product Name"],
          description: row["Description"] || "",
          productDetails: row["Product Details"] || "",
          sku: row["SKU"],
          thickness: row["Thickness"] || "",
          range: row["Range"] || "",
          price: row["Price"] || "",
          petfriendly: row["Pet Friendly"] || "",
          waterresistant: row["Water Resistant"] || "",
          scratchresistant: row["Scratch Resistant"] || "",
          brochurelink: row["Brochure Link"] || "",

          productImage: row["Product Image"]
            ? [
                {
                  url: row["Product Image"],
                  public_id: extractPublicId(row["Product Image"]),
                },
              ]
            : [],

          functionsImage: row["Function Image"]
            ? [
                {
                  url: row["Function Image"],
                  public_id: extractPublicId(row["Function Image"]),
                },
              ]
            : [],

          color: row["Color"] ? row["Color"].split(",") : [],

          specifications: {
            Warranty: row["Warranty"] || "",
            Rating: row["Rating"] || "",
          },
        };

        products.push(product);
      } catch (err) {
        errors.push({ row, error: err.message });
      }
    })
    .on("end", async () => {
      try {
        await Product.insertMany(products, { ordered: false });

        fs.unlinkSync(req.files.csv[0].path);

        res.json({
          success: true,
          inserted: products.length,
          errors,
        });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });
}


const getAllProduct = async (req, res) => {
  try {
    const products = await Product.find();

    return res
      .status(200)
      .json({ success: true, message: "All product fetched", products });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const products = await Product.findById(id);

    return res
      .status(200)
      .json({ success: true, message: "All product fetched", products });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const getProductByTypeAndName = async (req, res) => {
  try {
    const { type, productName } = req.body;

    // Filter
    const filter = {};
    if (type) filter.type = type;
    if (productName) filter.productName = productName;

    // Filter by type
    const product = await Product.find(filter);

    // Return response
    return res.status(200).json({
      success: true,
      message: "Product fetch successfull",
      data: product,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const getProductByType = async (req, res) => {
  try {
    const { type } = req.body;

    // Filter by type
    const product = await Product.find({ type });

    // Return response
    return res.status(200).json({
      success: true,
      message: "Product fetch successfull",
      data: product,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const getProductByRange = async (req, res) => {
  try {
    const {range}= req.body;

    // Filter by range
    const product = await Product.find({ range });
    // Return response
    return res.status(200).json({
      success: true,
      message: "Product fetch successfull",
      product,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const deleteProduct = (req, res) => {
  try {
    // Get product type or brand
    const { type, brand } = req.body;

    // Filter
    const filter = {};
    if (type) filter.type = type;
    if (brand) filter.brand = brand;

    // Delete product
    const product = Product.deleteOne({ filter });

    // Return response
    return res.status(200).json({
      success: true,
      message: "Product delete successfully",
      data: product,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Product delete failed" });
  }
};

module.exports = {
  uploadProduct,
  adminProductUpload,
  getAllProduct,
  getProductById,
  getProductByTypeAndName,
  getProductByType,
  getProductByRange,
  deleteProduct,
};
