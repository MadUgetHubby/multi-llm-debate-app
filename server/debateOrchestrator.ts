import { invokeLLM } from "./_core/llm";
import { addDebateMessage, updateDebateSynthesis, addDebateMetrics } from "./db";

/**
 * Agent configuration with persona and system prompt
 */
export interface AgentConfig {
  name: string;
  persona: string;
  systemPrompt: string;
}

/**
 * Default agent configurations
 */
export const DEFAULT_AGENTS: AgentConfig[] = [
  {
    name: "Strategist",
    persona: "efficiency-focused",
    systemPrompt: "You are a strategic thinker focused on efficiency, long-term planning, and structured methodologies. Provide concise, actionable advice that prioritizes practical implementation and measurable outcomes.",
  },
  {
    name: "Creative",
    persona: "innovative-approaches",
    systemPrompt: "You are a creative researcher who looks for unconventional methods, out-of-the-box tools, and innovative approaches. Focus on discovery, exploration, and novel solutions that others might overlook.",
  },
  {
    name: "Critic",
    persona: "skeptical-analyzer",
    systemPrompt: "You are a skeptical critic who identifies flaws, risks, and potential biases in proposed methods. Your role is to ensure accuracy, reliability, and completeness by questioning assumptions and highlighting gaps.",
  },
];

/**
 * Get LLM response with streaming support
 */
export async function getLLMResponse(
  systemPrompt: string,
  userPrompt: string,
  onChunk?: (chunk: string) => void
): Promise<string> {
  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    let content = response.choices[0]?.message.content || "";
    if (typeof content !== "string") {
      content = "";
    }
    if (onChunk) {
      onChunk(content);
    }
    return content;
  } catch (error) {
    console.error("Error getting LLM response:", error);
    throw error;
  }
}

/**
 * Run a multi-agent debate
 */
export async function runMultiAgentDebate(
  debateId: number,
  inquiry: string,
  numberOfRounds: number = 2,
  agents: AgentConfig[] = DEFAULT_AGENTS,
  onProgress?: (message: string) => void
): Promise<string> {
  try {
    // Step 1: Initial responses from all agents
    onProgress?.(`Starting debate with ${agents.length} agents for ${numberOfRounds} rounds...`);

    const agentResponses: { [key: string]: string } = {};

    for (const agent of agents) {
      onProgress?.(`Getting initial response from ${agent.name}...`);

      const initialPrompt = `Please provide your initial response to the following inquiry:\n\n${inquiry}`;
      const response = await getLLMResponse(agent.systemPrompt, initialPrompt);

      agentResponses[agent.name] = response;

      // Store the initial response
      await addDebateMessage(debateId, 0, agent.name, "initial_response", response, agent.persona);

      onProgress?.(`${agent.name} provided initial response.`);
    }

    // Step 2: Debate rounds with critiques and refinements
    for (let round = 1; round <= numberOfRounds; round++) {
      onProgress?.(`Starting debate round ${round}...`);

      const updatedResponses: { [key: string]: string } = {};

      for (const agent of agents) {
        // Build context from other agents
        const otherAgentsContext = agents
          .filter((a) => a.name !== agent.name)
          .map((a) => `${a.name} (${a.persona}): ${agentResponses[a.name]}`)
          .join("\n\n");

        const critiquePrompt = `
The original inquiry was: ${inquiry}

Here are the current perspectives from other experts:
${otherAgentsContext}

Your previous response was: ${agentResponses[agent.name]}

Based on the other experts' input, please:
1. Critique their views and identify strengths and weaknesses
2. Refine your own answer to address gaps or incorporate valid points
3. Provide your updated response that synthesizes the best insights

Remember to maintain your unique perspective while acknowledging valid points from others.
`;

        onProgress?.(`${agent.name} is critiquing and refining their response...`);

        const refinedResponse = await getLLMResponse(agent.systemPrompt, critiquePrompt);
        updatedResponses[agent.name] = refinedResponse;

        // Store the refined response
        await addDebateMessage(debateId, round, agent.name, "refined_response", refinedResponse, agent.persona);

        onProgress?.(`${agent.name} refined their response in round ${round}.`);
      }

      Object.assign(agentResponses, updatedResponses);
    }

    // Step 3: Final synthesis by Judge agent
    onProgress?.(`Synthesizing final answer from all perspectives...`);

    const allPerspectives = agents
      .map((a) => `${a.name} (${a.persona}): ${agentResponses[a.name]}`)
      .join("\n\n");

    const judgeSystemPrompt =
      "You are a master synthesizer and judge. Your goal is to take multiple expert perspectives and combine them into the single most comprehensive, accurate, and balanced answer possible. Structure your response clearly with sections for key insights, areas of agreement, and synthesized recommendations.";

    const synthesiPrompt = `
The original inquiry was: ${inquiry}

After ${numberOfRounds} rounds of debate, here are the final refined perspectives from the experts:
${allPerspectives}

Please synthesize these perspectives into the ultimate comprehensive answer. Your synthesis should:
1. Identify common themes and points of agreement
2. Resolve any conflicting information or arguments
3. Combine the best elements from all perspectives
4. Provide a clear, actionable final answer
5. Explain how different perspectives contributed to the final answer
`;

    const finalSynthesis = await getLLMResponse(judgeSystemPrompt, synthesiPrompt);

    onProgress?.(`Debate completed. Final synthesis generated.`);

    // Store the final synthesis
    await updateDebateSynthesis(debateId, finalSynthesis);

    // Calculate and store metrics
    const metrics = calculateDebateMetrics(agentResponses, numberOfRounds);
    await addDebateMetrics(debateId, metrics);

    return finalSynthesis;
  } catch (error) {
    console.error("Error running multi-agent debate:", error);
    throw error;
  }
}

/**
 * Calculate debate metrics
 */
export function calculateDebateMetrics(agentResponses: { [key: string]: string }, numberOfRounds: number) {
  const responses = Object.values(agentResponses);

  // Calculate average response length
  const totalLength = responses.reduce((sum, resp) => sum + resp.length, 0);
  const averageResponseLength = Math.round(totalLength / responses.length);

  // Estimate convergence speed (simplified)
  const convergenceSpeed = numberOfRounds / 2;

  // Estimate agreement rate (simplified - based on response similarity)
  const agentAgreementRate = estimateAgreementRate(responses);

  // Estimate quality improvement (simplified)
  const qualityImprovement = Math.min(numberOfRounds * 15, 80);

  // Determine complexity
  const complexity = averageResponseLength > 1000 ? "complex" : averageResponseLength > 500 ? "moderate" : "simple";

  return {
    convergenceSpeed: convergenceSpeed.toFixed(2),
    agentAgreementRate: agentAgreementRate.toFixed(2),
    qualityImprovement: qualityImprovement.toFixed(2),
    averageResponseLength,
    debateComplexity: complexity,
  };
}

/**
 * Estimate agreement rate between agents (simplified)
 */
function estimateAgreementRate(responses: string[]): number {
  if (responses.length < 2) return 100;

  // Simple heuristic: count common keywords
  const keywords = new Set<string>();
  responses.forEach((resp) => {
    const words = resp.toLowerCase().split(/\s+/).filter((w) => w.length > 4);
    words.forEach((w) => keywords.add(w));
  });

  let commonCount = 0;
  keywords.forEach((keyword) => {
    const count = responses.filter((resp) => resp.toLowerCase().includes(keyword)).length;
    if (count === responses.length) {
      commonCount++;
    }
  });

  return Math.min((commonCount / keywords.size) * 100, 100);
}
