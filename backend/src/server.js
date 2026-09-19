import express from "express";
import dotenv from "dotenv";
import { initDB } from "./config/db.js";
import rateLimiter from "./middleware/rateLimiter.js";
import habitRoutes from "./routes/habitsRoute.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Required middleware to parse JSON bodies
app.use(express.json());
app.use(rateLimiter);

app.get("/api/health", (req, res) => {
    res.status(200).json({ status: "ok" });
});

app.use("/api/habits", habitRoutes);

initDB().then(() => {
    app.listen(PORT, () => {
        console.log("Server is up and running on PORT:", PORT);
    });
});