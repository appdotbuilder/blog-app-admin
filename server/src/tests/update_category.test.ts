import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable } from '../db/schema';
import { type UpdateCategoryInput } from '../schema';
import { updateCategory } from '../handlers/update_category';
import { eq } from 'drizzle-orm';

describe('updateCategory', () => {
  let testCategoryId: number;

  beforeEach(async () => {
    await createDB();
    
    // Create a test category to update
    const result = await db.insert(categoriesTable)
      .values({
        name: 'Original Category',
        slug: 'original-category',
        description: 'Original description'
      })
      .returning()
      .execute();
    
    testCategoryId = result[0].id;
  });

  afterEach(resetDB);

  it('should update category name', async () => {
    const input: UpdateCategoryInput = {
      id: testCategoryId,
      name: 'Updated Category Name'
    };

    const result = await updateCategory(input);

    expect(result.id).toEqual(testCategoryId);
    expect(result.name).toEqual('Updated Category Name');
    expect(result.slug).toEqual('original-category'); // Should remain unchanged
    expect(result.description).toEqual('Original description'); // Should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update category slug', async () => {
    const input: UpdateCategoryInput = {
      id: testCategoryId,
      slug: 'updated-category-slug'
    };

    const result = await updateCategory(input);

    expect(result.id).toEqual(testCategoryId);
    expect(result.name).toEqual('Original Category'); // Should remain unchanged
    expect(result.slug).toEqual('updated-category-slug');
    expect(result.description).toEqual('Original description'); // Should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update category description', async () => {
    const input: UpdateCategoryInput = {
      id: testCategoryId,
      description: 'Updated description'
    };

    const result = await updateCategory(input);

    expect(result.id).toEqual(testCategoryId);
    expect(result.name).toEqual('Original Category'); // Should remain unchanged
    expect(result.slug).toEqual('original-category'); // Should remain unchanged
    expect(result.description).toEqual('Updated description');
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should set description to null', async () => {
    const input: UpdateCategoryInput = {
      id: testCategoryId,
      description: null
    };

    const result = await updateCategory(input);

    expect(result.id).toEqual(testCategoryId);
    expect(result.name).toEqual('Original Category'); // Should remain unchanged
    expect(result.slug).toEqual('original-category'); // Should remain unchanged
    expect(result.description).toBeNull();
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update multiple fields at once', async () => {
    const input: UpdateCategoryInput = {
      id: testCategoryId,
      name: 'Completely Updated Category',
      slug: 'completely-updated-category',
      description: 'Completely updated description'
    };

    const result = await updateCategory(input);

    expect(result.id).toEqual(testCategoryId);
    expect(result.name).toEqual('Completely Updated Category');
    expect(result.slug).toEqual('completely-updated-category');
    expect(result.description).toEqual('Completely updated description');
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save updates to database', async () => {
    const input: UpdateCategoryInput = {
      id: testCategoryId,
      name: 'Database Test Category',
      description: 'Database test description'
    };

    await updateCategory(input);

    // Verify changes were saved to database
    const categories = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, testCategoryId))
      .execute();

    expect(categories).toHaveLength(1);
    expect(categories[0].name).toEqual('Database Test Category');
    expect(categories[0].description).toEqual('Database test description');
    expect(categories[0].updated_at).toBeInstanceOf(Date);
  });

  it('should update updated_at timestamp', async () => {
    // Get original timestamp
    const originalCategory = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, testCategoryId))
      .execute();
    
    const originalUpdatedAt = originalCategory[0].updated_at;

    // Wait a moment to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const input: UpdateCategoryInput = {
      id: testCategoryId,
      name: 'Timestamp Test Category'
    };

    const result = await updateCategory(input);

    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });

  it('should throw error when category does not exist', async () => {
    const input: UpdateCategoryInput = {
      id: 99999, // Non-existent ID
      name: 'Non-existent Category'
    };

    await expect(updateCategory(input)).rejects.toThrow(/Category with id 99999 not found/i);
  });

  it('should handle update with no optional fields provided', async () => {
    const input: UpdateCategoryInput = {
      id: testCategoryId
      // No optional fields provided
    };

    const result = await updateCategory(input);

    // Should only update the updated_at timestamp
    expect(result.id).toEqual(testCategoryId);
    expect(result.name).toEqual('Original Category'); // Should remain unchanged
    expect(result.slug).toEqual('original-category'); // Should remain unchanged
    expect(result.description).toEqual('Original description'); // Should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });
});