import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {ApiError} from "../utils/ApiError.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const addComment = asyncHandler(async (req, res) => {
    const {content} = req.body
    const {productId} = req.params 

    if(!content || !productId){
        throw new ApiError(400, "content and video id is required")
    }

    const comment = await Comment.create({
        content,
        product : productId,
        owner : req.user?._id
    })

    if(!comment){
        throw new ApiError(400, "Something went wrong while creating comment")
    }

    return res.status(200).json(new ApiResponse(200, comment, "comment created successfully"))
})

const updateComment = asyncHandler(async(req, res) => {
    const {content} = req.body
    const {commentId} = req.params

    if(!content || !commentId){
        throw new ApiError(400, "Content to change the comment is required")
    }

    const comment = await Comment.findByIdAndUpdate(
        commentId,
        {
            $set : {
                content,
            }
        },
        {new : true}
    )

    if(!comment){
        throw new ApiError(400, "comment did not update please enter valid comment id")
    }

    return res.status(200).json(new ApiResponse(200, comment, "comment updated successfully"))
})

const deleteComment = asyncHandler(async (req, res) => {
    const {commentId} = req.params

    const comment = await Comment.findByIdAndDelete(commentId)
    console.log(comment)

    return res.status(200).json(new ApiResponse(200, {}, "comment deleted successfully"))
})

const getProductComments = asyncHandler(async(req, res) => {
    const {productId} = req.params
    const {page = 1, limit = 10} = req.query

    const comments = await Comment.aggregate([
        {
            $match : {
                product : new mongoose.Types.ObjectId(productId)
            }
        },
        {
            $sort : {
                'createdAt' : -1
            }
        },
        {
            $skip : parseInt(page) - 1 * parseInt(limit)
        },
        {
            $limit : parseInt(limit)
        },
        {
            $lookup : {
                from : "users",
                localField : "owner",
                foreignField : "_id",
                as : "owner",
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

    if(!comments.length){
        throw new ApiError(400, "There are no comments under this video")
    }
})

export {addComment, updateComment, deleteComment, getProductComments}