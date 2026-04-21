# Project Plan

## Migration Strategy

1. Rebuild each n8n workflow in code with matching behavior.
2. Verify the coded workflow produces the same outputs.
3. Improve edge cases, logging, retries, and approvals after parity is reached.

## Workflow Backlog

- `receipt-parser`: migrate first
- future workflows: add one folder per automation under `workflows/`

## Design Rules

- Keep secrets in environment variables
- Keep workflow-specific code isolated from shared helpers
- Favor simple services and scripts over heavy orchestration tools
- Add a short README in each workflow folder describing trigger, steps, and outputs
