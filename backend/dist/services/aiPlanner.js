import OpenAI from "openai";
import { env } from "../config/env.js";
const fallbackPlan = (input) => ({
    steps: [
        { id: 1, description: `Analyze task requirements: ${input}`, status: "pending" },
        { id: 2, description: "Initialize project structure", status: "pending" },
        { id: 3, description: "Install and configure dependencies", status: "pending" },
        { id: 4, description: "Implement core features", status: "pending" },
        { id: 5, description: "Validate with tests and checks", status: "pending" },
    ],
});
const client = env.OPENAI_API_KEY
    ? new OpenAI({ apiKey: env.OPENAI_API_KEY })
    : null;
export async function generateTaskPlan(input) {
    if (!client) {
        return fallbackPlan(input);
    }
    try {
        const prompt = `You are an autonomous planner. Convert the task into 4-7 concise execution steps. Return JSON only with schema: {"steps":[{"description":"..."}]}. Task: ${input}`;
        const response = await client.responses.create({
            model: env.OPENAI_MODEL,
            input: prompt,
        });
        const raw = response.output_text;
        const parsed = JSON.parse(raw);
        if (!parsed.steps || parsed.steps.length === 0) {
            return fallbackPlan(input);
        }
        return {
            steps: parsed.steps.map((step, index) => ({
                id: index + 1,
                description: step.description,
                status: "pending",
            })),
        };
    }
    catch {
        return fallbackPlan(input);
    }
}
