import { describe, it, expect, vi, beforeEach } from "vitest";
import { DEFAULT_AGENTS, calculateDebateMetrics } from "./debateOrchestrator";

describe("debateOrchestrator", () => {
  describe("DEFAULT_AGENTS", () => {
    it("should have three agents with correct names", () => {
      expect(DEFAULT_AGENTS).toHaveLength(3);
      expect(DEFAULT_AGENTS[0].name).toBe("Strategist");
      expect(DEFAULT_AGENTS[1].name).toBe("Creative");
      expect(DEFAULT_AGENTS[2].name).toBe("Critic");
    });

    it("should have correct personas for each agent", () => {
      expect(DEFAULT_AGENTS[0].persona).toBe("efficiency-focused");
      expect(DEFAULT_AGENTS[1].persona).toBe("innovative-approaches");
      expect(DEFAULT_AGENTS[2].persona).toBe("skeptical-analyzer");
    });

    it("should have system prompts for each agent", () => {
      DEFAULT_AGENTS.forEach((agent) => {
        expect(agent.systemPrompt).toBeTruthy();
        expect(agent.systemPrompt.length).toBeGreaterThan(50);
      });
    });
  });

  describe("calculateDebateMetrics", () => {
    it("should calculate metrics for agent responses", () => {
      const agentResponses = {
        Strategist:
          "This is a strategic approach focusing on efficiency and planning. We should prioritize implementation and measurable outcomes.",
        Creative:
          "Consider unconventional methods and innovative tools. Look for novel solutions that others might overlook.",
        Critic:
          "We need to verify accuracy and identify potential risks. Ensure completeness and address all gaps.",
      };

      const metrics = calculateDebateMetrics(agentResponses, 2);

      expect(metrics).toHaveProperty("convergenceSpeed");
      expect(metrics).toHaveProperty("agentAgreementRate");
      expect(metrics).toHaveProperty("qualityImprovement");
      expect(metrics).toHaveProperty("averageResponseLength");
      expect(metrics).toHaveProperty("debateComplexity");
    });

    it("should calculate correct average response length", () => {
      const agentResponses = {
        Agent1: "Short response",
        Agent2: "Another short response",
        Agent3: "Third short response",
      };

      const metrics = calculateDebateMetrics(agentResponses, 1);
      const totalLength = Object.values(agentResponses).reduce((sum, resp) => sum + resp.length, 0);
      const expectedAverage = Math.round(totalLength / 3);

      expect(metrics.averageResponseLength).toBe(expectedAverage);
    });

    it("should determine complexity based on response length", () => {
      const shortResponse = {
        Agent1: "Short",
        Agent2: "Short",
        Agent3: "Short",
      };

      const longResponse = {
        Agent1: "x".repeat(600),
        Agent2: "x".repeat(600),
        Agent3: "x".repeat(600),
      };

      const veryLongResponse = {
        Agent1: "x".repeat(1200),
        Agent2: "x".repeat(1200),
        Agent3: "x".repeat(1200),
      };

      expect(calculateDebateMetrics(shortResponse, 1).debateComplexity).toBe("simple");
      expect(calculateDebateMetrics(longResponse, 1).debateComplexity).toBe("moderate");
      expect(calculateDebateMetrics(veryLongResponse, 1).debateComplexity).toBe("complex");
    });

    it("should calculate convergence speed based on rounds", () => {
      const agentResponses = {
        Agent1: "Response 1",
        Agent2: "Response 2",
      };

      const metrics1 = calculateDebateMetrics(agentResponses, 1);
      const metrics2 = calculateDebateMetrics(agentResponses, 2);
      const metrics3 = calculateDebateMetrics(agentResponses, 3);

      expect(parseFloat(metrics1.convergenceSpeed)).toBe(0.5);
      expect(parseFloat(metrics2.convergenceSpeed)).toBe(1);
      expect(parseFloat(metrics3.convergenceSpeed)).toBe(1.5);
    });

    it("should calculate quality improvement based on rounds", () => {
      const agentResponses = {
        Agent1: "Response 1",
        Agent2: "Response 2",
      };

      const metrics1 = calculateDebateMetrics(agentResponses, 1);
      const metrics2 = calculateDebateMetrics(agentResponses, 2);
      const metrics3 = calculateDebateMetrics(agentResponses, 5);

      expect(parseFloat(metrics1.qualityImprovement)).toBeLessThan(parseFloat(metrics2.qualityImprovement));
      expect(parseFloat(metrics3.qualityImprovement)).toBeLessThanOrEqual(80);
    });

    it("should estimate agreement rate between agents", () => {
      const agentResponses = {
        Agent1: "This approach is efficient and practical",
        Agent2: "This approach is efficient and practical",
        Agent3: "This approach is efficient and practical",
      };

      const metrics = calculateDebateMetrics(agentResponses, 1);
      const agreementRate = parseFloat(metrics.agentAgreementRate);

      expect(agreementRate).toBeGreaterThan(0);
      expect(agreementRate).toBeLessThanOrEqual(100);
    });

    it("should handle single agent response", () => {
      const agentResponses = {
        Agent1: "This is a response",
      };

      const metrics = calculateDebateMetrics(agentResponses, 1);

      expect(metrics.agentAgreementRate).toBe("100.00");
    });
  });
});
