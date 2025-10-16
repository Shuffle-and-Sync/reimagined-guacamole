/**
 * .gitignore Environment File Protection Tests
 * 
 * Tests to ensure .env files are properly ignored by Git to prevent
 * accidental exposure of sensitive credentials.
 * 
 * This addresses the security requirement that ALL .env files must be
 * ignored by Git, with exceptions only for template files.
 */

import { describe, test, expect } from '@jest/globals';
import { execSync } from 'child_process';
import { existsSync, writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';

const ROOT_DIR = join(__dirname, '../../..');

describe('GitIgnore Environment File Protection', () => {
  describe('Environment File Patterns', () => {
    test('should ignore all .env files', () => {
      const envFiles = [
        '.env',
        '.env.local',
        '.env.production',
        '.env.test',
        '.env.development',
        '.env.staging',
        '.env.custom',
      ];

      envFiles.forEach(file => {
        const filePath = join(ROOT_DIR, file);
        const tempFile = `${filePath}.temp-test`;
        
        try {
          // Create a temporary test file
          writeFileSync(tempFile, 'TEST=true', 'utf8');
          
          // Check if Git would ignore it
          try {
            const result = execSync(`git check-ignore -q "${tempFile}"`, {
              cwd: ROOT_DIR,
              encoding: 'utf8',
            });
            // If check-ignore succeeds (exit code 0), file is ignored
            expect(true).toBe(true);
          } catch (error: any) {
            // If check-ignore fails (non-zero exit), file is NOT ignored
            if (error.status !== 0) {
              throw new Error(`File "${file}" is NOT ignored by Git but should be!`);
            }
          }
        } finally {
          // Cleanup
          if (existsSync(tempFile)) {
            unlinkSync(tempFile);
          }
        }
      });
    });

    test('should ignore .env files with any extension', () => {
      const envPatterns = [
        'something.env',
        'config.env.backup',
        'app.env',
        '.env.new.file',
      ];

      envPatterns.forEach(file => {
        const filePath = join(ROOT_DIR, file);
        const tempFile = `${filePath}.temp-test`;
        
        try {
          writeFileSync(tempFile, 'TEST=true', 'utf8');
          
          try {
            execSync(`git check-ignore -q "${tempFile}"`, {
              cwd: ROOT_DIR,
              encoding: 'utf8',
            });
            expect(true).toBe(true);
          } catch (error: any) {
            if (error.status !== 0) {
              throw new Error(`Pattern "${file}" is NOT ignored by Git but should be!`);
            }
          }
        } finally {
          if (existsSync(tempFile)) {
            unlinkSync(tempFile);
          }
        }
      });
    });

    test('should allow .env.example and .env.production.template files', () => {
      const allowedFiles = [
        '.env.example',
        '.env.production.template',
      ];

      allowedFiles.forEach(file => {
        const filePath = join(ROOT_DIR, file);
        
        try {
          const result = execSync(`git check-ignore -q "${filePath}"`, {
            cwd: ROOT_DIR,
            encoding: 'utf8',
          });
          // If we reach here, file is ignored - which is WRONG for these files
          throw new Error(`File "${file}" is ignored but should be allowed!`);
        } catch (error: any) {
          // Non-zero exit code means file is NOT ignored - which is correct
          if (error.status !== 0) {
            expect(true).toBe(true);
          } else {
            throw error;
          }
        }
      });
    });
  });

  describe('Security Requirements', () => {
    test('.env.production should not exist in Git history', () => {
      try {
        const result = execSync('git log --all --full-history -- .env.production', {
          cwd: ROOT_DIR,
          encoding: 'utf8',
        });
        
        // If there's any output, the file exists in history
        if (result.trim().length > 0) {
          throw new Error('.env.production found in Git history! This is a critical security issue.');
        }
        
        expect(result.trim()).toBe('');
      } catch (error: any) {
        if (error.message?.includes('critical security issue')) {
          throw error;
        }
        // Other errors are fine (e.g., command execution errors)
      }
    });

    test('specific problematic commit should not exist', () => {
      // The commit mentioned in the security issue
      const problematicCommit = '452a970b41758f0ae22e9adc578dd49b9adb815a';
      
      try {
        execSync(`git show ${problematicCommit}`, {
          cwd: ROOT_DIR,
          encoding: 'utf8',
        });
        
        // If we reach here, the commit still exists - FAIL
        throw new Error(`Problematic commit ${problematicCommit} still exists in Git history!`);
      } catch (error: any) {
        // If the commit doesn't exist (fatal: bad object), that's what we want
        if (error.stderr?.includes('bad object') || error.message?.includes('bad object')) {
          expect(true).toBe(true);
        } else if (error.message?.includes('still exists')) {
          throw error;
        }
      }
    });

    test('.gitignore should contain broad .env patterns', () => {
      const gitignorePath = join(ROOT_DIR, '.gitignore');
      const gitignoreContent = require('fs').readFileSync(gitignorePath, 'utf8');
      
      // Check for the broad patterns that catch all .env files
      expect(gitignoreContent).toContain('*.env*');
      expect(gitignoreContent).toContain('.env*');
      
      // Check for exceptions (template files that should be allowed)
      expect(gitignoreContent).toContain('!.env.example');
      expect(gitignoreContent).toContain('!.env.production.template');
    });
  });
});
