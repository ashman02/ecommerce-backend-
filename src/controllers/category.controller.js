import mongoose from "mongoose";
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

export { createCategory, addProductToCategory, removeProductFromCategory };
