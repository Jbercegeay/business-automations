# LinkedIn Model Benchmark Setup

## Purpose

This workflow compares 3 OpenRouter text models on the same fixed 10-video test set.

It is separate from production:

- no production review-sheet writes
- no image generation
- no Gmail notifications

## Commands

```bash
cd /Users/johnnyb/Documents/business-automations
npm run linkedin-model-benchmark
npm run linkedin-model-benchmark -- --limit=1
npm run linkedin-model-benchmark -- --video-id=OQUYyMiJrtw
```

## Required Env Vars

Add these to the project root `.env`:

```dotenv
OPENROUTER_API_KEY=
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_HTTP_REFERER=
OPENROUTER_APP_TITLE=
GOOGLE_SHEETS_LINKEDIN_BENCHMARK_SPREADSHEET_ID=
GOOGLE_SHEETS_LINKEDIN_BENCHMARK_SHEET_NAME=Benchmark
LINKEDIN_MODEL_BENCHMARK_PROMPT_VERSION=linkedin-ai-first-generator-v1
```

The workflow also reuses:

- `YOUTUBE_API_KEY`
- `LINKEDIN_AI_FIRST_GENERATOR_TRANSCRIPT_API_KEY`
- local Google OAuth files already created for the production LinkedIn workflow

## Benchmark Sheet

Current benchmark spreadsheet:

- Spreadsheet ID: `12qislQpy1-8WiDCNW_XnUP7KYE4kG-H4Vd63p2OWzXo`
- Tab name: `Benchmark`

Expected columns:

1. `Run Group ID`
2. `Video ID`
3. `Video Title`
4. `Video URL`
5. `Published At`
6. `Transcript Source`
7. `Model ID`
8. `Model Label`
9. `Prompt Version`
10. `LinkedIn Post`
11. `Email HTML`
12. `Hook Score`
13. `Executive Tone Score`
14. `Clarity Score`
15. `Actionability Score`
16. `Format Reliability Score`
17. `Overall Score`
18. `Human Winner`
19. `Reviewer Notes`
20. `Processed At`

## Models

The benchmark compares these 3 models:

1. `openai/gpt-oss-120b:free`
2. `google/gemma-4-31b:free`
3. `qwen/qwen3-next-80b-a3b-instruct:free`

## Fixed Video Set

The workflow uses a fixed 10-video dataset stored at:

`/Users/johnnyb/Documents/business-automations/workflows/linkedin-model-benchmark/src/lib/benchmark-videos.json`

This keeps comparisons fair across runs.
