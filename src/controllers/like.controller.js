import mongoose from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleProductLike = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  if (!productId) {
    throw new ApiError(400, "Product Id is required");
  }

  const like = await Like.create({
    product: productId,
    owner: req.user?._id,
  });

  if (!like) {
    throw new ApiError(500, "something went wrong while toggling like");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, like, "Like submitted successfully"));
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  if (!commentId) {
    throw new ApiError(400, "Comment Id is required");
  }

  const like = await Like.create({
    comment: commentId,
    owner: req.user?._id,
  });

  if (!like) {
    throw new ApiError(500, "something went wrong while toggling product like");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, like, "comment like submitted successfully"));
});

const getUserLikedProducts = asyncHandler(async (req, res) => {
  const result = await Like.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(req.user?._id),
        product: { $exists: true },
      },
    },
    {
      $sort: {
        'createdAt': -1,
      },
    },
    {
      $lookup: {
        from: "products",
        localField: "product",
        foreignField: "_id",
        as: "product",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    username: 1,
                    fullName: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: {
                $first: "$owner",
              },
            },
          },
        ],
      },
    },
  ]);

  if(!result){
    throw new ApiError(400, "User did not liked any product")
  }


  return res.status(200).json(new ApiResponse(200, result, "User likes products fetched successfully"))

});

const getProductLikes = asyncHandler(async (req, res) => {
    const {productId} = req.params
    if(!productId){
        throw new ApiError(400, "product Id is required")
    }

    const totalLikes = await Like.countDocuments({product : productId})
    const userLikedProduct = await Like.exists({product : productId, user: req.user?._id})
    const isUserLiked = userLikedProduct !== null;

    return res.status(200).json(new ApiResponse(200, {totalLikes, isUserLiked}, "Video likes fetched successfully"))
})

// TODO
//get count of comment likes
//unlike the video
//fix error while getting user likes

export { toggleProductLike, toggleCommentLike, getUserLikedProducts, getProductLikes };
