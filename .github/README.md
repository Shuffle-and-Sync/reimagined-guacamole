# GitHub Copilot Custom Instructions for Shuffle & Sync

This directory contains custom instruction files that provide GitHub Copilot with comprehensive context about your Shuffle & Sync project.

## Files Created

### 1. Repository-Wide Instructions
**File**: `.github/copilot-instructions.md`

This is the main instruction file that applies to all code in the repository. It includes:
- Complete project overview and architecture
- Technology stack details
- Build, test, and validation commands
- Common issues and workarounds
- Deployment information
- Coding patterns and conventions

### 2. Path-Specific Instructions

These files provide additional context for specific parts of your codebase:

#### **`.github/instructions/client.instructions.md`**
Applies to: `client/**/*` (Frontend/React code)

Contains:
- React/Vite development guidelines
- Shadcn/ui component usage
- React Query patterns
- Form handling with React Hook Form
- Styling with Tailwind CSS
- State management (React Query + Zustand)

#### **`.github/instructions/server.instructions.md`**
Applies to: `server/**/*` (Backend/Express code)

Contains:
- Express.js route development
- Repository pattern implementation
- Drizzle ORM query patterns
- Middleware patterns
- Authentication with Auth.js
- WebSocket implementation
- Testing strategies

#### **`.github/instructions/shared.instructions.md`**
Applies to: `shared/**/*` (Database schema and shared code)

Contains:
- Database schema definition guidelines
- Drizzle ORM best practices
- Schema migration procedures
- TypeScript type generation
- Query patterns and transactions

## Installation Instructions

To use these custom instructions in your Shuffle & Sync repository:

### Step 1: Copy Files to Your Repository

```bash
# From the root of your Shuffle & Sync repository:
cp -r /path/to/outputs/.github .
```

Or manually create the directory structure:
```
your-repo/
└── .github/
    ├── copilot-instructions.md
    └── instructions/
        ├── client.instructions.md
        ├── server.instructions.md
        └── shared.instructions.md
```

### Step 2: Commit the Files

```bash
git add .github/
git commit -m "Add GitHub Copilot custom instructions"
git push
```

### Step 3: Enable Custom Instructions (if not already enabled)

1. In GitHub, go to your repository settings
2. Navigate to **Copilot** settings
3. Ensure **"Use custom instructions"** is enabled (it's enabled by default)

## How It Works

### Repository-Wide Instructions
GitHub Copilot will automatically use `.github/copilot-instructions.md` for context when:
- Generating code suggestions
- Answering questions via Copilot Chat
- Creating new files or features
- Fixing issues

### Path-Specific Instructions
When you're working on a file in a specific directory, Copilot will additionally use the corresponding path-specific instructions:

- Working on `client/src/components/UserProfile.tsx`? 
  → Uses `copilot-instructions.md` + `client.instructions.md`

- Working on `server/features/users/service.ts`? 
  → Uses `copilot-instructions.md` + `server.instructions.md`

- Working on `shared/schema.ts`? 
  → Uses `copilot-instructions.md` + `shared.instructions.md`

## What This Gives You

With these custom instructions, GitHub Copilot will:

✅ **Understand your architecture** - Knows you use React + Express + Drizzle ORM  
✅ **Follow your patterns** - Suggests feature-based organization, not type-based  
✅ **Use correct dependencies** - Knows to use `--legacy-peer-deps` flag  
✅ **Write Drizzle queries** - Never suggests raw SQL or Prisma  
✅ **Handle authentication** - Understands Auth.js v5 setup  
✅ **Apply your conventions** - Follows your naming, file organization, and coding standards  
✅ **Avoid common pitfalls** - Knows about build requirements and common issues  
✅ **Provide better suggestions** - Context-aware code completion  

## Example Use Cases

### 1. Creating a New Feature

Ask Copilot: *"Create a new tournaments feature with routes, service, and repository"*

With custom instructions, Copilot will:
- Create feature-based directory structure
- Use Drizzle ORM for database operations
- Follow your repository pattern
- Include proper TypeScript types
- Add Zod validation
- Follow your error handling patterns

### 2. Fixing Build Issues

Ask Copilot: *"Why is my build failing with ERESOLVE errors?"*

Copilot will know to suggest: *"Use --legacy-peer-deps flag because of @sqlitecloud/drivers peer dependencies"*

### 3. Adding a New Database Table

Ask Copilot: *"Add a new 'posts' table with user relationship"*

Copilot will:
- Add table to `shared/schema.ts`
- Use CUID2 for primary key
- Include proper foreign key constraints
- Add timestamps (createdAt, updatedAt)
- Export TypeScript types
- Suggest running `npm run db:push`

### 4. Creating React Components

Ask Copilot: *"Create a user profile card component"*

Copilot will:
- Use Shadcn/ui components
- Apply Tailwind CSS classes
- Use React Query for data fetching
- Follow your component structure patterns
- Include proper TypeScript types

## Maintenance

### Updating Instructions

As your project evolves, update the instruction files:

1. **Architecture changes** → Update `copilot-instructions.md`
2. **New frontend patterns** → Update `client.instructions.md`
3. **New backend patterns** → Update `server.instructions.md`
4. **Schema conventions** → Update `shared.instructions.md`

### Best Practices

- Keep instructions concise but comprehensive
- Include examples of both correct and incorrect patterns
- Document common issues and solutions
- Update when you establish new conventions
- Review and refine based on Copilot's suggestions

## Verification

To verify Copilot is using your instructions:

1. Open GitHub Copilot Chat
2. Ask: *"What build system does this project use?"*
3. Copilot should mention: Vite, esbuild, npm scripts, etc.

Or:

1. Start typing a new database query
2. Copilot should suggest Drizzle ORM syntax, not Prisma or raw SQL

## Resources

- [GitHub Copilot Documentation](https://docs.github.com/en/copilot)
- [Custom Instructions Guide](https://docs.github.com/en/copilot/customizing-copilot/adding-custom-instructions-for-github-copilot)
- [Your Project Documentation](docs/README.md)

## Support

For issues or questions about these instruction files:
1. Review the main project documentation in `docs/`
2. Check the troubleshooting guide: `docs/troubleshooting/README.md`
3. Consult the development guide: `docs/development/DEVELOPMENT_GUIDE.md`

---

**Created**: January 2025  
**For**: Shuffle & Sync Project  
**Copilot Version**: Compatible with GitHub Copilot (all versions)
