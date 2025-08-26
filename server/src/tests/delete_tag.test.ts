import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tagsTable, blogPostsTable, blogPostTagsTable } from '../db/schema';
import { type DeleteItemInput } from '../schema';
import { deleteTag } from '../handlers/delete_tag';
import { eq } from 'drizzle-orm';

// Test input for deleting a tag
const testDeleteInput: DeleteItemInput = {
  id: 1
};

describe('deleteTag', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing tag', async () => {
    // Create a test tag first
    await db.insert(tagsTable).values({
      name: 'Test Tag',
      slug: 'test-tag'
    }).execute();

    const result = await deleteTag(testDeleteInput);

    // Verify success response
    expect(result.success).toBe(true);

    // Verify tag was actually deleted from database
    const tags = await db.select()
      .from(tagsTable)
      .where(eq(tagsTable.id, testDeleteInput.id))
      .execute();

    expect(tags).toHaveLength(0);
  });

  it('should delete tag associations with blog posts before deleting tag', async () => {
    // Create a test tag
    await db.insert(tagsTable).values({
      name: 'Test Tag',
      slug: 'test-tag'
    }).execute();

    // Create a test blog post
    const blogPost = await db.insert(blogPostsTable).values({
      title: 'Test Post',
      content: 'Test content',
      slug: 'test-post',
      author: 'Test Author'
    }).returning().execute();

    // Create association between blog post and tag
    await db.insert(blogPostTagsTable).values({
      blog_post_id: blogPost[0].id,
      tag_id: testDeleteInput.id
    }).execute();

    // Delete the tag
    const result = await deleteTag(testDeleteInput);

    expect(result.success).toBe(true);

    // Verify tag associations were deleted
    const associations = await db.select()
      .from(blogPostTagsTable)
      .where(eq(blogPostTagsTable.tag_id, testDeleteInput.id))
      .execute();

    expect(associations).toHaveLength(0);

    // Verify tag was deleted
    const tags = await db.select()
      .from(tagsTable)
      .where(eq(tagsTable.id, testDeleteInput.id))
      .execute();

    expect(tags).toHaveLength(0);
  });

  it('should throw error when trying to delete non-existent tag', async () => {
    const nonExistentInput: DeleteItemInput = { id: 999 };

    await expect(deleteTag(nonExistentInput))
      .rejects
      .toThrow(/Tag with id 999 not found/i);
  });

  it('should delete tag with multiple blog post associations', async () => {
    // Create a test tag
    await db.insert(tagsTable).values({
      name: 'Popular Tag',
      slug: 'popular-tag'
    }).execute();

    // Create multiple test blog posts
    const blogPost1 = await db.insert(blogPostsTable).values({
      title: 'Test Post 1',
      content: 'Test content 1',
      slug: 'test-post-1',
      author: 'Test Author'
    }).returning().execute();

    const blogPost2 = await db.insert(blogPostsTable).values({
      title: 'Test Post 2',
      content: 'Test content 2',
      slug: 'test-post-2',
      author: 'Test Author'
    }).returning().execute();

    // Create associations between blog posts and tag
    await db.insert(blogPostTagsTable).values([
      {
        blog_post_id: blogPost1[0].id,
        tag_id: testDeleteInput.id
      },
      {
        blog_post_id: blogPost2[0].id,
        tag_id: testDeleteInput.id
      }
    ]).execute();

    // Delete the tag
    const result = await deleteTag(testDeleteInput);

    expect(result.success).toBe(true);

    // Verify all tag associations were deleted
    const associations = await db.select()
      .from(blogPostTagsTable)
      .where(eq(blogPostTagsTable.tag_id, testDeleteInput.id))
      .execute();

    expect(associations).toHaveLength(0);

    // Verify tag was deleted
    const tags = await db.select()
      .from(tagsTable)
      .where(eq(tagsTable.id, testDeleteInput.id))
      .execute();

    expect(tags).toHaveLength(0);

    // Verify blog posts still exist (only associations were removed)
    const remainingPosts = await db.select()
      .from(blogPostsTable)
      .execute();

    expect(remainingPosts).toHaveLength(2);
  });
});