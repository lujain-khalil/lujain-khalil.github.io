# lujain-khalil.github.io

Personal portfolio for Lujain Khalil: AI engineer and ML researcher. It is a hand-built static site with no build step and no frameworks.

## Structure

| Path | What it is |
|---|---|
| `index.html` | Home: particle hero, the live terminal agent, the three portals and the career path |
| `engineering/` | AI engineering: number visuals, the agent architecture explorer and a traced agent turn |
| `research/` | The thesis fuzziness lab, one interactive visual per paper and the Kaprekar playground |
| `teaching/` | Audiences, the course map and leadership |
| `assets/js/config.js` | `LK_AGENT_URL`, the Worker URL for the live agent. It is not a secret |
| `assets/js/agent.js` | The terminal agent client: streaming, shell commands and an offline fallback |
| `assets/js/core.js` | Shared nav, reveals, count-ups and helpers |
| `assets/js/{home,engineering,research}.js` | Page visuals |
| `cv/Lujain-Khalil-CV.pdf` | Public CV, with no phone number |

The agent backend lives in a separate private repo: `~/Documents/GitHub/lujain-agent`. Its README covers the API key setup.

## Updating numbers

The EMAAR AI figures appear on the engineering page (`data-count` values and the `.fig` lines), on the home page stat strip and in the agent's knowledge base (`lujain-agent/kb/lujain.md`, section 2 "Results"). Change all three together.

## Updating the EMAAR AI numbers

When real figures replace the current ones, change every place below together:

1. **`engineering/index.html`, "The numbers":** each card's `data-count` (the big number) and its canvas attribute (`data-n`, `data-cut`, `data-faster`, `data-growth`). The visual reads its value from that attribute.
2. **`engineering/index.html`, architecture panel:** the `.fig` lines under Users, Agent harness and Evals.
3. **`index.html`:** the stat strip (~1,300) and the engineering portal blurb.
4. **`assets/js/agent.js`:** the `OFFLINE` answer for "build".
5. **The agent's KB:** `~/Documents/GitHub/lujain-agent/kb/lujain.md`, section 2 "Results". Redeploy the Worker after.

## Preview locally

```bash
cd ~/Documents/GitHub/lujain-khalil.github.io && python3 -m http.server 8000
```

Then open http://localhost:8000.

## Publish on GitHub Pages (one time)

Set your personal git identity for this repo before the first commit.

1. On github.com, signed in as **lujain-khalil**, create an empty public repo named exactly `lujain-khalil.github.io`. Add no README.
2. Run:

```bash
cd ~/Documents/GitHub/lujain-khalil.github.io
git init -b main
git config user.name "Lujain Khalil"
git config user.email "lujain.osama.4@gmail.com"
git add .
git commit -m "Launch portfolio"
git remote add origin https://github.com/lujain-khalil/lujain-khalil.github.io.git
git push -u origin main
```

3. In the repo, go to Settings > Pages and set the source to "Deploy from a branch", `main`, `/ (root)`. The site goes live at https://lujain-khalil.github.io within a minute or two.

If the push asks for credentials, sign in as lujain-khalil. Running `gh auth login` with the personal account first also works.

## Updating content

- Page text lives in each page's `index.html`. The live agent's knowledge lives in the private `lujain-agent` repo; the scripted offline answers live in `OFFLINE` in `assets/js/agent.js`.
- Rebuild the CV from its private LaTeX source, then copy the phone-free PDF to `cv/Lujain-Khalil-CV.pdf`.
- Before pushing, check for em dashes and that no phone number slipped in, in the HTML or the PDF:

```bash
cd ~/Documents/GitHub/lujain-khalil.github.io && grep -rn $'\xe2\x80\x94' --exclude-dir=.git . ; pdftotext cv/Lujain-Khalil-CV.pdf - | head -3
```
