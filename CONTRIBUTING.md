# Contributing to Shuffle & Sync

Thank you for your interest in contributing to **Shuffle & Sync** - the comprehensive TCG streaming coordination platform! We welcome contributions from developers of all skill levels and backgrounds.

## 📋 Table of Contents

1. [Quick Start](#-quick-start)
2. [Development Setup](#-development-setup)
3. [Making Contributions](#-making-contributions)
4. [Code Standards](#-code-standards)
5. [Testing Requirements](#-testing-requirements)
6. [Pull Request Process](#-pull-request-process)
7. [Issue Reporting](#-issue-reporting)
8. [Security](#-security)
9. [Community Guidelines](#-community-guidelines)
10. [Getting Help](#-getting-help)

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and npm
- **SQLite Cloud** database (or local SQLite for development)
- **Git** for version control
- **TypeScript** knowledge recommended

### First Contribution

1. **Fork** the repository
2. **Clone** your fork: `git clone https://github.com/YOUR_USERNAME/reimagined-guacamole.git`
3. **Install** dependencies: `npm install --legacy-peer-deps`
4. **Set up** environment:
   - **Linux/macOS**: `npm run env:setup`
   - **Windows (PowerShell)**: `Copy-Item .env.example .env.local` (then edit `.env.local`)
   - **Windows (Git Bash)**: `cp .env.example .env.local` (then edit `.env.local`)
5. **Explore** the codebase: `npm run test:generate`
6. **Start** development: `npm run dev`

## 🛠️ Development Setup

### Environment Configuration

#### Linux/macOS

1. **Copy environment template**:

   ```bash
   npm run env:setup
   ```

2. **Configure your `.env.local`** with:
   - Database connection (`DATABASE_URL`)
   - Google OAuth credentials (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`)
   - Auth secret (`AUTH_SECRET`)

3. **Initialize database**:

   ```bash
   npm run db:push
   ```

4. **Validate setup**:
   ```bash
   npm run env:validate
   npm run health
   ```

#### Windows (PowerShell)

1. **Copy environment template**:

   ```powershell
   Copy-Item .env.example .env.local
   # Edit .env.local with your configuration
   ```

2. **Configure your `.env.local`** with:
   - Database connection (`DATABASE_URL`)
   - Google OAuth credentials (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`)
   - Auth secret (`AUTH_SECRET`)

3. **Initialize database**:

   ```powershell
   npm run db:push
   ```

4. **Validate setup**:
   ```powershell
   npm run env:validate
   npm run health
   ```

#### Windows (Git Bash)

1. **Copy environment template**:

   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

2. **Configure your `.env.local`** with:
   - Database connection (`DATABASE_URL`)
   - Google OAuth credentials (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`)
   - Auth secret (`AUTH_SECRET`)

3. **Initialize database**:

   ```bash
   npm run db:push
   ```

4. **Validate setup**:
   ```bash
   npm run env:validate
   npm run health
   ```

> **Note for Windows Contributors**: All npm scripts (like `npm run dev`, `npm test`, `npm run build`) work identically across Windows, macOS, and Linux. However, some bash scripts in the `scripts/` directory may require Git Bash on Windows.

### Development Scripts

| Command                 | Purpose                      |
| ----------------------- | ---------------------------- |
| `npm run dev`           | Start development server     |
| `npm run test`          | Run test suite               |
| `npm run test:generate` | Generate tests with AI agent |
| `npm run lint`          | Run ESLint                   |
| `npm run check`         | TypeScript type checking     |
| `npm run build`         | Build for production         |

### Project Structure

```
/
├── client/src/          # React frontend application
│   ├── components/      # Reusable UI components
│   ├── features/        # Feature-based modules
│   ├── pages/          # Route components
│   └── lib/            # Utilities and configurations
├── server/             # Express backend application
│   ├── features/       # Feature-based API modules
│   ├── services/       # Business logic services
│   └── middleware/     # Express middleware
├── shared/             # Shared code and schemas
│   ├── schema.ts       # Database schema (Drizzle ORM)
│   └── database.ts     # Database utilities
└── docs/              # Documentation
    ├── README.md         # Documentation index
    ├── docs/maintenance/ISSUE_PR_HISTORY.md  # Historical context on resolved work
    └── features/         # Feature-specific documentation
```

### Understanding Past Work

Before starting work on an issue or feature:

1. **Check [Issue & PR History](./docs/maintenance/ISSUE_PR_HISTORY.md)** - See how similar issues were resolved
2. **Review related documentation** - Understand existing patterns and decisions
3. **Search closed issues** - Learn from past solutions and discussions

This helps avoid duplicating effort and ensures consistency with past architectural decisions.

## 🎯 Making Contributions

### Types of Contributions

We welcome:

- **🐛 Bug fixes** - Fix reported issues
- **✨ New features** - Add functionality (discuss first in issues)
- **📚 Documentation** - Improve guides and API docs
- **🧪 Tests** - Add or improve test coverage
- **🎨 UI/UX** - Enhance user interface and experience
- **⚡ Performance** - Optimize code and queries
- **🔒 Security** - Address security concerns

### Contribution Workflow

1. **Check existing issues** or create a new one to discuss your contribution
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Generate tests**: `npm run test:generate` for new code
4. **Make your changes** following our [code standards](#-code-standards)
5. **Test thoroughly**: `npm run test && npm run check`
6. **Commit with clear messages**: Follow [conventional commits](https://conventionalcommits.org/)
7. **Push and create Pull Request**

### Commit Message Format

```
type(scope): brief description

Detailed explanation of changes if needed

Closes #123
```

**Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`
**Scopes**: `auth`, `tournaments`, `ui`, `api`, `db`, `docs`

## 📏 Code Standards

### TypeScript Guidelines

- **Strict mode**: All code must pass TypeScript strict checks
- **Type safety**: Prefer explicit types over `any`
- **Interfaces**: Define clear interfaces for all data structures
- **Null safety**: Handle null/undefined cases explicitly

### Code Style

- **ESLint**: Follow configured ESLint rules (`npm run lint`)
  - Uses ESLint v9+ flat config format (`eslint.config.js`)
  - See [ESLINT_SETUP_SUMMARY.md](docs/maintenance/ESLINT_SETUP_SUMMARY.md) for migration guide
- **Prettier**: Use consistent formatting (`npm run format`)
- **File naming**: kebab-case for files, PascalCase for components
- **Import order**: External → Internal → Relative imports

### Architecture Patterns

- **Feature-based structure**: Group related functionality together
- **Separation of concerns**: Keep UI, business logic, and data separate
- **Error handling**: Comprehensive error handling with proper logging
- **Security first**: Input validation, SQL injection prevention

### Database Patterns

- **Drizzle ORM**: Use type-safe database operations
- **Transactions**: Use `withTransaction` for multi-step operations
- **Schema changes**: Always update `shared/schema.ts`
- **Migrations**: Use `npm run db:push` (development)

## 🧪 Testing Requirements

### Mandatory Testing

All contributions **must** include:

- ✅ **Generated unit tests**: Use `npm run test:generate`
- ✅ **Passing tests**: All tests must pass (`npm run test`)
- ✅ **Code coverage**: Minimum 70% coverage
- ✅ **Type safety**: Pass TypeScript checks (`npm run check`)

### Test Categories

1. **Unit tests**: Individual function/component testing
2. **Integration tests**: Feature workflow testing
3. **API tests**: Endpoint functionality and error handling
4. **UI tests**: Component behavior and user interactions

### Running Tests

```bash
# Run all tests
npm run test

# Run with coverage
npm run test:coverage

# Run specific feature tests
npm run test:auth
npm run test:tournaments

# Generate tests for new code
npm run test:generate

# Watch mode for development
npm run test:watch
```

## 🔄 Pull Request Process

### Before Submitting

- [ ] Code follows project patterns and conventions
- [ ] All tests pass (`npm run test`)
- [ ] TypeScript compiles without errors (`npm run check`)
- [ ] ESLint passes (`npm run lint`)
- [ ] Documentation updated if needed
- [ ] Security considerations addressed

### PR Requirements

1. **Clear description**: Explain what changes and why
2. **Issue reference**: Link to related issues (`Closes #123`)
3. **Test evidence**: Show tests passing
4. **Breaking changes**: Clearly document any breaking changes
5. **Screenshots**: Include for UI changes

### Review Process

1. **Automated checks**: CI/CD pipeline runs tests
2. **Code review**: Team members review code quality
3. **Testing verification**: Reviewers validate test coverage
4. **Security review**: Security implications assessed
5. **Documentation review**: Ensure docs are updated

### Merge Criteria

- ✅ All CI checks pass
- ✅ At least one approving review
- ✅ No merge conflicts
- ✅ Up-to-date with main branch

## 🐛 Issue Reporting

### Bug Reports

Use the bug report template and include:

- **Environment**: OS, Node.js version, browser
- **Steps to reproduce**: Clear, numbered steps
- **Expected behavior**: What should happen
- **Actual behavior**: What actually happens
- **Screenshots**: If applicable
- **Console logs**: Any error messages

### Feature Requests

Before requesting features:

1. **Check existing issues** for similar requests
2. **Discuss in community** channels first
3. **Provide use cases** and user stories
4. **Consider implementation** complexity

### Issue Labels

- `bug` - Something isn't working
- `enhancement` - New feature or request
- `documentation` - Documentation needs improvement
- `good first issue` - Good for newcomers
- `help wanted` - Extra attention needed
- `security` - Security-related issues

## 🔒 Security

### Reporting Security Issues

**Do not** report security vulnerabilities in public issues.

**Instead**:

1. Email the development team (details in [SECURITY.md](./docs/security/SECURITY_IMPROVEMENTS.md))
2. Provide detailed information about the vulnerability
3. Wait for acknowledgment before public disclosure

### Security Guidelines

- **Input validation**: Validate all user inputs
- **SQL injection prevention**: Use parameterized queries only
- **Authentication**: Secure session handling
- **Authorization**: Proper permission checks
- **Data exposure**: Avoid logging sensitive information

## 🤝 Community Guidelines

### Code of Conduct

We are committed to providing a welcoming and inclusive environment:

- **Be respectful** and professional in all interactions
- **Be constructive** in feedback and discussions
- **Be patient** with newcomers and questions
- **Be collaborative** and help others succeed

### Communication Channels

- **GitHub Issues**: Bug reports and feature requests
- **Pull Requests**: Code review and discussion
- **Discord Community**: Real-time discussions and support
- **Documentation**: Questions about setup and usage

### Recognition

We recognize contributions through:

- **GitHub contributors** list
- **Release notes** acknowledgments
- **Community highlights** in Discord
- **Maintainer program** for consistent contributors

## 🆘 Getting Help

### Documentation Resources

1. **[Development Guide](./docs/development/DEVELOPMENT_GUIDE.md)** - Comprehensive development info
2. **[API Documentation](./docs/api/API_DOCUMENTATION.md)** - Complete API reference
3. **[Database Architecture](./docs/architecture/DATABASE_ARCHITECTURE.md)** - Database design and setup
4. **[Testing Agent Guide](./docs/maintenance/TESTING_AGENT.md)** - Testing framework details

### Common Issues

**Environment setup problems**:

- Check [Environment Variables Guide](./docs/reference/ENVIRONMENT_VARIABLES.md)
- Run `npm run env:validate` to verify configuration
- Ensure database is running and accessible

**TypeScript errors**:

- Run `npm run check` to see all type errors
- Check import paths and type definitions
- Ensure dependencies are installed (`npm install --legacy-peer-deps`)

**Test failures**:

- Run `npm run test:generate` to create missing tests
- Check test dependencies and mocks
- Review test patterns in existing code

### Getting Support

1. **Check existing documentation** in the `docs/` directory
2. **Search existing issues** for similar problems
3. **Ask in Discord community** for real-time help
4. **Create a detailed issue** if you can't find answers

### Mentorship Program

New contributors can:

- **Request mentorship** in Discord
- **Pair with experienced contributors**
- **Start with `good first issue` labels**
- **Join community calls** for live support

---

## 🎉 Thank You!

Your contributions help make Shuffle & Sync the best platform for TCG streaming coordination. Whether you're fixing a typo, adding a feature, or helping other contributors, every contribution matters!

**Ready to get started?**

1. Run `npm run test:generate` to explore the codebase
2. Check out [`good first issue`](https://github.com/Shuffle-and-Sync/reimagined-guacamole/labels/good%20first%20issue) labels
3. Join our [Discord community](./client/src/pages/contact.tsx) for support

---

**Questions?** Check our [documentation index](./docs/README.md) or [create an issue](https://github.com/Shuffle-and-Sync/reimagined-guacamole/issues/new).
