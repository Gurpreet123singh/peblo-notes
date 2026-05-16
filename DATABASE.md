# Database Schema

## notes table

| Column | Type |
|---|---|
| id | bigint |
| title | text |
| content | text |
| tags | text[] |
| share_id | uuid |
| archived | boolean |
| ai_generated_count | int |
| created_at | timestamptz |
