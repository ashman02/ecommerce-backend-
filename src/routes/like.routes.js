import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  getProductLikes,
  getUserLikedProducts,
  toggleCommentLike,
  toggleProductLike,
  unlikeComment,
  unlikeProduct,
} from "../controllers/like.controller.js";

const router = Router();

router
  .route("/product/:productId")
  .post(verifyJWT, toggleProductLike)
  .get(verifyJWT,getProductLikes)

router
  .route("/comment/:commentId")
  .post(verifyJWT, toggleCommentLike)
  
router.route("/user-likes").get(verifyJWT, getUserLikedProducts);
router.route("/delete-product-like/:likeId").delete(verifyJWT, unlikeProduct)
router.route("/delete-comment-like/:likeId").delete(verifyJWT, unlikeComment)

export default router;
