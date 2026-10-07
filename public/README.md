# ESCV Documentation & Reporting Convention

## Recommended Repository Structure (projetc)
```bash
project/
├── 00-project/
│   ├── README.md
│   ├── project-charter.md
│   └── glossary.md
├── 01-requirements/
│   ├── README.md
│   ├── requirements-baseline.md
│   ├── product-backlog.md
│   ├── user-stories.md
│   └── acceptance-criteria.md
├── 02-system-design/
├── 03-database/
├── 04-api/
├── 05-client/
├── 06-security/
├── 07-devops/
├── 08-testing/
├── 09-decisions/
├── 10-meetings/
├── reports/
│   ├── weekly/
│   │   ├── 2026-W02/
│   │   │   ├── AM-REQ-01.md
│   │   │   ├── ES-CES-01.md
│   │   │   ├── RM-DB-01.md
│   │   │   └── ...
│   │   └── ...
│   └── templates/
│       └── ESCV-Individual-Weekly-Report-Template.md
└── assets/
    ├── diagrams/
    └── figures/
```

## File Rules
- Use Markdown (`.md`) as the Git-tracked source of truth for living documentation.
- Use `.docx`/`.pdf` for university submission packages or formally formatted snapshots.
- Do not store generated Word/PDF files as the only source of a document that will change frequently.
- Use stable IDs for requirements (`FR-xxx`), user stories (`US-xxx`), non-functional requirements (`NFR-xxx`), open questions (`OQ-xxx`), decisions (`ADR-xxx`), and evidence (`EV-xxx`).
- Never commit credentials, tokens, private keys, `.env` files, or real sensitive shipment data.
- Keep diagrams in `docs/assets/diagrams/` and reference them from the owning document.

## Report Naming
`[FirstInitial][LastInitial]-[PART-CODE]-[NN].extension`

Examples:
- `AM-REQ-01.docx`
- `ES-CES-01.docx`
- `RM-DB-01.docx`
- `OA-SYSDES-01.docx`
- `SI-DEVOPS-01.docx`
- `AN-SEC-01.docx`

## Part-Code Registry
| Code | Workstream |
|---|---|
| REQ | Requirements / Product Backlog |
| CES | Client-End Side / Frontend |
| DB | Database |
| SYSDES | System Design / Architecture |
| DEVOPS | DevOps / Infrastructure / CI-CD |
| SEC | Cybersecurity |
| BUS | Business Analysis |
| TEST | Testing / QA |
| API | API / Backend Integration |

## Maintenance Rule
A weekly report records a person's contribution. The canonical project artifact should live in the appropriate workstream folder. The weekly report should reference that artifact rather than becoming a second conflicting source of truth.