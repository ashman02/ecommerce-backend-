import { Router } from "express";
import {addToCart, checkUsername, getCurrentUser, loginUser, logoutUser, refreshAccessToken, registerUser, removeFromCart, testEmail, updateAccountDetails, updateAvatar, updatePassword, userChannelProfile} from "../controllers/user.controller.js"
import {upload} from "../middlewares/multer.middleware.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"


const router = Router()

router.route("/register").post(upload.single("avatar"),registerUser)
router.route("/login").post(loginUser)

router.route("/refresh-token").post(refreshAccessToken)
//verified routes
router.route("/logout").post(verifyJWT, logoutUser)
router.route("/update-password").patch(verifyJWT, updatePassword)
router.route("/current-user").get(verifyJWT, getCurrentUser)
router.route("/update-account").patch(verifyJWT, updateAccountDetails)
router.route("/update-avatar").patch(verifyJWT, upload.single("avatar"), updateAvatar)

router.route("/addto-cart/:productId").patch(verifyJWT, addToCart)
router.route("/removefrom-cart/:productId").patch(verifyJWT, removeFromCart)


router.route("/get-account/:username").get(verifyJWT, userChannelProfile)
router.route("/test-email").post(testEmail)
router.route("/check-username/:username").get(checkUsername)



export default router