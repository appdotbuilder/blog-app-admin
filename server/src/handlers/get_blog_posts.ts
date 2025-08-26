import { db } from '../db';
import { blogPostsTable, blogPostTagsTable } from '../db/schema';
import { type GetBlogPostsInput, type BlogPost } from '../schema';
import { eq, and, desc, type SQL } from 'drizzle-orm';

export async function getBlogPosts(input?: GetBlogPostsInput): Promise<BlogPost[]> {
  try {
    // Collect conditions for filtering
    const conditions: SQL<unknown>[] = [];
    let needsTagJoin = false;

    if (input) {
      // Filter by published status
      if (input.published !== undefined) {
        conditions.push(eq(blogPostsTable.published, input.published));
      }

      // Filter by category_id
      if (input.category_id !== undefined) {
        conditions.push(eq(blogPostsTable.category_id, input.category_id));
      }

      // Filter by tag_id (requires a join with blog_post_tags)
      if (input.tag_id !== undefined) {
        conditions.push(eq(blogPostTagsTable.tag_id, input.tag_id));
        needsTagJoin = true;
      }
    }

    // Build the query based on whether we need a join or not
    let query;
    if (needsTagJoin) {
      query = db.select()
        .from(blogPostsTable)
        .innerJoin(
          blogPostTagsTable,
          eq(blogPostsTable.id, blogPostTagsTable.blog_post_id)
        );
    } else {
      query = db.select().from(blogPostsTable);
    }

    // Apply conditions if any exist
    if (conditions.length > 0) {
      query = query.where(conditions.length === 1 ? conditions[0] : and(...conditions));
    }

    // Order by creation date (newest first)
    query = query.orderBy(desc(blogPostsTable.created_at));

    // Apply pagination if input is provided
    if (input) {
      const limit = input.limit ?? 50; // Default limit
      const offset = input.offset ?? 0; // Default offset
      query = query.limit(limit).offset(offset);
    }

    const results = await query.execute();

    // Handle the different result structures based on whether we joined
    return results.map(result => {
      // If we joined with tags, the result structure is nested
      const blogPostData = needsTagJoin 
        ? (result as any).blog_posts 
        : result;

      return blogPostData as BlogPost;
    });
  } catch (error) {
    console.error('Get blog posts failed:', error);
    throw error;
  }
}