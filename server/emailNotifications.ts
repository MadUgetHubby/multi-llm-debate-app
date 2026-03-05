import { notifyOwner } from "./_core/notification";

/**
 * Send email notification when a debate completes
 */
export async function sendDebateCompletionEmail(
  userEmail: string,
  userName: string,
  debateId: number,
  inquiry: string,
  finalSynthesis: string,
  numberOfRounds: number
): Promise<boolean> {
  try {
    // Create a formatted email content
    const emailTitle = `Your Debate on "${inquiry.substring(0, 50)}${inquiry.length > 50 ? "..." : ""}" is Complete`;

    const emailContent = `
Hi ${userName},

Your multi-agent debate has been completed! Here's a summary:

**Inquiry:** ${inquiry}

**Debate Rounds:** ${numberOfRounds}

**Final Synthesis:**
${finalSynthesis.substring(0, 500)}${finalSynthesis.length > 500 ? "..." : ""}

View the full debate and metrics here: [View Debate](https://your-app-url/debate/${debateId})

Best regards,
MultiLLM Debate Team
    `.trim();

    // Use the built-in notification system to notify the owner
    // In a production system, you would integrate with a proper email service
    // For now, we'll use the notification system as a fallback
    const result = await notifyOwner({
      title: emailTitle,
      content: emailContent,
    });

    if (result) {
      console.log(`[Email] Debate completion notification sent for debate ${debateId}`);
    }

    return result;
  } catch (error) {
    console.error(`[Email] Failed to send debate completion email for debate ${debateId}:`, error);
    return false;
  }
}

/**
 * Format debate summary for email
 */
export function formatDebateSummary(
  inquiry: string,
  numberOfRounds: number,
  finalSynthesis: string,
  metrics?: {
    convergenceSpeed: string;
    agentAgreementRate: string;
    qualityImprovement: string;
    debateComplexity: string;
  }
): string {
  let summary = `
# Debate Summary

## Inquiry
${inquiry}

## Configuration
- **Rounds:** ${numberOfRounds}
- **Complexity:** ${metrics?.debateComplexity || "N/A"}

## Final Answer
${finalSynthesis}

## Metrics
${
  metrics
    ? `
- **Convergence Speed:** ${metrics.convergenceSpeed} rounds
- **Agent Agreement:** ${metrics.agentAgreementRate}%
- **Quality Improvement:** ${metrics.qualityImprovement}%
`
    : "Metrics not yet available"
}
  `.trim();

  return summary;
}
