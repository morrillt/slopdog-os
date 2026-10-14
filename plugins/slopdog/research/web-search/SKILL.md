---
name: web-search
description: General web search best practices and patterns. Use when conducting broad web research, evaluating sources, building effective search queries, or when the user needs guidance on research strategies.
---
# Web Search

General web search patterns and best practices for effective research.

## Quick Start

Use the `web_search` tool with targeted queries:

```
"exact phrase" topic
topic site:domain.com
topic filetype:pdf
```

## Search Operators

### Essential Operators

| Operator | Purpose | Example |
|----------|---------|---------|
| `"..."` | Exact phrase match | `"machine learning"` |
| `site:` | Limit to domain | `site:docs.python.org` |
| `-` | Exclude term | `python -snake` |
| `OR` | Either term | `tutorial OR guide` |
| `filetype:` | File type | `filetype:pdf` |

### Advanced Operators

| Operator | Purpose | Example |
|----------|---------|---------|
| `intitle:` | Term in page title | `intitle:tutorial` |
| `inurl:` | Term in URL | `inurl:docs` |
| `before:` | Before date | `before:2025-01-01` |
| `after:` | After date | `after:2024-01-01` |

## Search Patterns by Goal

### Finding Documentation

```
"topic" documentation official
"topic" docs site:*.io
"topic" API reference
```

### Finding Tutorials

```
"topic" tutorial beginner 2026
"topic" step by step guide
"topic" getting started
```

### Finding Comparisons

```
"X vs Y" comparison 2026
"X" alternatives
"best X for Y"
```

### Finding Solutions

```
"error message" solution
"problem" fix resolved
"issue" workaround
```

### Finding Research/Papers

```
"topic" research paper filetype:pdf
"topic" whitepaper
"topic" site:arxiv.org
```

## Source Credibility Evaluation

### High-Credibility Sources

| Source Type | Examples | Trust Level |
|-------------|----------|-------------|
| Official docs | docs.python.org, react.dev | ⭐⭐⭐⭐⭐ |
| Academic | arxiv.org, acm.org | ⭐⭐⭐⭐⭐ |
| Established tech blogs | martinfowler.com, kentcdodds.com | ⭐⭐⭐⭐ |
| Major publications | wired.com, arstechnica.com | ⭐⭐⭐⭐ |
| Stack Overflow (high votes) | stackoverflow.com | ⭐⭐⭐⭐ |

### Caution Sources

| Source Type | Risk | Mitigation |
|-------------|------|------------|
| Medium articles | Variable quality | Check author credentials |
| SEO-optimized sites | May be shallow | Cross-reference |
| Old content (>3 years) | May be outdated | Check date, verify current |
| Anonymous forums | Unverified claims | Require multiple sources |

## Research Workflow

### 1. Start Broad

```
"topic" overview introduction
```

### 2. Identify Key Terms

From initial results, note:
- Technical terms used
- Related concepts
- Key authors/sources

### 3. Narrow Down

```
"specific term" "another term" site:trusted-domain.com
```

### 4. Verify and Cross-Reference

- Check multiple sources
- Look for consensus
- Note disagreements

### 5. Find Primary Sources

- Official documentation
- Original papers/articles
- Author's own site

## Site-Specific Patterns

### Documentation Sites

```
site:docs.* "topic"
site:*.readthedocs.io "topic"
site:developer.* "topic"
```

### News/Updates

```
site:news.ycombinator.com "topic"
site:techcrunch.com "topic"
site:theverge.com "topic"
```

### Learning Platforms

```
site:freecodecamp.org "topic"
site:dev.to "topic"
site:css-tricks.com "topic"
```

## Trigger Scenarios

- User asks to research a topic broadly
- User needs to evaluate source credibility
- User wants effective search strategies
- User is starting research on unfamiliar topic
- User needs to find official documentation

## Best Practices

1. **Be specific** — Vague queries return vague results
2. **Use quotes** — For exact phrases and error messages
3. **Check dates** — Tech info ages quickly
4. **Verify sources** — Cross-reference important claims
5. **Iterate** — Refine queries based on initial results
6. **Note sources** — Track where information came from
