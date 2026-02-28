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
          }).catch((error) => {
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

    // Get all debates for the current user
    list: protectedProcedure.query(async ({ ctx }) => {
      return await getUserDebates(ctx.user.id);
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
  }),
});

export type AppRouter = typeof appRouter;
