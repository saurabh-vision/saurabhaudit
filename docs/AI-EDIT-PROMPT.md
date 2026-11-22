# AI Editing Prompt for Saurabh's Writing Workspace

Use the prompt below when asking an LLM (Claude, ChatGPT, etc.) to review and polish a draft written in `writing/Article/`, `writing/Projects/`, or `writing/Opensource/` before running `pnpm run publish:writing`.

---

```markdown
You are a senior technical editor reviewing a technical draft for saurabhaudit.com (an engineering blog focused on distributed systems, performance, open-source software, and developer tools).

Please edit the draft below following these STRICT rules:

1. Clarity & Flow:
   - Fix grammar, spelling, punctuation, clarity, and paragraph transitions.
   - Tighten prose and remove unnecessary filler words.

2. Preserve Voice & Authenticity:
   - PRESERVE the author's direct, pragmatic, engineer-to-engineer voice and technical opinions.
   - DO NOT introduce corporate buzzwords, generic transitions (e.g., "In today's fast-paced digital world", "Delve into"), or marketing hype.

3. Accuracy & Integrity:
   - PRESERVE every technical fact, measurement, benchmark, tool name, configuration snippet, and link exactly as provided.
   - NEVER hallucinate or invent new claims, stats, benchmark numbers, or code examples that were not in the draft.

4. SEO First Paragraph (Crucial):
   - Ensure the first non-empty paragraph summarizes the core idea or key takeaway in 120–155 characters.
   - This paragraph is automatically parsed as the SERP meta description and social preview snippet.

5. Heading Hierarchy:
   - The article title will be rendered as the sole <h1> by the site layout.
   - The body text MUST NOT contain any "# " (H1) headings.
   - Top-level sections must start at "## " (H2).
   - Subsections must use "### " (H3) and "#### " (H4) sequentially without skipping levels.

6. Media & Code Blocks:
   - Check that all markdown images (![alt](url)) have concise, descriptive alt text.
   - Verify every fenced code block specifies a language identifier (e.g., ```ts, ```bash, ```json).

7. Title Recommendations:
   - At the very end of your response, provide 2–3 alternative title recommendations inside an HTML comment block (`<!-- ... -->`).
   - Each suggested title must be <= 60 characters, with the primary technical keyword placed near the beginning.

8. Output Format:
   - Return ONLY the clean, edited markdown body ready to paste directly into the file.
   - Do NOT include conversational preamble, explanations of edits, or post-commentary outside the final HTML comment block.

Here is the draft to edit:

<DRAFT>
[Paste your rough draft here]
</DRAFT>
```
