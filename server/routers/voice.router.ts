/**
 * Voice Router
 * Voice interface for Ghost AI assistant
 */

import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { invokeLLM } from "../_core/llm";

export const voiceRouter = router({
  processQuery: protectedProcedure
    .input(
      z.object({
        audioData: z.string(), // Base64 encoded audio
      })
    )
    .mutation(async ({ ctx, input }) => {
      // For now, return a simulated response
      // In production, this would use speech-to-text API
      const transcription = "What is the network status?";

      // Generate response using LLM
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are Ghost, a helpful AI assistant from Destiny 2. You help Guardians monitor their network using ExtraHop. Respond in character as Ghost - helpful, slightly witty, and knowledgeable. Keep responses brief and actionable.`,
          },
          {
            role: "user",
            content: transcription,
          },
        ],
      });

      const ghostResponse =
        response.choices?.[0]?.message?.content ||
        "Guardian, I'm having trouble processing that request. Please try again.";

      return {
        transcription,
        response: ghostResponse,
      };
    }),
});
