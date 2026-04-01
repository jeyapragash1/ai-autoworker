import OpenAI from "openai";

export interface ExecutionStep {
  id: number;
  action: string;
  description: string;
  parameters: Record<string, unknown>;
  expectedOutput: string;
  retryable: boolean;
}

export interface AIGeneratedPlan {
  taskId: string;
  userInput: string;
  aiReasoning: string;
  executionPlan: ExecutionStep[];
  estimatedDuration: number; // in seconds
  confidence: number; // 0-1
}

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const systemPrompt = `You are an AI task planning agent. Your job is to analyze user requests and break them down into executable steps.

When a user provides a task, you must:
1. Understand the intent and goal
2. Break it into clear, sequential steps
3. Each step should have: action, description, parameters, expected output
4. Output ONLY valid JSON (no markdown, no explanations)

Actions you can use:
- fetch_data: Get information from a source
- process_text: Analyze or transform text
- generate_content: Create new content
- analyze_sentiment: Determine emotional tone
- extract_info: Find specific information
- compare_data: Compare multiple inputs
- summarize: Create a summary
- format_output: Structure data for display
- send_notification: Alert user
- wait: Pause execution

Always respond with valid JSON in this format:
{
  "reasoning": "Brief explanation of your understanding",
  "steps": [
    {
      "id": 1,
      "action": "action_name",
      "description": "What this step does",
      "parameters": {"key": "value"},
      "expectedOutput": "What to expect after this step",
      "retryable": true
    }
  ],
  "estimatedDuration": 30,
  "confidence": 0.95
}`;

export async function generatePlan(userInput: string, taskId: string): Promise<AIGeneratedPlan> {
  try {
    const response = await client.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: `Task: ${userInput}`,
        },
      ],
      system: systemPrompt,
    });

    const content = response.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type from OpenAI");
    }

    // Parse the JSON response
    let planData;
    try {
      planData = JSON.parse(content.text);
    } catch {
      // Try to extract JSON if wrapped in markdown
      const jsonMatch = content.text.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        planData = JSON.parse(jsonMatch[1]);
      } else {
        throw new Error("Failed to parse AI response as JSON");
      }
    }

    const executionPlan: ExecutionStep[] = (planData.steps || []).map(
      (step: {
        id: number;
        action: string;
        description: string;
        parameters: Record<string, unknown>;
        expectedOutput: string;
        retryable: boolean;
      }) => ({
        id: step.id,
        action: step.action,
        description: step.description,
        parameters: step.parameters || {},
        expectedOutput: step.expectedOutput,
        retryable: step.retryable ?? true,
      })
    );

    return {
      taskId,
      userInput,
      aiReasoning: planData.reasoning || "No reasoning provided",
      executionPlan,
      estimatedDuration: planData.estimatedDuration || 60,
      confidence: planData.confidence || 0.5,
    };
  } catch (error) {
    console.error("AI Plan Generation Error:", error);
    throw new Error(`Failed to generate plan: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}
