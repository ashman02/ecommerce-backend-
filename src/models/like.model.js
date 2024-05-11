import mongoose,{Schema} from "mongoose"

const likeSchema = new Schema({
    product : {
        type : Schema.Types.ObjectId,
        ref : "Product"
    },
    comment : {
        type : Schema.Types.ObjectId,
        ref : "Comment"
    },
    owner : {
        type : Schema.Types.ObjectId,
        ref : "User"
    }
}, {timestamps : true})

export const Like = mongoose.model("Like", likeSchema)