import {Router} from "express";
import {verifyJWT} from "../middlewares/auth.middleware.js"
import { getProductLikes, getUserLikedProducts, toggleCommentLike, toggleProductLike } from "../controllers/like.controller.js"

const router = Router()

router.route("/:productId")
    .post(verifyJWT, toggleProductLike)
    .get(getProductLikes)
router.route("/comment/:commentId").post(verifyJWT, toggleCommentLike)
router.route("/user-likes").get(verifyJWT, getUserLikedProducts)


export default router