import { db } from '../db';
import { blogPostsTable, categoriesTable, blogPostTagsTable, tagsTable } from '../db/schema';
import { type GetBlogPostInput, type BlogPost } from '../schema';
import { eq, or, and } from 'drizzle-orm';

export async function getBlogPost(input: GetBlogPostInput): Promise<BlogPost | null> {
  try {
    // Build the base query with joins to get related data
    let query = db
      .select({
        // Blog post fields
        id: blogPostsTable.id,
        title: blogPostsTable.title,
        content: blogPostsTable.content,
        slug: blogPostsTable.slug,
        excerpt: blogPostsTable.excerpt,
        published: blogPostsTable.published,
        publication_date: blogPostsTable.publication_date,
        category_id: blogPostsTable.category_id,
        author: blogPostsTable.author,
        created_at: blogPostsTable.created_at,
        updated_at: blogPostsTable.updated_at,
        // Category fields (nullable join)
        category_name: categoriesTable.name,
        category_slug: categoriesTable.slug,
        category_description: categoriesTable.description,
        // Tag fields (nullable join)
        tag_id: tagsTable.id,
        tag_name: tagsTable.name,
        tag_slug: tagsTable.slug,
      })
      .from(blogPostsTable)
      .leftJoin(categoriesTable, eq(blogPostsTable.category_id, categoriesTable.id))
      .leftJoin(blogPostTagsTable, eq(blogPostsTable.id, blogPostTagsTable.blog_post_id))
      .leftJoin(tagsTable, eq(blogPostTagsTable.tag_id, tagsTable.id));

    // Build conditions array
    const conditions = [];
    
    // Add search conditions
    const searchConditions = [];
    if (input.id !== undefined) {
      searchConditions.push(eq(blogPostsTable.id, input.id));
    }
    
    if (input.slug !== undefined) {
      searchConditions.push(eq(blogPostsTable.slug, input.slug));
    }

    // Combine search conditions with OR if multiple
    if (searchConditions.length > 0) {
      conditions.push(searchConditions.length === 1 ? searchConditions[0] : or(...searchConditions));
    }

    // Only return published posts (for public-facing blog)
    conditions.push(eq(blogPostsTable.published, true));

    // Apply where clause
    const finalQuery = conditions.length === 1 
      ? query.where(conditions[0])
      : query.where(and(...conditions));

    const results = await finalQuery.execute();

    if (results.length === 0) {
      return null;
    }

    // Group the results to handle multiple tags
    const blogPostData = results[0];
    const tags = results
      .filter(result => result.tag_id !== null)
      .map(result => ({
        id: result.tag_id!,
        name: result.tag_name!,
        slug: result.tag_slug!,
      }));

    // Remove duplicates from tags
    const uniqueTags = tags.filter((tag, index, self) => 
      self.findIndex(t => t.id === tag.id) === index
    );

    // Construct the blog post with category and tags
    const blogPost: BlogPost = {
      id: blogPostData.id,
      title: blogPostData.title,
      content: blogPostData.content,
      slug: blogPostData.slug,
      excerpt: blogPostData.excerpt,
      published: blogPostData.published,
      publication_date: blogPostData.publication_date,
      category_id: blogPostData.category_id,
      author: blogPostData.author,
      created_at: blogPostData.created_at,
      updated_at: blogPostData.updated_at,
    };

    return blogPost;
  } catch (error) {
    console.error('Blog post retrieval failed:', error);
    throw error;
  }
}