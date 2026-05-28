Write comprehensive tests for: $ARGUMENTS

Testing conventions:
* Use Vitest with Vuu Test Utils
* Place test files in a __tests__ directory in the same folder as the source file
* Name test files as [filename].spec.ts
* Use @/ prefix for imports
* Use Mocking and stubbing where needed
* For mocking the store use `setActivePinia` & `createPinia`
* Tests should be simple and human understandable, don't write too many unnecessary tests
* Aim for coverage >= 90

Coverage:
* Test happy paths
* Test edge cases
* Test error states
* Focus on testing behavior and public apis rather than testing the implementation details