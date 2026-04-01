import type { ExecutionStep, AIGeneratedPlan } from "./aiPlanGenerator.js";

export interface StepExecutionResult {
  stepId: number;
  status: "pending" | "running" | "completed" | "failed" | "skipped";
  output: unknown;
  error?: string;
  duration: number; // milliseconds
  executedAt: string;
  retryCount: number;
}

export interface WorkflowExecution {
  taskId: string;
  plan: AIGeneratedPlan;
  steps: StepExecutionResult[];
  currentStepIndex: number;
  status: "pending" | "running" | "completed" | "failed";
  startedAt: string | null;
  completedAt: string | null;
  totalDuration: number;
  lastError?: string;
  replanCount: number;
}

// Simulated action handlers
async function executeAction(
  action: string,
  parameters: Record<string, unknown>
): Promise<unknown> {
  switch (action) {
    case "fetch_data":
      return simulateFetchData(parameters);
    case "process_text":
      return simulateProcessText(parameters);
    case "analyze_sentiment":
      return simulateAnalyzeSentiment(parameters);
    case "generate_content":
      return simulateGenerateContent(parameters);
    case "extract_info":
      return simulateExtractInfo(parameters);
    case "summarize":
      return simulateSummarize(parameters);
    case "format_output":
      return parameters;
    case "wait":
      return simulateWait(parameters);
    case "http_request":
      return simulateHttpRequest(parameters);
    case "database_query":
      return simulateDatabaseQuery(parameters);
    default:
      throw new Error(`Unknown action: ${action}`);
  }
}

function simulateFetchData(params: Record<string, unknown>): Record<string, unknown> {
  const source = params.source as string;
  return {
    source,
    data: `Fetched data from ${source}`,
    timestamp: new Date().toISOString(),
  };
}

function simulateProcessText(params: Record<string, unknown>): Record<string, unknown> {
  const text = params.text as string;
  return {
    original: text,
    processed: (text || "").toUpperCase(),
    wordCount: (text || "").split(" ").length,
  };
}

function simulateAnalyzeSentiment(params: Record<string, unknown>): Record<string, unknown> {
  const text = params.text as string;
  const hasPosWords = (text || "").toLowerCase().match(/good|great|excellent|amazing|wonderful/);
  const hasNegWords = (text || "").toLowerCase().match(/bad|terrible|horrible|awful|poor/);

  let sentiment = "neutral";
  if (hasPosWords && !hasNegWords) sentiment = "positive";
  if (hasNegWords && !hasPosWords) sentiment = "negative";

  return {
    text,
    sentiment,
    confidence: 0.85,
  };
}

function simulateGenerateContent(params: Record<string, unknown>): Record<string, unknown> {
  const type = params.type as string;
  const topic = params.topic as string;
  return {
    type,
    topic,
    content: `Generated ${type} about ${topic}. This is the main content that would be displayed to the user.`,
    generatedAt: new Date().toISOString(),
  };
}

function simulateExtractInfo(params: Record<string, unknown>): Record<string, unknown> {
  const text = params.text as string;
  const pattern = params.pattern as string;
  return {
    source: text,
    pattern,
    matches: text ? 3 : 0,
    extracted: ["match1", "match2", "match3"],
  };
}

function simulateSummarize(params: Record<string, unknown>): Record<string, unknown> {
  const text = params.text as string;
  return {
    original: text,
    summary: (text || "").substring(0, 60) + "...",
    reductionPercent: 75,
  };
}

async function simulateWait(params: Record<string, unknown>): Promise<Record<string, unknown>> {
  const duration = (params.duration as number) || 1000;
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ waited: Math.min(duration, 5000), resumed: new Date().toISOString() });
    }, Math.min(duration, 5000)); // Cap at 5s for testing
  });
}

function simulateHttpRequest(params: Record<string, unknown>): Record<string, unknown> {
  const method = (params.method as string) || "GET";
  const url = params.url as string;
  return {
    method,
    url,
    statusCode: 200,
    body: { success: true, message: `Called ${method} ${url}` },
  };
}

function simulateDatabaseQuery(params: Record<string, unknown>): Record<string, unknown> {
  const query = params.query as string;
  return {
    query,
    rowsAffected: 5,
    results: [
      { id: 1, name: "Row 1" },
      { id: 2, name: "Row 2" },
      { id: 3, name: "Row 3" },
    ],
  };
}

export async function executeStep(
  step: ExecutionStep,
  previousStepOutput?: unknown
): Promise<StepExecutionResult> {
  const startTime = Date.now();
  const result: StepExecutionResult = {
    stepId: step.id,
    status: "pending",
    output: null,
    duration: 0,
    executedAt: new Date().toISOString(),
    retryCount: 0,
  };

  try {
    // Replace $previous placeholder with actual previous output
    const params = { ...step.parameters };
    if (previousStepOutput) {
      Object.keys(params).forEach((key) => {
        if (params[key] === "$previous") {
          params[key] = previousStepOutput;
        }
      });
    }

    result.status = "running";
    result.output = await executeAction(step.action, params);
    result.status = "completed";
  } catch (error) {
    result.status = "failed";
    result.error = error instanceof Error ? error.message : "Unknown error";
  }

  result.duration = Date.now() - startTime;
  return result;
}

export function createWorkflowExecution(plan: AIGeneratedPlan): WorkflowExecution {
  return {
    taskId: plan.taskId,
    plan,
    steps: plan.executionPlan.map((step: ExecutionStep) => ({
      stepId: step.id,
      status: "pending",
      output: null,
      duration: 0,
      executedAt: new Date().toISOString(),
      retryCount: 0,
    })),
    currentStepIndex: 0,
    status: "pending",
    startedAt: null,
    completedAt: null,
    totalDuration: 0,
    replanCount: 0,
  };
}

export function updateWorkflowWithStepResult(
  workflow: WorkflowExecution,
  stepResult: StepExecutionResult
): WorkflowExecution {
  const updatedSteps = [...workflow.steps];
  const stepIndex = updatedSteps.findIndex((s) => s.stepId === stepResult.stepId);

  if (stepIndex >= 0) {
    updatedSteps[stepIndex] = stepResult;
  }

  const allCompleted = updatedSteps.every((s) => s.status === "completed");
  const anyFailed = updatedSteps.some((s) => s.status === "failed");

  return {
    ...workflow,
    steps: updatedSteps,
    currentStepIndex: stepIndex + 1,
    status: anyFailed ? "failed" : allCompleted ? "completed" : "running",
    startedAt: workflow.startedAt || new Date().toISOString(),
    completedAt: allCompleted || anyFailed ? new Date().toISOString() : null,
    totalDuration: updatedSteps.reduce((sum, s) => sum + s.duration, 0),
    lastError: stepResult.error,
  };
}
