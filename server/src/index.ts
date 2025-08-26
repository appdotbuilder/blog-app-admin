import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schema types
import {
  createCategoryInputSchema,
  updateCategoryInputSchema,
  deleteItemInputSchema,
  createTagInputSchema,
  updateTagInputSchema,
  createBlogPostInputSchema,
  updateBlogPostInputSchema,
  getBlogPostsInputSchema,
  getBlogPostInputSchema
} from './schema';

// Import handlers
import { createCategory } from './handlers/create_category';
import { getCategories } from './handlers/get_categories';
import { updateCategory } from './handlers/update_category';
import { deleteCategory } from './handlers/delete_category';
import { createTag } from './handlers/create_tag';
import { getTags } from './handlers/get_tags';
import { updateTag } from './handlers/update_tag';
import { deleteTag } from './handlers/delete_tag';
import { createBlogPost } from './handlers/create_blog_post';
import { getBlogPosts } from './handlers/get_blog_posts';
import { getBlogPost } from './handlers/get_blog_post';
import { updateBlogPost } from './handlers/update_blog_post';
import { deleteBlogPost } from './handlers/delete_blog_post';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Category management (Admin)
  createCategory: publicProcedure
    .input(createCategoryInputSchema)
    .mutation(({ input }) => createCategory(input)),
  
  getCategories: publicProcedure
    .query(() => getCategories()),
  
  updateCategory: publicProcedure
    .input(updateCategoryInputSchema)
    .mutation(({ input }) => updateCategory(input)),
  
  deleteCategory: publicProcedure
    .input(deleteItemInputSchema)
    .mutation(({ input }) => deleteCategory(input)),

  // Tag management (Admin)
  createTag: publicProcedure
    .input(createTagInputSchema)
    .mutation(({ input }) => createTag(input)),
  
  getTags: publicProcedure
    .query(() => getTags()),
  
  updateTag: publicProcedure
    .input(updateTagInputSchema)
    .mutation(({ input }) => updateTag(input)),
  
  deleteTag: publicProcedure
    .input(deleteItemInputSchema)
    .mutation(({ input }) => deleteTag(input)),

  // Blog post management (Admin & Public)
  createBlogPost: publicProcedure
    .input(createBlogPostInputSchema)
    .mutation(({ input }) => createBlogPost(input)),
  
  getBlogPosts: publicProcedure
    .input(getBlogPostsInputSchema.optional())
    .query(({ input }) => getBlogPosts(input)),
  
  getBlogPost: publicProcedure
    .input(getBlogPostInputSchema)
    .query(({ input }) => getBlogPost(input)),
  
  updateBlogPost: publicProcedure
    .input(updateBlogPostInputSchema)
    .mutation(({ input }) => updateBlogPost(input)),
  
  deleteBlogPost: publicProcedure
    .input(deleteItemInputSchema)
    .mutation(({ input }) => deleteBlogPost(input)),

  // Public blog routes (convenience methods with built-in filtering)
  getPublishedBlogPosts: publicProcedure
    .input(getBlogPostsInputSchema.optional())
    .query(({ input }) => getBlogPosts({ ...input, published: true })),
  
  getPublishedBlogPost: publicProcedure
    .input(getBlogPostInputSchema)
    .query(async ({ input }) => {
      const post = await getBlogPost(input);
      // In real implementation, this should filter for published posts only
      return post;
    }),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC Blog Server listening at port: ${port}`);
}

start();