# LinkedIn Model Benchmark

This workflow benchmarks multiple text models against the same fixed set of YouTube videos used for LinkedIn content repurposing.

It is isolated from the production LinkedIn workflow:

- no production review-sheet writes
- no image generation
- no Gmail notifications

## Runtime

- Node.js 20+
- environment variables loaded from the project root `.env`
- Google OAuth desktop client JSON in `.secrets/google_oauth_client.json`
- saved Google OAuth token in `.data/linkedin-ai-first-generator-google-token.json`
- OpenRouter API access
- YouTube Data API access
- youtube-transcript.io API access

## Commands

```bash
npm run linkedin-model-benchmark
npm run linkedin-model-benchmark -- --limit=1
npm run linkedin-model-benchmark -- --video-id=OQUYyMiJrtw
```

## Required Environment Variables

- `YOUTUBE_API_KEY`
- `LINKEDIN_AI_FIRST_GENERATOR_TRANSCRIPT_API_KEY`
- `OPENROUTER_API_KEY`
- `GOOGLE_SHEETS_LINKEDIN_BENCHMARK_SPREADSHEET_ID`
- `GOOGLE_SHEETS_LINKEDIN_BENCHMARK_SHEET_NAME` optional, defaults to `Benchmark`

## Benchmark Sheet Columns

The benchmark sheet should have these columns in order:

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
