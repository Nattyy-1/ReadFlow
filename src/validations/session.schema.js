import { z } from 'zod';
import { bookIdSchema } from './book.schema.js';

const sessionIdSchema = z.coerce.number({
  invalid_type_error: "SessionId must be a valid number"
})
  .int()
  .positive("Session ID must be a positive integer");

const currentPageSchema = z.coerce.number({
  invalid_type_error: "Current page must be a valid number"
})
  .int()
  .min(0, "Current page cannot be negative");

export const startSessionSchema = z.object({
  body: z.object({
    bookId: bookIdSchema
  })
});

export const stopSessionSchema = z.object({
  body: z.object({
    sessionId: sessionIdSchema,
    currentPage: currentPageSchema
  })
});

export const getSessionsForBookSchema = z.object({
  params: z.object({
    bookId: bookIdSchema
  })
});
