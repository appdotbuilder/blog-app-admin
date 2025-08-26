import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tagsTable } from '../db/schema';
import { type UpdateTagInput, type CreateTagInput } from '../schema';
import { updateTag } from '../handlers/update_tag';
import { eq } from 'drizzle-orm';

// Helper function to create a test tag
const createTestTag = async (tagData: CreateTagInput) => {
  const result = await db.insert(tagsTable)
    .values({
      name: tagData.name,
      slug: tagData.slug
    })
    .returning()
    .execute();
  
  return result[0];
};

const testTagInput: CreateTagInput = {
  name: 'Test Tag',
  slug: 'test-tag'
};

describe('updateTag', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update tag name only', async () => {
    // Create test tag first
    const createdTag = await createTestTag(testTagInput);
    
    const updateInput: UpdateTagInput = {
      id: createdTag.id,
      name: 'Updated Tag Name'
    };
    
    const result = await updateTag(updateInput);

    // Verify updated fields
    expect(result.id).toEqual(createdTag.id);
    expect(result.name).toEqual('Updated Tag Name');
    expect(result.slug).toEqual(testTagInput.slug); // Should remain unchanged
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.created_at).toEqual(createdTag.created_at); // Should remain unchanged
  });

  it('should update tag slug only', async () => {
    // Create test tag first
    const createdTag = await createTestTag(testTagInput);
    
    const updateInput: UpdateTagInput = {
      id: createdTag.id,
      slug: 'updated-slug'
    };
    
    const result = await updateTag(updateInput);

    // Verify updated fields
    expect(result.id).toEqual(createdTag.id);
    expect(result.name).toEqual(testTagInput.name); // Should remain unchanged
    expect(result.slug).toEqual('updated-slug');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.created_at).toEqual(createdTag.created_at); // Should remain unchanged
  });

  it('should update both name and slug', async () => {
    // Create test tag first
    const createdTag = await createTestTag(testTagInput);
    
    const updateInput: UpdateTagInput = {
      id: createdTag.id,
      name: 'Updated Tag Name',
      slug: 'updated-slug'
    };
    
    const result = await updateTag(updateInput);

    // Verify updated fields
    expect(result.id).toEqual(createdTag.id);
    expect(result.name).toEqual('Updated Tag Name');
    expect(result.slug).toEqual('updated-slug');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.created_at).toEqual(createdTag.created_at); // Should remain unchanged
  });

  it('should save updated tag to database', async () => {
    // Create test tag first
    const createdTag = await createTestTag(testTagInput);
    
    const updateInput: UpdateTagInput = {
      id: createdTag.id,
      name: 'Database Updated Tag',
      slug: 'database-updated-slug'
    };
    
    await updateTag(updateInput);

    // Query database to verify changes
    const tags = await db.select()
      .from(tagsTable)
      .where(eq(tagsTable.id, createdTag.id))
      .execute();

    expect(tags).toHaveLength(1);
    expect(tags[0].name).toEqual('Database Updated Tag');
    expect(tags[0].slug).toEqual('database-updated-slug');
    expect(tags[0].created_at).toEqual(createdTag.created_at); // Should remain unchanged
  });

  it('should throw error when tag does not exist', async () => {
    const updateInput: UpdateTagInput = {
      id: 99999, // Non-existent ID
      name: 'Updated Name'
    };

    expect(updateTag(updateInput)).rejects.toThrow(/Tag with id 99999 not found/i);
  });

  it('should handle partial updates with minimal data', async () => {
    // Create test tag first
    const createdTag = await createTestTag({
      name: 'Minimal Tag',
      slug: 'minimal-tag'
    });
    
    // Update only one field
    const updateInput: UpdateTagInput = {
      id: createdTag.id,
      name: 'M'
    };
    
    const result = await updateTag(updateInput);

    expect(result.name).toEqual('M');
    expect(result.slug).toEqual('minimal-tag'); // Should remain unchanged
  });

  it('should handle empty update gracefully', async () => {
    // Create test tag first
    const createdTag = await createTestTag(testTagInput);
    
    // Update with no optional fields (only id is required)
    const updateInput: UpdateTagInput = {
      id: createdTag.id
    };
    
    const result = await updateTag(updateInput);

    // All fields should remain unchanged since no update fields were provided
    expect(result.id).toEqual(createdTag.id);
    expect(result.name).toEqual(testTagInput.name);
    expect(result.slug).toEqual(testTagInput.slug);
    expect(result.created_at).toEqual(createdTag.created_at);
  });

  it('should prevent duplicate slug conflicts', async () => {
    // Create two test tags
    const firstTag = await createTestTag({
      name: 'First Tag',
      slug: 'first-tag'
    });
    
    const secondTag = await createTestTag({
      name: 'Second Tag',
      slug: 'second-tag'
    });
    
    // Try to update second tag to use first tag's slug
    const updateInput: UpdateTagInput = {
      id: secondTag.id,
      slug: 'first-tag' // This should cause a conflict
    };

    // Should throw due to unique constraint violation
    expect(updateTag(updateInput)).rejects.toThrow();
  });
});