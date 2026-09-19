import { sql } from "../config/db.js";

export async function createHabit(req, res) {
    try {
        const { user_id, title } = req.body;

        if (!user_id || !title) {
            return res.status(400).json({ message: "user_id and title are required" });
        }

        const newHabit = await sql`
      INSERT INTO habits (user_id, title)
      VALUES (${user_id}, ${title})
      RETURNING *;
    `;

        res.status(201).json(newHabit[0]);
    } catch (error) {
        console.log("Error creating habit:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export async function getHabitsByUserId(req, res) {
    try {
        const { userId } = req.params;

        const habits = await sql`
      SELECT * FROM habits
      WHERE user_id = ${userId}
      ORDER BY created_at DESC;
    `;

        res.status(200).json(habits);
    } catch (error) {
        console.log("Error fetching habits:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export async function completeHabit(req, res) {
    try {
        const { id } = req.params;

        // Fetch the habit along with the database's current date and date difference
        const habitResult = await sql`
      SELECT 
        *,
        (CURRENT_DATE - last_completed) AS days_since_last,
        (last_completed = CURRENT_DATE) AS is_already_completed
      FROM habits 
      WHERE id = ${id}
    `;

        if (habitResult.length === 0) {
            return res.status(404).json({ message: "Habit not found" });
        }

        const habit = habitResult[0];

        // If completed today, block the duplicate
        if (habit.is_already_completed) {
            return res.status(400).json({ message: "Habit already completed today" });
        }

        // If completed yesterday (days_since_last === 1), increment streak; otherwise reset to 1
        const newStreak = habit.days_since_last === 1 ? habit.streak + 1 : 1;

        const updatedHabit = await sql`
      UPDATE habits
      SET streak = ${newStreak}, last_completed = CURRENT_DATE
      WHERE id = ${id}
      RETURNING *;
    `;

        res.status(200).json(updatedHabit[0]);
    } catch (error) {
        console.log("Error completing habit:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export async function deleteHabit(req, res) {
    try {
        const { id } = req.params;

        const result = await sql`
      DELETE FROM habits
      WHERE id = ${id}
      RETURNING *;
    `;

        if (result.length === 0) {
            return res.status(404).json({ message: "Habit not found" });
        }

        res.status(200).json({ message: "Habit deleted successfully" });
    } catch (error) {
        console.log("Error deleting habit:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}