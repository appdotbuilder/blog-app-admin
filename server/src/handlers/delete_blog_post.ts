import { db } from '../db';
import { blogPostsTable, blogPostTagsTable } from '../db/schema';
import { type DeleteItemInput } from '../schema';
import { eq } from 'drizzle-orm';

export async function deleteBlogPost(input: DeleteItemInput): Promise<{ success: boolean }> {
  try {
    // First, delete the many-to-many relationships with tags
    await db.delete(blogPostTagsTable)
      .where(eq(blogPostTagsTable.blog_post_id, input.id))
      .execute();

    // Then delete the blog post itself
    const result = await db.delete(blogPostsTable)
      .where(eq(blogPostsTable.id, input.id))
      .returning()
      .execute();

    // Return success status based on whether a row was deleted
    return { success: result.length > 0 };
  } catch (error) {
    console.error('Blog post deletion failed:', error);
    throw error;
  }
}