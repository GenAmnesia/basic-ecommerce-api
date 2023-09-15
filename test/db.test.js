const assert = require('assert');
const { query } = require('../db');

const tablesToCheck = [
  {
    tableName: 'products',
    expectedColumns: [
      'id',
      'name',
      'description',
      'category_id',
      'tags',
      'price',
      'created_at',
      'updated_at',
      'deleted_at',
    ],
  },
  {
    tableName: 'product_photos',
    expectedColumns: ['id', 'product_id', 'url', 'caption'],
  },
  {
    tableName: 'categories',
    expectedColumns: ['id', 'name', 'parent_id'],
  },
  {
    tableName: 'users',
    expectedColumns: [
      'id',
      'first_name',
      'last_name',
      'email',
      'password',
      'google_id',
      'google_token',
      'is_admin',
      'created_at',
    ],
  },
  {
    tableName: 'shipping_addresses',
    expectedColumns: [
      'id',
      'user_id',
      'recipient_name',
      'street_address',
      'city',
      'state_province',
      'postal_code',
      'country',
      'phone_number',
      'notes',
      'is_default',
      'created_at',
      'deleted_at',
    ],
  },
  {
    tableName: 'orders',
    expectedColumns: [
      'id',
      'user_id',
      'status',
      'address_id',
      'created_at',
      'updated_at',
    ],
  },
  {
    tableName: 'order_items',
    expectedColumns: [
      'id',
      'order_id',
      'product_id',
      'quantity',
      'price_per_item',
    ],
  },
  {
    tableName: 'cart_items',
    expectedColumns: [
      'id',
      'user_id',
      'product_id',
      'quantity',
      'created_at',
      'updated_at',
    ],
  },
  {
    tableName: 'payments',
    expectedColumns: [
      'id',
      'user_id',
      'order_id',
      'amount',
      'timestamp',
      'payment_method',
      'status',
    ],
  },
  {
    tableName: 'reviews',
    expectedColumns: [
      'id',
      'rating',
      'user_id',
      'product_id',
      'description',
      'created_at',
    ],
  },
  {
    tableName: 'audit_log',
    expectedColumns: [
      'id',
      'user_id',
      'action_type',
      'action_description',
      'timestamp',
    ],
  },
  {
    tableName: 'error_log',
    expectedColumns: ['id', 'error_message', 'timestamp'],
  },
];

describe('Verify the existence of tables and their columns', () => {
  tablesToCheck.forEach((tableInfo) => {
    const { tableName, expectedColumns } = tableInfo;

    it(`Should have table "${tableName}" with specified columns`, async () => {
      const tableResult = await query(`
          SELECT table_name
          FROM information_schema.tables
          WHERE table_name = '${tableName}'
        `);

      const existingTables = tableResult.rows.map((row) => row.table_name);

      // Verify that the table exists
      assert.ok(existingTables.includes(tableName), `Table "${tableName}" does not exist`);

      const columnResult = await query(`
          SELECT column_name
          FROM information_schema.columns
          WHERE table_name = '${tableName}'
        `);

      const existingColumns = columnResult.rows.map((row) => row.column_name);

      // Verify that all expected columns exist
      expectedColumns.forEach((column) => {
        assert.ok(existingColumns.includes(column), `Column "${column}" does not exist in table "${tableName}"`);
      });

      // Verify that there are no additional columns
      existingColumns.forEach((column) => {
        assert.ok(expectedColumns.includes(column), `Column "${column}" is not expected in table "${tableName}"`);
      });
    });
  });
});
