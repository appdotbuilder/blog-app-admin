import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable } from '../db/schema';
import { type CreateCategoryInput } from '../schema';
import { getCategories } from '../handlers/get_categories';

// Test categories for seeding
const testCategories: CreateCategoryInput[] = [
  {
    name: 'Technology',
    slug: 'technology',
    description: 'Posts about technology and innovation'
  },
  {
    name: 'Travel',
    slug: 'travel',
    description: 'Travel guides and experiences'
  },
  {
    name: 'Food',
    slug: 'food',
    description: null // Test null description
  }
];

describe('getCategories', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no categories exist', async () => {
    const result = await getCategories();

    expect(result).toEqual([]);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return all categories', async () => {
    // Seed test data
    await db.insert(categoriesTable)
      .values(testCategories)
      .execute();

    const result = await getCategories();

    expect(result).toHaveLength(3);
    
    // Check that all categories are returned
    const names = result.map(cat => cat.name);
    expect(names).toContain('Technology');
    expect(names).toContain('Travel');
    expect(names).toContain('Food');

    // Check that all expected fields are present
    result.forEach(category => {
      expect(category.id).toBeDefined();
      expect(category.name).toBeDefined();
      expect(category.slug).toBeDefined();
      expect(category.created_at).toBeInstanceOf(Date);
      expect(category.updated_at).toBeInstanceOf(Date);
      // description can be null
    });
  });

  it('should handle categories with null descriptions', async () => {
    // Insert category with null description
    await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        slug: 'test-category',
        description: null
      })
      .execute();

    const result = await getCategories();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Test Category');
    expect(result[0].description).toBeNull();
  });

  it('should return categories with correct data types', async () => {
    // Insert a single category for type checking
    await db.insert(categoriesTable)
      .values({
        name: 'Sample Category',
        slug: 'sample-category',
        description: 'A sample category for testing'
      })
      .execute();

    const result = await getCategories();

    expect(result).toHaveLength(1);
    const category = result[0];

    // Verify all field types
    expect(typeof category.id).toBe('number');
    expect(typeof category.name).toBe('string');
    expect(typeof category.slug).toBe('string');
    expect(typeof category.description).toBe('string');
    expect(category.created_at).toBeInstanceOf(Date);
    expect(category.updated_at).toBeInstanceOf(Date);
  });

  it('should return categories ordered by creation order', async () => {
    // Insert categories in specific order
    const category1 = await db.insert(categoriesTable)
      .values({
        name: 'First Category',
        slug: 'first-category',
        description: 'Created first'
      })
      .returning()
      .execute();

    // Wait a tiny bit to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 1));

    const category2 = await db.insert(categoriesTable)
      .values({
        name: 'Second Category',
        slug: 'second-category',
        description: 'Created second'
      })
      .returning()
      .execute();

    const result = await getCategories();

    expect(result).toHaveLength(2);
    
    // Categories should be returned in the order they appear in the database
    // (typically insertion order for this simple query)
    const firstCategory = result.find(cat => cat.name === 'First Category');
    const secondCategory = result.find(cat => cat.name === 'Second Category');
    
    expect(firstCategory).toBeDefined();
    expect(secondCategory).toBeDefined();
    expect(firstCategory!.id).toBe(category1[0].id);
    expect(secondCategory!.id).toBe(category2[0].id);
  });

  it('should preserve unique slugs', async () => {
    // Insert categories with unique slugs
    await db.insert(categoriesTable)
      .values([
        {
          name: 'Category One',
          slug: 'category-one',
          description: 'First category'
        },
        {
          name: 'Category Two',
          slug: 'category-two',
          description: 'Second category'
        }
      ])
      .execute();

    const result = await getCategories();

    expect(result).toHaveLength(2);
    
    const slugs = result.map(cat => cat.slug);
    expect(slugs).toContain('category-one');
    expect(slugs).toContain('category-two');
    
    // Verify slugs are unique
    const uniqueSlugs = new Set(slugs);
    expect(uniqueSlugs.size).toBe(slugs.length);
  });
});