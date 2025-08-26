import { db } from '../db';
import { blogPostsTable, blogPostTagsTable } from '../db/schema';
import { type UpdateBlogPostInput, type BlogPost } from '../schema';
import { eq, and } from 'drizzle-orm';

export const updateBlogPost = async (input: UpdateBlogPostInput): Promise<BlogPost> => {
  try {
    // First, check if the blog post exists
    const existingPost = await db.select()
      .from(blogPostsTable)
      .where(eq(blogPostsTable.id, input.id))
      .execute();

    if (existingPost.length === 0) {
      throw new Error(`Blog post with id ${input.id} not found`);
    }

    // Build update object excluding id and tag_ids
    const updateData: any = {
      updated_at: new Date()
    };

    if (input.title !== undefined) {
      updateData.title = input.title;
    }
    if (input.content !== undefined) {
      updateData.content = input.content;
    }
    if (input.slug !== undefined) {
      updateData.slug = input.slug;
    }
    if (input.excerpt !== undefined) {
      updateData.excerpt = input.excerpt;
    }
    if (input.published !== undefined) {
      updateData.published = input.published;
    }
    if (input.publication_date !== undefined) {
      updateData.publication_date = input.publication_date;
    }
    if (input.category_id !== undefined) {
      updateData.category_id = input.category_id;
    }
    if (input.author !== undefined) {
      updateData.author = input.author;
    }

    // Update the blog post
    const result = await db.update(blogPostsTable)
      .set(updateData)
      .where(eq(blogPostsTable.id, input.id))
      .returning()
      .execute();

    // Handle tag relationships if tag_ids are provided
    if (input.tag_ids !== undefined) {
      // Delete existing tag relationships
      await db.delete(blogPostTagsTable)
        .where(eq(blogPostTagsTable.blog_post_id, input.id))
        .execute();

      // Insert new tag relationships
      if (input.tag_ids.length > 0) {
        const tagRelations = input.tag_ids.map(tagId => ({
          blog_post_id: input.id,
          tag_id: tagId
        }));

        await db.insert(blogPostTagsTable)
          .values(tagRelations)
          .execute();
      }
    }

    return result[0];
  } catch (error) {
    console.error('Blog post update failed:', error);
    throw error;
  }
};