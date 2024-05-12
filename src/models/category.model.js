import mongoose, {Schema} from "mongoose"

const categorySchema = new Schema({
    title : {
        type : String,
        required : true,
        unique : true
    },
    image : {
        type : String,
    },
    products : [{
        type : Schema.Types.ObjectId,
        ref : "Product"
    }]
})

export const Category = mongoose.model("Category", categorySchema)