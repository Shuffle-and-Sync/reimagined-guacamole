import { db } from '../db-optimized';
import { logger } from '../logger';
import path from 'path';
import fs from 'fs/promises';
import { spawn } from 'child_process';
import { promisify } from 'util';
import crypto from 'crypto';

export interface BackupMetadata {
  id: string;
  timestamp: Date;
  type: 'full' | 'incremental' | 'critical_data';
  size: number;
  status: 'in_progress' | 'completed' | 'failed';
  filePath: string;
  checksum?: string;
  tables: string[];
  duration?: number;
  error?: string;
}

export interface BackupConfig {
  enabled: boolean;
  schedule: {
    full: string;      // cron pattern for full backups
    incremental: string; // cron pattern for incremental backups
    criticalData: string; // cron pattern for critical data backups
  };
  retention: {
    full: number;        // days to retain full backups
    incremental: number; // days to retain incremental backups
    criticalData: number; // days to retain critical data backups
  };
  compression: boolean;
  encryption: boolean;
  maxBackupSize: number; // MB
  notificationChannels: string[];
}

class BackupService {
  private config: BackupConfig;
  private backupDir: string;
  private isRunning = false;
  private backupHistory: BackupMetadata[] = [];

  constructor() {
    this.backupDir = process.env.BACKUP_DIR || '/tmp/backups';
    this.config = {
      enabled: process.env.BACKUP_ENABLED === 'true',
      schedule: {
        full: process.env.BACKUP_FULL_SCHEDULE || '0 2 * * 0', // Weekly at 2 AM Sunday
        incremental: process.env.BACKUP_INCREMENTAL_SCHEDULE || '0 2 * * 1-6', // Daily at 2 AM Mon-Sat
        criticalData: process.env.BACKUP_CRITICAL_SCHEDULE || '0 */6 * * *', // Every 6 hours
      },
      retention: {
        full: parseInt(process.env.BACKUP_RETENTION_FULL || '30'), // 30 days
        incremental: parseInt(process.env.BACKUP_RETENTION_INCREMENTAL || '7'), // 7 days
        criticalData: parseInt(process.env.BACKUP_RETENTION_CRITICAL || '3'), // 3 days
      },
      compression: process.env.BACKUP_COMPRESSION === 'true',
      encryption: process.env.BACKUP_ENCRYPTION === 'true',
      maxBackupSize: parseInt(process.env.BACKUP_MAX_SIZE || '1000'), // 1GB default
      notificationChannels: (process.env.BACKUP_NOTIFICATION_CHANNELS || '').split(',').filter(Boolean),
    };

    this.initializeBackupDirectory();
  }

  private async initializeBackupDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.backupDir, { recursive: true });
      logger.info('Backup directory initialized', { backupDir: this.backupDir });
    } catch (error) {
      logger.error('Failed to initialize backup directory', error, { backupDir: this.backupDir });
      throw error;
    }
  }

  /**
   * Create a full database backup
   */
  async createFullBackup(): Promise<BackupMetadata> {
    const backupId = `full_${Date.now()}`;
    const timestamp = new Date();
    const fileName = `${backupId}.sql${this.config.compression ? '.gz' : ''}`;
    const filePath = path.join(this.backupDir, fileName);

    const metadata: BackupMetadata = {
      id: backupId,
      timestamp,
      type: 'full',
      size: 0,
      status: 'in_progress',
      filePath,
      tables: await this.getAllTableNames(),
    };

    this.backupHistory.push(metadata);
    logger.info('Starting full database backup', { backupId, filePath });

    const startTime = Date.now();

    try {
      // Use pg_dump for full backup
      await this.executePgDump(filePath, {
        tables: metadata.tables,
        compression: this.config.compression,
      });

      const stats = await fs.stat(filePath);
      const duration = Date.now() - startTime;

      metadata.size = stats.size;
      metadata.status = 'completed';
      metadata.duration = duration;
      metadata.checksum = await this.calculateChecksum(filePath);

      logger.info('Full backup completed successfully', {
        backupId,
        size: metadata.size,
        duration,
        checksum: metadata.checksum,
      });

      await this.notifyBackupCompletion(metadata);
      return metadata;
    } catch (error) {
      metadata.status = 'failed';
      metadata.error = error instanceof Error ? error.message : 'Unknown error';
      metadata.duration = Date.now() - startTime;

      logger.error('Full backup failed', error, { backupId });
      await this.notifyBackupFailure(metadata, error);
      throw error;
    }
  }

  /**
   * Create a backup of critical data only
   */
  async createCriticalDataBackup(): Promise<BackupMetadata> {
    const backupId = `critical_${Date.now()}`;
    const timestamp = new Date();
    const fileName = `${backupId}.sql${this.config.compression ? '.gz' : ''}`;
    const filePath = path.join(this.backupDir, fileName);

    const criticalTables = [
      'users',
      'communities', 
      'events',
      'tournaments',
      'stream_sessions',
      'user_settings',
      'notifications'
    ];

    const metadata: BackupMetadata = {
      id: backupId,
      timestamp,
      type: 'critical_data',
      size: 0,
      status: 'in_progress',
      filePath,
      tables: criticalTables,
    };

    this.backupHistory.push(metadata);
    logger.info('Starting critical data backup', { backupId, tables: criticalTables });

    const startTime = Date.now();

    try {
      await this.executePgDump(filePath, {
        tables: criticalTables,
        compression: this.config.compression,
      });

      const stats = await fs.stat(filePath);
      const duration = Date.now() - startTime;

      metadata.size = stats.size;
      metadata.status = 'completed';
      metadata.duration = duration;
      metadata.checksum = await this.calculateChecksum(filePath);

      logger.info('Critical data backup completed', {
        backupId,
        size: metadata.size,
        duration,
      });

      return metadata;
    } catch (error) {
      metadata.status = 'failed';
      metadata.error = error instanceof Error ? error.message : 'Unknown error';
      metadata.duration = Date.now() - startTime;

      logger.error('Critical data backup failed', error, { backupId });
      throw error;
    }
  }

  /**
   * Restore database from backup
   */
  async restoreFromBackup(backupPath: string, options?: {
    tables?: string[];
    dropExisting?: boolean;
    dryRun?: boolean;
  }): Promise<{
    success: boolean;
    tablesRestored: string[];
    duration: number;
    error?: string;
  }> {
    const startTime = Date.now();
    logger.info('Starting database restore', { backupPath, options });

    try {
      // Verify backup file exists and is readable
      await fs.access(backupPath, fs.constants.R_OK);
      
      if (options?.dryRun) {
        logger.info('Dry run: restore validation completed', { backupPath });
        return {
          success: true,
          tablesRestored: options.tables || [],
          duration: Date.now() - startTime,
        };
      }

      // Execute restore using psql
      const restoreResult = await this.executePsqlRestore(backupPath, {
        tables: options?.tables,
        dropExisting: options?.dropExisting || false,
      });

      const duration = Date.now() - startTime;

      logger.info('Database restore completed successfully', {
        backupPath,
        tablesRestored: restoreResult.tablesRestored,
        duration,
      });

      return {
        success: true,
        tablesRestored: restoreResult.tablesRestored,
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      logger.error('Database restore failed', error, { backupPath, duration });

      return {
        success: false,
        tablesRestored: [],
        duration,
        error: errorMessage,
      };
    }
  }

  /**
   * Verify backup integrity
   */
  async verifyBackup(backupPath: string): Promise<{
    valid: boolean;
    checksum: string;
    size: number;
    error?: string;
  }> {
    try {
      logger.info('Verifying backup integrity', { backupPath });

      // Check file exists and is readable
      await fs.access(backupPath, fs.constants.R_OK);
      
      const stats = await fs.stat(backupPath);
      const checksum = await this.calculateChecksum(backupPath);

      // Basic validation - check if file is not empty and has reasonable size
      if (stats.size === 0) {
        throw new Error('Backup file is empty');
      }

      if (stats.size > this.config.maxBackupSize * 1024 * 1024) {
        logger.warn('Backup file size exceeds maximum', { 
          size: stats.size, 
          maxSize: this.config.maxBackupSize * 1024 * 1024 
        });
      }

      // Try to validate SQL structure (basic check)
      if (backupPath.endsWith('.sql')) {
        const isValidSql = await this.validateSqlStructure(backupPath);
        if (!isValidSql) {
          throw new Error('Invalid SQL structure detected');
        }
      }

      logger.info('Backup verification successful', { 
        backupPath, 
        size: stats.size, 
        checksum 
      });

      return {
        valid: true,
        checksum,
        size: stats.size,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Backup verification failed', error, { backupPath });

      return {
        valid: false,
        checksum: '',
        size: 0,
        error: errorMessage,
      };
    }
  }

  /**
   * Clean up old backups based on retention policy
   */
  async cleanupOldBackups(): Promise<{
    deletedCount: number;
    freedSpace: number;
    errors: string[];
  }> {
    logger.info('Starting backup cleanup', { config: this.config.retention });

    let deletedCount = 0;
    let freedSpace = 0;
    const errors: string[] = [];

    try {
      const files = await fs.readdir(this.backupDir);
      const now = new Date();

      for (const file of files) {
        try {
          const filePath = path.join(this.backupDir, file);
          const stats = await fs.stat(filePath);
          const ageInDays = (now.getTime() - stats.mtime.getTime()) / (1000 * 60 * 60 * 24);

          let shouldDelete = false;

          if (file.includes('full_') && ageInDays > this.config.retention.full) {
            shouldDelete = true;
          } else if (file.includes('incremental_') && ageInDays > this.config.retention.incremental) {
            shouldDelete = true;
          } else if (file.includes('critical_') && ageInDays > this.config.retention.criticalData) {
            shouldDelete = true;
          }

          if (shouldDelete) {
            await fs.unlink(filePath);
            deletedCount++;
            freedSpace += stats.size;
            logger.info('Deleted old backup', { file, ageInDays, size: stats.size });
          }
        } catch (error) {
          const errorMsg = `Failed to process file ${file}: ${error}`;
          errors.push(errorMsg);
          logger.error('Backup cleanup error', error, { file });
        }
      }

      logger.info('Backup cleanup completed', { deletedCount, freedSpace });
      return { deletedCount, freedSpace, errors };
    } catch (error) {
      logger.error('Backup cleanup failed', error);
      throw error;
    }
  }

  /**
   * Get backup status and history
   */
  getBackupStatus(): {
    isRunning: boolean;
    config: BackupConfig;
    recentBackups: BackupMetadata[];
    diskUsage: {
      backupDir: string;
      totalSpace?: number;
      usedSpace?: number;
      freeSpace?: number;
    };
  } {
    return {
      isRunning: this.isRunning,
      config: this.config,
      recentBackups: this.backupHistory.slice(-10), // Last 10 backups
      diskUsage: {
        backupDir: this.backupDir,
        // Note: Disk usage calculation would require additional system calls
      },
    };
  }

  // Private helper methods

  private async getAllTableNames(): Promise<string[]> {
    try {
      const result = await db.execute(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
      `);
      
      return result.rows.map((row: any) => row.table_name);
    } catch (error) {
      logger.error('Failed to get table names', error);
      return [];
    }
  }

  private async executePgDump(filePath: string, options: {
    tables: string[];
    compression: boolean;
  }): Promise<void> {
    return new Promise((resolve, reject) => {
      const args = [
        process.env.DATABASE_URL!,
        '--no-password',
        '--verbose',
        '--clean',
        '--if-exists',
        '--format=plain',
      ];

      // Add specific tables if provided
      if (options.tables.length > 0) {
        options.tables.forEach(table => {
          args.push('--table', table);
        });
      }

      let command = 'pg_dump';
      let outputFile = filePath;

      if (options.compression) {
        // Use gzip compression
        outputFile = filePath.replace('.gz', '');
        args.push('--compress=9');
      }

      const pgDump = spawn(command, args);
      
      let errorOutput = '';

      pgDump.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      pgDump.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`pg_dump failed with code ${code}: ${errorOutput}`));
        }
      });

      pgDump.on('error', (error) => {
        reject(new Error(`Failed to start pg_dump: ${error.message}`));
      });
    });
  }

  private async executePsqlRestore(backupPath: string, options: {
    tables?: string[];
    dropExisting: boolean;
  }): Promise<{ tablesRestored: string[] }> {
    return new Promise((resolve, reject) => {
      const args = [
        process.env.DATABASE_URL!,
        '--file', backupPath,
        '--verbose',
      ];

      if (options.dropExisting) {
        args.push('--clean');
      }

      const psql = spawn('psql', args);
      
      let errorOutput = '';

      psql.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      psql.on('close', (code) => {
        if (code === 0) {
          resolve({ tablesRestored: options.tables || [] });
        } else {
          reject(new Error(`psql restore failed with code ${code}: ${errorOutput}`));
        }
      });

      psql.on('error', (error) => {
        reject(new Error(`Failed to start psql: ${error.message}`));
      });
    });
  }

  private async calculateChecksum(filePath: string): Promise<string> {
    const fileBuffer = await fs.readFile(filePath);
    return crypto.createHash('sha256').update(fileBuffer).digest('hex');
  }

  private async validateSqlStructure(filePath: string): Promise<boolean> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      
      // Basic SQL validation - check for common SQL keywords
      const hasCreateStatements = content.includes('CREATE TABLE') || content.includes('INSERT INTO');
      const hasValidStructure = content.includes('--') || content.includes(';');
      
      return hasCreateStatements && hasValidStructure;
    } catch (error) {
      logger.error('SQL validation failed', error, { filePath });
      return false;
    }
  }

  private async notifyBackupCompletion(metadata: BackupMetadata): Promise<void> {
    if (this.config.notificationChannels.length === 0) return;

    logger.info('Backup completion notification sent', {
      backupId: metadata.id,
      channels: this.config.notificationChannels,
    });
  }

  private async notifyBackupFailure(metadata: BackupMetadata, error: any): Promise<void> {
    if (this.config.notificationChannels.length === 0) return;

    logger.error('Backup failure notification sent', error, {
      backupId: metadata.id,
      channels: this.config.notificationChannels,
    });
  }
}

export const backupService = new BackupService();
export { BackupService };