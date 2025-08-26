import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { blogPostsTable, categoriesTable, tagsTable, blogPostTagsTable } from '../db/schema';
import { type GetBlogPostsInput } from '../schema';
import { getBlogPosts } from '../handlers/get_blog_posts';

// Test data setup
const testCategory = {
  name: 'Tech',
  slug: 'tech',
  description: 'Technology articles'
};

const testTag = {
  name: 'JavaScript',
  slug: 'javascript'
};

const testBlogPost1 = {
  title: 'First Post',
  content: 'Content of first post',
  slug: 'first-post',
  excerpt: 'First post excerpt',
  published: true,
  publication_date: new Date('2024-01-01'),
  author: 'John Doe'
};

const testBlogPost2 = {
  title: 'Second Post',
  content: 'Content of second post',
  slug: 'second-post',
  excerpt: null,
  published: false,
  publication_date: null,
  author: 'Jane Smith'
};

const testBlogPost3 = {
  title: 'Third Post',
  content: 'Content of third post',
  slug: 'third-post',
  excerpt: 'Third post excerpt',
  published: true,
  publication_date: new Date('2024-02-01'),
  author: 'Bob Wilson'
};

describe('getBlogPosts', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all blog posts when no input provided', async () => {
    // Create test category
    const categoryResult = await db.insert(categoriesTable)
      .values(testCategory)
      .returning()
      .execute();
    const categoryId = categoryResult[0].id;

    // Create test blog posts one by one to ensure different timestamps
    const firstPost = await db.insert(blogPostsTable)
      .values({ ...testBlogPost1, category_id: categoryId })
      .returning()
      .execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    const secondPost = await db.insert(blogPostsTable)
      .values({ ...testBlogPost2, category_id: categoryId })
      .returning()
      .execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    const thirdPost = await db.insert(blogPostsTable)
      .values({ ...testBlogPost3, category_id: categoryId })
      .returning()
      .execute();

    const result = await getBlogPosts();

    expect(result).toHaveLength(3);
    
    // Should be ordered by creation date (newest first)
    // The last created post should be first
    expect(result[0].title).toEqual('Third Post');
    expect(result[1].title).toEqual('Second Post');
    expect(result[2].title).toEqual('First Post');

    // Verify all fields are properly returned
    expect(result[0].id).toBeDefined();
    expect(result[0].author).toEqual('Bob Wilson');
    expect(result[0].published).toBe(true);
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
  });

  it('should filter by published status', async () => {
    // Create test category
    const categoryResult = await db.insert(categoriesTable)
      .values(testCategory)
      .returning()
      .execute();
    const categoryId = categoryResult[0].id;

    // Create test blog posts
    await db.insert(blogPostsTable)
      .values([
        { ...testBlogPost1, category_id: categoryId },
        { ...testBlogPost2, category_id: categoryId },
        { ...testBlogPost3, category_id: categoryId }
      ])
      .execute();

    const input: GetBlogPostsInput = {
      published: true
    };

    const result = await getBlogPosts(input);

    expect(result).toHaveLength(2);
    result.forEach(post => {
      expect(post.published).toBe(true);
    });

    // Test unpublished posts
    const unpublishedInput: GetBlogPostsInput = {
      published: false
    };

    const unpublishedResult = await getBlogPosts(unpublishedInput);

    expect(unpublishedResult).toHaveLength(1);
    expect(unpublishedResult[0].published).toBe(false);
    expect(unpublishedResult[0].title).toEqual('Second Post');
  });

  it('should filter by category_id', async () => {
    // Create test categories
    const category1Result = await db.insert(categoriesTable)
      .values(testCategory)
      .returning()
      .execute();
    const category1Id = category1Result[0].id;

    const category2Result = await db.insert(categoriesTable)
      .values({
        name: 'Design',
        slug: 'design',
        description: 'Design articles'
      })
      .returning()
      .execute();
    const category2Id = category2Result[0].id;

    // Create test blog posts in different categories
    await db.insert(blogPostsTable)
      .values([
        { ...testBlogPost1, category_id: category1Id },
        { ...testBlogPost2, category_id: category2Id },
        { ...testBlogPost3, category_id: category1Id }
      ])
      .execute();

    const input: GetBlogPostsInput = {
      category_id: category1Id
    };

    const result = await getBlogPosts(input);

    expect(result).toHaveLength(2);
    result.forEach(post => {
      expect(post.category_id).toEqual(category1Id);
    });
  });

  it('should filter by tag_id', async () => {
    // Create test category
    const categoryResult = await db.insert(categoriesTable)
      .values(testCategory)
      .returning()
      .execute();
    const categoryId = categoryResult[0].id;

    // Create test tag
    const tagResult = await db.insert(tagsTable)
      .values(testTag)
      .returning()
      .execute();
    const tagId = tagResult[0].id;

    // Create test blog posts one by one to ensure different timestamps
    const firstPost = await db.insert(blogPostsTable)
      .values({ ...testBlogPost1, category_id: categoryId })
      .returning()
      .execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    const secondPost = await db.insert(blogPostsTable)
      .values({ ...testBlogPost2, category_id: categoryId })
      .returning()
      .execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    const thirdPost = await db.insert(blogPostsTable)
      .values({ ...testBlogPost3, category_id: categoryId })
      .returning()
      .execute();

    // Associate first and third posts with the tag
    await db.insert(blogPostTagsTable)
      .values([
        { blog_post_id: firstPost[0].id, tag_id: tagId },
        { blog_post_id: thirdPost[0].id, tag_id: tagId }
      ])
      .execute();

    const input: GetBlogPostsInput = {
      tag_id: tagId
    };

    const result = await getBlogPosts(input);

    expect(result).toHaveLength(2);
    // Should be ordered by creation date (newest first)
    expect(result[0].title).toEqual('Third Post');
    expect(result[1].title).toEqual('First Post');
  });

  it('should support pagination', async () => {
    // Create test category
    const categoryResult = await db.insert(categoriesTable)
      .values(testCategory)
      .returning()
      .execute();
    const categoryId = categoryResult[0].id;

    // Create multiple test blog posts
    const posts = Array.from({ length: 5 }, (_, i) => ({
      title: `Post ${i + 1}`,
      content: `Content of post ${i + 1}`,
      slug: `post-${i + 1}`,
      excerpt: null,
      published: true,
      publication_date: new Date(`2024-0${Math.min(i + 1, 9)}-01`),
      category_id: categoryId,
      author: 'Test Author'
    }));

    await db.insert(blogPostsTable)
      .values(posts)
      .execute();

    // Test first page
    const firstPageInput: GetBlogPostsInput = {
      limit: 2,
      offset: 0
    };

    const firstPageResult = await getBlogPosts(firstPageInput);
    expect(firstPageResult).toHaveLength(2);

    // Test second page
    const secondPageInput: GetBlogPostsInput = {
      limit: 2,
      offset: 2
    };

    const secondPageResult = await getBlogPosts(secondPageInput);
    expect(secondPageResult).toHaveLength(2);

    // Verify different posts returned
    expect(firstPageResult[0].id).not.toEqual(secondPageResult[0].id);
  });

  it('should combine multiple filters', async () => {
    // Create test category
    const categoryResult = await db.insert(categoriesTable)
      .values(testCategory)
      .returning()
      .execute();
    const categoryId = categoryResult[0].id;

    // Create another category
    const otherCategoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Other',
        slug: 'other',
        description: 'Other articles'
      })
      .returning()
      .execute();
    const otherCategoryId = otherCategoryResult[0].id;

    // Create test blog posts
    await db.insert(blogPostsTable)
      .values([
        { ...testBlogPost1, category_id: categoryId }, // published: true, tech category
        { ...testBlogPost2, category_id: categoryId }, // published: false, tech category
        { ...testBlogPost3, category_id: otherCategoryId } // published: true, other category
      ])
      .execute();

    const input: GetBlogPostsInput = {
      published: true,
      category_id: categoryId
    };

    const result = await getBlogPosts(input);

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('First Post');
    expect(result[0].published).toBe(true);
    expect(result[0].category_id).toEqual(categoryId);
  });

  it('should return empty array when no posts match filters', async () => {
    // Create test category
    const categoryResult = await db.insert(categoriesTable)
      .values(testCategory)
      .returning()
      .execute();
    const categoryId = categoryResult[0].id;

    // Create only unpublished posts
    await db.insert(blogPostsTable)
      .values([
        { ...testBlogPost2, category_id: categoryId }
      ])
      .execute();

    const input: GetBlogPostsInput = {
      published: true // No published posts exist
    };

    const result = await getBlogPosts(input);

    expect(result).toHaveLength(0);
  });

  it('should handle posts without category_id', async () => {
    // Create blog posts without category
    await db.insert(blogPostsTable)
      .values([
        { ...testBlogPost1, category_id: null },
        { ...testBlogPost3, category_id: null }
      ])
      .execute();

    const result = await getBlogPosts();

    expect(result).toHaveLength(2);
    result.forEach(post => {
      expect(post.category_id).toBeNull();
    });
  });
});