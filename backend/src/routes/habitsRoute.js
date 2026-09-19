import express from "express";
import {
    createHabit,
    getHabitsByUserId,
    completeHabit,
    deleteHabit,
} from "../controllers/habitsController.js";

const router = express.Router();

router.post("/", createHabit);
router.get("/:userId", getHabitsByUserId);
router.put("/:id/complete", completeHabit);
router.delete("/:id", deleteHabit);

export default router;