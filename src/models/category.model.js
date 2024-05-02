import mongoose, {Schema} from "mongoose"

const categorySchema = new Schema({
    title : {
        type : String,
        required : true,
        unique : true
    },
    products : [{
        type : mongoose.Types.ObjectId,
        ref : "Product"
    }]
})