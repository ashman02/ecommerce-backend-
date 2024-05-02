import mongoose from "mongoose";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

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

  const { fullName, email, phoneNo, password } = req.body;

  if (
    [fullName, email, phoneNo, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields all required");
  }

  //check if user exits
  const existedUser = await User.findOne({
    $or: [{ email }, { phoneNo }],
  });

  if (existedUser) {
    throw new ApiError(400, "User with email or phone no. already exists");
  }

  const user = await User.create({
    fullName,
    email,
    phoneNo,
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
    .json(new ApiResponse(401, createdUser, "User registered successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  //check user details
  //check password
  //give access and refresh token
  const { email, phoneNo, password } = req.body;

  if (!email && !phoneNo) {
    throw new ApiError(400, "email or phone is required to login");
  }

  const user = await User.findOne({
    $or: [{ email }, { phoneNo }],
  });

  if (!user) {
    throw new ApiError(400, "user with email or phone no. not found");
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

export { registerUser, loginUser };
