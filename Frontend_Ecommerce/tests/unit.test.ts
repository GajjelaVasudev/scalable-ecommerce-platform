import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { formatCurrency, calculateDiscount, formatDate } from '../src/utils/format';
import { INITIAL_PRODUCTS, INITIAL_CATEGORIES } from '../src/services/mockData';

describe('Frontend Utilities and Formatting', () => {
  test('formatCurrency formats Indian Rupee correctly with comma grouping', () => {
    assert.match(formatCurrency(24999), /₹\s?24,999/);
    assert.match(formatCurrency(189990), /₹\s?1,89,990/);
    assert.match(formatCurrency(0), /₹\s?0/);
    assert.match(formatCurrency(null), /₹\s?0/);
    assert.match(formatCurrency(undefined), /₹\s?0/);
  });

  test('calculateDiscount computes accurate rounded discount percentages', () => {
    assert.equal(calculateDiscount(100, 80), 20);
    assert.equal(calculateDiscount(29999, 24999), 17);
    assert.equal(calculateDiscount(100, 100), 0);
    assert.equal(calculateDiscount(100, 120), 0);
  });

  test('formatDate safely formats valid dates', () => {
    const formatted = formatDate('2026-10-30T10:00:00Z');
    assert.ok(formatted.length > 5);
    assert.equal(formatDate(null), '');
    assert.equal(formatDate('invalid-date'), '');
  });
});

describe('Catalog Seed and Category Data Integrity', () => {
  test('INITIAL_CATEGORIES contains expected standard departments', () => {
    assert.ok(INITIAL_CATEGORIES.length >= 5);
    const names = INITIAL_CATEGORIES.map((c) => c.name);
    assert.ok(names.includes('Electronics'));
    assert.ok(names.includes('Home & Living'));
    assert.ok(names.includes('Grocery & Essentials'));
  });

  test('INITIAL_PRODUCTS are fully specified with positive prices and stock', () => {
    assert.ok(INITIAL_PRODUCTS.length >= 8);
    for (const p of INITIAL_PRODUCTS) {
      assert.ok(p._id, 'Product must have an _id');
      assert.ok(p.name, 'Product must have a name');
      assert.ok(p.price > 0, 'Price must be positive');
      assert.ok(p.stock >= 0, 'Stock must be non-negative');
      assert.ok(p.category, 'Category must be defined');
      assert.ok(p.image, 'Image URL must be defined');
    }
  });
});

