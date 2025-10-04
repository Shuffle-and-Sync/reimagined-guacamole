import * as schema from '../shared/schema.js';

console.log('Testing schema imports...');

// Test that all insert schemas are valid
const insertSchemas = [
  'insertUserSchema',
  'insertCommunitySchema', 
  'insertEventSchema',
  'insertEventAttendeeSchema',
  'insertGameSessionSchema',
  'insertCollaborativeStreamEventSchema',
  'insertStreamCollaboratorSchema',
  'insertStreamCoordinationSessionSchema',
  'insertMessageSchema',
  'insertNotificationSchema',
  'insertUserRoleSchema',
  'insertContentReportSchema',
  'insertModerationActionSchema',
  'insertModerationQueueSchema',
  'insertCmsContentSchema',
  'insertUserAppealSchema',
  'insertAdminAuditLogSchema',
];

let errors = 0;
insertSchemas.forEach(schemaName => {
  if (!(schemaName in schema)) {
    console.error(`❌ Missing schema: ${schemaName}`);
    errors++;
  } else {
    const s = (schema as any)[schemaName];
    if (typeof s.parse !== 'function') {
      console.error(`❌ Invalid schema (not a Zod schema): ${schemaName}`);
      errors++;
    } else {
      console.log(`✅ ${schemaName}`);
    }
  }
});

console.log(`\nTotal errors: ${errors}`);
process.exit(errors > 0 ? 1 : 0);
