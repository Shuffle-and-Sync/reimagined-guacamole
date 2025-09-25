/**
 * Base Repository Pattern Implementation
 * 
 * This module provides a base repository class that abstracts common database operations,
 * following Copilot best practices for database interaction patterns.
 */

import { PgDatabase } from 'drizzle-orm/pg-core';
import { PgTableWithColumns, TableConfig } from 'drizzle-orm/pg-core';
import { eq, and, or, SQL, sql, asc, desc, count, lt, gt } from 'drizzle-orm';
import { logger } from '../logger';
import { DatabaseError } from '../middleware/error-handling.middleware';
import { withQueryTiming } from '@shared/database-unified';

// Generic types for repository operations
export interface PaginationOptions {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface SortOptions {
  field: string;
  direction?: 'asc' | 'desc';
}

export interface FilterOptions {
  [key: string]: any;
}

export interface QueryOptions {
  pagination?: PaginationOptions;
  sort?: SortOptions;
  filters?: FilterOptions;
  select?: string[];
  include?: string[];
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

/**
 * Base Repository Class
 * Provides common CRUD operations and utilities for database entities
 */
export abstract class BaseRepository<
  TTable extends PgTableWithColumns<TableConfig>,
  TEntity = TTable['$inferSelect'],
  TInsert = TTable['$inferInsert'],
  TUpdate = Partial<TInsert>
> {
  protected db: PgDatabase<any>;
  protected table: TTable;
  protected tableName: string;

  constructor(db: PgDatabase<any>, table: TTable, tableName: string) {
    this.db = db;
    this.table = table;
    this.tableName = tableName;
  }

  /**
   * Find entity by ID
   */
  async findById(id: string): Promise<TEntity | null> {
    return withQueryTiming(`${this.tableName}:findById`, async () => {
      try {
        const result = await this.db
          .select()
          .from(this.table)
          .where(eq(this.table.id, id))
          .limit(1);

        return result[0] || null;
      } catch (error) {
        logger.error(`Failed to find ${this.tableName} by ID`, error, { id });
        throw new DatabaseError(`Failed to find ${this.tableName}`);
      }
    });
  }

  /**
   * Find multiple entities by IDs
   */
  async findByIds(ids: string[]): Promise<TEntity[]> {
    return withQueryTiming(`${this.tableName}:findByIds`, async () => {
      if (ids.length === 0) return [];

      try {
        return await this.db
          .select()
          .from(this.table)
          .where(sql`${this.table.id} = ANY(${ids})`);
      } catch (error) {
        logger.error(`Failed to find ${this.tableName} by IDs`, error, { ids });
        throw new DatabaseError(`Failed to find ${this.tableName} records`);
      }
    });
  }

  /**
   * Find entities with filters and options
   */
  async find(options: QueryOptions = {}): Promise<PaginatedResult<TEntity>> {
    return withQueryTiming(`${this.tableName}:find`, async () => {
      try {
        const { pagination, sort, filters } = options;
        const page = pagination?.page || 1;
        const limit = Math.min(pagination?.limit || 50, 100); // Max 100 per page
        const offset = (page - 1) * limit;

        // Build base query
        let query = this.db.select().from(this.table);

        // Apply filters
        if (filters && Object.keys(filters).length > 0) {
          const whereConditions = this.buildWhereConditions(filters);
          if (whereConditions.length > 0) {
            query = query.where(and(...whereConditions));
          }
        }

        // Apply sorting
        if (sort?.field) {
          const column = (this.table as any)[sort.field];
          if (column) {
            query = query.orderBy(sort.direction === 'desc' ? desc(column) : asc(column));
          }
        }

        // Get total count
        const countQuery = this.db
          .select({ count: count() })
          .from(this.table);

        if (filters && Object.keys(filters).length > 0) {
          const whereConditions = this.buildWhereConditions(filters);
          if (whereConditions.length > 0) {
            countQuery.where(and(...whereConditions));
          }
        }

        const [data, totalResult] = await Promise.all([
          query.limit(limit).offset(offset),
          countQuery
        ]);

        const total = totalResult[0]?.count || 0;
        const totalPages = Math.ceil(total / limit);

        return {
          data,
          total,
          page,
          limit,
          totalPages,
          hasNext: page < totalPages,
          hasPrevious: page > 1
        };
      } catch (error) {
        logger.error(`Failed to find ${this.tableName} records`, error, { options });
        throw new DatabaseError(`Failed to find ${this.tableName} records`);
      }
    });
  }

  /**
   * Find one entity with filters
   */
  async findOne(filters: FilterOptions): Promise<TEntity | null> {
    return withQueryTiming(`${this.tableName}:findOne`, async () => {
      try {
        const whereConditions = this.buildWhereConditions(filters);
        
        if (whereConditions.length === 0) {
          return null;
        }

        const result = await this.db
          .select()
          .from(this.table)
          .where(and(...whereConditions))
          .limit(1);

        return result[0] || null;
      } catch (error) {
        logger.error(`Failed to find one ${this.tableName}`, error, { filters });
        throw new DatabaseError(`Failed to find ${this.tableName}`);
      }
    });
  }

  /**
   * Create new entity
   */
  async create(data: TInsert): Promise<TEntity> {
    return withQueryTiming(`${this.tableName}:create`, async () => {
      try {
        const result = await this.db
          .insert(this.table)
          .values(data)
          .returning();

        if (!result[0]) {
          throw new DatabaseError(`Failed to create ${this.tableName}`);
        }

        return result[0];
      } catch (error) {
        logger.error(`Failed to create ${this.tableName}`, error, { data });
        throw new DatabaseError(`Failed to create ${this.tableName}`);
      }
    });
  }

  /**
   * Create multiple entities
   */
  async createMany(data: TInsert[]): Promise<TEntity[]> {
    return withQueryTiming(`${this.tableName}:createMany`, async () => {
      if (data.length === 0) return [];

      try {
        return await this.db
          .insert(this.table)
          .values(data)
          .returning();
      } catch (error) {
        logger.error(`Failed to create multiple ${this.tableName}`, error, { count: data.length });
        throw new DatabaseError(`Failed to create ${this.tableName} records`);
      }
    });
  }

  /**
   * Update entity by ID
   */
  async update(id: string, data: TUpdate): Promise<TEntity | null> {
    return withQueryTiming(`${this.tableName}:update`, async () => {
      try {
        const result = await this.db
          .update(this.table)
          .set(data)
          .where(eq(this.table.id, id))
          .returning();

        return result[0] || null;
      } catch (error) {
        logger.error(`Failed to update ${this.tableName}`, error, { id, data });
        throw new DatabaseError(`Failed to update ${this.tableName}`);
      }
    });
  }

  /**
   * Update entities with filters
   */
  async updateWhere(filters: FilterOptions, data: TUpdate): Promise<TEntity[]> {
    return withQueryTiming(`${this.tableName}:updateWhere`, async () => {
      try {
        const whereConditions = this.buildWhereConditions(filters);
        
        if (whereConditions.length === 0) {
          throw new DatabaseError('Update requires at least one filter condition');
        }

        return await this.db
          .update(this.table)
          .set(data)
          .where(and(...whereConditions))
          .returning();
      } catch (error) {
        logger.error(`Failed to update ${this.tableName} with filters`, error, { filters, data });
        throw new DatabaseError(`Failed to update ${this.tableName} records`);
      }
    });
  }

  /**
   * Delete entity by ID (soft delete if supported)
   */
  async delete(id: string): Promise<boolean> {
    return withQueryTiming(`${this.tableName}:delete`, async () => {
      try {
        // Check if table has deletedAt column for soft delete
        const hasDeletedAt = 'deletedAt' in this.table;
        
        if (hasDeletedAt) {
          const result = await this.db
            .update(this.table)
            .set({ deletedAt: new Date() } as any)
            .where(eq(this.table.id, id))
            .returning();
          
          return result.length > 0;
        } else {
          const result = await this.db
            .delete(this.table)
            .where(eq(this.table.id, id))
            .returning();
          
          return result.length > 0;
        }
      } catch (error) {
        logger.error(`Failed to delete ${this.tableName}`, error, { id });
        throw new DatabaseError(`Failed to delete ${this.tableName}`);
      }
    });
  }

  /**
   * Delete entities with filters
   */
  async deleteWhere(filters: FilterOptions): Promise<number> {
    return withQueryTiming(`${this.tableName}:deleteWhere`, async () => {
      try {
        const whereConditions = this.buildWhereConditions(filters);
        
        if (whereConditions.length === 0) {
          throw new DatabaseError('Delete requires at least one filter condition');
        }

        // Check if table has deletedAt column for soft delete
        const hasDeletedAt = 'deletedAt' in this.table;
        
        if (hasDeletedAt) {
          const result = await this.db
            .update(this.table)
            .set({ deletedAt: new Date() } as any)
            .where(and(...whereConditions))
            .returning();
          
          return result.length;
        } else {
          const result = await this.db
            .delete(this.table)
            .where(and(...whereConditions))
            .returning();
          
          return result.length;
        }
      } catch (error) {
        logger.error(`Failed to delete ${this.tableName} with filters`, error, { filters });
        throw new DatabaseError(`Failed to delete ${this.tableName} records`);
      }
    });
  }

  /**
   * Count entities with optional filters
   */
  async count(filters?: FilterOptions): Promise<number> {
    return withQueryTiming(`${this.tableName}:count`, async () => {
      try {
        let query = this.db.select({ count: count() }).from(this.table);

        if (filters && Object.keys(filters).length > 0) {
          const whereConditions = this.buildWhereConditions(filters);
          if (whereConditions.length > 0) {
            query = query.where(and(...whereConditions));
          }
        }

        const result = await query;
        return result[0]?.count || 0;
      } catch (error) {
        logger.error(`Failed to count ${this.tableName}`, error, { filters });
        throw new DatabaseError(`Failed to count ${this.tableName} records`);
      }
    });
  }

  /**
   * Find entities with cursor-based pagination for better performance
   * Especially useful for large datasets where OFFSET becomes slow
   */
  async findWithCursor(options: {
    cursor?: string;
    limit?: number;
    sortField?: string;
    sortDirection?: 'asc' | 'desc';
    filters?: FilterOptions;
  } = {}): Promise<{
    data: TEntity[];
    nextCursor?: string;
    hasMore: boolean;
  }> {
    return withQueryTiming(`${this.tableName}:findWithCursor`, async () => {
      try {
        const { cursor, limit = 50, sortField = 'createdAt', sortDirection = 'desc', filters } = options;
        const maxLimit = Math.min(limit, 100);
        
        // Build base query
        let query = this.db.select().from(this.table);
        
        // Apply filters
        const conditions = [];
        if (filters && Object.keys(filters).length > 0) {
          const whereConditions = this.buildWhereConditions(filters);
          conditions.push(...whereConditions);
        }
        
        // Apply cursor condition for pagination
        if (cursor) {
          const cursorData = this.parseCursor(cursor);
          if (cursorData && cursorData.field === sortField) {
            const column = (this.table as any)[sortField];
            if (column) {
              const cursorCondition = sortDirection === 'desc' 
                ? lt(column, cursorData.value)
                : gt(column, cursorData.value);
              conditions.push(cursorCondition);
            }
          }
        }
        
        // Apply all conditions
        if (conditions.length > 0) {
          query = query.where(and(...conditions));
        }
        
        // Apply sorting
        const sortColumn = (this.table as any)[sortField];
        if (sortColumn) {
          query = query.orderBy(sortDirection === 'desc' ? desc(sortColumn) : asc(sortColumn));
        }
        
        // Fetch one extra item to check if there's more data
        const data = await query.limit(maxLimit + 1);
        
        const hasMore = data.length > maxLimit;
        const results = hasMore ? data.slice(0, maxLimit) : data;
        
        // Generate next cursor if there's more data
        let nextCursor: string | undefined;
        if (hasMore && results.length > 0) {
          const lastItem = results[results.length - 1];
          nextCursor = this.generateCursor(lastItem, sortField);
        }
        
        return {
          data: results,
          nextCursor,
          hasMore
        };
      } catch (error) {
        logger.error(`Failed to find ${this.tableName} with cursor`, error, { options });
        throw new DatabaseError(`Failed to find ${this.tableName} records`);
      }
    });
  }

  /**
   * Generate cursor for pagination
   */
  private generateCursor(item: any, sortField: string): string {
    if (!item || !item[sortField]) {
      return '';
    }
    
    const cursorData = {
      field: sortField,
      value: item[sortField],
      id: item.id
    };
    
    return Buffer.from(JSON.stringify(cursorData)).toString('base64');
  }

  /**
   * Parse cursor data
   */
  private parseCursor(cursor: string): { field: string; value: any; id: string } | null {
    try {
      const decoded = Buffer.from(cursor, 'base64').toString('utf-8');
      return JSON.parse(decoded);
    } catch {
      return null;
    }
  }

  /**
   * Check if entity exists
   */
  async exists(filters: FilterOptions): Promise<boolean> {
    const count = await this.count(filters);
    return count > 0;
  }

  /**
   * Execute raw SQL query with proper error handling
   */
  protected async executeRawQuery<T = any>(query: string, params?: any[]): Promise<T[]> {
    return withQueryTiming(`${this.tableName}:rawQuery`, async () => {
      try {
        return await this.db.execute(sql.raw(query, params));
      } catch (error) {
        logger.error(`Raw query failed for ${this.tableName}`, error, { query, params });
        throw new DatabaseError(`Database query failed`);
      }
    });
  }

  /**
   * Build WHERE conditions from filters
   */
  protected buildWhereConditions(filters: FilterOptions): SQL[] {
    const conditions: SQL[] = [];

    for (const [key, value] of Object.entries(filters)) {
      if (value === undefined || value === null) continue;

      const column = (this.table as any)[key];
      if (!column) continue;

      if (Array.isArray(value)) {
        // IN clause for arrays
        conditions.push(sql`${column} = ANY(${value})`);
      } else if (typeof value === 'object' && value.operator) {
        // Custom operators like { operator: 'gte', value: 10 }
        switch (value.operator) {
          case 'gte':
            conditions.push(sql`${column} >= ${value.value}`);
            break;
          case 'lte':
            conditions.push(sql`${column} <= ${value.value}`);
            break;
          case 'gt':
            conditions.push(sql`${column} > ${value.value}`);
            break;
          case 'lt':
            conditions.push(sql`${column} < ${value.value}`);
            break;
          case 'like':
            conditions.push(sql`${column} ILIKE ${`%${value.value}%`}`);
            break;
          case 'not':
            conditions.push(sql`${column} != ${value.value}`);
            break;
        }
      } else {
        // Simple equality
        conditions.push(eq(column, value));
      }
    }

    return conditions;
  }

  /**
   * Transaction wrapper for complex operations
   */
  async transaction<T>(callback: (tx: PgDatabase<any>) => Promise<T>): Promise<T> {
    return withQueryTiming(`${this.tableName}:transaction`, async () => {
      try {
        return await this.db.transaction(callback);
      } catch (error) {
        logger.error(`Transaction failed for ${this.tableName}`, error);
        throw new DatabaseError(`Transaction failed`);
      }
    });
  }
}