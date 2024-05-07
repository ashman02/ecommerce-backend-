import { Router } from "express";
import {verifyJWT} from "../middlewares/auth.middleware.js"
import {upload} from "../middlewares/multer.middleware.js"
import { createProduct } from "../controllers/product.controller.js"


const router = Router()

router.route("/create-product").post(verifyJWT, upload.array("product-images", 6), createProduct)

export default router