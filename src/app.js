import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express()
const allowedOrigins = ["http://localhost:5173", "https://chobarcart.netlify.app"]
app.use(cors({
    origin : allowedOrigins,
    methods : ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials : true
}))


app.use(express.json({
    limit : "16kb"
}))

app.use(express.urlencoded({extended : true, limit : "16kb"}))

app.use(express.static("public"))

app.use(cookieParser())


//routes 
import userRouter from "./routes/user.routes.js"
import categoryRouter from "./routes/category.routes.js"
import productRouter from "./routes/product.routes.js"
import commentRouter from "./routes/comment.routes.js"
import likeRouter from "./routes/like.routes.js"
import subscriptionRouter from "./routes/subscription.routes.js"


//implementation of routes
app.use("/api/v1/users", userRouter)
app.use("/api/v1/category", categoryRouter)
app.use("/api/v1/products", productRouter)
app.use("/api/v1/comments", commentRouter)
app.use("/api/v1/likes", likeRouter)
app.use("/api/v1/subscriptions", subscriptionRouter)

export {app}