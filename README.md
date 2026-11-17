# lujain-khalil.github.io

personal portfolio for lujain khalil, an ai engineer and ml researcher. it is a hand-built static site with no build step and no frameworks.

## structure

| path | what it is |
|---|---|
| `index.html` | home page: the particle hero, the live terminal agent, the three page links and the career path |
| `engineering/` | ai engineering: the number visuals, the agent architecture explorer and a traced agent turn |
| `research/` | the thesis fuzziness lab, one interactive visual per paper and the kaprekar demo |
| `teaching/` | audiences, the course map and leadership |
| `assets/js/config.js` | `LK_AGENT_URL`, the worker url for the live agent. it is not a secret |
| `assets/js/agent.js` | the terminal agent client. it handles streaming, shell commands and an offline fallback |
| `assets/js/core.js` | shared nav, reveals, count-ups and helpers |
| `assets/js/{home,engineering,research}.js` | page visuals |
| `cv/Lujain-Khalil-CV.pdf` | public cv, with no phone number |

the agent backend is in a separate private repo: `~/Documents/GitHub/lujain-agent`. its readme covers the api key setup.

## updating the emaar ai numbers

the emaar ai figures appear in five places. change all of them together:

1. `engineering/index.html`, "the numbers" section. each card has a `data-count` value for the big number and a canvas attribute (`data-n`, `data-cut`, `data-faster` or `data-growth`). the visual reads its value from that attribute.
2. `engineering/index.html`, architecture panel. update the `.fig` lines under users, agent loop and evals.
3. `index.html`. update the stat strip (~1,300) and the engineering portal blurb.
4. `assets/js/agent.js`. update the `OFFLINE` answer for "build".
5. the agent's knowledge base, `~/Documents/GitHub/lujain-agent/kb/lujain.md`, section 2 "results". redeploy the worker after.

## preview locally

```bash
cd ~/Documents/GitHub/lujain-khalil.github.io && python3 -m http.server 8000
```

then open http://localhost:8000.

## publish on github pages (one time)

set your personal git identity for this repo before the first commit.

1. on github.com, signed in as lujain-khalil, create an empty public repo named `lujain-khalil.github.io`. add no readme.
2. run:

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

3. in the repo, go to settings, then pages, and set the source to "deploy from a branch", `main`, `/ (root)`. the site goes live at https://lujain-khalil.github.io within a few minutes.

if the push asks for credentials, sign in as lujain-khalil. you can also run `gh auth login` with the personal account first.

## updating content

- page text is in each page's `index.html`. the live agent's knowledge is in the private `lujain-agent` repo. the scripted offline answers are in `OFFLINE` in `assets/js/agent.js`.
- rebuild the cv from its private latex source, then copy the phone-free pdf to `cv/Lujain-Khalil-CV.pdf`.
- before pushing, check the html and the pdf for em dashes and for a phone number:

```bash
cd ~/Documents/GitHub/lujain-khalil.github.io && grep -rn $'\xe2\x80\x94' --exclude-dir=.git . ; pdftotext cv/Lujain-Khalil-CV.pdf - | head -3
```
