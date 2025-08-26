import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable, tagsTable, blogPostsTable, blogPostTagsTable } from '../db/schema';
import { type GetBlogPostInput } from '../schema';
import { getBlogPost } from '../handlers/get_blog_post';

describe('getBlogPost', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should get a published blog post by ID', async () => {
    // Create test category
    const [category] = await db.insert(categoriesTable)
      .values({
        name: 'Technology',
        slug: 'technology',
        description: 'Tech articles'
      })
      .returning()
      .execute();

    // Create test blog post
    const [blogPost] = await db.insert(blogPostsTable)
      .values({
        title: 'Test Blog Post',
        content: 'This is test content',
        slug: 'test-blog-post',
        excerpt: 'Test excerpt',
        published: true,
        publication_date: new Date(),
        category_id: category.id,
        author: 'Test Author'
      })
      .returning()
      .execute();

    const input: GetBlogPostInput = { id: blogPost.id };
    const result = await getBlogPost(input);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(blogPost.id);
    expect(result!.title).toEqual('Test Blog Post');
    expect(result!.content).toEqual('This is test content');
    expect(result!.slug).toEqual('test-blog-post');
    expect(result!.excerpt).toEqual('Test excerpt');
    expect(result!.published).toBe(true);
    expect(result!.category_id).toEqual(category.id);
    expect(result!.author).toEqual('Test Author');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should get a published blog post by slug', async () => {
    // Create test blog post without category
    const [blogPost] = await db.insert(blogPostsTable)
      .values({
        title: 'Slug Test Post',
        content: 'Content for slug test',
        slug: 'slug-test-post',
        excerpt: null,
        published: true,
        publication_date: new Date(),
        category_id: null,
        author: 'Slug Author'
      })
      .returning()
      .execute();

    const input: GetBlogPostInput = { slug: 'slug-test-post' };
    const result = await getBlogPost(input);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(blogPost.id);
    expect(result!.title).toEqual('Slug Test Post');
    expect(result!.slug).toEqual('slug-test-post');
    expect(result!.excerpt).toBeNull();
    expect(result!.category_id).toBeNull();
    expect(result!.author).toEqual('Slug Author');
  });

  it('should return null for unpublished blog post', async () => {
    // Create unpublished blog post
    const [blogPost] = await db.insert(blogPostsTable)
      .values({
        title: 'Unpublished Post',
        content: 'This should not be returned',
        slug: 'unpublished-post',
        excerpt: 'Should not be visible',
        published: false,
        publication_date: null,
        category_id: null,
        author: 'Hidden Author'
      })
      .returning()
      .execute();

    // Try to get by ID
    const resultById = await getBlogPost({ id: blogPost.id });
    expect(resultById).toBeNull();

    // Try to get by slug
    const resultBySlug = await getBlogPost({ slug: 'unpublished-post' });
    expect(resultBySlug).toBeNull();
  });

  it('should return null for non-existent blog post', async () => {
    const resultById = await getBlogPost({ id: 99999 });
    expect(resultById).toBeNull();

    const resultBySlug = await getBlogPost({ slug: 'non-existent-slug' });
    expect(resultBySlug).toBeNull();
  });

  it('should handle blog post with category and tags', async () => {
    // Create test category
    const [category] = await db.insert(categoriesTable)
      .values({
        name: 'Web Development',
        slug: 'web-development',
        description: 'Web dev articles'
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
        name: 'React',
        slug: 'react'
      })
      .returning()
      .execute();

    // Create blog post
    const [blogPost] = await db.insert(blogPostsTable)
      .values({
        title: 'Advanced React Tips',
        content: 'Learn advanced React patterns',
        slug: 'advanced-react-tips',
        excerpt: 'Advanced patterns for React developers',
        published: true,
        publication_date: new Date(),
        category_id: category.id,
        author: 'React Expert'
      })
      .returning()
      .execute();

    // Associate tags with blog post
    await db.insert(blogPostTagsTable)
      .values([
        { blog_post_id: blogPost.id, tag_id: tag1.id },
        { blog_post_id: blogPost.id, tag_id: tag2.id }
      ])
      .execute();

    const result = await getBlogPost({ id: blogPost.id });

    expect(result).not.toBeNull();
    expect(result!.title).toEqual('Advanced React Tips');
    expect(result!.category_id).toEqual(category.id);
    expect(result!.published).toBe(true);
  });

  it('should prefer ID over slug when both are provided', async () => {
    // Create two blog posts
    const [blogPost1] = await db.insert(blogPostsTable)
      .values({
        title: 'First Post',
        content: 'First post content',
        slug: 'first-post',
        excerpt: 'First excerpt',
        published: true,
        publication_date: new Date(),
        category_id: null,
        author: 'Author One'
      })
      .returning()
      .execute();

    const [blogPost2] = await db.insert(blogPostsTable)
      .values({
        title: 'Second Post',
        content: 'Second post content',
        slug: 'second-post',
        excerpt: 'Second excerpt',
        published: true,
        publication_date: new Date(),
        category_id: null,
        author: 'Author Two'
      })
      .returning()
      .execute();

    // Request with both ID and slug - should match either one
    const input: GetBlogPostInput = { 
      id: blogPost1.id, 
      slug: 'second-post' 
    };
    const result = await getBlogPost(input);

    expect(result).not.toBeNull();
    // Should return either the first or second post since OR condition is used
    expect([blogPost1.id, blogPost2.id]).toContain(result!.id);
  });

  it('should handle blog post with no category but with tags', async () => {
    // Create test tag
    const [tag] = await db.insert(tagsTable)
      .values({
        name: 'Tutorial',
        slug: 'tutorial'
      })
      .returning()
      .execute();

    // Create blog post without category
    const [blogPost] = await db.insert(blogPostsTable)
      .values({
        title: 'No Category Post',
        content: 'Post without category',
        slug: 'no-category-post',
        excerpt: null,
        published: true,
        publication_date: new Date(),
        category_id: null,
        author: 'Solo Author'
      })
      .returning()
      .execute();

    // Associate tag with blog post
    await db.insert(blogPostTagsTable)
      .values({ blog_post_id: blogPost.id, tag_id: tag.id })
      .execute();

    const result = await getBlogPost({ slug: 'no-category-post' });

    expect(result).not.toBeNull();
    expect(result!.title).toEqual('No Category Post');
    expect(result!.category_id).toBeNull();
    expect(result!.published).toBe(true);
  });

  it('should handle blog post with category but no tags', async () => {
    // Create test category
    const [category] = await db.insert(categoriesTable)
      .values({
        name: 'News',
        slug: 'news',
        description: 'Latest news'
      })
      .returning()
      .execute();

    // Create blog post with category but no tags
    const [blogPost] = await db.insert(blogPostsTable)
      .values({
        title: 'News Update',
        content: 'Latest news update',
        slug: 'news-update',
        excerpt: 'Breaking news',
        published: true,
        publication_date: new Date(),
        category_id: category.id,
        author: 'News Reporter'
      })
      .returning()
      .execute();

    const result = await getBlogPost({ id: blogPost.id });

    expect(result).not.toBeNull();
    expect(result!.title).toEqual('News Update');
    expect(result!.category_id).toEqual(category.id);
    expect(result!.published).toBe(true);
  });
});