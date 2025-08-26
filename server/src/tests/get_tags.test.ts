import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tagsTable } from '../db/schema';
import { type CreateTagInput } from '../schema';
import { getTags } from '../handlers/get_tags';

describe('getTags', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no tags exist', async () => {
    const result = await getTags();
    
    expect(result).toEqual([]);
  });

  it('should return all tags from database', async () => {
    // Create test tags
    await db.insert(tagsTable).values([
      {
        name: 'JavaScript',
        slug: 'javascript'
      },
      {
        name: 'TypeScript',
        slug: 'typescript'
      },
      {
        name: 'React',
        slug: 'react'
      }
    ]).execute();

    const result = await getTags();

    expect(result).toHaveLength(3);
    
    // Check that all tags are returned
    const tagNames = result.map(tag => tag.name).sort();
    expect(tagNames).toEqual(['JavaScript', 'React', 'TypeScript']);
    
    // Check that all required fields are present
    result.forEach(tag => {
      expect(tag.id).toBeDefined();
      expect(typeof tag.id).toBe('number');
      expect(tag.name).toBeDefined();
      expect(typeof tag.name).toBe('string');
      expect(tag.slug).toBeDefined();
      expect(typeof tag.slug).toBe('string');
      expect(tag.created_at).toBeInstanceOf(Date);
    });
  });

  it('should return tags in creation order', async () => {
    // Create tags with slight delay to ensure different timestamps
    await db.insert(tagsTable).values({
      name: 'First Tag',
      slug: 'first-tag'
    }).execute();

    await db.insert(tagsTable).values({
      name: 'Second Tag',
      slug: 'second-tag'
    }).execute();

    await db.insert(tagsTable).values({
      name: 'Third Tag',
      slug: 'third-tag'
    }).execute();

    const result = await getTags();

    expect(result).toHaveLength(3);
    expect(result[0].name).toEqual('First Tag');
    expect(result[1].name).toEqual('Second Tag');
    expect(result[2].name).toEqual('Third Tag');
  });

  it('should handle tags with special characters in name', async () => {
    await db.insert(tagsTable).values({
      name: 'C++',
      slug: 'cpp'
    }).execute();

    await db.insert(tagsTable).values({
      name: 'Node.js',
      slug: 'nodejs'
    }).execute();

    const result = await getTags();

    expect(result).toHaveLength(2);
    
    const specialTag = result.find(tag => tag.name === 'C++');
    expect(specialTag).toBeDefined();
    expect(specialTag?.slug).toEqual('cpp');

    const nodeTag = result.find(tag => tag.name === 'Node.js');
    expect(nodeTag).toBeDefined();
    expect(nodeTag?.slug).toEqual('nodejs');
  });

  it('should preserve unique slugs', async () => {
    await db.insert(tagsTable).values([
      {
        name: 'JavaScript Frontend',
        slug: 'javascript-frontend'
      },
      {
        name: 'JavaScript Backend',
        slug: 'javascript-backend'
      }
    ]).execute();

    const result = await getTags();

    expect(result).toHaveLength(2);
    
    const slugs = result.map(tag => tag.slug);
    expect(slugs).toContain('javascript-frontend');
    expect(slugs).toContain('javascript-backend');
    
    // Ensure slugs are unique
    const uniqueSlugs = new Set(slugs);
    expect(uniqueSlugs.size).toEqual(slugs.length);
  });
});