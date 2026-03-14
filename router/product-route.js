const exporess = require("express");
const {
  uploadProduct,
  adminProductUpload,
  getAllProduct,
  getProductById,
  getProductByTypeAndName,
  getProductByType,
  getProductByRange,
  deleteProduct,
  getProductsForCarts,
  searchProductName
} = require("../controller/product-controller");
const upload = require("../middleware/multer");

const productRouter = exporess.Router();

productRouter.post(
  "/uploadProduct",
  upload.fields([
    { name: "productImage", maxCount: 10 },
    { name: "functionsImage", maxCount: 10 },
  ]),
  uploadProduct,
);


productRouter.get("/getallProduct", getAllProduct);
productRouter.post("/getProductById/:id", getProductById);
productRouter.post("/getProductForCarts", getProductsForCarts);
productRouter.post("/getProductbyTypeName", getProductByTypeAndName);
productRouter.post("/getProductbyType", getProductByType);
productRouter.post("/getProductbyRange", getProductByRange);
productRouter.post("/search-product", searchProductName);
productRouter.post("/deleteProduct", deleteProduct);

module.exports = productRouter;
