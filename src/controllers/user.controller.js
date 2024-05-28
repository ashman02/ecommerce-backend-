import mongoose from "mongoose";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  uploadOnCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.js";
import { sendVerificationCode } from "../utils/sendVerificationCode.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "something went wrong while generating access and refresh token",
    );
  }
};
const registerUser = asyncHandler(async (req, res) => {
  //algorithm => get all the neccessary detail from frontend
  //check if you have all the details required
  //check if user is already registered or not
  //create user
  //send the response to frontend

  const { fullName, username, email, password } = req.body;

  if (
    [fullName, username, email, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields all required");
  }

  //check if user exits
  const existedUser = await User.findOne({
    $or: [{ email }],
  });

  if (existedUser) {
    throw new ApiError(400, "User with email or phone no. already exists");
  }

  const user = await User.create({
    fullName,
    username,
    email,
    password,
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken",
  );

  if (!createdUser) {
    throw new ApiError(500, "Error while registering the user");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, createdUser, "User registered successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  //check user details
  //check password
  //give access and refresh token
  const { identifier, password } = req.body;

  if (!identifier) {
    throw new ApiError(400, "email or username is required to login");
  }

  const user = await User.findOne({
    $or: [{ email: identifier }, { username: identifier }],
  });

  if (!user) {
    throw new ApiError(400, "user with email or username not found");
  }

  //check for password
  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(400, "incorrect password");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id,
  );

  //if you think its not that big computation get latest user
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken",
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "user logged in successfully",
      ),
    );
});

//this website will have funtion like youtube where people can make their
const logoutUser = asyncHandler(async (req, res) => {
  //clear cookies and refresh token of user
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1,
      },
    },
    { new: true },
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  //clear the cookies
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "user logged out"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies?.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(400, "unauthorized request");
  }

  //compare refresh token
  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET,
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(400, "invalid refresh token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(400, "refresh token expired or used");
    }

    //generate new token
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
      user?._id,
    );

    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken },
          "access token refreshed successfully",
        ),
      );
  } catch (error) {
    throw new ApiError(200, error?.message || "Invalid refresh token");
  }
});

const updatePassword = asyncHandler(async (req, res) => {
  const { newPassword, oldPassword } = req.body;

  const user = await User.findById(req.user?._id);

  const isPasswordValid = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordValid) {
    throw new ApiError(400, "Invalid old password");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "User detail fetched"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { username, fullName, bio } = req.body;
  if (!username && !fullName && !bio) {
    throw new ApiError(400, "all fields are empty");
  }

  const update = {};

  if (username) {
    update.username = username;
  }
  if (fullName) {
    update.fullName = fullName;
  }
  if (bio) {
    update.bio = bio;
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: update,
    },
    { new: true },
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "user detail updated successfully"));
});

const updateAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "avatar is required");
  }

  let oldAvatar = null;

  if (req.user?.avatar) {
    oldAvatar = req.user?.avatar;
  }
  const avatar = await uploadOnCloudinary(avatarLocalPath);

  if (!avatar.url) {
    throw new ApiError(500, "error while uploading on cloudinary");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    { new: true },
  ).select("-password -refreshToken");

  if (oldAvatar !== null) {
    deleteFromCloudinary(oldAvatar);
  }

  return res
    .status(200)
    .json(new ApiResponse(200, user, "avatar updated successfully"));
});

const addToCart = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $push: {
        cart: productId,
      },
    },
    { new: true },
  ).select("-password -refreshToken");

  if (!user) {
    throw new ApiError(
      400,
      "something went wrong while adding the product to the cart",
    );
  }

  return res
    .status(200)
    .json(new ApiResponse(200, user, "product saved successfully"));
});

const removeFromCart = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $pull: {
        cart: productId,
      },
    },
    { new: true },
  ).select("-password -refreshToken");

  if (!user) {
    throw new ApiError(400, "error while removing the product from the cart");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, user, "product removed from cart"));
});

const getCartItmes = asyncHandler(async (req, res) => {
  const cartItems = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user?._id),
      },
    },
    {
      $lookup: {
        from: "products",
        localField: "cart",
        foreignField: "_id",
        as: "cart",
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
    {
      $project: {
        cart: 1,
      },
    },
  ]);

  if (cartItems.length === 0) {
    throw new ApiError(400, "Cart is empty");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, cartItems[0], "Cart items fetched successfully"),
    );
});

const userChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;
  if (!username.trim()) {
    throw new ApiError(400, "Username is missing");
  }

  const account = await User.aggregate([
    {
      $match: {
        username: username.trim(),
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "account",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        subscriberCount: {
          $size: "$subscribers",
        },
        subscribedToCount: {
          $size: "$subscribedTo",
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullName: 1,
        username: 1,
        avatar: 1,
        email: 1,
        bio: 1,
        subscriberCount: 1,
        subscribedToCount: 1,
        isSubscribed: 1,
      },
    },
  ]);

  if (!account.length) {
    throw new ApiError(400, "Account does not exists");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, account, "User account fetched successfully"));
});

const testEmail = asyncHandler(async (req, res) => {
  const { email, username } = req.body;

  //check email it exists or not
  const existingUserWithEmail = await User.findOne({ email });

  if (existingUserWithEmail) {
    throw new ApiError(400, "User with this email is already registered");
  }
  let verifyCode = Math.floor(100000 + Math.random() * 900000);
  const emailResponse = await sendVerificationCode(email, username, verifyCode);

  if (!emailResponse) {
    throw new ApiError(
      400,
      "Could not send verification email please sign up again",
    );
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        emailResponse,
        "We've just sent a 6-digit verification code to your email. Please check your inbox and enter the code to continue.",
      ),
    );
});

const checkUsername = asyncHandler(async (req, res) => {
  const { username } = req.params;
  const userByUsername = await User.findOne({ username });

  if (userByUsername) {
    throw new ApiError(400, "User with this username is already registered");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, {}, "Username is available"));
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  updatePassword,
  getCurrentUser,
  updateAccountDetails,
  updateAvatar,
  addToCart,
  removeFromCart,
  getCartItmes,
  userChannelProfile,
  testEmail,
  checkUsername,
};
