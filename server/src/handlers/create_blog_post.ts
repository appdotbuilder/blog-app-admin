import { db } from '../db';
import { blogPostsTable, blogPostTagsTable, categoriesTable, tagsTable } from '../db/schema';
import { type CreateBlogPostInput, type BlogPost } from '../schema';
import { eq, inArray } from 'drizzle-orm';

export const createBlogPost = async (input: CreateBlogPostInput): Promise<BlogPost> => {
  try {
    // Verify category exists if provided
    if (input.category_id) {
      const categoryExists = await db.select()
        .from(categoriesTable)
        .where(eq(categoriesTable.id, input.category_id))
        .limit(1)
        .execute();
      
      if (categoryExists.length === 0) {
        throw new Error(`Category with id ${input.category_id} does not exist`);
      }
    }

    // Verify all tags exist if provided
    if (input.tag_ids && input.tag_ids.length > 0) {
      const existingTags = await db.select()
        .from(tagsTable)
        .where(inArray(tagsTable.id, input.tag_ids))
        .execute();
      
      if (existingTags.length !== input.tag_ids.length) {
        const existingTagIds = existingTags.map(tag => tag.id);
        const missingTagIds = input.tag_ids.filter(id => !existingTagIds.includes(id));
        throw new Error(`Tags with ids ${missingTagIds.join(', ')} do not exist`);
      }
    }

    // Insert blog post
    const result = await db.insert(blogPostsTable)
      .values({
        title: input.title,
        content: input.content,
        slug: input.slug,
        excerpt: input.excerpt,
        published: input.published,
        publication_date: input.publication_date,
        category_id: input.category_id,
        author: input.author
      })
      .returning()
      .execute();

    const blogPost = result[0];

    // Handle tag associations if provided
    if (input.tag_ids && input.tag_ids.length > 0) {
      const tagAssociations = input.tag_ids.map(tag_id => ({
        blog_post_id: blogPost.id,
        tag_id: tag_id
      }));

      await db.insert(blogPostTagsTable)
        .values(tagAssociations)
        .execute();
    }

    return blogPost;
  } catch (error) {
    console.error('Blog post creation failed:', error);
    throw error;
  }
};