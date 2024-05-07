import mongoose, { isValidObjectId } from "mongoose";
import { Category } from "../models/category.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createCategory = asyncHandler(async (req, res) => {
  const { title } = req.body;
  if (!title) {
    throw new ApiError(400, "Title is required");
  }

  const category = await Category.create({
    title: title,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, category, "category created successfully"));
});

const addProductToCategory = asyncHandler(async (req, res) => {
  const { categoryId, productId } = req.params;

  if (!categoryId || !productId) {
    throw new ApiError(400, "category and product required");
  }

  const category = await Category.findByIdAndUpdate(
    categoryId,
    {
      $push: {
        products: productId,
      },
    },
    { new: true },
  );

  if(!category){
    throw new ApiError(400, "invalid category id")
  }
  
  return res.status(200).json(new ApiResponse(200, category, "product added to the category"))

});

const removeProductFromCategory = asyncHandler(async (req, res) => {
    const {categoryId, productId} = req.params
    if(!categoryId || !productId){
        throw new ApiError(400, "category Id and product Id is required")
    }

    const category = await Category.findByIdAndUpdate(
        categoryId,
        {
            $pull : {
                products : productId
            }
        },
        {new : true}
    )

    if(!category){
        throw new ApiError(400, "enter valid category id")
    }

    return res.status(200).json(new ApiResponse(200, category, "product removed successfully"))
})

//get products by id
const getProductByCategory = asyncHandler(async(req, res) => {
  const {categoryId} = req.params
  if(!isValidObjectId(categoryId)){
    throw new ApiError(400, "Category id is should be valid")
  }

  const category = Category.aggregate([
    {
      $match : {
        _id : new mongoose.Types.ObjectId(categoryId)
      }
    },
    {
      $lookup : {
        from : "products",
        localField : "products",
        foreignField : "_id",
        as : "products",
        pipeline : [
          {
            $lookup : {
              from : "users",
              localField : "owner",
              foreignField : "_id",
              as : "owner",
              pipeline : [
                {
                  $project : {
                    fullName : 1,
                    username : 1,
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
        ]
      }
    },
  ])

  if(!category.length){
    throw new ApiError(400, "No products found under this category")
  }

  return res.status(200).json(new ApiResponse(200, category, "products under this category fetched successfully"))

})

export { createCategory, addProductToCategory, removeProductFromCategory, getProductByCategory };
