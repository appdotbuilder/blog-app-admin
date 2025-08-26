import { serial, text, pgTable, timestamp, boolean, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Categories table
export const categoriesTable = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'), // Nullable by default
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Tags table
export const tagsTable = pgTable('tags', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Blog posts table
export const blogPostsTable = pgTable('blog_posts', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  slug: text('slug').notNull().unique(),
  excerpt: text('excerpt'), // Nullable by default
  published: boolean('published').notNull().default(false),
  publication_date: timestamp('publication_date'), // Nullable by default
  category_id: integer('category_id'), // Nullable by default, foreign key
  author: text('author').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Junction table for many-to-many relationship between posts and tags
export const blogPostTagsTable = pgTable('blog_post_tags', {
  id: serial('id').primaryKey(),
  blog_post_id: integer('blog_post_id').notNull(),
  tag_id: integer('tag_id').notNull(),
});

// Define relations
export const categoriesRelations = relations(categoriesTable, ({ many }) => ({
  blogPosts: many(blogPostsTable),
}));

export const tagsRelations = relations(tagsTable, ({ many }) => ({
  blogPostTags: many(blogPostTagsTable),
}));

export const blogPostsRelations = relations(blogPostsTable, ({ one, many }) => ({
  category: one(categoriesTable, {
    fields: [blogPostsTable.category_id],
    references: [categoriesTable.id],
  }),
  blogPostTags: many(blogPostTagsTable),
}));

export const blogPostTagsRelations = relations(blogPostTagsTable, ({ one }) => ({
  blogPost: one(blogPostsTable, {
    fields: [blogPostTagsTable.blog_post_id],
    references: [blogPostsTable.id],
  }),
  tag: one(tagsTable, {
    fields: [blogPostTagsTable.tag_id],
    references: [tagsTable.id],
  }),
}));

// TypeScript types for the table schemas
export type Category = typeof categoriesTable.$inferSelect;
export type NewCategory = typeof categoriesTable.$inferInsert;

export type Tag = typeof tagsTable.$inferSelect;
export type NewTag = typeof tagsTable.$inferInsert;

export type BlogPost = typeof blogPostsTable.$inferSelect;
export type NewBlogPost = typeof blogPostsTable.$inferInsert;

export type BlogPostTag = typeof blogPostTagsTable.$inferSelect;
export type NewBlogPostTag = typeof blogPostTagsTable.$inferInsert;

// Export all tables and relations for proper query building
export const tables = {
  categories: categoriesTable,
  tags: tagsTable,
  blogPosts: blogPostsTable,
  blogPostTags: blogPostTagsTable
};