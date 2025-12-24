/**
 * Lore Router
 * Destiny 2 lore chatbot and search endpoints
 */

import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";
import * as db from "../db";
import { invokeLLM } from "../_core/llm";
import { searchLore, destinyLore, loreCategories } from "../lore-data";

export const loreRouter = router({
  // Chat with the lore bot
  chat: protectedProcedure
    .input(
      z.object({
        message: z.string().min(1),
        sessionId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const sessionId = input.sessionId || nanoid();

      // Save user message
      await db.createChatMessage({
        userId: ctx.user.id,
        sessionId,
        role: "user",
        content: input.message,
      });

      // Get chat history for context
      const history = await db.getChatHistory(ctx.user.id, sessionId, 10);

      // Search for relevant lore using the comprehensive lore database
      const loreResults = searchLore(input.message, 5);

      // Build context from lore
      const loreContext =
        loreResults.length > 0
          ? `Relevant Destiny 2 Lore:\n${loreResults
              .map(
                (l) =>
                  `[${l.category}] ${l.title}: ${l.content.substring(0, 500)}...`
              )
              .join("\n\n")}`
          : "";

      // Build messages for LLM
      const messages = [
        {
          role: "system" as const,
          content: `You are a Ghost, the AI companion of Guardians in Destiny 2. You have extensive knowledge of Destiny and Destiny 2 lore, including the Books of Sorrow, the history of the Traveler, the Darkness, the Vanguard, and all major characters and events.

Your personality:
- Helpful and knowledgeable, like a wise companion
- Occasionally make references to in-game events and characters
- Use Destiny terminology naturally (Guardians, Light, Darkness, Traveler, etc.)
- Be enthusiastic about sharing lore knowledge
- If you don't know something, admit it but offer to explore related topics

${loreContext}

Respond to the Guardian's question about Destiny lore.`,
        },
        ...history.reverse().map((h) => ({
          role: h.role as "user" | "assistant",
          content: h.content,
        })),
        { role: "user" as const, content: input.message },
      ];

      try {
        const response = await invokeLLM({ messages });
        const messageContent = response.choices[0]?.message?.content;
        const assistantMessage =
          typeof messageContent === "string"
            ? messageContent
            : "I'm having trouble accessing my memory banks, Guardian. Please try again.";

        // Save assistant response
        await db.createChatMessage({
          userId: ctx.user.id,
          sessionId,
          role: "assistant",
          content: assistantMessage,
        });

        return {
          message: assistantMessage,
          sessionId,
          sources: loreResults.map((l) => ({
            title: l.title,
            category: l.category,
          })),
        };
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to generate response",
        });
      }
    }),

  // Get chat history
  getHistory: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ ctx, input }) => {
      const history = await db.getChatHistory(ctx.user.id, input.sessionId, 50);
      return history.reverse();
    }),

  // Get lore categories
  getCategories: publicProcedure.query(async () => {
    const categories = await db.getLoreCategories();
    return categories.length > 0
      ? categories
      : [
          "Books of Sorrow",
          "The Nine",
          "Guardians",
          "The Traveler",
          "The Darkness",
          "Vanguard",
          "Fallen Houses",
          "Hive",
          "Cabal",
          "Vex",
          "Taken",
          "Awoken",
          "Exo",
          "Golden Age",
          "The Collapse",
        ];
  }),

  // Search lore
  searchLore: publicProcedure
    .input(
      z.object({
        query: z.string().min(1),
        category: z.string().optional(),
        limit: z.number().optional().default(10),
      })
    )
    .query(({ input }) => {
      return searchLore(input.query, input.limit);
    }),

  // Get all lore categories
  getAllCategories: publicProcedure.query(() => loreCategories),

  // Get all lore entries
  getAllLore: publicProcedure.query(() => destinyLore),
});
