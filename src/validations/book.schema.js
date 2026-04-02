import { z } from 'zod';

const titleSchema = z.string()
  .trim()
  .min(1, "Title must be provided for the search");

const googleIdSchema = z.string()
  .trim()
  .min(1, "GoogleId must be provided");

const validStatusMessage = "Invalid Reading Status provided. Must be WANT_TO_READ, READING, or COMPLETED";
const statusSchema = z.string()
  .trim()
  .refine(
    (value) => ['WANT_TO_READ', 'READING', 'COMPLETED'].includes(value),
    validStatusMessage
  );

const ratingSchema = z.coerce.number({
  invalid_type_error: "Rating must be a valid number"
})
  .int()
  .min(1, "Rating must be at least 1")
  .max(5, "Rating cannot be higher than 5");

const reviewSchema = z.string()
  .trim()
  .max(500, "Review is too long (max 500 characters)");

export const bookIdSchema = z.coerce.number({
  invalid_type_error: "Book ID must be a valid number"
}).int().positive("Book ID must be a positive integer");

export const searchBookSchema = z.object({
  query: z.object({
    title: titleSchema
  })
});

export const addBookSchema = z.object({
  body: z.object({
    googleId: googleIdSchema,
    status: statusSchema
  })
});

export const getBooksSchema = z.object({
  query: z.object({
    status: statusSchema.optional()
  })
});

export const getBookByIdSchema = z.object({
  params: z.object({
    id: bookIdSchema
  })
});

export const updateBookStatusSchema = z.object({
  params: z.object({
    id: bookIdSchema
  }),
  body: z.object({
    status: statusSchema
  })
});

export const deleteBookSchema = z.object({
  params: z.object({
    id: bookIdSchema
  })
});

export const updateReviewSchema = z.object({
  params: z.object({
    id: bookIdSchema
  }),
  body: z.object({
    rating: ratingSchema,
    review: reviewSchema.optional()
  })
});

export const getPaceSchema = z.object({
  params: z.object({
    id: bookIdSchema
  })
});
