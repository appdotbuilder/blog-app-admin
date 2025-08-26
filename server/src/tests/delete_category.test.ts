import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable } from '../db/schema';
import { type DeleteItemInput } from '../schema';
import { deleteCategory } from '../handlers/delete_category';
import { eq } from 'drizzle-orm';

describe('deleteCategory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing category', async () => {
    // Create a test category first
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        slug: 'test-category',
        description: 'A category for testing'
      })
      .returning()
      .execute();

    const categoryId = categoryResult[0].id;

    // Delete the category
    const input: DeleteItemInput = { id: categoryId };
    const result = await deleteCategory(input);

    // Verify deletion was successful
    expect(result.success).toBe(true);

    // Verify category no longer exists in database
    const categories = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, categoryId))
      .execute();

    expect(categories).toHaveLength(0);
  });

  it('should return false when trying to delete non-existent category', async () => {
    // Try to delete a category that doesn't exist
    const input: DeleteItemInput = { id: 999999 };
    const result = await deleteCategory(input);

    // Should return success: false since no rows were affected
    expect(result.success).toBe(false);
  });

  it('should not affect other categories when deleting one', async () => {
    // Create multiple test categories
    const categories = await db.insert(categoriesTable)
      .values([
        {
          name: 'Category 1',
          slug: 'category-1',
          description: 'First test category'
        },
        {
          name: 'Category 2',
          slug: 'category-2',
          description: 'Second test category'
        },
        {
          name: 'Category 3',
          slug: 'category-3',
          description: 'Third test category'
        }
      ])
      .returning()
      .execute();

    const categoryToDelete = categories[1]; // Delete the middle one

    // Delete one category
    const input: DeleteItemInput = { id: categoryToDelete.id };
    const result = await deleteCategory(input);

    expect(result.success).toBe(true);

    // Verify only the target category was deleted
    const remainingCategories = await db.select()
      .from(categoriesTable)
      .execute();

    expect(remainingCategories).toHaveLength(2);
    expect(remainingCategories.find(cat => cat.id === categoryToDelete.id)).toBeUndefined();
    expect(remainingCategories.find(cat => cat.id === categories[0].id)).toBeDefined();
    expect(remainingCategories.find(cat => cat.id === categories[2].id)).toBeDefined();
  });

  it('should handle deletion with proper database transaction', async () => {
    // Create a category to delete
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Transaction Test Category',
        slug: 'transaction-test-category',
        description: 'Category for transaction testing'
      })
      .returning()
      .execute();

    const categoryId = categoryResult[0].id;

    // Count total categories before deletion
    const beforeCount = await db.select()
      .from(categoriesTable)
      .execute();

    // Delete the category
    const input: DeleteItemInput = { id: categoryId };
    const result = await deleteCategory(input);

    expect(result.success).toBe(true);

    // Verify total count decreased by exactly 1
    const afterCount = await db.select()
      .from(categoriesTable)
      .execute();

    expect(afterCount.length).toBe(beforeCount.length - 1);
  });
});