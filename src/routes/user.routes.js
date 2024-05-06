import { Router } from "express";
import {getCurrentUser, loginUser, logoutUser, refreshAccessToken, registerUser, updateAccountDetails, updateAvatar, updatePassword} from "../controllers/user.controller.js"
import {upload} from "../middlewares/multer.middleware.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"


const router = Router()

router.route("/register").post(upload.single("avatar"),registerUser)
router.route("/login").post(loginUser)

router.route("/refresh-token").post(refreshAccessToken)
//verified routes
router.route("/logout").post(verifyJWT, logoutUser)
router.route("/update-password").post(verifyJWT, updatePassword)
router.route("/current-user").get(verifyJWT, getCurrentUser)
router.route("/update-account").post(verifyJWT, updateAccountDetails)
router.route("/update-avatar").post(verifyJWT, upload.single("avatar"), updateAvatar)


export default router