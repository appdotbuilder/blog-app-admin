import { db } from '../db';
import { categoriesTable } from '../db/schema';
import { type DeleteItemInput } from '../schema';
import { eq } from 'drizzle-orm';

export async function deleteCategory(input: DeleteItemInput): Promise<{ success: boolean }> {
  try {
    // Delete the category by ID
    const result = await db.delete(categoriesTable)
      .where(eq(categoriesTable.id, input.id))
      .execute();

    // Check if any rows were affected (category existed and was deleted)
    return { success: (result.rowCount ?? 0) > 0 };
  } catch (error) {
    console.error('Category deletion failed:', error);
    throw error;
  }
}