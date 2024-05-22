import { Router } from "express";
import {verifyJWT} from "../middlewares/auth.middleware.js"
import {upload} from "../middlewares/multer.middleware.js"
import { addProductToCategory, createCategory, getAllCategories, getProductsByCategory, removeProductFromCategory } from "../controllers/category.controller.js"

const router = Router()


router.route("/create").post(verifyJWT,upload.single("category"), createCategory)
router.route("/add-product/:productId/:categoryId").patch(verifyJWT, addProductToCategory)
router.route("/remove-product/:productId/:categoryId").patch(verifyJWT, removeProductFromCategory)
router.route("/get-products/:categoryId").get(getProductsByCategory)
router.route("/get-categories").get(getAllCategories)

export default router