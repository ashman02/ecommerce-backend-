import { Router } from "express";
import {verifyJWT} from "../middlewares/auth.middleware.js"
import {upload} from "../middlewares/multer.middleware.js"
import { createProduct, deleteProduct, getAllProducts, getProductById, updateProductDetails } from "../controllers/product.controller.js"


const router = Router()

router.route("/create-product").post(verifyJWT, upload.array("product-images", 6), createProduct)
router.route("/get-products").get(getAllProducts)
router.route("/:productId")
    .get(getProductById)
    .patch(verifyJWT, updateProductDetails)
    .delete(verifyJWT, deleteProduct)

export default router