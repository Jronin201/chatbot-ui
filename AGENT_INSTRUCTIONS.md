# GitHub Copilot Agent Instructions

## MANDATORY: Read This Document on Every Task

**PROTOCOL**: The GitHub Copilot Agent must read and apply these instructions on **EVERY SINGLE TASK** without exception. This ensures consistent, high-quality implementation and prevents issues from recurring.

**STEP 1 OF EVERY TASK**: Before starting any work, the agent must:
1. Read `/workspaces/chatbot-ui/AGENT_INSTRUCTIONS.md` (this document)
2. Read `/workspaces/chatbot-ui/WINDOW_IDENTIFIERS.md` if working with UI components
3. Apply all protocols and requirements listed below

**FAILURE TO FOLLOW THIS PROTOCOL** will result in:
- Inconsistent implementation
- Broken window identifiers
- Linting errors blocking commits
- Poor code quality
- Wasted time on repeated issues

## Core Protocol for All Tasks

Follow these instructions on **every task** to ensure consistent, high-quality implementation:

### 1. Pre-Change Analysis

- Analyze the codebase structure and understand the context before making changes
- Identify all files that need modification
- Plan the implementation approach

### 2. Implementation Standards

- Make targeted, precise changes that directly address the task requirements
- Follow existing code patterns and conventions
- Maintain consistency with the project's architecture

### 3. Window Identifier Preservation

- **CRITICAL**: Do not lose or change window identifiers (windowId props) unless explicitly requested
- When modifying dialogs, sheets, or alert dialogs, preserve existing window IDs
- Ensure all window identifier badges remain visible and functional
- Reference the `/workspaces/chatbot-ui/WINDOW_IDENTIFIERS.md` file for existing IDs

### 4. Quality Assurance (MANDATORY)

After making any changes, **ALWAYS** run these checks:

```bash
# Check for linting errors
npm run lint

# Fix auto-fixable linting issues
npm run lint:fix

# Check formatting
npm run format:write
```

**REQUIREMENT**: Ensure no linting errors remain that would cause the commit to fail with "Git: > chatbot-ui@2.0.0 lint:fix" error.

### 5. Error Handling

- Use `get_errors` tool to check for compilation/linting issues after edits
- Fix any errors introduced by changes
- Validate that fixes actually resolve the issues

### 6. Iteration Protocol

- **Continue iterating indefinitely** until the task is complete
- Do not stop due to time spent or number of iterations
- Each iteration should bring the implementation closer to completion
- Test and validate changes at each step

### 7. Scope Management

- **Only make changes explicitly requested** in the task
- **Do not make additional "helpful" changes** without user approval
- If you identify beneficial additional changes, ask the user:

  ```text
  "I notice that [describe potential improvement]. Would you like me to make this additional change, or should I focus only on the requested task?"
  ```

### 8. Commit Management

- When you detect that changes should be committed before continuing (e.g., major refactoring, before adding new features, etc.), ask the user:

  ```text
  "I recommend committing the current changes before proceeding with [next steps]. Please commit the changes, then tell me to 'continue' and I'll proceed with the next iteration."
  ```

- Wait for user confirmation before proceeding after requesting a commit

### 9. Documentation Updates

- Update relevant documentation files when making significant changes
- Maintain the `WINDOW_IDENTIFIERS.md` file when adding new dialogs/windows
- Keep implementation summaries and guides current

### 10. Final Validation

Before considering a task complete:

- [ ] All requested functionality is implemented
- [ ] No linting errors remain
- [ ] Window identifiers are preserved/correctly implemented
- [ ] Code follows project conventions
- [ ] Documentation is updated if needed
- [ ] All changes are tested and functional

## Emergency Protocols

### If Linting Fails:
1. Run `npm run lint` to identify specific issues
2. Use `get_errors` tool to see detailed error information
3. Fix errors systematically
4. Re-run linting until clean

### If Window IDs Are Lost:
1. Check `/workspaces/chatbot-ui/WINDOW_IDENTIFIERS.md` for correct IDs
2. Restore missing `windowId` props
3. Verify window identifier badges are visible

### If Iteration Seems Stuck:
1. Reassess the current state
2. Break down remaining work into smaller steps
3. Focus on one specific issue at a time
4. Ask for user clarification if requirements are unclear

## Success Criteria
A task is complete when:
- All requested functionality works as intended
- No linting errors remain
- Window identifiers are preserved and functional
- Code quality meets project standards
- User has confirmed satisfaction with the implementation

---

**Remember: This protocol applies to EVERY task. Always reference these instructions before and during implementation.**

## Agent Self-Instruction Protocol

**REQUIRED FIRST ACTION ON EVERY TASK**: When given any task, I must:

1. **Read this document** (`/workspaces/chatbot-ui/AGENT_INSTRUCTIONS.md`) in its entirety
2. **Read the window identifiers** (`/workspaces/chatbot-ui/WINDOW_IDENTIFIERS.md`) if working with UI components
3. **Apply all protocols** listed above without exception
4. **Confirm in my mind** that I understand the requirements before proceeding

This protocol ensures:
- Consistent, high-quality implementation
- Preservation of window identifiers
- No linting errors that block commits
- Proper documentation maintenance
- Continuous iteration until completion

**FAILURE TO FOLLOW THIS PROTOCOL** will result in subpar implementation and repeated issues.

---