import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable } from '../db/schema';
import { type CreateCategoryInput } from '../schema';
import { createCategory } from '../handlers/create_category';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreateCategoryInput = {
  name: 'Technology',
  slug: 'technology',
  description: 'Articles about technology and programming'
};

// Test input with null description
const testInputNullDescription: CreateCategoryInput = {
  name: 'Travel',
  slug: 'travel',
  description: null
};

describe('createCategory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a category with description', async () => {
    const result = await createCategory(testInput);

    // Basic field validation
    expect(result.name).toEqual('Technology');
    expect(result.slug).toEqual('technology');
    expect(result.description).toEqual('Articles about technology and programming');
    expect(result.id).toBeDefined();
    expect(typeof result.id).toEqual('number');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a category with null description', async () => {
    const result = await createCategory(testInputNullDescription);

    // Basic field validation
    expect(result.name).toEqual('Travel');
    expect(result.slug).toEqual('travel');
    expect(result.description).toBeNull();
    expect(result.id).toBeDefined();
    expect(typeof result.id).toEqual('number');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save category to database', async () => {
    const result = await createCategory(testInput);

    // Query using proper drizzle syntax
    const categories = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, result.id))
      .execute();

    expect(categories).toHaveLength(1);
    expect(categories[0].name).toEqual('Technology');
    expect(categories[0].slug).toEqual('technology');
    expect(categories[0].description).toEqual('Articles about technology and programming');
    expect(categories[0].created_at).toBeInstanceOf(Date);
    expect(categories[0].updated_at).toBeInstanceOf(Date);
  });

  it('should create multiple categories with unique slugs', async () => {
    const category1 = await createCategory({
      name: 'Technology',
      slug: 'technology',
      description: 'Tech articles'
    });

    const category2 = await createCategory({
      name: 'Science',
      slug: 'science',
      description: 'Science articles'
    });

    // Verify both categories exist
    const allCategories = await db.select()
      .from(categoriesTable)
      .execute();

    expect(allCategories).toHaveLength(2);
    expect(category1.id).not.toEqual(category2.id);
    expect(category1.slug).toEqual('technology');
    expect(category2.slug).toEqual('science');
  });

  it('should throw error for duplicate slug', async () => {
    // Create first category
    await createCategory(testInput);

    // Try to create category with same slug
    const duplicateInput: CreateCategoryInput = {
      name: 'Tech Blog',
      slug: 'technology', // Same slug as first category
      description: 'Another tech blog'
    };

    // Should throw error due to unique constraint on slug
    await expect(createCategory(duplicateInput)).rejects.toThrow(/unique/i);
  });

  it('should handle empty string description as valid input', async () => {
    const emptyDescInput: CreateCategoryInput = {
      name: 'Minimal Category',
      slug: 'minimal',
      description: ''
    };

    const result = await createCategory(emptyDescInput);

    expect(result.name).toEqual('Minimal Category');
    expect(result.slug).toEqual('minimal');
    expect(result.description).toEqual('');
    expect(result.id).toBeDefined();
  });
});