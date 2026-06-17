# Coding Standard

## Language

- TypeScript only.
- Strict mode enabled.
- No implicit any.

## Naming

- React components: PascalCase.
- Hooks: `useSomething`.
- Services: `somethingService`.
- Repositories: `somethingRepository`.
- Types: PascalCase.
- Zod schemas: `somethingSchema`.
- Database columns: camelCase, no underscore.
- Database tables: prefix `sh_`.

## Layering

Route handler must be thin.

```txt
Route
→ Service
→ Repository
→ D1/R2/Queue
```

Shopee access:

```txt
Route/Workflow
→ Shopee service
→ Shopee adapter
```

AI access:

```txt
Workflow
→ AI service
→ 9router client
```

## Rules

- Do not hardcode secrets.
- Do not duplicate types.
- Use shared Zod schemas.
- External input must be validated.
- Missing Shopee data must not be invented.
- Store raw large data in R2.
- Store structured data in D1.
