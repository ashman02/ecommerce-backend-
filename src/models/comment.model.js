import mongoose from "mongoose"

const commentSchema = new mongoose.Schema({
    content : {
        type : String,
        required : true
    },
    product : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "Product"
    },
    owner : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "User"
    }
}, {timestamps : true})


export const Comment = mongoose.model("Comment", commentSchema)