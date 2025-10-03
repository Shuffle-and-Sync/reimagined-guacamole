import { Request, Response, NextFunction } from 'express';
import { storage } from '../storage';
import { getAuthUserId } from '../auth';
import { logger } from '../logger';

// Permission constants for admin operations
export const ADMIN_PERMISSIONS = {
  // User management
  USER_VIEW: 'user:view',
  USER_EDIT: 'user:edit',
  USER_DELETE: 'user:delete',
  USER_BAN: 'user:ban',
  USER_UNBAN: 'user:unban',
  
  // Role management
  ROLE_VIEW: 'role:view',
  ROLE_ASSIGN: 'role:assign',
  ROLE_REVOKE: 'role:revoke',
  ROLE_CREATE: 'role:create',
  
  // Content moderation
  CONTENT_VIEW_REPORTS: 'content:view_reports',
  CONTENT_MODERATE: 'content:moderate',
  CONTENT_DELETE: 'content:delete',
  CONTENT_RESTORE: 'content:restore',
  
  // Moderation actions
  MODERATION_CREATE_ACTION: 'moderation:create_action',
  MODERATION_REVERSE_ACTION: 'moderation:reverse_action',
  MODERATION_VIEW_ACTIONS: 'moderation:view_actions',
  
  // Moderation queue
  QUEUE_VIEW: 'queue:view',
  QUEUE_ASSIGN: 'queue:assign',
  QUEUE_COMPLETE: 'queue:complete',
  QUEUE_PRIORITIZE: 'queue:prioritize',
  
  // CMS management
  CMS_VIEW: 'cms:view',
  CMS_CREATE: 'cms:create',
  CMS_EDIT: 'cms:edit',
  CMS_PUBLISH: 'cms:publish',
  CMS_DELETE: 'cms:delete',
  
  // Ban evasion
  BAN_EVASION_VIEW: 'ban_evasion:view',
  BAN_EVASION_REVIEW: 'ban_evasion:review',
  BAN_EVASION_ACTION: 'ban_evasion:action',
  
  // Appeals
  APPEAL_VIEW: 'appeal:view',
  APPEAL_ASSIGN: 'appeal:assign',
  APPEAL_REVIEW: 'appeal:review',
  APPEAL_DECIDE: 'appeal:decide',
  
  // Templates
  TEMPLATE_VIEW: 'template:view',
  TEMPLATE_CREATE: 'template:create',
  TEMPLATE_EDIT: 'template:edit',
  TEMPLATE_DELETE: 'template:delete',
  
  // Audit logs
  AUDIT_VIEW: 'audit:view',
  
  // Analytics
  ANALYTICS_VIEW: 'analytics:view',
  ANALYTICS_EXPORT: 'analytics:export',
  
  // System administration
  SYSTEM_SETTINGS: 'system:settings',
  SYSTEM_MAINTENANCE: 'system:maintenance',
  
  // Super admin (all permissions)
  SUPER_ADMIN: 'super_admin:all'
} as const;

// Role definitions with their permissions
export const ADMIN_ROLES = {
  SUPER_ADMIN: {
    name: 'super_admin',
    permissions: [ADMIN_PERMISSIONS.SUPER_ADMIN]
  },
  ADMIN: {
    name: 'admin',
    permissions: [
      ADMIN_PERMISSIONS.USER_VIEW,
      ADMIN_PERMISSIONS.USER_EDIT,
      ADMIN_PERMISSIONS.USER_BAN,
      ADMIN_PERMISSIONS.USER_UNBAN,
      ADMIN_PERMISSIONS.ROLE_VIEW,
      ADMIN_PERMISSIONS.ROLE_ASSIGN,
      ADMIN_PERMISSIONS.CONTENT_VIEW_REPORTS,
      ADMIN_PERMISSIONS.CONTENT_MODERATE,
      ADMIN_PERMISSIONS.CONTENT_DELETE,
      ADMIN_PERMISSIONS.MODERATION_CREATE_ACTION,
      ADMIN_PERMISSIONS.MODERATION_REVERSE_ACTION,
      ADMIN_PERMISSIONS.MODERATION_VIEW_ACTIONS,
      ADMIN_PERMISSIONS.QUEUE_VIEW,
      ADMIN_PERMISSIONS.QUEUE_ASSIGN,
      ADMIN_PERMISSIONS.QUEUE_COMPLETE,
      ADMIN_PERMISSIONS.CMS_VIEW,
      ADMIN_PERMISSIONS.CMS_CREATE,
      ADMIN_PERMISSIONS.CMS_EDIT,
      ADMIN_PERMISSIONS.CMS_PUBLISH,
      ADMIN_PERMISSIONS.BAN_EVASION_VIEW,
      ADMIN_PERMISSIONS.BAN_EVASION_REVIEW,
      ADMIN_PERMISSIONS.BAN_EVASION_ACTION,
      ADMIN_PERMISSIONS.APPEAL_VIEW,
      ADMIN_PERMISSIONS.APPEAL_ASSIGN,
      ADMIN_PERMISSIONS.APPEAL_REVIEW,
      ADMIN_PERMISSIONS.APPEAL_DECIDE,
      ADMIN_PERMISSIONS.TEMPLATE_VIEW,
      ADMIN_PERMISSIONS.TEMPLATE_CREATE,
      ADMIN_PERMISSIONS.TEMPLATE_EDIT,
      ADMIN_PERMISSIONS.AUDIT_VIEW,
      ADMIN_PERMISSIONS.ANALYTICS_VIEW
    ]
  },
  MODERATOR: {
    name: 'moderator',
    permissions: [
      ADMIN_PERMISSIONS.USER_VIEW,
      ADMIN_PERMISSIONS.CONTENT_VIEW_REPORTS,
      ADMIN_PERMISSIONS.CONTENT_MODERATE,
      ADMIN_PERMISSIONS.MODERATION_CREATE_ACTION,
      ADMIN_PERMISSIONS.MODERATION_VIEW_ACTIONS,
      ADMIN_PERMISSIONS.QUEUE_VIEW,
      ADMIN_PERMISSIONS.QUEUE_ASSIGN,
      ADMIN_PERMISSIONS.QUEUE_COMPLETE,
      ADMIN_PERMISSIONS.TEMPLATE_VIEW,
      ADMIN_PERMISSIONS.TEMPLATE_CREATE,
      ADMIN_PERMISSIONS.APPEAL_VIEW,
      ADMIN_PERMISSIONS.APPEAL_REVIEW
    ]
  },
  TRUST_SAFETY: {
    name: 'trust_safety',
    permissions: [
      ADMIN_PERMISSIONS.USER_VIEW,
      ADMIN_PERMISSIONS.USER_BAN,
      ADMIN_PERMISSIONS.USER_UNBAN,
      ADMIN_PERMISSIONS.CONTENT_VIEW_REPORTS,
      ADMIN_PERMISSIONS.CONTENT_MODERATE,
      ADMIN_PERMISSIONS.CONTENT_DELETE,
      ADMIN_PERMISSIONS.MODERATION_CREATE_ACTION,
      ADMIN_PERMISSIONS.MODERATION_VIEW_ACTIONS,
      ADMIN_PERMISSIONS.BAN_EVASION_VIEW,
      ADMIN_PERMISSIONS.BAN_EVASION_REVIEW,
      ADMIN_PERMISSIONS.BAN_EVASION_ACTION,
      ADMIN_PERMISSIONS.QUEUE_VIEW,
      ADMIN_PERMISSIONS.QUEUE_ASSIGN,
      ADMIN_PERMISSIONS.QUEUE_COMPLETE,
      ADMIN_PERMISSIONS.QUEUE_PRIORITIZE,
      ADMIN_PERMISSIONS.TEMPLATE_VIEW,
      ADMIN_PERMISSIONS.AUDIT_VIEW
    ]
  },
  COMMUNITY_MANAGER: {
    name: 'community_manager',
    permissions: [
      ADMIN_PERMISSIONS.USER_VIEW,
      ADMIN_PERMISSIONS.CONTENT_VIEW_REPORTS,
      ADMIN_PERMISSIONS.CONTENT_MODERATE,
      ADMIN_PERMISSIONS.CMS_VIEW,
      ADMIN_PERMISSIONS.CMS_CREATE,
      ADMIN_PERMISSIONS.CMS_EDIT,
      ADMIN_PERMISSIONS.CMS_PUBLISH,
      ADMIN_PERMISSIONS.TEMPLATE_VIEW,
      ADMIN_PERMISSIONS.TEMPLATE_CREATE,
      ADMIN_PERMISSIONS.TEMPLATE_EDIT,
      ADMIN_PERMISSIONS.ANALYTICS_VIEW
    ]
  }
} as const;

// Helper function to check if user has any admin role
export async function hasAdminRole(userId: string): Promise<boolean> {
  try {
    const userRoles = await storage.getUserRoles(userId);
    return userRoles.some(role => 
      role.isActive && Object.values(ADMIN_ROLES).some(adminRole => 
        adminRole.name === role.role
      )
    );
  } catch (error) {
    logger.error('Error checking admin role', error, { 
        userId,
        operation: 'checking_admin_role'
      });
    return false;
  }
}

// Helper function to check if user has specific permission
export async function hasPermission(userId: string, permission: string): Promise<boolean> {
  try {
    // Get user's roles
    const userRoles = await storage.getUserRoles(userId);
    
    // Check if user has any active roles
    const activeRoles = userRoles.filter(role => role.isActive);
    
    for (const userRole of activeRoles) {
      // Check if user has super admin permission (grants all)
      if (userRole.role === ADMIN_ROLES.SUPER_ADMIN.name) {
        return true;
      }
      
      // Find matching admin role definition
      const roleDefinition = Object.values(ADMIN_ROLES).find(adminRole => adminRole.name === userRole.role);
      
      if (roleDefinition && (roleDefinition.permissions as readonly string[]).includes(permission)) {
        return true;
      }
      
      // Also check custom permissions stored directly on the role
      if (userRole.permissions) {
        const permissions = typeof userRole.permissions === 'string' 
          ? JSON.parse(userRole.permissions) 
          : userRole.permissions;
        
        if (Array.isArray(permissions) && permissions.includes(permission)) {
          return true;
        }
      }
    }
    
    return false;
  } catch (error) {
    logger.error('Error checking permission', error, { 
        userId,
        operation: 'checking_permission'
      });
    return false;
  }
}

// Middleware to require actual admin role (not just a specific permission)
export async function requireAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = getAuthUserId(req);
    
    if (!userId) {
      res.status(401).json({ 
        message: 'Authentication required',
        code: 'UNAUTHORIZED'
      });
      return;
    }

    const isAdmin = await hasAdminRole(userId);
    
    if (!isAdmin) {
      res.status(403).json({ 
        message: 'Admin role required',
        code: 'FORBIDDEN'
      });
      return;
    }

    // Store admin info in request for use in routes
    req.adminUser = {
      userId,
      hasAccess: true
    };

    next();
  } catch (error) {
    logger.error('Admin role check error', error, { 
        userId: getAuthUserId(req),
        operation: 'admin_role_check_error'
      });
    res.status(500).json({ message: 'Permission check failed' });
    return;
  }
}

// Middleware to require specific permission
export function requirePermission(permission: string) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = getAuthUserId(req);
      
      if (!userId) {
        res.status(401).json({ 
          message: 'Authentication required',
          code: 'UNAUTHORIZED'
        });
        return;
      }

      const hasAccess = await hasPermission(userId, permission);
      
      if (!hasAccess) {
        res.status(403).json({ 
          message: 'Insufficient permissions',
          code: 'FORBIDDEN',
          required_permission: permission
        });
        return;
      }

      // Store permission info in request for use in routes
      req.adminUser = {
        userId,
        permission,
        hasAccess: true
      };

      next();
    } catch (error) {
      logger.error('Admin permission check error', error, { 
        userId: getAuthUserId(req),
        operation: 'admin_permission_check_error'
      });
      res.status(500).json({ 
        message: 'Permission check failed',
        code: 'INTERNAL_ERROR'
      });
      return;
    }
  };
}

// Middleware to require multiple permissions (all must be present)
export function requireAllPermissions(permissions: string[]) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = getAuthUserId(req);
      
      if (!userId) {
        res.status(401).json({ 
          message: 'Authentication required',
          code: 'UNAUTHORIZED'
        });
        return;
      }

      // Check all permissions
      const permissionChecks = await Promise.all(
        permissions.map(permission => hasPermission(userId, permission))
      );

      if (!permissionChecks.every(hasAccess => hasAccess)) {
        res.status(403).json({ 
          message: 'Insufficient permissions',
          code: 'FORBIDDEN',
          required_permissions: permissions
        });
        return;
      }

      req.adminUser = {
        userId,
        permissions,
        hasAccess: true
      };

      next();
    } catch (error) {
      logger.error('Admin permissions check error', error, { 
        userId: getAuthUserId(req),
        operation: 'admin_permissions_check_error'
      });
      res.status(500).json({ 
        message: 'Permissions check failed',
        code: 'INTERNAL_ERROR'
      });
      return;
    }
  };
}

// Middleware to require any of the specified permissions
export function requireAnyPermission(permissions: string[]) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = getAuthUserId(req);
      
      if (!userId) {
        res.status(401).json({ 
          message: 'Authentication required',
          code: 'UNAUTHORIZED'
        });
        return;
      }

      // Check if user has any of the permissions
      let hasAccess = false;
      for (const permission of permissions) {
        if (await hasPermission(userId, permission)) {
          hasAccess = true;
          break;
        }
      }

      if (!hasAccess) {
        res.status(403).json({ 
          message: 'Insufficient permissions',
          code: 'FORBIDDEN',
          required_any_permissions: permissions
        });
        return;
      }

      req.adminUser = {
        userId,
        permissions,
        hasAccess: true
      };

      next();
    } catch (error) {
      logger.error('Admin permissions check error', error, { 
        userId: getAuthUserId(req),
        operation: 'admin_permissions_check_error'
      });
      res.status(500).json({ 
        message: 'Permissions check failed',
        code: 'INTERNAL_ERROR'
      });
      return;
    }
  };
}

// Audit middleware to log all admin actions
export function auditAdminAction(action: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = getAuthUserId(req);
      const targetUserId = req.params.userId || req.body.userId || '';
      
      // Store audit info for post-request logging
      req.auditInfo = {
        adminUserId: userId,
        action,
        targetUserId,
        requestBody: req.method !== 'GET' ? req.body : undefined,
        requestParams: req.params
      };

      next();
    } catch (error) {
      logger.error('Audit middleware error', error, { 
        userId: getAuthUserId(req),
        operation: 'audit_middleware_error'
      });
      next(); // Continue even if audit setup fails
    }
  };
}


// Comprehensive audit logging middleware for all admin responses
export function comprehensiveAuditLogging(req: Request, res: Response, next: NextFunction) {
  const originalSend = res.send;
  const originalJson = res.json;
  
  // Override res.send to capture all responses
  res.send = function(data: any) {
    logResponseForAudit(req, res, data);
    return originalSend.call(this, data);
  };
  
  // Override res.json to capture all JSON responses
  res.json = function(data: any) {
    logResponseForAudit(req, res, data);
    return originalJson.call(this, data);
  };
  
  // Also log on response finish event to catch other response types
  res.on('finish', () => {
    if (!res.locals.auditLogged) {
      logResponseForAudit(req, res, null);
    }
  });
  
  next();
}

// Sanitize sensitive data for audit logging
function sanitizeForAudit(data: any): any {
  if (!data) return data;
  
  const sanitized = { ...data };
  const sensitiveFields = ['password', 'token', 'secret', 'key', 'auth', 'session', 'credit_card', 'ssn', 'phone'];
  
  // Recursively redact sensitive fields
  function redactSensitive(obj: any, path = ''): any {
    if (typeof obj !== 'object' || obj === null) return obj;
    
    if (Array.isArray(obj)) {
      return obj.map((item, index) => redactSensitive(item, `${path}[${index}]`));
    }
    
    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      const keyLower = key.toLowerCase();
      const shouldRedact = sensitiveFields.some(field => keyLower.includes(field));
      
      if (shouldRedact) {
        result[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        result[key] = redactSensitive(value, `${path}.${key}`);
      } else {
        result[key] = value;
      }
    }
    return result;
  }
  
  return redactSensitive(sanitized);
}

// Helper to log response for audit
function logResponseForAudit(req: Request, res: Response, responseData: any) {
  if (res.locals.auditLogged) return; // Prevent duplicate logging
  res.locals.auditLogged = true;
  
  const userId = req.adminUser?.userId || 'unknown';
  const action = `${req.method.toLowerCase()}_${req.path.replace(/\//g, '_')}`;
  const statusCode = res.statusCode;
  
  // Sanitize request/response data to prevent PII leakage
  const sanitizedQuery = sanitizeForAudit(req.query);
  const sanitizedBody = sanitizeForAudit(req.body);
  const sanitizedResponse = statusCode >= 400 ? sanitizeForAudit(responseData) : { status: 'success' };
  
  storage.createAuditLog({
    adminUserId: userId,
    action,
    category: statusCode >= 400 ? 'system_config' : 'user_management',
    targetType: 'api_response',
    targetId: req.path,
    parameters: JSON.stringify({
      method: req.method,
      statusCode,
      responseData: sanitizedResponse,
      userAgent: req.get('User-Agent') || '',
      query: sanitizedQuery,
      body: sanitizedBody
    }),
    ipAddress: req.ip || req.connection.remoteAddress || '127.0.0.1'
  }).catch(error => console.error('Failed to create comprehensive audit log:', error));
}

// Declare module augmentation for Request interface
declare global {
  namespace Express {
    interface Request {
      adminUser?: {
        userId: string;
        permission?: string;
        permissions?: string[];
        hasAccess: boolean;
      };
      auditInfo?: {
        adminUserId: string;
        action: string;
        targetUserId: string;
        requestBody?: any;
        requestParams?: any;
      };
    }
  }
}