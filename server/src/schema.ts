import { z } from 'zod';

// Category schema
export const categorySchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Category = z.infer<typeof categorySchema>;

// Tag schema
export const tagSchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  created_at: z.coerce.date()
});

export type Tag = z.infer<typeof tagSchema>;

// Blog post schema
export const blogPostSchema = z.object({
  id: z.number(),
  title: z.string(),
  content: z.string(),
  slug: z.string(),
  excerpt: z.string().nullable(),
  published: z.boolean(),
  publication_date: z.coerce.date().nullable(),
  category_id: z.number().nullable(),
  author: z.string(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type BlogPost = z.infer<typeof blogPostSchema>;

// Input schema for creating categories
export const createCategoryInputSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().nullable()
});

export type CreateCategoryInput = z.infer<typeof createCategoryInputSchema>;

// Input schema for updating categories
export const updateCategoryInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  description: z.string().nullable().optional()
});

export type UpdateCategoryInput = z.infer<typeof updateCategoryInputSchema>;

// Input schema for creating tags
export const createTagInputSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1)
});

export type CreateTagInput = z.infer<typeof createTagInputSchema>;

// Input schema for updating tags
export const updateTagInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional()
});

export type UpdateTagInput = z.infer<typeof updateTagInputSchema>;

// Input schema for creating blog posts
export const createBlogPostInputSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  slug: z.string().min(1),
  excerpt: z.string().nullable(),
  published: z.boolean().default(false),
  publication_date: z.coerce.date().nullable(),
  category_id: z.number().nullable(),
  author: z.string().min(1),
  tag_ids: z.array(z.number()).optional()
});

export type CreateBlogPostInput = z.infer<typeof createBlogPostInputSchema>;

// Input schema for updating blog posts
export const updateBlogPostInputSchema = z.object({
  id: z.number(),
  title: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  excerpt: z.string().nullable().optional(),
  published: z.boolean().optional(),
  publication_date: z.coerce.date().nullable().optional(),
  category_id: z.number().nullable().optional(),
  author: z.string().min(1).optional(),
  tag_ids: z.array(z.number()).optional()
});

export type UpdateBlogPostInput = z.infer<typeof updateBlogPostInputSchema>;

// Query schema for getting blog posts with filters
export const getBlogPostsInputSchema = z.object({
  published: z.boolean().optional(),
  category_id: z.number().optional(),
  tag_id: z.number().optional(),
  limit: z.number().int().positive().optional(),
  offset: z.number().int().nonnegative().optional()
});

export type GetBlogPostsInput = z.infer<typeof getBlogPostsInputSchema>;

// Schema for getting a single blog post
export const getBlogPostInputSchema = z.object({
  id: z.number().optional(),
  slug: z.string().optional()
}).refine(data => data.id !== undefined || data.slug !== undefined, {
  message: "Either id or slug must be provided"
});

export type GetBlogPostInput = z.infer<typeof getBlogPostInputSchema>;

// Schema for deleting items
export const deleteItemInputSchema = z.object({
  id: z.number()
});

export type DeleteItemInput = z.infer<typeof deleteItemInputSchema>;