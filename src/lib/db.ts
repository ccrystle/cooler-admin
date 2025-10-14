import { Pool } from 'pg';

// Create a connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Connection pool settings
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
});

// Test the database connection
export const testConnection = async (): Promise<boolean> => {
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    console.log('Database connection successful');
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
};

// Execute a query with error handling
export const query = async (text: string, params?: any[]): Promise<any> => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

// Clear a specific table
export const clearTable = async (tableName: string): Promise<{ success: boolean; rowCount: number; error?: string }> => {
  try {
    console.log(`Clearing table: ${tableName}`);
    const result = await query(`DELETE FROM ${tableName}`);
    console.log(`Successfully cleared ${result.rowCount} rows from ${tableName}`);
    return {
      success: true,
      rowCount: result.rowCount || 0
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Failed to clear table ${tableName}:`, errorMessage);
    return {
      success: false,
      rowCount: 0,
      error: errorMessage
    };
  }
};

// Clear multiple tables in sequence
export const clearTables = async (tableNames: string[]): Promise<{ [key: string]: { success: boolean; rowCount: number; error?: string } }> => {
  const results: { [key: string]: { success: boolean; rowCount: number; error?: string } } = {};
  
  for (const tableName of tableNames) {
    results[tableName] = await clearTable(tableName);
  }
  
  return results;
};

// Get table row counts
export const getTableCounts = async (tableNames: string[]): Promise<{ [key: string]: number }> => {
  const counts: { [key: string]: number } = {};
  
  for (const tableName of tableNames) {
    try {
      const result = await query(`SELECT COUNT(*) FROM ${tableName}`);
      counts[tableName] = parseInt(result.rows[0].count);
    } catch (error) {
      console.error(`Failed to get count for table ${tableName}:`, error);
      counts[tableName] = 0;
    }
  }
  
  return counts;
};

export default pool;






