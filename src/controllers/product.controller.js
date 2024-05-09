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
  const {
    page = 1,
    limit = 30,
    query,
    sortBy,
    sortType,
    gender,
    userId,
  } = req.query;

  const sortStage = {};
  if (sortBy) {
    sortStage["$sort"] = {
      score: 1,
      [`${sortBy}`]: sortType === "asc" ? 1 : -1,
    };
  } else {
    sortStage["$sort"] = {
      score: 1,
      createdAt: -1,
    };
  }

  //search query is best way
  const agg = [
    sortStage,
    //todo : lookups to get review
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              fullName: 1,
              username: 1,
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
    {
      $project: {
        title: 1,
        image: 1,
        price: 1,
        gender: 1,
        owner: 1,
        score: { $meta: "searchScore" },
      },
    },
    {
      $skip : parseInt((page - 1)) * parseInt(limit)
    },
    {
      $limit : parseInt(limit)
    }   
  ];

  //dynamically built query

  //TODO : when we search with userId gender option is not working
  if(userId){
    agg.unshift({
      $match : {
        owner : new mongoose.Types.ObjectId(userId)
      }
    })
  }

  if (!userId && query) {
    if (gender) {
      agg.unshift({
        $search: {
          index: "product",
          compound: {
            must: [
              {
                text: {
                  query: query,
                  path: ["title", "description"],
                },
              },
              {
                text: {
                  query: gender,
                  path: "gender",
                },
              },
            ],
          },
        },
      });
    } else {
      agg.unshift({
        $search: {
          index: "product",
          text: {
            query: query,
            path: ["title", "description"],
          },
        },
      });
    }
  }

  const result = await Product.aggregate(agg);

  if (!result.length) {
    throw new ApiError(400, "Product not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, result, "products fetched successfully"));
});

const getProductById = asyncHandler(async(req, res) => {
  const {productId} = req.params

  if(!productId){
    throw new ApiError(400, "Product id is required")
  }

  const product = await Product.aggregate([
    {
      $match : {
        _id : new mongoose.Types.ObjectId(productId)
      }
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
              avatar : 1,
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

  if(!product){
    throw new ApiError(400, "Enter valid product id")
  }

  return res.status(200).json(new ApiResponse(200, product, "Product fetched successfully"))
})

const updateProductDetails = asyncHandler(async(req, res) => {
  const {title, description, gender, price} = req.body
  const {productId} = req.params

  if(!title && !description && !gender && !price){
    throw new ApiError(400, "All fields are empty to update")
  }

  const update = {}
  if(title){
    update.title = title
  }
  if(description){
    update.description = description
  }
  if(gender){
    update.gender = gender
  }
  if(price){
    update.price = price
  }
  
  const product = await Product.findByIdAndUpdate(
    productId,
    {
      $set : update
    }, {new : true}
  )

  if(!product){
    throw new ApiError(400, "Product not found while updating the product")
  }

  return res.status(200).json(new ApiResponse(200, product, "Product details updated successfully"))
  

})

const deleteProduct = asyncHandler(async(req, res) => {
  const {productId} = req.params

  //we have to delete all the images from cloudinary too
  if(!productId){
    throw new ApiError(400, "Enter product Id to delete product")
  }

  const product = await Product.findById(productId)
  if(!product){
    throw new ApiError(400, "Enter valid product id to delete")
  }
  
  product.image.forEach((img) => {
    deleteFromCloudinary(img)
  })

  product.category.forEach(async (cat) => {
    await Category.findByIdAndUpdate(
      cat,
      {
        $pull : {
          products : product._id
        }
      }
    )
  })

  await Product.findByIdAndDelete(product._id)

  return res.status(200).json(new ApiResponse(200, {}, "product deleted successfully"))

})

export { createProduct, getAllProducts, getProductById, updateProductDetails, deleteProduct };
