# AI Summary Configuration

EDGE can show an AI Summary button in metagenomics result sections. The button lets a project owner, or an admin user, generate a concise AI summary for each result section.

The AI provider key is configured only on the server. Do not put provider keys in the client `.env` file.

## Supported Result Sections

AI summaries are available for these result sections:

- ReadsQC Result
- Assembly Result
- Annotation Result
- Binning Result
- AntiSmash Result
- Taxonomy Result
- Phylogeny Analysis Result
- Reference-Based Analysis Result
- Gene Family Result

## Access Rules

- Project owners can generate summaries for their own projects.
- Admin users can generate summaries for any project through the admin project page.
- Shared users and public visitors cannot generate summaries.
- The server enforces these rules, so direct API calls from non-owners are rejected.

## Client Configuration

The client only controls whether the AI Summary button is shown. It does not store the AI provider key, model, endpoint, or prompts.

Edit `webapp/client/.env`:

```env
VITE_AI_SUMMARY_ENABLED=true
```

If this value is changed, restart the Vite dev server or rebuild the client.

## Server Configuration

Edit `webapp/server/.env`:

```env
AI_SUMMARY_ENABLED=true
AI_SUMMARY_API_KEY=__YOUR_PROVIDER_KEY__
AI_SUMMARY_MODEL=__YOUR_MODEL_NAME__
AI_SUMMARY_BASE_URL=https://api.openai.com/v1
AI_SUMMARY_CHAT_COMPLETIONS_PATH=/chat/completions
AI_SUMMARY_INCLUDE_IMAGES=true
AI_SUMMARY_MAX_OUTPUT_TOKENS=300
AI_SUMMARY_TEMPERATURE=0.2
AI_SUMMARY_MAX_USER_CHARS=60000
AI_SUMMARY_MAX_FETCH_CHARS=20000
AI_SUMMARY_MAX_IMAGE_BYTES=1500000
AI_SUMMARY_REQUEST_TIMEOUT_MS=120000
```

Restart the API server after changing `webapp/server/.env`.

## Server Settings

| Variable | Default | Purpose |
| --- | --- | --- |
| `AI_SUMMARY_ENABLED` | `false` | Enables or disables AI summary generation on the server. |
| `AI_SUMMARY_API_KEY` | none | Provider API key. This stays on the server and is never sent to the browser. |
| `AI_SUMMARY_MODEL` | none | Model name sent to the AI provider. |
| `AI_SUMMARY_BASE_URL` | `https://api.openai.com/v1` | Base URL for the AI provider. |
| `AI_SUMMARY_CHAT_COMPLETIONS_PATH` | `/chat/completions` | Chat completions path appended to the base URL. |
| `AI_SUMMARY_INCLUDE_IMAGES` | `true` | Includes small PNG, JPG, JPEG, or WebP figures as image inputs when the provider supports image input. |
| `AI_SUMMARY_MAX_OUTPUT_TOKENS` | `300` | Maximum response length requested from the model. |
| `AI_SUMMARY_TEMPERATURE` | `0.2` | Sampling temperature for summary generation. |
| `AI_SUMMARY_MAX_USER_CHARS` | `60000` | Maximum characters sent from the assembled user content. |
| `AI_SUMMARY_MAX_FETCH_CHARS` | `20000` | Maximum characters read from each linked text, HTML, SVG, TSV, CSV, or JSON file. |
| `AI_SUMMARY_MAX_IMAGE_BYTES` | `1500000` | Maximum image file size included as model input. Larger images are skipped. |
| `AI_SUMMARY_REQUEST_TIMEOUT_MS` | `120000` | Provider request timeout in milliseconds. |

## Prompt Configuration

The server has a default system prompt in `webapp/server/config.js`. You can override the default prompt for all sections:

```env
AI_SUMMARY_SYSTEM_CONTENT="Write one concise paragraph summarizing this workflow result. If data are insufficient, say so plainly."
```

You can also override the system prompt per result section:

```env
AI_SUMMARY_SYSTEM_CONTENT_READSQC="Write one concise ReadsQC summary paragraph."
AI_SUMMARY_SYSTEM_CONTENT_ASSEMBLY="Write one concise assembly summary paragraph."
AI_SUMMARY_SYSTEM_CONTENT_ANNOTATION="Write one concise annotation summary paragraph."
AI_SUMMARY_SYSTEM_CONTENT_BINNING="Write one concise binning summary paragraph."
AI_SUMMARY_SYSTEM_CONTENT_ANTISMASH="Write one concise antiSMASH summary paragraph."
AI_SUMMARY_SYSTEM_CONTENT_TAXONOMY="Write one concise taxonomy summary paragraph."
AI_SUMMARY_SYSTEM_CONTENT_PHYLOGENY="Write one concise phylogeny summary paragraph."
AI_SUMMARY_SYSTEM_CONTENT_REF_BASED="Write one concise reference-based analysis summary paragraph."
AI_SUMMARY_SYSTEM_CONTENT_GENE_FAMILY="Write one concise gene family summary paragraph."
```

Section-specific prompts take priority over `AI_SUMMARY_SYSTEM_CONTENT`.

## What Data Is Sent To The Model

For each section, the server assembles user content from:

- The structured result data stored in the project result JSON.
- Linked text-like outputs, including HTML, text, TSV, CSV, JSON, and SVG files, when they are under configured project or static result directories.
- Linked image outputs, including PNG, JPG, JPEG, and WebP files, when `AI_SUMMARY_INCLUDE_IMAGES=true` and the image is smaller than `AI_SUMMARY_MAX_IMAGE_BYTES`.

PDF files are listed as linked files but are not text-extracted by this implementation.

The server truncates large arrays and long strings before sending them to the model. This keeps prompts bounded and avoids sending very large result files.

## Caching And Regeneration

Generated summaries are saved in the project directory:

```text
<PROJECTS_BASE_DIR>/<project-code>/ai_summary.json
```

Normal AI Summary button behavior:

- First click with no saved summary: generates a summary and saves it.
- Later clicks, including after refreshing the result page: returns the saved summary without calling the provider again.
- Clicking `Generate` or `Regenerate` in the popup: forces a new provider request and overwrites the saved section summary.

To clear all saved AI summaries for a project, delete `ai_summary.json`. To clear only one section, remove that section key from the JSON file.

## API Routes

The client calls one of these routes depending on how the project page is being viewed:

```text
POST /api/auth-user/projects/:code/aiSummary
POST /api/admin/projects/:code/aiSummary
```

The public route exists but cannot generate summaries for anonymous users because summary generation requires the project owner or an admin user:

```text
POST /api/public/projects/:code/aiSummary
```

Request body:

```json
{
  "sectionKey": "taxonomy",
  "title": "Taxonomy Result",
  "regenerate": false
}
```

Response body:

```json
{
  "summary": "One-paragraph summary text...",
  "cached": true,
  "model": "configured-model-name",
  "updated": "2026-06-02T18:30:00.000Z",
  "message": "Action successful",
  "success": true
}
```

## Troubleshooting

If the button does not appear:

- Confirm `VITE_AI_SUMMARY_ENABLED=true` in `webapp/client/.env`.
- Confirm the viewer is the project owner or has admin role.
- Restart or rebuild the client after changing `VITE_AI_SUMMARY_ENABLED`.

If generation fails with missing configuration:

- Confirm `AI_SUMMARY_ENABLED=true` in `webapp/server/.env`.
- Confirm `AI_SUMMARY_API_KEY` and `AI_SUMMARY_MODEL` are set.
- Restart the API server after changing `webapp/server/.env`.

If generation fails for image input:

- Set `AI_SUMMARY_INCLUDE_IMAGES=false`, or use a model/provider that supports image inputs through chat completions.
- The server automatically retries without images for non-authentication provider errors.

If a summary does not change after editing the prompt:

- Click `Regenerate` in the popup, or delete the relevant section from `ai_summary.json`.
