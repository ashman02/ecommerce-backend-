import { Router } from "express";
import {verifyJWT} from "../middlewares/auth.middleware.js"
import {upload} from "../middlewares/multer.middleware.js"
import { createProduct, deleteProduct, getAllProducts, getProductById, homePageProducts, updateProductDetails } from "../controllers/product.controller.js"


const router = Router()

router.route("/create-product").post(verifyJWT, upload.array("productImages", 6), createProduct)
router.route("/get-products").get(getAllProducts)
router.route("/product/:productId")
    .get(getProductById)
    .patch(verifyJWT, updateProductDetails)
    .delete(verifyJWT, deleteProduct)
router.route("/home-products").get(homePageProducts)

export default router