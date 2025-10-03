#!/usr/bin/env python3
"""
Schema Conversion Script: PostgreSQL to SQLite
Converts Drizzle ORM schema from PostgreSQL to SQLite-compatible format
"""

import re
import sys

def convert_schema(input_file, output_file):
    with open(input_file, 'r') as f:
        content = f.read()
    
    # Step 1: Update imports
    content = re.sub(
        r'from "drizzle-orm/pg-core"',
        r'from "drizzle-orm/sqlite-core"',
        content
    )
    
    # Step 2: Replace pgTable with sqliteTable
    content = re.sub(r'\bpgTable\b', 'sqliteTable', content)
    
    # Step 3: Replace pgEnum with text (enums become text fields)
    # Remove all pgEnum declarations
    content = re.sub(
        r'export const \w+Enum = pgEnum\([^)]+\);?\n',
        '',
        content
    )
    
    # Step 4: Replace PostgreSQL types with SQLite equivalents
    # varchar -> text
    content = re.sub(r'\bvarchar\(', 'text(', content)
    
    # timestamp -> integer with mode: 'timestamp'
    content = re.sub(
        r'timestamp\("([^"]+)"\)',
        r'integer("\1", { mode: \'timestamp\' })',
        content
    )
    
    # jsonb -> text (will store JSON as string)
    content = re.sub(r'\bjsonb\(', 'text(', content)
    
    # decimal -> real
    content = re.sub(r'\bdecimal\(', 'real(', content)
    
    # boolean stays the same but needs integer in SQLite
    # Note: Drizzle handles boolean as integer(0/1) automatically
    
    # date -> text or integer
    content = re.sub(r'\bdate\(', 'text(', content)
    
    # Step 5: Replace enum references with text
    # Find all enum usage patterns like: enumField("field_name")
    enum_pattern = r'(\w+Enum)\("([^"]+)"\)'
    content = re.sub(enum_pattern, r'text("\2")', content)
    
    # Step 6: Remove PostgreSQL-specific functions
    content = re.sub(r'\.default\(sql`gen_random_uuid\(\)`\)', '.default(sql`(lower(hex(randomblob(16))))`)', content)
    content = re.sub(r'\.defaultNow\(\)', '', content)  # SQLite doesn't have defaultNow, use triggers
    
    # Step 7: Fix default values for timestamps
    content = re.sub(
        r'integer\("([^"]+)", \{ mode: \'timestamp\' \}\)\.default',
        r'integer("\1", { mode: \'timestamp\' }).default',
        content
    )
    
    # Step 8: Add comment about enum values at the top
    enum_comment = """
// SQLite Schema - Converted from PostgreSQL
// Note: Enums are replaced with TEXT fields. Validation should be done at application level.
// Enum values documentation:
// - user_status: 'online', 'offline', 'away', 'busy', 'gaming'
// - privacy_level: 'everyone', 'friends_only', 'private'
// - event_type: 'tournament', 'convention', 'release', 'stream', 'community', 'personal', 'game_pod'
// - event_status: 'active', 'cancelled', 'completed', 'draft'
// - attendee_status: 'attending', 'maybe', 'not_attending'
// - game_session_status: 'waiting', 'active', 'paused', 'completed', 'cancelled'
// - notification_type: 'event_join', 'event_leave', 'game_invite', 'message', 'system', 'friend_request', 'friend_accepted', 'pod_filled', 'pod_almost_full', 'spectator_join'
// - notification_priority: 'low', 'normal', 'high', 'urgent'
// - stream_session_status: 'scheduled', 'live', 'ended', 'cancelled'
// - collaboration_request_status: 'pending', 'accepted', 'declined', 'expired', 'cancelled'
// And more... (check original schema for complete list)

"""
    
    # Insert comment after the imports
    import_end = content.find('import { z } from "zod";')
    if import_end != -1:
        insert_pos = content.find('\n', import_end) + 1
        content = content[:insert_pos] + enum_comment + content[insert_pos:]
    
    with open(output_file, 'w') as f:
        f.write(content)
    
    print(f"✅ Schema converted successfully!")
    print(f"   Input: {input_file}")
    print(f"   Output: {output_file}")
    print(f"\n⚠️  Manual review needed for:")
    print(f"   - Default timestamp values (SQLite uses different approach)")
    print(f"   - JSON field validation (jsonb -> text)")
    print(f"   - Enum value validation (add CHECK constraints if needed)")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        input_file = "shared/schema.ts"
        output_file = "shared/schema-sqlite.ts"
    else:
        input_file = sys.argv[1]
        output_file = sys.argv[2] if len(sys.argv) > 2 else input_file.replace('.ts', '-sqlite.ts')
    
    convert_schema(input_file, output_file)
