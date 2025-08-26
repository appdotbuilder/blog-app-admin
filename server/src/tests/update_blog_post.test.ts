import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { blogPostsTable, categoriesTable, tagsTable, blogPostTagsTable } from '../db/schema';
import { type UpdateBlogPostInput } from '../schema';
import { updateBlogPost } from '../handlers/update_blog_post';
import { eq } from 'drizzle-orm';

// Test data setup
const setupTestData = async () => {
  // Create test category
  const [category] = await db.insert(categoriesTable)
    .values({
      name: 'Technology',
      slug: 'technology',
      description: 'Tech articles'
    })
    .returning()
    .execute();

  // Create test tags
  const [tag1] = await db.insert(tagsTable)
    .values({
      name: 'JavaScript',
      slug: 'javascript'
    })
    .returning()
    .execute();

  const [tag2] = await db.insert(tagsTable)
    .values({
      name: 'TypeScript',
      slug: 'typescript'
    })
    .returning()
    .execute();

  const [tag3] = await db.insert(tagsTable)
    .values({
      name: 'React',
      slug: 'react'
    })
    .returning()
    .execute();

  // Create test blog post
  const [blogPost] = await db.insert(blogPostsTable)
    .values({
      title: 'Original Post',
      content: 'Original content',
      slug: 'original-post',
      excerpt: 'Original excerpt',
      published: false,
      publication_date: null,
      category_id: category.id,
      author: 'Original Author'
    })
    .returning()
    .execute();

  // Create initial tag relationships
  await db.insert(blogPostTagsTable)
    .values([
      { blog_post_id: blogPost.id, tag_id: tag1.id }
    ])
    .execute();

  return { category, tags: [tag1, tag2, tag3], blogPost };
};

describe('updateBlogPost', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update basic blog post fields', async () => {
    const { blogPost } = await setupTestData();

    const updateInput: UpdateBlogPostInput = {
      id: blogPost.id,
      title: 'Updated Title',
      content: 'Updated content',
      author: 'Updated Author',
      published: true
    };

    const result = await updateBlogPost(updateInput);

    expect(result.id).toEqual(blogPost.id);
    expect(result.title).toEqual('Updated Title');
    expect(result.content).toEqual('Updated content');
    expect(result.author).toEqual('Updated Author');
    expect(result.published).toEqual(true);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > blogPost.updated_at).toBe(true);

    // Verify unchanged fields remain the same
    expect(result.slug).toEqual(blogPost.slug);
    expect(result.excerpt).toEqual(blogPost.excerpt);
    expect(result.category_id).toEqual(blogPost.category_id);
  });

  it('should update nullable fields correctly', async () => {
    const { blogPost } = await setupTestData();

    const updateInput: UpdateBlogPostInput = {
      id: blogPost.id,
      excerpt: null,
      publication_date: new Date('2023-12-25'),
      category_id: null
    };

    const result = await updateBlogPost(updateInput);

    expect(result.excerpt).toBeNull();
    expect(result.publication_date).toEqual(new Date('2023-12-25'));
    expect(result.category_id).toBeNull();
  });

  it('should update tag relationships when tag_ids provided', async () => {
    const { blogPost, tags } = await setupTestData();

    const updateInput: UpdateBlogPostInput = {
      id: blogPost.id,
      tag_ids: [tags[1].id, tags[2].id] // tag2 and tag3
    };

    await updateBlogPost(updateInput);

    // Verify tag relationships in database
    const tagRelations = await db.select()
      .from(blogPostTagsTable)
      .where(eq(blogPostTagsTable.blog_post_id, blogPost.id))
      .execute();

    expect(tagRelations).toHaveLength(2);
    expect(tagRelations.map(r => r.tag_id).sort()).toEqual([tags[1].id, tags[2].id].sort());
  });

  it('should clear all tag relationships when empty tag_ids provided', async () => {
    const { blogPost } = await setupTestData();

    const updateInput: UpdateBlogPostInput = {
      id: blogPost.id,
      tag_ids: []
    };

    await updateBlogPost(updateInput);

    // Verify no tag relationships remain
    const tagRelations = await db.select()
      .from(blogPostTagsTable)
      .where(eq(blogPostTagsTable.blog_post_id, blogPost.id))
      .execute();

    expect(tagRelations).toHaveLength(0);
  });

  it('should not modify tags when tag_ids not provided', async () => {
    const { blogPost } = await setupTestData();

    const updateInput: UpdateBlogPostInput = {
      id: blogPost.id,
      title: 'Updated without tags'
    };

    await updateBlogPost(updateInput);

    // Verify original tag relationships remain
    const tagRelations = await db.select()
      .from(blogPostTagsTable)
      .where(eq(blogPostTagsTable.blog_post_id, blogPost.id))
      .execute();

    expect(tagRelations).toHaveLength(1); // Original tag relationship should remain
  });

  it('should save changes to database', async () => {
    const { blogPost, tags } = await setupTestData();

    const updateInput: UpdateBlogPostInput = {
      id: blogPost.id,
      title: 'Database Update Test',
      published: true,
      tag_ids: [tags[0].id, tags[1].id, tags[2].id]
    };

    await updateBlogPost(updateInput);

    // Query database directly to verify changes
    const updatedPost = await db.select()
      .from(blogPostsTable)
      .where(eq(blogPostsTable.id, blogPost.id))
      .execute();

    expect(updatedPost).toHaveLength(1);
    expect(updatedPost[0].title).toEqual('Database Update Test');
    expect(updatedPost[0].published).toEqual(true);
    expect(updatedPost[0].updated_at > blogPost.updated_at).toBe(true);

    // Verify tag relationships in database
    const tagRelations = await db.select()
      .from(blogPostTagsTable)
      .where(eq(blogPostTagsTable.blog_post_id, blogPost.id))
      .execute();

    expect(tagRelations).toHaveLength(3);
    expect(tagRelations.map(r => r.tag_id).sort()).toEqual([tags[0].id, tags[1].id, tags[2].id].sort());
  });

  it('should throw error when blog post does not exist', async () => {
    await setupTestData();

    const updateInput: UpdateBlogPostInput = {
      id: 99999, // Non-existent ID
      title: 'Should fail'
    };

    await expect(updateBlogPost(updateInput)).rejects.toThrow(/not found/i);
  });

  it('should handle partial updates correctly', async () => {
    const { blogPost } = await setupTestData();

    const updateInput: UpdateBlogPostInput = {
      id: blogPost.id,
      published: true // Only update published status
    };

    const result = await updateBlogPost(updateInput);

    // Verify only published and updated_at changed
    expect(result.published).toEqual(true);
    expect(result.updated_at > blogPost.updated_at).toBe(true);

    // Verify all other fields remain unchanged
    expect(result.title).toEqual(blogPost.title);
    expect(result.content).toEqual(blogPost.content);
    expect(result.slug).toEqual(blogPost.slug);
    expect(result.excerpt).toEqual(blogPost.excerpt);
    expect(result.author).toEqual(blogPost.author);
    expect(result.category_id).toEqual(blogPost.category_id);
  });

  it('should handle complex update with all fields', async () => {
    const { blogPost, tags, category } = await setupTestData();

    const newDate = new Date('2024-01-15');
    const updateInput: UpdateBlogPostInput = {
      id: blogPost.id,
      title: 'Comprehensive Update',
      content: 'New comprehensive content',
      slug: 'comprehensive-update',
      excerpt: 'New excerpt',
      published: true,
      publication_date: newDate,
      category_id: category.id,
      author: 'New Author',
      tag_ids: [tags[1].id, tags[2].id]
    };

    const result = await updateBlogPost(updateInput);

    // Verify all fields updated correctly
    expect(result.title).toEqual('Comprehensive Update');
    expect(result.content).toEqual('New comprehensive content');
    expect(result.slug).toEqual('comprehensive-update');
    expect(result.excerpt).toEqual('New excerpt');
    expect(result.published).toEqual(true);
    expect(result.publication_date).toEqual(newDate);
    expect(result.category_id).toEqual(category.id);
    expect(result.author).toEqual('New Author');
    expect(result.updated_at).toBeInstanceOf(Date);

    // Verify tag relationships
    const tagRelations = await db.select()
      .from(blogPostTagsTable)
      .where(eq(blogPostTagsTable.blog_post_id, blogPost.id))
      .execute();

    expect(tagRelations).toHaveLength(2);
    expect(tagRelations.map(r => r.tag_id).sort()).toEqual([tags[1].id, tags[2].id].sort());
  });
});