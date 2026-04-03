# TheBrief

AI signal reader with:
- `site/`: Next.js frontend
- `pipeline/`: Python ingest and processing pipeline

## Phase 1 scaffold

Project structure and mock edition data are initialized.

### Frontend
- Framework scaffold files in `site/`
- Mock edition files in `site/public/editions/`

### Pipeline
- Starter files in `pipeline/`
- Admin source abstraction config in `pipeline/config/source_inputs.yaml`
- Generated execution source mapping in `pipeline/config/sources.yaml`

## Sources configuration workflow (admin)

- Edit source inputs in `pipeline/config/source_inputs.yaml`:
  - `trusted_sites`
  - `individuals`
  - `search_terms`
- Run the pipeline to apply changes for the next edition:
  - `python3 pipeline/run.py --day fri`
- Each run automatically updates:
  - `pipeline/config/sources.yaml` (method-level mapping used by ingestion)
  - `site/public/config/sources.public.json` (public read-only snapshot for `/sources`)

### Environment
Use `env.example` as the template for local environment variables.
