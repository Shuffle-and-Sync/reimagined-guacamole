import { Router } from 'express';
import { storage } from '../storage';
import { isAuthenticated, getAuthUserId } from '../auth';
import { generalRateLimit } from '../rate-limiting';
import {
  requirePermission,
  requireAllPermissions,
  requireAnyPermission,
  requireAdmin,
  auditAdminAction,
  comprehensiveAuditLogging,
  ADMIN_PERMISSIONS
} from './admin.middleware';
import { z } from 'zod';

const router = Router();

// Apply comprehensive audit logging FIRST to capture ALL responses including 401/429
router.use(comprehensiveAuditLogging);

// Apply general middleware
router.use(isAuthenticated);
router.use(generalRateLimit);

// Require admin role for all routes in this router
router.use(requireAdmin);

// ===== VALIDATION SCHEMAS =====

const queueFiltersSchema = z.object({
  status: z.enum(['open', 'assigned', 'in_progress', 'completed', 'skipped']).optional(),
  assignedModerator: z.string().optional(),
  priority: z.coerce.number().int().min(1).max(10).optional(),
  itemType: z.enum(['report', 'auto_flag', 'appeal', 'ban_evasion']).optional(),
  overdue: z.enum(['true', 'false']).transform(v => v === 'true').optional()
});

const bulkAssignSchema = z.object({
  itemIds: z.array(z.string().min(1)),
  moderatorId: z.string().min(1)
});

const autoAssignSchema = z.object({
  itemType: z.enum(['report', 'auto_flag', 'appeal', 'ban_evasion']).optional()
});

const completeQueueItemSchema = z.object({
  resolution: z.string().min(1),
  actionTaken: z.string().optional()
});

const priorityUpdateSchema = z.object({
  priority: z.number().int().min(1).max(10)
});

const escalateSchema = z.object({
  thresholdHours: z.number().positive().optional()
});

const userFiltersSchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  search: z.string().optional(),
  role: z.string().optional(),
  status: z.enum(['online', 'offline', 'away', 'busy', 'gaming', 'all']).optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'username', 'email', 'firstName', 'lastName']).optional(),
  order: z.enum(['asc', 'desc']).optional()
});

const userUpdateSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  username: z.string().min(1).optional(),
  email: z.string().email().optional(),
  bio: z.string().optional(),
  location: z.string().optional(),
  website: z.string().url().optional(),
  timezone: z.string().optional(),
  isPrivate: z.boolean().optional(),
  showOnlineStatus: z.enum(['everyone', 'friends_only']).optional(),
  allowDirectMessages: z.enum(['everyone', 'friends_only']).optional()
});

const roleAssignSchema = z.object({
  role: z.enum(['admin', 'moderator', 'trust_safety', 'community_manager']),
  permissions: z.array(z.string()).optional(),
  expiresAt: z.string().datetime().optional(),
  notes: z.string().optional()
});

const userActionSchema = z.object({
  action: z.enum(['mute', 'unmute', 'warn', 'restrict']),
  reason: z.string().min(1, 'Reason is required'),
  duration: z.string().optional(), // For temporary restrictions
  notes: z.string().optional()
});

// ===== USER MANAGEMENT ROUTES =====

// Get users (with filtering and pagination)
router.get('/users', 
  requirePermission(ADMIN_PERMISSIONS.USER_VIEW),
  auditAdminAction('users_list_viewed'),
  async (req, res) => {
    try {
      const validation = userFiltersSchema.safeParse(req.query);
      if (!validation.success) {
        return res.status(400).json({ 
          message: 'Invalid query parameters',
          errors: validation.error.errors
        });
      }

      const { page, limit, search, role, status, sortBy, order } = validation.data;
      
      const result = await storage.getAllUsers({
        page,
        limit,
        search,
        role,
        status,
        sortBy,
        order
      });
      
      const data = {
        users: result.users,
        pagination: {
          page: page || 1,
          limit: limit || 50,
          total: result.total,
          totalPages: Math.ceil(result.total / (limit || 50))
        }
      };

      res.json(data);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: 'Failed to fetch users' });
    }
  }
);

// Get specific user details
router.get('/users/:userId',
  requirePermission(ADMIN_PERMISSIONS.USER_VIEW),
  auditAdminAction('user_details_viewed'),
  async (req, res) => {
    try {
      const { userId } = req.params;
      
      const [user, roles, reputation, moderationActions, appeals] = await Promise.all([
        storage.getUser(userId),
        storage.getUserRoles(userId),
        storage.getUserReputation(userId),
        storage.getModerationActions({ targetUserId: userId }),
        storage.getUserAppeals({ userId })
      ]);

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const data = {
        user,
        roles,
        reputation,
        moderationHistory: moderationActions,
        appeals
      };

      res.json(data);
    } catch (error) {
      console.error('Error fetching user details:', error);
      res.status(500).json({ message: 'Failed to fetch user details' });
    }
  }
);

// Update user
router.patch('/users/:userId',
  requirePermission(ADMIN_PERMISSIONS.USER_EDIT),
  auditAdminAction('user_updated'),
  async (req, res) => {
    try {
      const { userId } = req.params;
      
      const validation = userUpdateSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: 'Invalid user data',
          errors: validation.error.errors
        });
      }

      const updates = validation.data;
      
      // Check if user exists
      const existingUser = await storage.getUser(userId);
      if (!existingUser) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      const updatedUser = await storage.updateUser(userId, updates);
      
      res.json(updatedUser);
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ message: 'Failed to update user' });
    }
  }
);

// ===== ROLE MANAGEMENT ROUTES =====

// Get user roles
router.get('/users/:userId/roles',
  requirePermission(ADMIN_PERMISSIONS.ROLE_VIEW),
  auditAdminAction('user_roles_viewed'),
  async (req, res) => {
    try {
      const { userId } = req.params;
      const roles = await storage.getUserRoles(userId);
      
      res.json(roles);
    } catch (error) {
      console.error('Error fetching user roles:', error);
      res.status(500).json({ message: 'Failed to fetch user roles' });
    }
  }
);

// Assign role to user
router.post('/users/:userId/roles',
  requirePermission(ADMIN_PERMISSIONS.ROLE_ASSIGN),
  auditAdminAction('role_assigned'),
  async (req, res) => {
    try {
      const { userId } = req.params;
      
      const validation = roleAssignSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: 'Invalid role data',
          errors: validation.error.errors
        });
      }

      const { role, permissions, expiresAt, notes } = validation.data;
      const adminUserId = getAuthUserId(req);

      // Check if user exists
      const existingUser = await storage.getUser(userId);
      if (!existingUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      const roleData = {
        userId,
        role,
        permissions,
        assignedBy: adminUserId,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
        notes
      };

      const newRole = await storage.createUserRole(roleData);
      
      res.status(201).json(newRole);
    } catch (error) {
      console.error('Error assigning role:', error);
      res.status(500).json({ message: 'Failed to assign role' });
    }
  }
);

// Remove role from user
router.delete('/users/:userId/roles/:roleId',
  requirePermission(ADMIN_PERMISSIONS.ROLE_REVOKE),
  auditAdminAction('role_revoked'),
  async (req, res) => {
    try {
      const { roleId } = req.params;
      
      await storage.deleteUserRole(roleId);
      
      res.json({ message: 'Role revoked successfully' });
    } catch (error) {
      console.error('Error revoking role:', error);
      res.status(500).json({ message: 'Failed to revoke role' });
    }
  }
);

// ===== USER PROFILE MANAGEMENT =====

// Get user detailed information
router.get('/users/:userId/details',
  requirePermission(ADMIN_PERMISSIONS.USER_VIEW),
  auditAdminAction('user_details_viewed'),
  async (req, res) => {
    try {
      const { userId } = req.params;
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Get additional user data
      const [roles, reputation, socialLinks, gamingProfiles] = await Promise.all([
        storage.getUserRoles(userId),
        storage.getUserReputation(userId),
        storage.getUserSocialLinks(userId),
        storage.getUserGamingProfiles(userId)
      ]);
      
      res.json({ 
        user,
        roles,
        reputation,
        socialLinks,
        gamingProfiles,
        stats: {
          totalRoles: roles.length,
          reputationScore: reputation?.score || 0,
          socialLinksCount: socialLinks.length,
          gamingProfilesCount: gamingProfiles.length
        }
      });
    } catch (error) {
      console.error('Error fetching user details:', error);
      res.status(500).json({ message: 'Failed to fetch user details' });
    }
  }
);

// ===== USER MODERATION NOTES =====

// Get user moderation notes (stored as special moderation actions)
router.get('/users/:userId/notes',
  requirePermission(ADMIN_PERMISSIONS.USER_VIEW),
  auditAdminAction('user_notes_viewed'),
  async (req, res) => {
    try {
      const { userId } = req.params;
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Get notes from moderation actions with action type 'note'
      const notes = await storage.getModerationActions({ 
        targetUserId: userId, 
        action: 'note' 
      });
      
      res.json({ 
        userId,
        notes: notes.map(note => ({
          id: note.id,
          content: note.notes,
          moderatorId: note.moderatorId,
          moderatorName: note.moderator?.firstName && note.moderator?.lastName 
            ? `${note.moderator.firstName} ${note.moderator.lastName}`
            : note.moderator?.username || 'Unknown',
          createdAt: note.createdAt,
          updatedAt: note.updatedAt
        })),
        total: notes.length
      });
    } catch (error) {
      console.error('Error fetching user notes:', error);
      res.status(500).json({ message: 'Failed to fetch user notes' });
    }
  }
);

// Add moderation note to user
router.post('/users/:userId/notes',
  requirePermission(ADMIN_PERMISSIONS.USER_EDIT),
  auditAdminAction('user_note_added'),
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { content } = req.body;
      
      if (!content || typeof content !== 'string' || content.trim().length === 0) {
        return res.status(400).json({ 
          message: 'Note content is required',
          errors: [{ message: 'Content must be a non-empty string' }]
        });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      const adminUserId = getAuthUserId(req);
      
      // Create moderation action with action type 'note'
      const moderationAction = await storage.createModerationAction({
        moderatorId: adminUserId,
        targetUserId: userId,
        action: 'note',
        reason: 'Moderation note',
        notes: content.trim(),
        isActive: false
      });
      
      const adminUser = await storage.getUser(adminUserId);
      
      res.status(201).json({ 
        id: moderationAction.id,
        content: moderationAction.notes,
        moderatorId: adminUserId,
        moderatorName: adminUser?.firstName && adminUser?.lastName 
          ? `${adminUser.firstName} ${adminUser.lastName}`
          : adminUser?.username || 'Unknown',
        createdAt: moderationAction.createdAt
      });
    } catch (error) {
      console.error('Error adding user note:', error);
      res.status(500).json({ message: 'Failed to add user note' });
    }
  }
);

// ===== USER ACTIONS =====

// Perform moderation action on user
router.post('/users/:userId/actions',
  requirePermission(ADMIN_PERMISSIONS.USER_MODERATE),
  auditAdminAction('user_action_performed'),
  async (req, res) => {
    try {
      const { userId } = req.params;
      
      const validation = userActionSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: 'Invalid action data',
          errors: validation.error.errors
        });
      }

      const { action, reason, duration, notes } = validation.data;
      const adminUserId = getAuthUserId(req);
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Create moderation action record
      const moderationAction = await storage.createModerationAction({
        moderatorId: adminUserId,
        targetUserId: userId,
        action,
        reason,
        notes,
        isActive: ['mute', 'restrict'].includes(action),
        duration: duration ? parseInt(duration) : undefined
      });

      res.json({
        message: `User ${action} completed successfully`,
        action: moderationAction,
        user: await storage.getUser(userId)
      });
    } catch (error) {
      console.error('Error performing user action:', error);
      res.status(500).json({ message: 'Failed to perform user action' });
    }
  }
);

// Get user activity history
router.get('/users/:userId/activity',
  requirePermission(ADMIN_PERMISSIONS.USER_VIEW),
  auditAdminAction('user_activity_viewed'),
  async (req, res) => {
    try {
      const { userId } = req.params;
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const [moderationActions, appeals, roles] = await Promise.all([
        storage.getModerationActions({ targetUserId: userId }),
        storage.getUserAppeals({ userId }),
        storage.getUserRoles(userId)
      ]);

      const activity = {
        user,
        moderationHistory: moderationActions,
        appeals,
        roles,
        stats: {
          totalModerationActions: moderationActions.length,
          activeRestrictions: moderationActions.filter(a => ['mute', 'restrict'].includes(a.action) && a.isActive).length,
          totalAppeals: appeals.length,
          activeRoles: roles.filter(r => !r.expiresAt || r.expiresAt > new Date()).length
        }
      };

      res.json(activity);
    } catch (error) {
      console.error('Error fetching user activity:', error);
      res.status(500).json({ message: 'Failed to fetch user activity' });
    }
  }
);

// ===== CONTENT MODERATION ROUTES =====

// Get content reports
router.get('/content-reports',
  requirePermission(ADMIN_PERMISSIONS.CONTENT_VIEW_REPORTS),
  auditAdminAction('content_reports_viewed'),
  async (req, res) => {
    try {
      const { status, priority, assignedModerator } = req.query;
      
      const reports = await storage.getContentReports({
        status: status as string,
        priority: priority as string,
        assignedModerator: assignedModerator as string
      });
      
      res.json(reports);
    } catch (error) {
      console.error('Error fetching content reports:', error);
      res.status(500).json({ message: 'Failed to fetch content reports' });
    }
  }
);

// Get specific content report
router.get('/content-reports/:reportId',
  requirePermission(ADMIN_PERMISSIONS.CONTENT_VIEW_REPORTS),
  auditAdminAction('content_report_viewed'),
  async (req, res) => {
    try {
      const { reportId } = req.params;
      
      const report = await storage.getContentReport(reportId);
      if (!report) {
        return res.status(404).json({ message: 'Content report not found' });
      }
      

      res.json(report);
    } catch (error) {
      console.error('Error fetching content report:', error);
      res.status(500).json({ message: 'Failed to fetch content report' });
    }
  }
);

// Assign content report to moderator
router.patch('/content-reports/:reportId/assign',
  requirePermission(ADMIN_PERMISSIONS.CONTENT_MODERATE),
  auditAdminAction('content_report_assigned'),
  async (req, res) => {
    try {
      const { reportId } = req.params;
      const { moderatorId } = req.body;
      
      const report = await storage.assignContentReport(reportId, moderatorId);
      

      res.json(report);
    } catch (error) {
      console.error('Error assigning content report:', error);
      res.status(500).json({ message: 'Failed to assign content report' });
    }
  }
);

// Resolve content report
router.patch('/content-reports/:reportId/resolve',
  requirePermission(ADMIN_PERMISSIONS.CONTENT_MODERATE),
  auditAdminAction('content_report_resolved'),
  async (req, res) => {
    try {
      const { reportId } = req.params;
      const { resolution, actionTaken } = req.body;
      const moderatorId = getAuthUserId(req);
      
      const report = await storage.resolveContentReport(reportId, resolution, actionTaken, moderatorId);
      

      res.json(report);
    } catch (error) {
      console.error('Error resolving content report:', error);
      res.status(500).json({ message: 'Failed to resolve content report' });
    }
  }
);

// ===== MODERATION ACTIONS ROUTES =====

// Get moderation actions
router.get('/moderation-actions',
  requirePermission(ADMIN_PERMISSIONS.MODERATION_VIEW_ACTIONS),
  auditAdminAction('moderation_actions_viewed'),
  async (req, res) => {
    try {
      const { targetUserId, moderatorId, action, isActive } = req.query;
      
      const actions = await storage.getModerationActions({
        targetUserId: targetUserId as string,
        moderatorId: moderatorId as string,
        action: action as string,
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined
      });
      
      res.json(actions);
    } catch (error) {
      console.error('Error fetching moderation actions:', error);
      res.status(500).json({ message: 'Failed to fetch moderation actions' });
    }
  }
);

// Create moderation action
router.post('/moderation-actions',
  requirePermission(ADMIN_PERMISSIONS.MODERATION_CREATE_ACTION),
  auditAdminAction('moderation_action_created'),
  async (req, res) => {
    try {
      const moderatorId = getAuthUserId(req);
      const actionData = {
        ...req.body,
        moderatorId
      };
      
      const action = await storage.createModerationAction(actionData);
      

      res.status(201).json(action);
    } catch (error) {
      console.error('Error creating moderation action:', error);
      res.status(500).json({ message: 'Failed to create moderation action' });
    }
  }
);

// Reverse moderation action
router.patch('/moderation-actions/:actionId/reverse',
  requirePermission(ADMIN_PERMISSIONS.MODERATION_REVERSE_ACTION),
  auditAdminAction('moderation_action_reversed'),
  async (req, res) => {
    try {
      const { actionId } = req.params;
      const { reason } = req.body;
      const reversedBy = getAuthUserId(req);
      
      const action = await storage.reverseModerationAction(actionId, reversedBy, reason);
      

      res.json(action);
    } catch (error) {
      console.error('Error reversing moderation action:', error);
      res.status(500).json({ message: 'Failed to reverse moderation action' });
    }
  }
);

// ===== MODERATION QUEUE ROUTES =====

// Get moderation queue with enhanced filtering
router.get('/moderation-queue',
  requirePermission(ADMIN_PERMISSIONS.QUEUE_VIEW),
  auditAdminAction('moderation_queue_viewed'),
  async (req, res) => {
    try {
      const validation = queueFiltersSchema.safeParse(req.query);
      if (!validation.success) {
        return res.status(400).json({ 
          message: 'Invalid query parameters',
          errors: validation.error.errors
        });
      }

      const { status, assignedModerator, priority, itemType, overdue } = validation.data;
      
      const queue = await storage.getModerationQueue({
        status,
        assignedModerator,
        priority,
        itemType,
        overdue
      });
      
      res.json(queue);
    } catch (error) {
      console.error('Error fetching moderation queue:', error);
      res.status(500).json({ message: 'Failed to fetch moderation queue' });
    }
  }
);

// Assign queue item to moderator
router.patch('/moderation-queue/:itemId/assign',
  requirePermission(ADMIN_PERMISSIONS.QUEUE_ASSIGN),
  auditAdminAction('queue_item_assigned'),
  async (req, res) => {
    try {
      const { itemId } = req.params;
      const moderatorId = getAuthUserId(req);
      
      const item = await storage.assignModerationQueueItem(itemId, moderatorId);
      

      res.json(item);
    } catch (error) {
      console.error('Error assigning queue item:', error);
      res.status(500).json({ message: 'Failed to assign queue item' });
    }
  }
);

// Complete queue item
router.patch('/moderation-queue/:itemId/complete',
  requirePermission(ADMIN_PERMISSIONS.QUEUE_COMPLETE),
  auditAdminAction('queue_item_completed'),
  async (req, res) => {
    try {
      const validation = completeQueueItemSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: 'Invalid request data',
          errors: validation.error.errors
        });
      }

      const { itemId } = req.params;
      const { resolution, actionTaken } = validation.data;
      
      const item = await storage.completeModerationQueueItem(itemId, resolution, actionTaken);
      
      res.json(item);
    } catch (error) {
      console.error('Error completing queue item:', error);
      res.status(500).json({ message: 'Failed to complete queue item' });
    }
  }
);

// Get queue statistics
router.get('/moderation-queue/stats',
  requirePermission(ADMIN_PERMISSIONS.QUEUE_VIEW),
  auditAdminAction('queue_stats_viewed'),
  async (req, res) => {
    try {
      const stats = await storage.getModerationQueueStats();
      res.json(stats);
    } catch (error) {
      console.error('Error fetching queue stats:', error);
      res.status(500).json({ message: 'Failed to fetch queue statistics' });
    }
  }
);

// Auto-assign queue items
router.post('/moderation-queue/auto-assign',
  requirePermission(ADMIN_PERMISSIONS.QUEUE_ASSIGN),
  auditAdminAction('queue_auto_assigned'),
  async (req, res) => {
    try {
      const validation = autoAssignSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: 'Invalid request data',
          errors: validation.error.errors
        });
      }

      const { itemType } = validation.data;
      const result = await storage.autoAssignModerationQueue(itemType);
      
      res.json(result);
    } catch (error) {
      console.error('Error auto-assigning queue items:', error);
      res.status(500).json({ message: 'Failed to auto-assign queue items' });
    }
  }
);

// Bulk assign queue items
router.post('/moderation-queue/bulk-assign',
  requirePermission(ADMIN_PERMISSIONS.QUEUE_ASSIGN),
  auditAdminAction('queue_bulk_assigned'),
  async (req, res) => {
    try {
      const validation = bulkAssignSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: 'Invalid request data',
          errors: validation.error.errors
        });
      }
      
      const { itemIds, moderatorId } = validation.data;
      const assignedItems = await storage.bulkAssignModerationQueue(itemIds, moderatorId);
      
      res.json({ 
        assigned: assignedItems.length,
        items: assignedItems
      });
    } catch (error) {
      console.error('Error bulk assigning queue items:', error);
      res.status(500).json({ message: 'Failed to bulk assign queue items' });
    }
  }
);

// Get moderator workload analytics
router.get('/moderation-queue/workload',
  requirePermission(ADMIN_PERMISSIONS.QUEUE_VIEW),
  auditAdminAction('moderator_workload_viewed'),
  async (req, res) => {
    try {
      const { moderatorId } = req.query;
      
      const workloads = await storage.getModeratorWorkload(moderatorId as string);
      
      res.json(workloads);
    } catch (error) {
      console.error('Error fetching moderator workload:', error);
      res.status(500).json({ message: 'Failed to fetch moderator workload' });
    }
  }
);

// Escalate overdue items
router.post('/moderation-queue/escalate',
  requirePermission(ADMIN_PERMISSIONS.QUEUE_PRIORITIZE),
  auditAdminAction('queue_items_escalated'),
  async (req, res) => {
    try {
      const validation = escalateSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: 'Invalid request data',
          errors: validation.error.errors
        });
      }

      const { thresholdHours = 24 } = validation.data;
      const escalatedItems = await storage.escalateOverdueItems(thresholdHours);
      
      res.json({
        escalated: escalatedItems.length,
        items: escalatedItems
      });
    } catch (error) {
      console.error('Error escalating overdue items:', error);
      res.status(500).json({ message: 'Failed to escalate overdue items' });
    }
  }
);

// Update queue item priority
router.patch('/moderation-queue/:itemId/priority',
  requirePermission(ADMIN_PERMISSIONS.QUEUE_PRIORITIZE),
  auditAdminAction('queue_priority_updated'),
  async (req, res) => {
    try {
      const validation = priorityUpdateSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: 'Invalid request data',
          errors: validation.error.errors
        });
      }

      const { itemId } = req.params;
      const { priority } = validation.data;
      
      const item = await storage.updateModerationQueuePriority(itemId, priority);
      
      res.json(item);
    } catch (error) {
      console.error('Error updating queue priority:', error);
      res.status(500).json({ message: 'Failed to update queue priority' });
    }
  }
);

// ===== USER APPEALS ROUTES =====

// Get user appeals
router.get('/appeals',
  requirePermission(ADMIN_PERMISSIONS.APPEAL_VIEW),
  auditAdminAction('appeals_viewed'),
  async (req, res) => {
    try {
      const { userId, status, assignedReviewer } = req.query;
      
      const appeals = await storage.getUserAppeals({
        userId: userId as string,
        status: status as string,
        assignedReviewer: assignedReviewer as string
      });
      
      res.json(appeals);
    } catch (error) {
      console.error('Error fetching appeals:', error);
      res.status(500).json({ message: 'Failed to fetch appeals' });
    }
  }
);

// Assign appeal reviewer
router.patch('/appeals/:appealId/assign',
  requirePermission(ADMIN_PERMISSIONS.APPEAL_ASSIGN),
  auditAdminAction('appeal_assigned'),
  async (req, res) => {
    try {
      const { appealId } = req.params;
      const reviewerId = getAuthUserId(req);
      
      const appeal = await storage.assignAppealReviewer(appealId, reviewerId);
      

      res.json(appeal);
    } catch (error) {
      console.error('Error assigning appeal:', error);
      res.status(500).json({ message: 'Failed to assign appeal' });
    }
  }
);

// Resolve appeal
router.patch('/appeals/:appealId/resolve',
  requirePermission(ADMIN_PERMISSIONS.APPEAL_DECIDE),
  auditAdminAction('appeal_resolved'),
  async (req, res) => {
    try {
      const { appealId } = req.params;
      const { decision, reviewerNotes } = req.body;
      const reviewerId = getAuthUserId(req);
      
      const appeal = await storage.resolveUserAppeal(appealId, decision, reviewerNotes, reviewerId);
      

      res.json(appeal);
    } catch (error) {
      console.error('Error resolving appeal:', error);
      res.status(500).json({ message: 'Failed to resolve appeal' });
    }
  }
);

// ===== AUDIT LOG ROUTES =====

// Get audit logs
router.get('/audit-logs',
  requirePermission(ADMIN_PERMISSIONS.AUDIT_VIEW),
  auditAdminAction('audit_logs_viewed'),
  async (req, res) => {
    try {
      const { adminUserId, action, startDate, endDate } = req.query;
      
      const logs = await storage.getAuditLogs({
        adminUserId: adminUserId as string,
        action: action as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined
      });
      
      res.json(logs);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      res.status(500).json({ message: 'Failed to fetch audit logs' });
    }
  }
);

// ===== CMS CONTENT ROUTES =====

// Get CMS content
router.get('/cms-content',
  requirePermission(ADMIN_PERMISSIONS.CMS_VIEW),
  auditAdminAction('cms_content_viewed'),
  async (req, res) => {
    try {
      const { type, isPublished } = req.query;
      
      const content = await storage.getCmsContent(
        type as string,
        isPublished === 'true' ? true : isPublished === 'false' ? false : undefined
      );
      

      res.json(content);
    } catch (error) {
      console.error('Error fetching CMS content:', error);
      res.status(500).json({ message: 'Failed to fetch CMS content' });
    }
  }
);

// Create CMS content
router.post('/cms-content',
  requirePermission(ADMIN_PERMISSIONS.CMS_CREATE),
  auditAdminAction('cms_content_created'),
  async (req, res) => {
    try {
      const authorId = getAuthUserId(req);
      const contentData = {
        ...req.body,
        authorId,
        lastEditedBy: authorId
      };
      
      const content = await storage.createCmsContent(contentData);
      

      res.status(201).json(content);
    } catch (error) {
      console.error('Error creating CMS content:', error);
      res.status(500).json({ message: 'Failed to create CMS content' });
    }
  }
);

// Update CMS content
router.patch('/cms-content/:contentId',
  requirePermission(ADMIN_PERMISSIONS.CMS_EDIT),
  auditAdminAction('cms_content_updated'),
  async (req, res) => {
    try {
      const { contentId } = req.params;
      const lastEditedBy = getAuthUserId(req);
      const updateData = {
        ...req.body,
        lastEditedBy
      };
      
      const content = await storage.updateCmsContent(contentId, updateData);
      

      res.json(content);
    } catch (error) {
      console.error('Error updating CMS content:', error);
      res.status(500).json({ message: 'Failed to update CMS content' });
    }
  }
);

// Publish CMS content
router.patch('/cms-content/:contentId/publish',
  requirePermission(ADMIN_PERMISSIONS.CMS_PUBLISH),
  auditAdminAction('cms_content_published'),
  async (req, res) => {
    try {
      const { contentId } = req.params;
      const publisherId = getAuthUserId(req);
      
      const content = await storage.publishCmsContent(contentId, publisherId);
      

      res.json(content);
    } catch (error) {
      console.error('Error publishing CMS content:', error);
      res.status(500).json({ message: 'Failed to publish CMS content' });
    }
  }
);

// ===== ADMIN DASHBOARD STATS =====

// Get admin dashboard statistics
router.get('/dashboard/stats',
  requirePermission(ADMIN_PERMISSIONS.ANALYTICS_VIEW),
  auditAdminAction('admin_dashboard_viewed'),
  async (req, res) => {
    try {
      // TODO: Implement comprehensive dashboard statistics
      const stats = {
        users: {
          total: 0,
          active: 0,
          banned: 0,
          new_today: 0
        },
        content: {
          total_reports: 0,
          pending_reports: 0,
          resolved_today: 0
        },
        moderation: {
          queue_size: 0,
          active_moderators: 0,
          actions_today: 0
        },
        appeals: {
          pending: 0,
          resolved_today: 0
        }
      };
      
      res.json(stats);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      res.status(500).json({ message: 'Failed to fetch dashboard stats' });
    }
  }
);

export default router;