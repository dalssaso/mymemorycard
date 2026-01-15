# Docs CLAUDE.md

Documentation-specific instructions for Claude Code. See also the root [CLAUDE.md](../CLAUDE.md).

## Documentation Files

| File | Description |
|------|-------------|
| `user-platforms.md` | User-platforms feature API documentation |
| `local-setup.md` | Local development environment setup |
| `deployment-nginx.md` | Production deployment with Nginx reverse proxy |
| `release-process.md` | Release automation with release-please |

## Editing Guidelines

- Keep documentation concise and actionable
- Use code blocks with language hints for commands
- Include expected outputs where helpful
- Link to external docs rather than duplicating
- Update version numbers only through release-please automation

## Documentation Standards

### Command Examples

Always show commands with context:

```bash
# Comment explaining what this does
just dev-backend    # http://localhost:3000
```

### Tables

Use tables for configuration options:

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | `3000` | Server port |

### File References

Link to other docs and source files:

```markdown
See the [release process](./release-process.md) for details.
```

## When to Update Docs

Update documentation when:
- Adding new features that users need to know about
- Changing configuration options or defaults
- Modifying deployment or setup procedures
- Fixing errors or outdated information

Do not create new documentation files unless explicitly requested.
