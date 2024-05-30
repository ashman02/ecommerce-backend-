import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    username : {
      type : String,
      required : true,
      trim : true,
      unique : true
    },
    bio : {
      type : String,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    location : {
      type : String,
    },
    phoneNo: {
      type: Number,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      unique: true,
    },
    avatar: {
      type : String, //cloudinary url
    },
    refreshToken: {
      type: String,
    },
    cart : [
      {
        type : Schema.Types.ObjectId,
        ref : "Product"
      }
    ]
  },
  { timestamps: true },
);

//hash the password
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

//custom method to check password
userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

//generate access token
userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      username : this.username,
      fullName: this.fullName,
      email: this.email,
      phoneNo: this.phoneNo,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    },
  );
};

userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
           _id : this._id
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn : process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User = mongoose.model("User", userSchema);
