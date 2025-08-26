import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tagsTable } from '../db/schema';
import { type CreateTagInput } from '../schema';
import { createTag } from '../handlers/create_tag';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateTagInput = {
  name: 'Test Tag',
  slug: 'test-tag'
};

describe('createTag', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a tag', async () => {
    const result = await createTag(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test Tag');
    expect(result.slug).toEqual('test-tag');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(typeof result.id).toBe('number');
    expect(result.id).toBeGreaterThan(0);
  });

  it('should save tag to database', async () => {
    const result = await createTag(testInput);

    // Query using proper drizzle syntax
    const tags = await db.select()
      .from(tagsTable)
      .where(eq(tagsTable.id, result.id))
      .execute();

    expect(tags).toHaveLength(1);
    expect(tags[0].name).toEqual('Test Tag');
    expect(tags[0].slug).toEqual('test-tag');
    expect(tags[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle unique slug constraint violation', async () => {
    // Create first tag
    await createTag(testInput);

    // Try to create another tag with same slug
    const duplicateInput: CreateTagInput = {
      name: 'Another Test Tag',
      slug: 'test-tag' // Same slug
    };

    await expect(createTag(duplicateInput)).rejects.toThrow(/unique/i);
  });

  it('should create multiple tags with different slugs', async () => {
    const tag1Input: CreateTagInput = {
      name: 'First Tag',
      slug: 'first-tag'
    };

    const tag2Input: CreateTagInput = {
      name: 'Second Tag',
      slug: 'second-tag'
    };

    const result1 = await createTag(tag1Input);
    const result2 = await createTag(tag2Input);

    expect(result1.name).toEqual('First Tag');
    expect(result1.slug).toEqual('first-tag');
    expect(result2.name).toEqual('Second Tag');
    expect(result2.slug).toEqual('second-tag');
    expect(result1.id).not.toEqual(result2.id);

    // Verify both exist in database
    const allTags = await db.select().from(tagsTable).execute();
    expect(allTags).toHaveLength(2);
  });

  it('should preserve exact input values', async () => {
    const specialInput: CreateTagInput = {
      name: 'Special Characters & Symbols',
      slug: 'special-chars-symbols'
    };

    const result = await createTag(specialInput);

    expect(result.name).toEqual('Special Characters & Symbols');
    expect(result.slug).toEqual('special-chars-symbols');
  });
});