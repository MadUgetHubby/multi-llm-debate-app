import { describe, it, expect, vi } from "vitest";
import { formatDebateSummary } from "./emailNotifications";

describe("emailNotifications", () => {
  describe("formatDebateSummary", () => {
    it("should format debate summary without metrics", () => {
      const inquiry = "What is the best way to learn programming?";
      const numberOfRounds = 2;
      const finalSynthesis = "The best way is through practice and projects.";

      const summary = formatDebateSummary(inquiry, numberOfRounds, finalSynthesis);

      expect(summary).toContain(inquiry);
      expect(summary).toContain("2");
      expect(summary).toContain(finalSynthesis);
      expect(summary).toContain("Metrics not yet available");
    });

    it("should format debate summary with metrics", () => {
      const inquiry = "How to improve productivity?";
      const numberOfRounds = 3;
      const finalSynthesis = "Focus on time management and breaks.";
      const metrics = {
        convergenceSpeed: "1.50",
        agentAgreementRate: "85.50",
        qualityImprovement: "45.00",
        debateComplexity: "moderate",
      };

      const summary = formatDebateSummary(inquiry, numberOfRounds, finalSynthesis, metrics);

      expect(summary).toContain(inquiry);
      expect(summary).toContain("3");
      expect(summary).toContain(finalSynthesis);
      expect(summary).toContain("1.50");
      expect(summary).toContain("85.50");
      expect(summary).toContain("45.00");
      expect(summary).toContain("moderate");
    });

    it("should include proper markdown formatting", () => {
      const inquiry = "Test inquiry";
      const numberOfRounds = 1;
      const finalSynthesis = "Test synthesis";

      const summary = formatDebateSummary(inquiry, numberOfRounds, finalSynthesis);

      expect(summary).toContain("# Debate Summary");
      expect(summary).toContain("## Inquiry");
      expect(summary).toContain("## Configuration");
      expect(summary).toContain("## Final Answer");
    });
  });
});
