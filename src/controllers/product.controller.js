import mongoose from "mongoose";
import { Product } from "../models/product.model.js";
import { Category } from "../models/category.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  uploadOnCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.js";

const createProduct = asyncHandler(async (req, res) => {
  const { title, description, price, gender, category } = req.body;
  if ([title, description, price].some((field) => field.trim() === "")) {
    throw new ApiError(400, "title, description and price is required");
  }
  if (!category.length) {
    throw new ApiError(400, "Please include atleast one category");
  }

  //we will recieve array of files
  if (req.files.length < 3) {
    throw new ApiError(
      400,
      "Please upload atleast three photos of your product",
    );
  }

  //upload files to the cloudinary
  let cloudinaryFilesPath = [];
  for (let i = 0; i < req.files.length; i++) {
    let localFilePath = req.files[i].path;
    let result = await uploadOnCloudinary(localFilePath);
    cloudinaryFilesPath.push(result.url);
  }

  const product = await Product.create({
    title,
    description,
    image: cloudinaryFilesPath,
    price,
    gender,
    category,
    owner: req.user?._id,
  });

  if (!product) {
    throw new ApiError(500, "Error while creating the product");
  }

  //add product to it categories
  //we have made wrote controller for that you can use that one too
  category.forEach(async (cat) => {
    try {
      await Category.findByIdAndUpdate(
        cat,
        {
          $push: {
            products: product._id,
          },
        },
        { new: true },
      );
    } catch (error) {
      throw new ApiError(
        500,
        "Something went wrong while adding product to the category",
        error,
      );
    }
  });

  return res
    .status(200)
    .json(new ApiResponse(200, product, "Product created successfully"));
});

const getAllProducts = asyncHandler(async (req, res) => {
  const {page = 1, limit = 10, query, sortBy, sortType, userId} = req.query

  //search query is best way 
})

export { createProduct };
