# Database Scripts Documentation

The database scripts have been consolidated and optimized for clarity and performance.

## Structure

- **[00-schema.sql](file:///f:/Website/atlasops-financial/scripts/00-schema.sql)**: Contains the unified database structure.
    - Table definitions (`employees`, `categories`, `income`, `expenses`, `payroll`, `payment_authorizations`, `user_permissions`).
    - Unified indexes for faster queries.
    - Security logic, including Row Level Security (RLS) policies and manager verification functions.
- **[01-seeds.sql](file:///f:/Website/atlasops-financial/scripts/01-seeds.sql)**: Contains the initial data and configuration.
    - Standard categories with emojis and colors.
    - Sample employees and transactions.
    - Unified user permissions (Safe handling for `admin@atlasops.com`).
- **[backup/](file:///f:/Website/atlasops-financial/scripts/backup/)**: Contains the legacy incremental scripts for historical reference.

## How to use

1.  **New Setup**: Run `00-schema.sql` first to create the structure, then `01-seeds.sql` to populate initial data.
2.  **Updates**: The scripts use `IF NOT EXISTS` and `ON CONFLICT` logic, making them safe to run on existing environments.
3.  **Permissions**: To managed permissions, ensure the user has `assign_access = TRUE` in the `user_permissions` table.

> [!NOTE]
> The admin user `admin@atlasops.com` is protected and will always retain full access through these scripts.
