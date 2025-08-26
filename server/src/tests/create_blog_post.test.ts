import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { blogPostsTable, blogPostTagsTable, categoriesTable, tagsTable } from '../db/schema';
import { type CreateBlogPostInput } from '../schema';
import { createBlogPost } from '../handlers/create_blog_post';
import { eq } from 'drizzle-orm';

// Test input without tags
const basicTestInput: CreateBlogPostInput = {
  title: 'Test Blog Post',
  content: 'This is a test blog post content',
  slug: 'test-blog-post',
  excerpt: 'Test excerpt',
  published: true,
  publication_date: new Date('2024-01-01'),
  category_id: null,
  author: 'Test Author'
};

describe('createBlogPost', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a basic blog post without category or tags', async () => {
    const result = await createBlogPost(basicTestInput);

    // Basic field validation
    expect(result.title).toEqual('Test Blog Post');
    expect(result.content).toEqual(basicTestInput.content);
    expect(result.slug).toEqual('test-blog-post');
    expect(result.excerpt).toEqual('Test excerpt');
    expect(result.published).toEqual(true);
    expect(result.publication_date).toEqual(basicTestInput.publication_date);
    expect(result.category_id).toEqual(null);
    expect(result.author).toEqual('Test Author');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save blog post to database', async () => {
    const result = await createBlogPost(basicTestInput);

    // Query using proper drizzle syntax
    const blogPosts = await db.select()
      .from(blogPostsTable)
      .where(eq(blogPostsTable.id, result.id))
      .execute();

    expect(blogPosts).toHaveLength(1);
    expect(blogPosts[0].title).toEqual('Test Blog Post');
    expect(blogPosts[0].content).toEqual(basicTestInput.content);
    expect(blogPosts[0].slug).toEqual('test-blog-post');
    expect(blogPosts[0].published).toEqual(true);
    expect(blogPosts[0].created_at).toBeInstanceOf(Date);
    expect(blogPosts[0].updated_at).toBeInstanceOf(Date);
  });

  it('should create blog post with valid category', async () => {
    // Create a test category first
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        slug: 'test-category',
        description: 'A test category'
      })
      .returning()
      .execute();

    const testCategory = categoryResult[0];

    const inputWithCategory: CreateBlogPostInput = {
      ...basicTestInput,
      category_id: testCategory.id
    };

    const result = await createBlogPost(inputWithCategory);

    expect(result.category_id).toEqual(testCategory.id);

    // Verify in database
    const blogPost = await db.select()
      .from(blogPostsTable)
      .where(eq(blogPostsTable.id, result.id))
      .execute();

    expect(blogPost[0].category_id).toEqual(testCategory.id);
  });

  it('should create blog post with tags', async () => {
    // Create test tags first
    const tag1Result = await db.insert(tagsTable)
      .values({
        name: 'Tag 1',
        slug: 'tag-1'
      })
      .returning()
      .execute();

    const tag2Result = await db.insert(tagsTable)
      .values({
        name: 'Tag 2',
        slug: 'tag-2'
      })
      .returning()
      .execute();

    const tag1 = tag1Result[0];
    const tag2 = tag2Result[0];

    const inputWithTags: CreateBlogPostInput = {
      ...basicTestInput,
      tag_ids: [tag1.id, tag2.id]
    };

    const result = await createBlogPost(inputWithTags);

    expect(result.id).toBeDefined();

    // Verify tag associations in database
    const tagAssociations = await db.select()
      .from(blogPostTagsTable)
      .where(eq(blogPostTagsTable.blog_post_id, result.id))
      .execute();

    expect(tagAssociations).toHaveLength(2);
    const associatedTagIds = tagAssociations.map(assoc => assoc.tag_id).sort();
    expect(associatedTagIds).toEqual([tag1.id, tag2.id].sort());
  });

  it('should create blog post with category and tags', async () => {
    // Create test category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Tech Category',
        slug: 'tech-category',
        description: 'Technology posts'
      })
      .returning()
      .execute();

    // Create test tags
    const tag1Result = await db.insert(tagsTable)
      .values({
        name: 'JavaScript',
        slug: 'javascript'
      })
      .returning()
      .execute();

    const tag2Result = await db.insert(tagsTable)
      .values({
        name: 'Programming',
        slug: 'programming'
      })
      .returning()
      .execute();

    const category = categoryResult[0];
    const tag1 = tag1Result[0];
    const tag2 = tag2Result[0];

    const inputWithCategoryAndTags: CreateBlogPostInput = {
      ...basicTestInput,
      category_id: category.id,
      tag_ids: [tag1.id, tag2.id]
    };

    const result = await createBlogPost(inputWithCategoryAndTags);

    expect(result.category_id).toEqual(category.id);

    // Verify both category and tag associations
    const blogPost = await db.select()
      .from(blogPostsTable)
      .where(eq(blogPostsTable.id, result.id))
      .execute();

    expect(blogPost[0].category_id).toEqual(category.id);

    const tagAssociations = await db.select()
      .from(blogPostTagsTable)
      .where(eq(blogPostTagsTable.blog_post_id, result.id))
      .execute();

    expect(tagAssociations).toHaveLength(2);
  });

  it('should handle blog post with minimal required fields', async () => {
    const minimalInput: CreateBlogPostInput = {
      title: 'Minimal Post',
      content: 'Minimal content',
      slug: 'minimal-post',
      excerpt: null,
      published: false, // This will use the Zod default
      publication_date: null,
      category_id: null,
      author: 'Author Name'
    };

    const result = await createBlogPost(minimalInput);

    expect(result.title).toEqual('Minimal Post');
    expect(result.excerpt).toEqual(null);
    expect(result.published).toEqual(false);
    expect(result.publication_date).toEqual(null);
    expect(result.category_id).toEqual(null);
  });

  it('should throw error for non-existent category', async () => {
    const inputWithInvalidCategory: CreateBlogPostInput = {
      ...basicTestInput,
      category_id: 999 // Non-existent category
    };

    await expect(createBlogPost(inputWithInvalidCategory))
      .rejects.toThrow(/category with id 999 does not exist/i);
  });

  it('should throw error for non-existent tags', async () => {
    // Create one valid tag
    const validTagResult = await db.insert(tagsTable)
      .values({
        name: 'Valid Tag',
        slug: 'valid-tag'
      })
      .returning()
      .execute();

    const validTag = validTagResult[0];

    const inputWithInvalidTags: CreateBlogPostInput = {
      ...basicTestInput,
      tag_ids: [validTag.id, 999, 888] // Mix of valid and invalid tag IDs
    };

    await expect(createBlogPost(inputWithInvalidTags))
      .rejects.toThrow(/tags with ids 999, 888 do not exist/i);
  });

  it('should throw error for single non-existent tag', async () => {
    const inputWithInvalidTag: CreateBlogPostInput = {
      ...basicTestInput,
      tag_ids: [999] // Single non-existent tag
    };

    await expect(createBlogPost(inputWithInvalidTag))
      .rejects.toThrow(/tags with ids 999 do not exist/i);
  });

  it('should handle empty tag_ids array', async () => {
    const inputWithEmptyTags: CreateBlogPostInput = {
      ...basicTestInput,
      tag_ids: []
    };

    const result = await createBlogPost(inputWithEmptyTags);

    expect(result.id).toBeDefined();

    // Verify no tag associations were created
    const tagAssociations = await db.select()
      .from(blogPostTagsTable)
      .where(eq(blogPostTagsTable.blog_post_id, result.id))
      .execute();

    expect(tagAssociations).toHaveLength(0);
  });
});