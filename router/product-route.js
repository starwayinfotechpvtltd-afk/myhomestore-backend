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

// router.post(
//   "/product/adminProductUpload",
//   upload.field({ name: "csv", maxCount: 1 }),
//   adminProductUpload,
// );

productRouter.get("/getallProduct", getAllProduct);
productRouter.post("/getProductById/:id", getProductById);
productRouter.post("/getProductbyTypeName", getProductByTypeAndName);
productRouter.post("/getProductbyType", getProductByType);
productRouter.post("/getProductbyRange", getProductByRange);
productRouter.post("/deleteProduct", deleteProduct);

module.exports = productRouter;
