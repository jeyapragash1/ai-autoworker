import { Router, Request, Response } from "express";
import { generatePlan } from "../services/aiPlanGenerator.js";
import { createWorkflowExecution, executeStep, updateWorkflowWithStepResult } from "../services/stepExecutor.js";
import type { AIGeneratedPlan, ExecutionStep } from "../services/aiPlanGenerator.js";
import type { WorkflowExecution, StepExecutionResult } from "../services/stepExecutor.js";

const router = Router();

// In-memory storage for workflows (replace with database in production)
const workflows = new Map<string, WorkflowExecution>();
const plans = new Map<string, AIGeneratedPlan>();

/**
 * POST /api/ai/plan
 * Generate an AI execution plan from natural language input
 */
router.post("/ai/plan", async (req: Request, res: Response) => {
  try {
    const { input } = req.body as { input: string };

    if (!input || typeof input !== "string") {
      res.status(400).json({ error: "Missing or invalid 'input' field" });
      return;
    }

    const taskId = `plan-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const plan = await generatePlan(input, taskId);

    // Store the plan
    plans.set(taskId, plan);

    res.json({
      taskId,
      plan,
    });
  } catch (error) {
    console.error("Plan generation error:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to generate plan",
    });
  }
});

/**
 * GET /api/ai/plan/:planId
 * Retrieve a generated plan
 */
router.get("/ai/plan/:planId", (req: Request, res: Response) => {
  const planId = typeof req.params.planId === "string" ? req.params.planId : req.params.planId[0];
  const plan = plans.get(planId);

  if (!plan) {
    res.status(404).json({ error: "Plan not found" });
    return;
  }

  res.json({ plan });
});

/**
 * POST /api/ai/execute
 * Start executing an AI-generated plan
 */
router.post("/ai/execute", async (req: Request, res: Response) => {
  try {
    const { planId } = req.body as { planId: string };

    const plan = plans.get(planId);
    if (!plan) {
      res.status(404).json({ error: "Plan not found" });
      return;
    }

    const workflow = createWorkflowExecution(plan);
    workflows.set(workflow.taskId, workflow);

    // Start execution in background
    executeWorkflow(workflow.taskId).catch((err) => {
      console.error("Workflow execution error:", err);
    });

    res.json({
      taskId: workflow.taskId,
      workflow,
    });
  } catch (error) {
    console.error("Execution error:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to start execution",
    });
  }
});

/**
 * GET /api/ai/execute/:taskId
 * Get workflow execution status
 */
router.get("/ai/execute/:taskId", (req: Request, res: Response) => {
  const taskId = typeof req.params.taskId === "string" ? req.params.taskId : req.params.taskId[0];
  const workflow = workflows.get(taskId);

  if (!workflow) {
    res.status(404).json({ error: "Workflow not found" });
    return;
  }

  res.json({ workflow });
});

/**
 * GET /api/ai/execute/:taskId/steps
 * Get all steps and their execution results
 */
router.get("/ai/execute/:taskId/steps", (req: Request, res: Response) => {
  const taskId2 = typeof req.params.taskId === "string" ? req.params.taskId : req.params.taskId[0];
  const workflow = workflows.get(taskId2);

  if (!workflow) {
    res.status(404).json({ error: "Workflow not found" });
    return;
  }

  res.json({
    taskId: workflow.taskId,
    reasoning: workflow.plan.aiReasoning,
    steps: workflow.plan.executionPlan,
    results: workflow.steps,
    status: workflow.status,
  });
});

/**
 * GET /api/ai/list
 * List all workflows
 */
router.get("/ai/list", (req: Request, res: Response) => {
  const allWorkflows = Array.from(workflows.values()).map((w) => ({
    taskId: w.taskId,
    userInput: w.plan.userInput,
    status: w.status,
    createdAt: w.startedAt,
    completedAt: w.completedAt,
    stepCount: w.plan.executionPlan.length,
    completedSteps: w.steps.filter((s: StepExecutionResult) => s.status === "completed").length,
  }));

  res.json({ workflows: allWorkflows });
});

// Helper function to execute workflow steps sequentially
async function executeWorkflow(taskId: string): Promise<void> {
  const workflow = workflows.get(taskId);
  if (!workflow) return;

  let updatedWorkflow: WorkflowExecution = { ...workflow, status: "running", startedAt: new Date().toISOString() };
  workflows.set(taskId, updatedWorkflow);

  let previousOutput: unknown = null;

  for (const step of updatedWorkflow.plan.executionPlan) {
    try {
      const result = await executeStep(step, previousOutput);
      updatedWorkflow = updateWorkflowWithStepResult(updatedWorkflow, result) as WorkflowExecution;
      workflows.set(taskId, updatedWorkflow);
      previousOutput = result.output;

      if (result.status === "failed") {
        // Stop on first failure (no automatic retry for now)
        break;
      }
    } catch (error) {
      console.error(`Failed to execute step ${step.id}:`, error);
      updatedWorkflow = {
        ...updatedWorkflow,
        status: "failed" as const,
        lastError: error instanceof Error ? error.message : "Unknown error",
        completedAt: new Date().toISOString(),
      };
      workflows.set(taskId, updatedWorkflow);
      break;
    }
  }
}

export default router;
