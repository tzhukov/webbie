- [x] Verify that the copilot-instructions.md file in the .github directory is created.
- [x] Clarify Project Requirements - TypeScript TUI chatbot with Ollama, LlamaIndex, and web search
- [x] Scaffold the Project
- [x] Customize the Project
- [ ] Install Required Extensions
- [ ] Compile the Project
- [ ] Create and Run Task
- [ ] Launch the Project
- [x] Ensure Documentation is Complete

# Custom Instructions for TypeScript Project

## General Requirements
*   **Use TypeScript for all code**; prefer `interface`s over `type` aliases.
*   **Avoid `enum`s**; use objects or maps instead.
*   **Prioritize clean, maintainable code** with appropriate TSDoc comments.
*   **Ensure accessibility** by using semantic HTML and proper ARIA roles when writing components.

## Naming Conventions
*   Use `camelCase` for variable and function names.
*   Use `PascalCase` for component and interface names.
*   Use lowercase with dashes for directories (e.g., `components/auth-wizard`).

## Style Guidelines
*   Use 2 spaces for indentation (or tabs, depending on your project's ESLint rules).
*   Favor named exports for components and utilities.
*   When writing React, use functional components with explicit TypeScript interfaces for props.

## Testing
*   Use **Jest** for unit testing and **Playwright** for end-to-end testing.
*   Ensure new code includes relevant tests and adheres to the existing testing structure.

## Code Quality
*   Minimize the use of `any` type; strive for strict type safety.
*   Focus on readability over being performant in the first pass.
*   Do not leave `// TODO` comments or placeholders in the final code.
