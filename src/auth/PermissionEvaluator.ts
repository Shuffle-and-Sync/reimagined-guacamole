/**
 * PermissionEvaluator
 *
 * Evaluates permissions based on resource, action, and conditions.
 */

import { Permission, PermissionCondition, AuthContext } from "./types";

export class PermissionEvaluator {
  /**
   * Evaluate if a permission grants access to a resource
   */
  evaluate(
    permission: Permission,
    context: AuthContext,
    resource: any,
  ): boolean {
    // Check resource type matches
    if (!this.matchesResource(permission.resource, resource)) {
      return false;
    }

    // Evaluate conditions if present
    if (permission.conditions && permission.conditions.length > 0) {
      for (const condition of permission.conditions) {
        if (!this.evaluateCondition(condition, context, resource)) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Evaluate all permissions for a context
   */
  evaluateAll(
    permissions: Permission[],
    context: AuthContext,
    resource: any,
  ): boolean {
    return permissions.some((permission) =>
      this.evaluate(permission, context, resource),
    );
  }

  /**
   * Check if resource matches permission resource pattern
   */
  private matchesResource(pattern: string, resource: any): boolean {
    if (typeof resource === "object" && resource !== null) {
      // Check if resource has a type or kind field that matches
      if ("type" in resource && typeof resource.type === "string") {
        return this.matchesPattern(pattern, resource.type);
      }
      if ("kind" in resource && typeof resource.kind === "string") {
        return this.matchesPattern(pattern, resource.kind);
      }
    }

    // Default: assume resource string matches pattern
    return this.matchesPattern(pattern, String(resource));
  }

  /**
   * Match a pattern with wildcards (e.g., "game.*" matches "game.state")
   */
  private matchesPattern(pattern: string, value: string): boolean {
    // Exact match
    if (pattern === value) return true;

    // Wildcard match
    if (pattern.endsWith(".*")) {
      const prefix = pattern.slice(0, -2);
      return value.startsWith(prefix);
    }

    return false;
  }

  /**
   * Evaluate a single permission condition
   */
  private evaluateCondition(
    condition: PermissionCondition,
    context: AuthContext,
    resource: any,
  ): boolean {
    // Custom check has priority
    if (condition.customCheck) {
      return condition.customCheck(context, resource);
    }

    const fieldValue = this.getFieldValue(resource, condition.field);

    switch (condition.operator) {
      case "eq":
        return fieldValue === condition.value;

      case "ne":
        return fieldValue !== condition.value;

      case "in":
        if (Array.isArray(condition.value)) {
          return condition.value.includes(fieldValue);
        }
        return false;

      default:
        return false;
    }
  }

  /**
   * Get field value from resource using dot notation
   */
  private getFieldValue(resource: any, field: string): any {
    if (!resource || typeof resource !== "object") {
      return undefined;
    }

    const parts = field.split(".");
    let value = resource;

    for (const part of parts) {
      if (value && typeof value === "object" && part in value) {
        value = value[part];
      } else {
        return undefined;
      }
    }

    return value;
  }

  /**
   * Check if context has required permission
   */
  hasPermission(
    context: AuthContext,
    resource: string,
    action: string,
  ): boolean {
    return context.permissions.some(
      (permission) =>
        permission.resource === resource && permission.action === action,
    );
  }

  /**
   * Get all matching permissions for a resource and action
   */
  getMatchingPermissions(
    context: AuthContext,
    resource: string,
    action: string,
  ): Permission[] {
    return context.permissions.filter(
      (permission) =>
        this.matchesPattern(permission.resource, resource) &&
        this.matchesPattern(permission.action, action),
    );
  }
}
