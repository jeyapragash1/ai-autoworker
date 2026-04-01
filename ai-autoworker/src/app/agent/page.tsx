'use client';

import { useCallback, useEffect, useState } from 'react';
import { showToast } from '@/lib/toast';
import { getStoredRole, roleChangeEventName, type UserRole } from '@/lib/role';

interface AIGeneratedPlan {
  taskId: string;
  userInput: string;
  aiReasoning: string;
  executionPlan: ExecutionStep[];
  estimatedDuration: number;
  confidence: number;
}

interface ExecutionStep {
  id: number;
  action: string;
  description: string;
  parameters: Record<string, unknown>;
  expectedOutput: string;
  retryable: boolean;
}

interface StepExecutionResult {
  stepId: number;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  output: unknown;
  error?: string;
  duration: number;
  executedAt: string;
  retryCount: number;
}

interface WorkflowExecution {
  taskId: string;
  plan: AIGeneratedPlan;
  steps: StepExecutionResult[];
  currentStepIndex: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt: string | null;
  completedAt: string | null;
  totalDuration: number;
  lastError?: string;
  replanCount: number;
}

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';

export default function AIAgentPage() {
  const [role, setRole] = useState<UserRole>(() => {
    if (typeof window === 'undefined') {
      return 'admin';
    }
    return getStoredRole();
  });

  const [input, setInput] = useState('');
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [plan, setPlan] = useState<AIGeneratedPlan | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [workflow, setWorkflow] = useState<WorkflowExecution | null>(null);
  const [workflows, setWorkflows] = useState<WorkflowExecution[]>([]);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);

  useEffect(() => {
    const onRoleChange = () => {
      setRole(getStoredRole());
    };

    window.addEventListener(roleChangeEventName, onRoleChange);
    return () => {
      window.removeEventListener(roleChangeEventName, onRoleChange);
    };
  }, []);

  // Fetch workflows list
  const fetchWorkflows = useCallback(async () => {
    try {
      const response = await fetch(`${apiBase}/api/ai/list`, { cache: 'no-store' });
      if (!response.ok) throw new Error('Failed to load workflows');
      const data = (await response.json()) as { workflows: WorkflowExecution[] };
      setWorkflows(data.workflows);
    } catch (error) {
      console.error('Error fetching workflows:', error);
    }
  }, []);

  useEffect(() => {
    fetchWorkflows();
    const interval = setInterval(fetchWorkflows, 5000);
    return () => clearInterval(interval);
  }, [fetchWorkflows]);

  // Fetch workflow details
  const fetchWorkflowDetails = useCallback(
    async (taskId: string) => {
      try {
        const response = await fetch(`${apiBase}/api/ai/execute/${taskId}`, {
          cache: 'no-store',
        });
        if (!response.ok) throw new Error('Failed to load workflow');
        const data = (await response.json()) as { workflow: WorkflowExecution };
        setWorkflow(data.workflow);
      } catch (error) {
        console.error('Error fetching workflow:', error);
      }
    },
    []
  );

  useEffect(() => {
    if (selectedWorkflowId) {
      fetchWorkflowDetails(selectedWorkflowId);
      const interval = setInterval(() => fetchWorkflowDetails(selectedWorkflowId), 2000);
      return () => clearInterval(interval);
    }
  }, [selectedWorkflowId, fetchWorkflowDetails]);

  const generatePlan = useCallback(async () => {
    if (!input.trim()) {
      showToast('Please enter a task description', 'info');
      return;
    }

    if (role !== 'admin') {
      showToast('Only admins can generate plans', 'warning');
      return;
    }

    setIsGeneratingPlan(true);
    try {
      const response = await fetch(`${apiBase}/api/ai/plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input }),
      });

      if (!response.ok) throw new Error('Failed to generate plan');
      const data = (await response.json()) as { plan: AIGeneratedPlan };
      setPlan(data.plan);
      showToast('Plan generated successfully!', 'success');
    } catch (error) {
      showToast('Failed to generate plan', 'error');
      console.error('Plan generation error:', error);
    } finally {
      setIsGeneratingPlan(false);
    }
  }, [input, role]);

  const executePlan = useCallback(async () => {
    if (!plan) return;

    if (role !== 'admin') {
      showToast('Only admins can execute plans', 'warning');
      return;
    }

    setIsExecuting(true);
    try {
      const response = await fetch(`${apiBase}/api/ai/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: plan.taskId }),
      });

      if (!response.ok) throw new Error('Failed to execute plan');
      const data = (await response.json()) as { workflow: WorkflowExecution };
      setWorkflow(data.workflow);
      setSelectedWorkflowId(data.workflow.taskId);
      await fetchWorkflows();
      showToast('Execution started!', 'success');
    } catch (error) {
      showToast('Failed to execute plan', 'error');
      console.error('Execution error:', error);
    } finally {
      setIsExecuting(false);
    }
  }, [plan, role, fetchWorkflows]);

  const getActionColor = (action: string): string => {
    const colors: Record<string, string> = {
      fetch_data: 'bg-blue-900 border-blue-600',
      process_text: 'bg-purple-900 border-purple-600',
      analyze_sentiment: 'bg-pink-900 border-pink-600',
      generate_content: 'bg-emerald-900 border-emerald-600',
      extract_info: 'bg-amber-900 border-amber-600',
      summarize: 'bg-cyan-900 border-cyan-600',
      format_output: 'bg-slate-900 border-slate-600',
      wait: 'bg-gray-900 border-gray-600',
      http_request: 'bg-orange-900 border-orange-600',
      database_query: 'bg-indigo-900 border-indigo-600',
    };
    return colors[action] || 'bg-zinc-800 border-zinc-600';
  };

  const getStatusBadge = (status: string): string => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-900 text-emerald-200 border-emerald-700';
      case 'failed':
        return 'bg-red-900 text-red-200 border-red-700';
      case 'running':
        return 'bg-amber-900 text-amber-200 border-amber-700';
      case 'pending':
        return 'bg-zinc-800 text-zinc-200 border-zinc-700';
      default:
        return 'bg-gray-900 text-gray-200 border-gray-700';
    }
  };

  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <header className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-5 py-4 shadow-lg">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">AI Agent</h1>
        <p className="mt-1 text-sm text-zinc-400">Autonomous task planning and execution powered by AI</p>
      </header>

      {/* Input Section */}
      {role === 'admin' && (
        <section className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-6 shadow-lg">
          <label className="block text-sm font-medium text-zinc-100 mb-3">Describe your task (natural language)</label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g., 'Analyze customer feedback emails for sentiment, extract key themes, and generate a summary report'"
            className="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-zinc-100 placeholder-zinc-500 focus:border-blue-600 focus:outline-none"
            rows={4}
          />
          <button
            onClick={generatePlan}
            disabled={isGeneratingPlan || !input.trim()}
            className="mt-4 rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-gray-600"
          >
            {isGeneratingPlan ? 'Generating...' : '🤖 Generate AI Plan'}
          </button>
        </section>
      )}

      {/* AI Reasoning & Plan Section */}
      {plan && (
        <section className="rounded-lg border border-blue-700/50 bg-blue-950/40 p-6 shadow-lg">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold text-blue-100">AI Analysis</h2>
              <span className="text-xs px-2 py-1 rounded bg-blue-900/60 text-blue-200">
                Confidence: {(plan.confidence * 100).toFixed(0)}%
              </span>
            </div>
            <p className="text-sm text-blue-300 italic">{plan.aiReasoning}</p>
          </div>

          <div className="mb-6">
            <h3 className="text-sm font-medium text-blue-100 mb-3">Execution Plan ({plan.executionPlan.length} steps)</h3>
            <div className="space-y-2">
              {plan.executionPlan.map((step, idx) => (
                <div key={step.id} className={`rounded border ${getActionColor(step.action)} p-3 text-sm`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-white">
                        Step {idx + 1}: {step.action}
                      </p>
                      <p className="text-zinc-300 text-xs mt-1">{step.description}</p>
                      {step.expectedOutput && (
                        <p className="text-zinc-400 text-xs mt-1">Expected: {step.expectedOutput}</p>
                      )}
                    </div>
                    {step.retryable && <span className="text-xs bg-white/10 px-2 py-0.5 rounded">Retryable</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-blue-400 mb-4">
            ⏱️ Estimated Duration: {plan.estimatedDuration} seconds
          </p>

          {role === 'admin' && (
            <button
              onClick={executePlan}
              disabled={isExecuting}
              className="rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:bg-gray-600"
            >
              {isExecuting ? 'Starting Execution...' : '▶️ Execute Plan'}
            </button>
          )}
        </section>
      )}

      {/* Workflow Execution Section */}
      {workflow && (
        <section className="rounded-lg border border-amber-700/50 bg-amber-950/40 p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-amber-100">Execution Progress</h2>
            <span className={`text-xs px-3 py-1 rounded border ${getStatusBadge(workflow.status)}`}>
              {workflow.status.toUpperCase()}
            </span>
          </div>

          {/* Step-by-step execution */}
          <div className="space-y-3 mb-6">
            {workflow.plan.executionPlan.map((step, idx) => {
              const result = workflow.steps[idx];
              return (
                <div key={step.id} className="rounded border border-amber-700/30 bg-amber-900/20 p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs px-2 py-1 rounded font-medium ${
                          result?.status === 'completed'
                            ? 'bg-emerald-600 text-white'
                            : result?.status === 'failed'
                              ? 'bg-red-600 text-white'
                              : result?.status === 'running'
                                ? 'bg-amber-600 text-white'
                                : 'bg-zinc-700 text-zinc-200'
                        }`}
                      >
                        {result?.status || 'pending'}
                      </span>
                      <p className="font-medium text-amber-100">
                        Step {idx + 1}: {step.action}
                      </p>
                    </div>
                    {result && <p className="text-xs text-amber-400">{result.duration}ms</p>}
                  </div>
                  <p className="text-xs text-amber-300 mb-2">{step.description}</p>
                  {result?.output && (
                    <p className="text-xs text-amber-200/70 bg-black/20 p-2 rounded max-h-20 overflow-y-auto">
                      <strong>Output:</strong> {JSON.stringify(result.output, null, 2)}
                    </p>
                  )}
                  {result?.error && <p className="text-xs text-red-300 mt-2">Error: {result.error}</p>}
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-xs text-amber-400">
            <p>
              Progress: {workflow.steps.filter((s) => s.status === 'completed').length}/
              {workflow.steps.length}
            </p>
            <p>Total Duration: {(workflow.totalDuration / 1000).toFixed(2)}s</p>
          </div>
        </section>
      )}

      {/* Workflows History */}
      <section className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-6 shadow-lg">
        <h2 className="text-lg font-semibold text-zinc-100 mb-4">Workflow History</h2>
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {workflows.length === 0 ? (
            <p className="text-sm text-zinc-400">No workflows yet</p>
          ) : (
            workflows.map((w) => (
              <div
                key={w.taskId}
                onClick={() => setSelectedWorkflowId(w.taskId)}
                className={`p-3 rounded border cursor-pointer transition ${
                  selectedWorkflowId === w.taskId
                    ? 'border-blue-600 bg-blue-900/40'
                    : 'border-zinc-700 bg-zinc-800/60 hover:bg-zinc-800'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-zinc-100">{w.userInput.substring(0, 60)}...</p>
                  <span
                    className={`text-xs px-2 py-0.5 rounded font-medium ${
                      w.status === 'completed'
                        ? 'bg-emerald-900 text-emerald-200'
                        : w.status === 'failed'
                          ? 'bg-red-900 text-red-200'
                          : w.status === 'running'
                            ? 'bg-amber-900 text-amber-200'
                            : 'bg-zinc-700 text-zinc-200'
                    }`}
                  >
                    {w.status}
                  </span>
                </div>
                <p className="text-xs text-zinc-500">
                  {w.completedSteps}/{w.stepCount} steps • {w.createdAt ? new Date(w.createdAt).toLocaleTimeString() : 'N/A'}
                </p>
              </div>
            ))
          )}
        </div>
      </section>
    </section>
  );
}
