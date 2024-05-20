import mongoose from "mongoose"
import {Subscription} from "../models/subscription.model.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {ApiError} from "../utils/ApiError.js"

const toggleSubscribe = asyncHandler(async (req, res) => {
    //we will create a document with account id and user id
    const {accountId} = req.params
    const subscribe = await Subscription.create({
        subscriber : req.user?._id,
        account : accountId
    });

    if(!subscribe){
        throw new ApiError(500, "error while subscribing to the account")
    }

    return res.status(200).json(new ApiResponse(200, subscribe, "Followed successfully"))
})

const subscribedTo = asyncHandler(async(req, res) => {
    //all the document whom subscriber === subscriberId
    const {subscriberId} = req.params
    const result = await Subscription.aggregate([
        {
            $match : {
                subscriber : new mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            $lookup : {
                from : "users",
                localField : "account",
                foreignField : "_id",
                as : "account",
                pipeline : [
                    {
                        $project : {
                            username : 1,
                            fullName : 1,
                            avatar : 1,
                        }
                    }
                ]
            }
        },
        {
            $addFields : {
                account : {
                    $first : "$account"
                }
            }
        }
    ])
    if(!result.length){
        throw new ApiError(400, "User have not subscriber to any channel")
    }

    return res.status(200).json(new ApiResponse(200, result, "account fetched whow user subscribed"))
})

const getUserSubscribers = asyncHandler(async(req, res) => {
    //how many documents who contains account as user id
    const {accountId} = req.params
    const subscribers = await Subscription.aggregate([
        {
            $match : {
                account : new mongoose.Types.ObjectId(accountId)
            }
        },
        {
            $lookup : {
                from : "users",
                localField : "subscriber",
                foreignField : "_id",
                as : "subscriber",
                pipeline : [
                    {
                        $project : {
                            username : 1,
                            fullName : 1,
                            avatar : 1
                        }
                    }
                ]
            }
        },
        {
            $addFields : {
                owner : {
                    $first : "$owner"
                }
            }
        }
    ])
    if(!subscribers){
        throw new ApiError(500, "error while fetching user subscribers")
    }

    return res.status(200).json(new ApiResponse(200, subscribers, "user subscribers fetched successfully"))
})

const unsubscribeAccount = asyncHandler(async (req, res) => {
    const {accountId} = req.params
    const subscribe = await Subscription.findOne({subscriber : req.user?._id, account : accountId})

    if(!subscribe){
        throw new ApiError(400, "subscriber not found")
    }
    await Subscription.findByIdAndDelete(subscribe._id)
    return res.status(200).json(new ApiResponse(200, {}, "unsubscribed the channel"))
})

export {toggleSubscribe, subscribedTo, getUserSubscribers, unsubscribeAccount}