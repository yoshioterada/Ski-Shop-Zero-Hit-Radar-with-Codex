import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

export const SeveritySchema = z.enum(["Critical", "High", "Medium", "Low"]);

const OptionalNumberSchema = z.number().optional();
const OptionalNumberFromNullableSchema = z.preprocess(
  (value) => (value === null ? undefined : value),
  OptionalNumberSchema
);

function buildAgentFindingSchema(lineNumberSchema: z.ZodType<number | undefined, z.ZodTypeDef, unknown>) {
  return z.object({
    severity: SeveritySchema,
    category: z.string(),
    title: z.string(),
    description: z.string(),
    targetFile: z.string(),
    lineStart: lineNumberSchema,
    lineEnd: lineNumberSchema,
    evidence: z.string().optional(),
    suggestedFix: z.string().optional(),
    confidence: z.enum(["high", "medium", "low"])
  }).strict();
}

export const AgentFindingSchema = buildAgentFindingSchema(OptionalNumberFromNullableSchema);

const AgentFindingOutputContractSchema = buildAgentFindingSchema(OptionalNumberSchema);

export const AgentEscalationSchema = z.object({
  priority: z.enum(["highest", "high", "normal"]),
  description: z.string(),
  recommendedDecisionMaker: z.string()
}).strict();

export const DesignDeviationSchema = z.object({
  document: z.string(),
  description: z.string(),
  targetFile: z.string()
}).strict();

function buildAgentReviewSchema(
  findingSchema: typeof AgentFindingSchema,
  scoreSchema: z.ZodType<number | undefined, z.ZodTypeDef, unknown>
) {
  return z.object({
    verdict: z.enum(["pass", "warning", "fail"]),
    summary: z.string(),
    findings: z.array(findingSchema),
    escalations: z.array(AgentEscalationSchema),
    designDeviations: z.array(DesignDeviationSchema),
    score: scoreSchema,
    rawMarkdown: z.string()
  }).strict();
}

export const AgentReviewSchema = buildAgentReviewSchema(
  AgentFindingSchema,
  OptionalNumberFromNullableSchema
);

const AgentReviewOutputContractSchema = buildAgentReviewSchema(
  AgentFindingOutputContractSchema,
  OptionalNumberSchema
);

export const AdjudicationSchema = z.object({
  adjudications: z.array(
    z.object({
      conflictId: z.string(),
      decision: z.enum(["prefer_a", "prefer_b", "merge", "escalate"]),
      finalSeverity: SeveritySchema,
      finalFindingTitle: z.string(),
      rationale: z.string(),
      recommendedAction: z.string()
    }).strict()
  ),
  summary: z.string()
}).strict();

export type AgentReviewOutput = z.infer<typeof AgentReviewSchema>;
export type AgentFindingOutput = z.infer<typeof AgentFindingSchema>;
export type AgentEscalationOutput = z.infer<typeof AgentEscalationSchema>;
export type AdjudicationOutput = z.infer<typeof AdjudicationSchema>;

export const agentReviewOutputSchema = zodToJsonSchema(AgentReviewOutputContractSchema, {
  target: "openAi"
});

export const adjudicationOutputSchema = zodToJsonSchema(AdjudicationSchema, {
  target: "openAi"
});

export function parseAgentReviewJson(raw: string): AgentReviewOutput {
  return AgentReviewSchema.parse(JSON.parse(raw));
}

export function parseAdjudicationJson(raw: string): AdjudicationOutput {
  return AdjudicationSchema.parse(JSON.parse(raw));
}
