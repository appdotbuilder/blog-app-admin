import { db } from '../db';
import { tagsTable } from '../db/schema';
import { type UpdateTagInput, type Tag } from '../schema';
import { eq } from 'drizzle-orm';

export const updateTag = async (input: UpdateTagInput): Promise<Tag> => {
  try {
    // Build the update data object with only provided fields
    const updateData: Partial<typeof tagsTable.$inferInsert> = {};
    
    if (input.name !== undefined) {
      updateData.name = input.name;
    }
    
    if (input.slug !== undefined) {
      updateData.slug = input.slug;
    }
    
    // Only proceed with update if there are fields to update
    if (Object.keys(updateData).length === 0) {
      // If no fields to update, just return the existing record
      const existingRecord = await db.select()
        .from(tagsTable)
        .where(eq(tagsTable.id, input.id))
        .execute();
        
      if (existingRecord.length === 0) {
        throw new Error(`Tag with id ${input.id} not found`);
      }
      
      return existingRecord[0];
    }
    
    // Update the tag
    const result = await db.update(tagsTable)
      .set(updateData)
      .where(eq(tagsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Tag with id ${input.id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Tag update failed:', error);
    throw error;
  }
};