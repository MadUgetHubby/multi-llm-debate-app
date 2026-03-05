import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import {
  createDebate,
  getDebateById,
  getUserDebates,
  getDebateMessages,
  getDebateMetrics,
  getUserDebateSettings,
  createOrUpdateDebateSettings,
} from "./db";
import { runMultiAgentDebate, DEFAULT_AGENTS } from "./debateOrchestrator";
import { sendDebateCompletionEmail } from "./emailNotifications";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Debate routers
  debate: router({
    // Submit a new inquiry for debate
    submit: protectedProcedure
      .input(
        z.object({
          inquiry: z.string().min(10, "Inquiry must be at least 10 characters"),
          numberOfRounds: z.number().int().min(1).max(5).default(2),
        })
      )
      .mutation(async ({ input, ctx }) => {
        try {
          const result = await createDebate(ctx.user.id, input.inquiry, input.numberOfRounds);
          const debateId = (result as any).insertId;

          // Start the debate asynchronously
          runMultiAgentDebate(debateId, input.inquiry, input.numberOfRounds, DEFAULT_AGENTS, (progress) => {
            console.log(`[Debate ${debateId}] ${progress}`);
          })
            .then(async () => {
              // Send email notification after debate completes
              const debate = await getDebateById(debateId);
              if (debate && ctx.user.email) {
                const settings = await getUserDebateSettings(ctx.user.id);
                if (settings?.enableEmailNotifications) {
                  await sendDebateCompletionEmail(
                    ctx.user.email,
                    ctx.user.name || "User",
                    debateId,
                    input.inquiry,
                    debate.finalSynthesis || "",
                    input.numberOfRounds
                  );
                }
              }
            })
            .catch((error) => {
              console.error(`[Debate ${debateId}] Error:`, error);
            });

          return {
            debateId,
            status: "pending",
          };
        } catch (error) {
          console.error("Error submitting debate:", error);
          throw error;
        }
      }),

    // Get debate by ID
    getById: protectedProcedure
      .input(z.object({ debateId: z.number() }))
      .query(async ({ input, ctx }) => {
        const debate = await getDebateById(input.debateId);

        if (!debate || debate.userId !== ctx.user.id) {
          throw new Error("Debate not found or access denied");
        }

        return debate;
      }),

    // Get all debates for the current user with optional filtering
    list: protectedProcedure
      .input(
        z.object({
          search: z.string().optional(),
          complexity: z.enum(["simple", "moderate", "complex"]).optional(),
          startDate: z.date().optional(),
          endDate: z.date().optional(),
        })
      )
      .query(async ({ input, ctx }) => {
        let debates = await getUserDebates(ctx.user.id);

        // Filter by search query
        if (input.search) {
          const searchLower = input.search.toLowerCase();
          debates = debates.filter(
            (d) =>
              d.inquiry.toLowerCase().includes(searchLower) ||
              d.topic?.toLowerCase().includes(searchLower)
          );
        }

        // Filter by date range
        if (input.startDate) {
          debates = debates.filter((d) => new Date(d.createdAt) >= input.startDate!);
        }
        if (input.endDate) {
          debates = debates.filter((d) => new Date(d.createdAt) <= input.endDate!);
        }

        // Filter by complexity (requires metrics)
        if (input.complexity) {
          const debatesWithMetrics = await Promise.all(
            debates.map(async (d) => {
              const metrics = await getDebateMetrics(d.id);
              return { debate: d, complexity: metrics?.debateComplexity };
            })
          );
          debates = debatesWithMetrics
            .filter((dm) => dm.complexity === input.complexity)
            .map((dm) => dm.debate);
        }

        return debates;
      }),

    // Get debate messages/transcript
    getMessages: protectedProcedure
      .input(z.object({ debateId: z.number() }))
      .query(async ({ input, ctx }) => {
        const debate = await getDebateById(input.debateId);

        if (!debate || debate.userId !== ctx.user.id) {
          throw new Error("Debate not found or access denied");
        }

        return await getDebateMessages(input.debateId);
      }),

    // Get debate metrics
    getMetrics: protectedProcedure
      .input(z.object({ debateId: z.number() }))
      .query(async ({ input, ctx }) => {
        const debate = await getDebateById(input.debateId);

        if (!debate || debate.userId !== ctx.user.id) {
          throw new Error("Debate not found or access denied");
        }

        return await getDebateMetrics(input.debateId);
      }),

    // Get user debate settings
    getSettings: protectedProcedure.query(async ({ ctx }) => {
      return await getUserDebateSettings(ctx.user.id);
    }),

    // Update user debate settings
    updateSettings: protectedProcedure
      .input(
        z.object({
          defaultNumberOfRounds: z.number().int().min(1).max(5).optional(),
          enableEmailNotifications: z.boolean().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        await createOrUpdateDebateSettings(ctx.user.id, input);
        return { success: true };
      }),

    // Compare two debates side-by-side
    compare: protectedProcedure
      .input(
        z.object({
          debateId1: z.number(),
          debateId2: z.number(),
        })
      )
      .query(async ({ input, ctx }) => {
        const debate1 = await getDebateById(input.debateId1);
        const debate2 = await getDebateById(input.debateId2);

        // Verify user owns both debates
        if (
          !debate1 ||
          !debate2 ||
          debate1.userId !== ctx.user.id ||
          debate2.userId !== ctx.user.id
        ) {
          throw new Error("Access denied or debates not found");
        }

        const messages1 = await getDebateMessages(input.debateId1);
        const messages2 = await getDebateMessages(input.debateId2);
        const metrics1 = await getDebateMetrics(input.debateId1);
        const metrics2 = await getDebateMetrics(input.debateId2);

        return {
          debate1: { ...debate1, messages: messages1, metrics: metrics1 },
          debate2: { ...debate2, messages: messages2, metrics: metrics2 },
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;
