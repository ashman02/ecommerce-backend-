import {Router} from "express"
import {verifyJWT} from "../middlewares/auth.middleware.js"
import { addComment, deleteComment, getProductComments, updateComment } from "../controllers/comment.controller.js"

const router = Router()
router.use(verifyJWT)

router.route("/:productId")
    .post(addComment)
    .get(getProductComments)

router.route("/:commentId")
    .patch(updateComment)
    .delete(deleteComment)

export default router