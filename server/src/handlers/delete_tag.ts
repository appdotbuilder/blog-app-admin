import { db } from '../db';
import { tagsTable, blogPostTagsTable } from '../db/schema';
import { type DeleteItemInput } from '../schema';
import { eq } from 'drizzle-orm';

export async function deleteTag(input: DeleteItemInput): Promise<{ success: boolean }> {
  try {
    // First, delete all associations with blog posts
    await db.delete(blogPostTagsTable)
      .where(eq(blogPostTagsTable.tag_id, input.id))
      .execute();

    // Then delete the tag itself
    const result = await db.delete(tagsTable)
      .where(eq(tagsTable.id, input.id))
      .returning()
      .execute();

    // Check if the tag was actually deleted
    if (result.length === 0) {
      throw new Error(`Tag with id ${input.id} not found`);
    }

    return { success: true };
  } catch (error) {
    console.error('Tag deletion failed:', error);
    throw error;
  }
}