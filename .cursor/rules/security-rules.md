---
description: This rule should be used when handling security-sensitive operations like file writes, command execution, or API interactions.
version: 1.0.0
---

# Security Rules

This rule defines security guidelines and validation requirements.

## General Security Principles

- **Never trust user input**: Always validate and sanitize
- **Principle of least privilege**: Request minimum permissions
- **Defense in depth**: Multiple layers of security
- **Fail securely**: Handle errors safely
- **Audit trail**: Log security-relevant events
- **Absolutely prohibited**: path traversal, system file operations, dangerous commands, hardcoded keys
- **Mandatory requirements**: input validation, minimum privileges, audit logs, desensitized output, security failure
- All file / command / API/Agent operations must undergo a security scan first

## File Operations

### Before Writing Files

Verify the operation is safe:

1. **Path validation**: No path traversal (`..`)
2. **Location check**: Not system directories (`/etc`, `/root`)
3. **File type check**: Appropriate extension
4. **Size check**: Reasonable file size
5. **Sensitive files**: Warn about `.env`, credentials, keys

### Dangerous Patterns to Block

- Path traversal: `..` in file paths
- System paths: `/etc/`, `/root/`, `/sys/`
- Sensitive files: `.env`, `*.pem`, `credentials.json`
- Overwriting configs: `~/.ssh/`, `/etc/`
- Temporary files in wrong locations

### File Write Validation

```javascript
// Validate file path - 检测相对路径和绝对路径（增强版：处理多级路径穿越）
const normalizedPath = path.replace(/\\/g, '/').replace(/\/+/g, '/');
const isPathTraversal = /\.\./.test(normalizedPath);
const isSystemPathAbsolute = /^\/(etc|root|sys|proc)\//.test(normalizedPath);
const isSystemPathRelative = /\.\.\/(etc|root|sys|proc)\//.test(normalizedPath);
const isSensitive = /\.(env|pem|key|credentials)$/.test(path);
const isTooLarge = size > MAX_FILE_SIZE;

if (isPathTraversal || isSystemPathAbsolute || isSystemPathRelative || isSensitive || isTooLarge) {
  // Block or warn
}
```

## Command Execution

### Bash Command Safety

1. **Validate input**: Sanitize all user input
2. **Avoid shell injection**: Use arrays, not string interpolation
3. **Limit scope**: Restrict to specific commands
4. **Timeout**: Prevent infinite processes
5. **Log commands**: Audit trail for debugging

### Dangerous Commands

Block or warn on:

- `rm -rf` (especially with wildcards)
- `dd` (disk operations)
- `mkfs` (filesystem creation)
- `chmod 777` (insecure permissions)
- `sudo` without specific commands
- Commands modifying `/etc/` or system files

### Command Validation

```bash
#!/bin/bash
# Validate bash command
command="$1"

# Block dangerous patterns
if echo "$command" | grep -qE 'rm\s+-rf|dd\s+|mkfs|chmod\s+777'; then
  echo "Dangerous command detected"
  exit 1
fi
```

## API Security

### Input Validation

1. **Type checking**: Expected data types
2. **Range validation**: Min/max values
3. **Format validation**: Regex patterns
4. **Length limits**: Prevent overflow
5. **Required fields**: Validate presence

### Common Vulnerabilities

- **SQL Injection**: Use parameterized queries
- **XSS**: Escape output, use CSP
- **CSRF**: Implement tokens
- **IDOR**: Validate object ownership
- **SSRF**: Validate URLs, block internal IPs

## Secrets Management

### Never Commit

Add to `.gitignore`:

```
.env
*.env
.env.*
credentials.json
*.pem
*.key
secrets.json
api-keys.json
```

### Environment Variables

1. **Don't log secrets**: Mask in output
2. **Don't hardcode**: Use environment variables
3. **Validate presence**: Check required vars
4. **Type checking**: Validate format

## Security Checklist

- [ ] All user input validated
- [ ] No hardcoded secrets
- [ ] Proper error handling
- [ ] Sensitive data masked in logs
- [ ] Secure defaults
- [ ] Dependencies updated
- [ ] Security headers set
- [ ] CORS properly configured
