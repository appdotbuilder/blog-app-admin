import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { blogPostsTable, blogPostTagsTable, categoriesTable, tagsTable } from '../db/schema';
import { type DeleteItemInput } from '../schema';
import { deleteBlogPost } from '../handlers/delete_blog_post';
import { eq } from 'drizzle-orm';

describe('deleteBlogPost', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a blog post without tags', async () => {
    // Create a category first
    const [category] = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        slug: 'test-category',
        description: 'Test description'
      })
      .returning()
      .execute();

    // Create a blog post
    const [blogPost] = await db.insert(blogPostsTable)
      .values({
        title: 'Test Post',
        content: 'Test content',
        slug: 'test-post',
        excerpt: 'Test excerpt',
        published: true,
        publication_date: new Date(),
        category_id: category.id,
        author: 'Test Author'
      })
      .returning()
      .execute();

    const input: DeleteItemInput = { id: blogPost.id };
    const result = await deleteBlogPost(input);

    expect(result.success).toBe(true);

    // Verify the blog post was deleted
    const remainingPosts = await db.select()
      .from(blogPostsTable)
      .where(eq(blogPostsTable.id, blogPost.id))
      .execute();

    expect(remainingPosts).toHaveLength(0);
  });

  it('should delete a blog post and its tag associations', async () => {
    // Create a category
    const [category] = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        slug: 'test-category',
        description: 'Test description'
      })
      .returning()
      .execute();

    // Create tags
    const [tag1] = await db.insert(tagsTable)
      .values({
        name: 'Tag 1',
        slug: 'tag-1'
      })
      .returning()
      .execute();

    const [tag2] = await db.insert(tagsTable)
      .values({
        name: 'Tag 2',
        slug: 'tag-2'
      })
      .returning()
      .execute();

    // Create a blog post
    const [blogPost] = await db.insert(blogPostsTable)
      .values({
        title: 'Test Post',
        content: 'Test content',
        slug: 'test-post',
        excerpt: 'Test excerpt',
        published: true,
        publication_date: new Date(),
        category_id: category.id,
        author: 'Test Author'
      })
      .returning()
      .execute();

    // Create tag associations
    await db.insert(blogPostTagsTable)
      .values([
        { blog_post_id: blogPost.id, tag_id: tag1.id },
        { blog_post_id: blogPost.id, tag_id: tag2.id }
      ])
      .execute();

    // Verify associations exist before deletion
    const associationsBefore = await db.select()
      .from(blogPostTagsTable)
      .where(eq(blogPostTagsTable.blog_post_id, blogPost.id))
      .execute();
    expect(associationsBefore).toHaveLength(2);

    const input: DeleteItemInput = { id: blogPost.id };
    const result = await deleteBlogPost(input);

    expect(result.success).toBe(true);

    // Verify the blog post was deleted
    const remainingPosts = await db.select()
      .from(blogPostsTable)
      .where(eq(blogPostsTable.id, blogPost.id))
      .execute();
    expect(remainingPosts).toHaveLength(0);

    // Verify tag associations were deleted
    const associationsAfter = await db.select()
      .from(blogPostTagsTable)
      .where(eq(blogPostTagsTable.blog_post_id, blogPost.id))
      .execute();
    expect(associationsAfter).toHaveLength(0);

    // Verify tags themselves still exist
    const remainingTags = await db.select()
      .from(tagsTable)
      .execute();
    expect(remainingTags).toHaveLength(2);
  });

  it('should return false when trying to delete non-existent blog post', async () => {
    const input: DeleteItemInput = { id: 999 };
    const result = await deleteBlogPost(input);

    expect(result.success).toBe(false);
  });

  it('should not affect other blog posts when deleting one', async () => {
    // Create a category
    const [category] = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        slug: 'test-category',
        description: 'Test description'
      })
      .returning()
      .execute();

    // Create two blog posts
    const [blogPost1] = await db.insert(blogPostsTable)
      .values({
        title: 'Test Post 1',
        content: 'Test content 1',
        slug: 'test-post-1',
        excerpt: 'Test excerpt 1',
        published: true,
        publication_date: new Date(),
        category_id: category.id,
        author: 'Test Author'
      })
      .returning()
      .execute();

    const [blogPost2] = await db.insert(blogPostsTable)
      .values({
        title: 'Test Post 2',
        content: 'Test content 2',
        slug: 'test-post-2',
        excerpt: 'Test excerpt 2',
        published: false,
        publication_date: null,
        category_id: category.id,
        author: 'Another Author'
      })
      .returning()
      .execute();

    // Delete first blog post
    const input: DeleteItemInput = { id: blogPost1.id };
    const result = await deleteBlogPost(input);

    expect(result.success).toBe(true);

    // Verify first post is deleted
    const deletedPost = await db.select()
      .from(blogPostsTable)
      .where(eq(blogPostsTable.id, blogPost1.id))
      .execute();
    expect(deletedPost).toHaveLength(0);

    // Verify second post still exists
    const remainingPost = await db.select()
      .from(blogPostsTable)
      .where(eq(blogPostsTable.id, blogPost2.id))
      .execute();
    expect(remainingPost).toHaveLength(1);
    expect(remainingPost[0].title).toBe('Test Post 2');
  });

  it('should handle deletion when blog post has no category', async () => {
    // Create a blog post without a category
    const [blogPost] = await db.insert(blogPostsTable)
      .values({
        title: 'Test Post No Category',
        content: 'Test content',
        slug: 'test-post-no-category',
        excerpt: null,
        published: false,
        publication_date: null,
        category_id: null,
        author: 'Test Author'
      })
      .returning()
      .execute();

    const input: DeleteItemInput = { id: blogPost.id };
    const result = await deleteBlogPost(input);

    expect(result.success).toBe(true);

    // Verify the blog post was deleted
    const remainingPosts = await db.select()
      .from(blogPostsTable)
      .where(eq(blogPostsTable.id, blogPost.id))
      .execute();
    expect(remainingPosts).toHaveLength(0);
  });
});