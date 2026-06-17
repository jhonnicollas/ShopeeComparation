# Self Review Checklist

Before marking any task as done, verify all items below.

## Scope

- [ ] The implementation matches the active task.
- [ ] No forbidden files were edited.
- [ ] No unrelated features were added.
- [ ] No locked technical decisions were changed.

## Architecture

- [ ] Code follows the folder structure.
- [ ] Business logic is not placed inside UI components.
- [ ] Shopee access is only handled through extractor/adapters.
- [ ] Heavy processing uses Queue.
- [ ] Runtime configuration is read from configuration tables.
- [ ] Secrets are read from environment/secrets only.

## Database

- [ ] All table names use `sh_` prefix.
- [ ] No database column contains underscores.
- [ ] Column names use camelCase.
- [ ] No new D1 database was created.
- [ ] Existing `DB` binding is used.
- [ ] Existing `LOGS` R2 binding is used.

## Validation and Error Handling

- [ ] Inputs are validated with Zod.
- [ ] API errors use the standard error format.
- [ ] No internal stacktrace is returned to frontend.
- [ ] Partial success is handled where relevant.

## AI and Config

- [ ] 9router provider is configurable.
- [ ] AI model is configurable.
- [ ] AI model can be tested from frontend when relevant.
- [ ] AI output is schema-validated.
- [ ] AI does not invent missing data.

## Tests and Build

- [ ] Lint passes.
- [ ] Typecheck passes.
- [ ] Tests pass.
- [ ] Build passes.
- [ ] Validation scripts pass.

## Documentation

- [ ] Related docs were updated.
- [ ] Current task status was updated.
- [ ] Done or failed report was written.
