import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  getUserSubscribers,
  subscribedTo,
  toggleSubscribe,
  unsubscribeAccount,
} from "../controllers/subscription.controller.js";

const router = Router();
router.use(verifyJWT);

router
  .route("/subscribe/:accountId")
  .post(toggleSubscribe)
  .delete(unsubscribeAccount);

router.route("/get-subscribed-to/:subscriberId").get(subscribedTo);
router.route("/get-subscribers/:accountId").get(getUserSubscribers);

export default router;
