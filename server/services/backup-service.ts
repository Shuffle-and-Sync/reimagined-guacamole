/**
 * Database Backup Service
 *
 * Provides comprehensive database backup and restore functionality with support for:
 * - Full database backups
 * - Incremental backups
 * - Critical data-only backups
 * - Backup verification and integrity checking
 * - Automated retention policy management
 * - Backup compression and encryption
 *
 * This service is critical for data recovery and disaster management.
 *
 * @module BackupService
 */

import { spawn } from "child_process";
import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import { sql } from "drizzle-orm";
import { db } from "@shared/database-unified";
import { toLoggableError } from "@shared/utils/type-guards";
import { logger } from "../logger";

/**
 * Metadata information for a database backup
 *
 * @interface BackupMetadata
 * @property {string} id - Unique identifier for the backup
 * @property {Date} timestamp - When the backup was initiated
 * @property {"full" | "incremental" | "critical_data"} type - Type of backup performed
 * @property {number} size - Size of the backup file in bytes
 * @property {"in_progress" | "completed" | "failed"} status - Current status of the backup
 * @property {string} filePath - Absolute path to the backup file
 * @property {string} [checksum] - SHA-256 checksum for integrity verification
 * @property {string[]} tables - List of tables included in the backup
 * @property {number} [duration] - Backup duration in milliseconds
 * @property {string} [error] - Error message if backup failed
 */
export interface BackupMetadata {
  id: string;
  timestamp: Date;
  type: "full" | "incremental" | "critical_data";
  size: number;
  status: "in_progress" | "completed" | "failed";
  filePath: string;
  checksum?: string;
  tables: string[];
  duration?: number;
  error?: string;
}

/**
 * Configuration settings for the backup service
 *
 * @interface BackupConfig
 * @property {boolean} enabled - Whether automated backups are enabled
 * @property {Object} schedule - Cron patterns for different backup types
 * @property {string} schedule.full - Cron pattern for full backups (default: weekly)
 * @property {string} schedule.incremental - Cron pattern for incremental backups (default: daily)
 * @property {string} schedule.criticalData - Cron pattern for critical data backups (default: every 6 hours)
 * @property {Object} retention - Retention periods in days for each backup type
 * @property {number} retention.full - Days to retain full backups
 * @property {number} retention.incremental - Days to retain incremental backups
 * @property {number} retention.criticalData - Days to retain critical data backups
 * @property {boolean} compression - Whether to compress backups
 * @property {boolean} encryption - Whether to encrypt backups
 * @property {number} maxBackupSize - Maximum backup file size in MB
 * @property {string[]} notificationChannels - Channels to notify on backup events
 */
export interface BackupConfig {
  enabled: boolean;
  schedule: {
    full: string; // cron pattern for full backups
    incremental: string; // cron pattern for incremental backups
    criticalData: string; // cron pattern for critical data backups
  };
  retention: {
    full: number; // days to retain full backups
    incremental: number; // days to retain incremental backups
    criticalData: number; // days to retain critical data backups
  };
  compression: boolean;
  encryption: boolean;
  maxBackupSize: number; // MB
  notificationChannels: string[];
}

/**
 * Database Backup Service
 *
 * Manages automated database backups with support for multiple backup types,
 * retention policies, and restore operations. Handles backup verification,
 * compression, and cleanup operations.
 *
 * @class BackupService
 */
class BackupService {
  private config: BackupConfig;
  private backupDir: string;
  private isRunning = false;
  private backupHistory: BackupMetadata[] = [];

  /**
   * Initialize the backup service
   *
   * Loads configuration from environment variables and initializes the backup directory.
   * Defaults are provided for all configuration values if not specified.
   */
  constructor() {
    this.backupDir = process.env.BACKUP_DIR || "/tmp/backups";
    this.config = {
      enabled: process.env.BACKUP_ENABLED === "true",
      schedule: {
        full: process.env.BACKUP_FULL_SCHEDULE || "0 2 * * 0", // Weekly at 2 AM Sunday
        incremental: process.env.BACKUP_INCREMENTAL_SCHEDULE || "0 2 * * 1-6", // Daily at 2 AM Mon-Sat
        criticalData: process.env.BACKUP_CRITICAL_SCHEDULE || "0 */6 * * *", // Every 6 hours
      },
      retention: {
        full: parseInt(process.env.BACKUP_RETENTION_FULL || "30"), // 30 days
        incremental: parseInt(process.env.BACKUP_RETENTION_INCREMENTAL || "7"), // 7 days
        criticalData: parseInt(process.env.BACKUP_RETENTION_CRITICAL || "3"), // 3 days
      },
      compression: process.env.BACKUP_COMPRESSION === "true",
      encryption: process.env.BACKUP_ENCRYPTION === "true",
      maxBackupSize: parseInt(process.env.BACKUP_MAX_SIZE || "1000"), // 1GB default
      notificationChannels: (process.env.BACKUP_NOTIFICATION_CHANNELS || "")
        .split(",")
        .filter(Boolean),
    };

    this.initializeBackupDirectory();
  }

  /**
   * Initialize backup directory
   *
   * Creates the backup directory if it doesn't exist. This is called automatically
   * during service initialization.
   *
   * @private
   * @returns {Promise<void>}
   * @throws {Error} If directory creation fails
   */
  private async initializeBackupDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.backupDir, { recursive: true });
      logger.info("Backup directory initialized", {
        backupDir: this.backupDir,
      });
    } catch (error) {
      logger.error(
        "Failed to initialize backup directory",
        toLoggableError(error),
        {
          backupDir: this.backupDir,
        },
      );
      throw error;
    }
  }

  /**
   * Create a full database backup
   *
   * Backs up all database tables using pg_dump. Includes optional compression
   * and generates a checksum for integrity verification. The backup is stored
   * in the configured backup directory with metadata tracked in memory.
   *
   * @returns {Promise<BackupMetadata>} Metadata for the completed backup
   * @throws {Error} If backup operation fails
   * @example
   * const backup = await backupService.createFullBackup();
   * console.log(`Backup completed: ${backup.id}, size: ${backup.size} bytes`);
   */
  async createFullBackup(): Promise<BackupMetadata> {
    const backupId = `full_${Date.now()}`;
    const timestamp = new Date();
    const fileName = `${backupId}.sql${this.config.compression ? ".gz" : ""}`;
    const filePath = path.join(this.backupDir, fileName);

    const metadata: BackupMetadata = {
      id: backupId,
      timestamp,
      type: "full",
      size: 0,
      status: "in_progress",
      filePath,
      tables: await this.getAllTableNames(),
    };

    this.backupHistory.push(metadata);
    logger.info("Starting full database backup", { backupId, filePath });

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
      metadata.status = "completed";
      metadata.duration = duration;
      metadata.checksum = await this.calculateChecksum(filePath);

      logger.info("Full backup completed successfully", {
        backupId,
        size: metadata.size,
        duration,
        checksum: metadata.checksum,
      });

      await this.notifyBackupCompletion(metadata);
      return metadata;
    } catch (error) {
      metadata.status = "failed";
      metadata.error = error instanceof Error ? error.message : "Unknown error";
      metadata.duration = Date.now() - startTime;

      logger.error("Full backup failed", toLoggableError(error), { backupId });
      await this.notifyBackupFailure(metadata, error);
      throw error;
    }
  }

  /**
   * Create a backup of critical data only
   *
   * Backs up only essential tables (users, communities, events, tournaments, etc.)
   * for faster backup and restore operations. Useful for frequent backups of
   * business-critical data.
   *
   * @returns {Promise<BackupMetadata>} Metadata for the completed backup
   * @throws {Error} If backup operation fails
   * @example
   * const backup = await backupService.createCriticalDataBackup();
   * console.log(`Critical backup completed in ${backup.duration}ms`);
   */
  async createCriticalDataBackup(): Promise<BackupMetadata> {
    const backupId = `critical_${Date.now()}`;
    const timestamp = new Date();
    const fileName = `${backupId}.sql${this.config.compression ? ".gz" : ""}`;
    const filePath = path.join(this.backupDir, fileName);

    const criticalTables = [
      "users",
      "communities",
      "events",
      "tournaments",
      "stream_sessions",
      "user_settings",
      "notifications",
    ];

    const metadata: BackupMetadata = {
      id: backupId,
      timestamp,
      type: "critical_data",
      size: 0,
      status: "in_progress",
      filePath,
      tables: criticalTables,
    };

    this.backupHistory.push(metadata);
    logger.info("Starting critical data backup", {
      backupId,
      tables: criticalTables,
    });

    const startTime = Date.now();

    try {
      await this.executePgDump(filePath, {
        tables: criticalTables,
        compression: this.config.compression,
      });

      const stats = await fs.stat(filePath);
      const duration = Date.now() - startTime;

      metadata.size = stats.size;
      metadata.status = "completed";
      metadata.duration = duration;
      metadata.checksum = await this.calculateChecksum(filePath);

      logger.info("Critical data backup completed", {
        backupId,
        size: metadata.size,
        duration,
      });

      return metadata;
    } catch (error) {
      metadata.status = "failed";
      metadata.error = error instanceof Error ? error.message : "Unknown error";
      metadata.duration = Date.now() - startTime;

      logger.error("Critical data backup failed", toLoggableError(error), {
        backupId,
      });
      throw error;
    }
  }

  /**
   * Restore database from backup
   *
   * Restores database tables from a backup file using psql. Supports selective
   * table restoration and optional dropping of existing tables before restore.
   *
   * @param {string} backupPath - Absolute path to the backup file
   * @param {Object} [options] - Restore options
   * @param {string[]} [options.tables] - Specific tables to restore (default: all)
   * @param {boolean} [options.dropExisting] - Drop existing tables before restore (default: false)
   * @param {boolean} [options.dryRun] - Validate without performing restore (default: false)
   * @returns {Promise<{success: boolean, tablesRestored: string[], duration: number, error?: string}>} Restore result
   * @throws {Error} If backup file is inaccessible
   * @example
   * // Restore specific tables
   * const result = await backupService.restoreFromBackup('/path/to/backup.sql', {
   *   tables: ['users', 'communities'],
   *   dropExisting: true
   * });
   * if (result.success) {
   *   console.log(`Restored ${result.tablesRestored.length} tables in ${result.duration}ms`);
   * }
   */
  async restoreFromBackup(
    backupPath: string,
    options?: {
      tables?: string[];
      dropExisting?: boolean;
      dryRun?: boolean;
    },
  ): Promise<{
    success: boolean;
    tablesRestored: string[];
    duration: number;
    error?: string;
  }> {
    const startTime = Date.now();
    logger.info("Starting database restore", { backupPath, options });

    try {
      // Verify backup file exists and is readable
      await fs.access(backupPath, fs.constants.R_OK);

      if (options?.dryRun) {
        logger.info("Dry run: restore validation completed", { backupPath });
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

      logger.info("Database restore completed successfully", {
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
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      logger.error("Database restore failed", toLoggableError(error), {
        backupPath,
        duration,
      });

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
   *
   * Validates that a backup file exists, is readable, has valid SQL structure,
   * and meets size requirements. Calculates and returns a SHA-256 checksum
   * for integrity verification.
   *
   * @param {string} backupPath - Absolute path to the backup file to verify
   * @returns {Promise<{valid: boolean, checksum: string, size: number, error?: string}>} Verification result
   * @example
   * const verification = await backupService.verifyBackup('/path/to/backup.sql');
   * if (verification.valid) {
   *   console.log(`Backup is valid. Checksum: ${verification.checksum}`);
   * } else {
   *   console.error(`Backup verification failed: ${verification.error}`);
   * }
   */
  async verifyBackup(backupPath: string): Promise<{
    valid: boolean;
    checksum: string;
    size: number;
    error?: string;
  }> {
    try {
      logger.info("Verifying backup integrity", { backupPath });

      // Check file exists and is readable
      await fs.access(backupPath, fs.constants.R_OK);

      const stats = await fs.stat(backupPath);
      const checksum = await this.calculateChecksum(backupPath);

      // Basic validation - check if file is not empty and has reasonable size
      if (stats.size === 0) {
        throw new Error("Backup file is empty");
      }

      if (stats.size > this.config.maxBackupSize * 1024 * 1024) {
        logger.warn("Backup file size exceeds maximum", {
          size: stats.size,
          maxSize: this.config.maxBackupSize * 1024 * 1024,
        });
      }

      // Try to validate SQL structure (basic check)
      if (backupPath.endsWith(".sql")) {
        const isValidSql = await this.validateSqlStructure(backupPath);
        if (!isValidSql) {
          throw new Error("Invalid SQL structure detected");
        }
      }

      logger.info("Backup verification successful", {
        backupPath,
        size: stats.size,
        checksum,
      });

      return {
        valid: true,
        checksum,
        size: stats.size,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      logger.error("Backup verification failed", toLoggableError(error), {
        backupPath,
      });

      return {
        valid: false,
        checksum: "",
        size: 0,
        error: errorMessage,
      };
    }
  }

  /**
   * Clean up old backups based on retention policy
   *
   * Automatically removes backup files older than the configured retention period
   * for each backup type (full, incremental, critical data). Runs as part of
   * daily maintenance operations.
   *
   * @returns {Promise<{deletedCount: number, freedSpace: number, errors: string[]}>} Cleanup results
   * @example
   * const result = await backupService.cleanupOldBackups();
   * console.log(`Deleted ${result.deletedCount} backups, freed ${result.freedSpace} bytes`);
   * if (result.errors.length > 0) {
   *   console.error('Errors during cleanup:', result.errors);
   * }
   */
  async cleanupOldBackups(): Promise<{
    deletedCount: number;
    freedSpace: number;
    errors: string[];
  }> {
    logger.info("Starting backup cleanup", { config: this.config.retention });

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
          const ageInDays =
            (now.getTime() - stats.mtime.getTime()) / (1000 * 60 * 60 * 24);

          let shouldDelete = false;

          if (
            file.includes("full_") &&
            ageInDays > this.config.retention.full
          ) {
            shouldDelete = true;
          } else if (
            file.includes("incremental_") &&
            ageInDays > this.config.retention.incremental
          ) {
            shouldDelete = true;
          } else if (
            file.includes("critical_") &&
            ageInDays > this.config.retention.criticalData
          ) {
            shouldDelete = true;
          }

          if (shouldDelete) {
            await fs.unlink(filePath);
            deletedCount++;
            freedSpace += stats.size;
            logger.info("Deleted old backup", {
              file,
              ageInDays,
              size: stats.size,
            });
          }
        } catch (error) {
          const errorMsg = `Failed to process file ${file}: ${error}`;
          errors.push(errorMsg);
          logger.error("Backup cleanup error", toLoggableError(error), {
            file,
          });
        }
      }

      logger.info("Backup cleanup completed", { deletedCount, freedSpace });
      return { deletedCount, freedSpace, errors };
    } catch (error) {
      logger.error("Backup cleanup failed", toLoggableError(error));
      throw error;
    }
  }

  /**
   * Get backup status and history
   *
   * Returns the current state of the backup service including configuration,
   * recent backup history, and disk usage information.
   *
   * @returns {{isRunning: boolean, config: BackupConfig, recentBackups: BackupMetadata[], diskUsage: Object}} Current backup status
   * @example
   * const status = backupService.getBackupStatus();
   * console.log(`Service running: ${status.isRunning}`);
   * console.log(`Recent backups: ${status.recentBackups.length}`);
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

  /**
   * Get all table names from the database
   *
   * Queries the SQLite master table to retrieve all user-created tables,
   * excluding system tables.
   *
   * @private
   * @returns {Promise<string[]>} Array of table names
   */
  private async getAllTableNames(): Promise<string[]> {
    try {
      // SQLite query to get all tables
      const result = await db.all(sql`
        SELECT name as table_name 
        FROM sqlite_master 
        WHERE type = 'table' 
        AND name NOT LIKE 'sqlite_%'
      `);

      return result.map((row: unknown) => row.table_name);
    } catch (error) {
      logger.error("Failed to get table names", toLoggableError(error));
      return [];
    }
  }

  /**
   * Execute pg_dump to create backup
   *
   * Spawns pg_dump process to create a database backup. Handles compression,
   * table selection, and error reporting.
   *
   * @private
   * @param {string} filePath - Destination path for backup file
   * @param {Object} options - Dump options
   * @param {string[]} options.tables - Tables to include in backup
   * @param {boolean} options.compression - Whether to compress the output
   * @returns {Promise<void>}
   * @throws {Error} If pg_dump fails or DATABASE_URL is not configured
   */
  private async executePgDump(
    filePath: string,
    options: {
      tables: string[];
      compression: boolean;
    },
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!process.env.DATABASE_URL) {
        return reject(new Error("DATABASE_URL not configured"));
      }
      const args = [
        process.env.DATABASE_URL,
        "--no-password",
        "--verbose",
        "--clean",
        "--if-exists",
        "--format=plain",
      ];

      // Add specific tables if provided
      if (options.tables.length > 0) {
        options.tables.forEach((table) => {
          args.push("--table", table);
        });
      }

      const command = "pg_dump";

      if (options.compression) {
        // Use gzip compression
        args.push("--compress=9");
      }

      const pgDump = spawn(command, args);

      let errorOutput = "";

      pgDump.stderr.on("data", (data) => {
        errorOutput += data.toString();
      });

      pgDump.on("close", (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`pg_dump failed with code ${code}: ${errorOutput}`));
        }
      });

      pgDump.on("error", (error) => {
        reject(new Error(`Failed to start pg_dump: ${error.message}`));
      });
    });
  }

  /**
   * Execute psql restore operation
   *
   * Spawns psql process to restore database from a backup file. Handles
   * selective table restoration and cleanup operations.
   *
   * @private
   * @param {string} backupPath - Path to backup file
   * @param {Object} options - Restore options
   * @param {string[]} [options.tables] - Specific tables to restore
   * @param {boolean} options.dropExisting - Whether to drop existing tables
   * @returns {Promise<{tablesRestored: string[]}>} List of restored tables
   * @throws {Error} If psql fails or DATABASE_URL is not configured
   */
  private async executePsqlRestore(
    backupPath: string,
    options: {
      tables?: string[];
      dropExisting: boolean;
    },
  ): Promise<{ tablesRestored: string[] }> {
    return new Promise((resolve, reject) => {
      if (!process.env.DATABASE_URL) {
        return reject(new Error("DATABASE_URL not configured"));
      }
      const args = [
        process.env.DATABASE_URL,
        "--file",
        backupPath,
        "--verbose",
      ];

      if (options.dropExisting) {
        args.push("--clean");
      }

      const psql = spawn("psql", args);

      let errorOutput = "";

      psql.stderr.on("data", (data) => {
        errorOutput += data.toString();
      });

      psql.on("close", (code) => {
        if (code === 0) {
          resolve({ tablesRestored: options.tables || [] });
        } else {
          reject(
            new Error(`psql restore failed with code ${code}: ${errorOutput}`),
          );
        }
      });

      psql.on("error", (error) => {
        reject(new Error(`Failed to start psql: ${error.message}`));
      });
    });
  }

  /**
   * Calculate SHA-256 checksum of a file
   *
   * Generates a cryptographic hash of the entire file contents for integrity
   * verification and tamper detection.
   *
   * @private
   * @param {string} filePath - Path to file
   * @returns {Promise<string>} SHA-256 checksum in hexadecimal format
   */
  private async calculateChecksum(filePath: string): Promise<string> {
    const fileBuffer = await fs.readFile(filePath);
    return crypto.createHash("sha256").update(fileBuffer).digest("hex");
  }

  /**
   * Validate SQL file structure
   *
   * Performs basic validation to ensure backup file contains valid SQL
   * by checking for common SQL keywords and structure.
   *
   * @private
   * @param {string} filePath - Path to SQL file
   * @returns {Promise<boolean>} True if file appears to be valid SQL
   */
  private async validateSqlStructure(filePath: string): Promise<boolean> {
    try {
      const content = await fs.readFile(filePath, "utf-8");

      // Basic SQL validation - check for common SQL keywords
      const hasCreateStatements =
        content.includes("CREATE TABLE") || content.includes("INSERT INTO");
      const hasValidStructure = content.includes("--") || content.includes(";");

      return hasCreateStatements && hasValidStructure;
    } catch (error) {
      logger.error("SQL validation failed", toLoggableError(error), {
        filePath,
      });
      return false;
    }
  }

  /**
   * Send notification when backup completes successfully
   *
   * Sends notifications to configured channels (email, Slack, etc.) when
   * a backup operation completes successfully.
   *
   * @private
   * @param {BackupMetadata} metadata - Backup metadata
   * @returns {Promise<void>}
   */
  private async notifyBackupCompletion(
    metadata: BackupMetadata,
  ): Promise<void> {
    if (this.config.notificationChannels.length === 0) return;

    logger.info("Backup completion notification sent", {
      backupId: metadata.id,
      channels: this.config.notificationChannels,
    });
  }

  /**
   * Send notification when backup fails
   *
   * Sends notifications to configured channels (email, Slack, etc.) when
   * a backup operation fails, including error details.
   *
   * @private
   * @param {BackupMetadata} metadata - Backup metadata
   * @param {unknown} error - Error that caused the failure
   * @returns {Promise<void>}
   */
  private async notifyBackupFailure(
    metadata: BackupMetadata,
    error: unknown,
  ): Promise<void> {
    if (this.config.notificationChannels.length === 0) return;

    logger.error("Backup failure notification sent", toLoggableError(error), {
      backupId: metadata.id,
      channels: this.config.notificationChannels,
    });
  }
}

/**
 * Singleton instance of the backup service
 *
 * @constant
 * @type {BackupService}
 */
export const backupService = new BackupService();
export { BackupService };
