import { Router } from "express";
import {verifyJWT} from "../middlewares/auth.middleware.js"
import { addProductToCategory, createCategory, getProductsByCategory, removeProductFromCategory } from "../controllers/category.controller.js"

const router = Router()


router.route("/create").post(verifyJWT, createCategory)
router.route("/add-product/:productId/:categoryId").patch(verifyJWT, addProductToCategory)
router.route("/remove-product/:productId/:categoryId").patch(verifyJWT, removeProductFromCategory)
router.route("/:categoryId").get(getProductsByCategory)

export default router