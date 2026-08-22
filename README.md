# Vitaly Bogdel — Portfolio

Static site (no framework, no bundler). Content lives in JSON files under
`content/`; `build.js` reads them and generates `index.html` and
`work/*.html`. Editing happens either by hand (edit JSON → run the build) or
through a web admin panel at `/admin` (Decap CMS), which commits changes to
this repo automatically and triggers a rebuild on Netlify.

## Project structure

```
content/
  site.json          ← homepage & global copy (hero, about, contact, skills)
  cases/*.json        ← one file per case study
assets/images/         ← photos and screenshots (served as-is)
assets/images/uploads/  ← where images uploaded through /admin land
css/style.css
js/main.js
admin/                 ← Decap CMS (config.yml + index.html)
build.js               ← generates index.html + work/*.html from content/
netlify.toml            ← tells Netlify to run `node build.js` on every deploy
```

`index.html` and `work/*.html` are **generated files** — don't hand-edit them,
edits will be overwritten the next time `build.js` runs. Edit the JSON in
`content/` instead.

## Editing locally

1. Edit a file in `content/site.json` or `content/cases/*.json` in any text editor.
2. Run:
   ```bash
   node build.js
   ```
3. Open `index.html` (via a local server, not `file://`) to check it.

### Adding a new case study
Copy an existing file in `content/cases/`, give it a new `slug` and a unique
`order` number, edit the content, then run `node build.js`. It'll appear on
the homepage and get its own page at `work/<slug>.html` automatically.

### Removing a case study
Delete its file from `content/cases/`, then run `node build.js` — the old
`work/<slug>.html` page is deleted automatically and the remaining cases
renumber themselves.

### Images
Put files in `assets/images/` (optimize to WebP first — see below), then
reference them by path in the JSON, e.g. `"/assets/images/my-photo.webp"`.

To resize/convert images to WebP locally:
```bash
npm install sharp --no-save
node -e "require('sharp')('in.jpg').resize({width:1400}).webp({quality:78}).toFile('out.webp')"
```

## Publishing + setting up the /admin editor

This uses **Netlify** to host the site and **Decap CMS + Netlify Identity**
to power `/admin`. All of this is free for a single-editor personal site.

### 1. Push this folder to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
```
Create a new empty repository on [github.com/new](https://github.com/new),
then:
```bash
git remote add origin https://github.com/<your-username>/<repo-name>.git
git branch -M main
git push -u origin main
```

### 2. Create the Netlify site
1. Go to [app.netlify.com](https://app.netlify.com) → **Add new site → Import an existing project**
2. Connect GitHub, pick this repository
3. Build command: `node build.js` · Publish directory: `.` (these are already set in `netlify.toml`, so the defaults should be correct — just confirm and deploy)
4. Wait for the first deploy to finish — you'll get a live URL like `random-name.netlify.app`

### 3. Turn on the editor (Identity + Git Gateway)
1. In the Netlify site dashboard: **Site configuration → Identity → Enable Identity**
2. Under **Registration**, set it to **Invite only** (so strangers can't sign up and edit your site)
3. Still under Identity → **Services → Git Gateway → Enable Git Gateway**
4. Go to the **Identity** tab → **Invite users** → enter your own email
5. Check your email, click the invite link — it'll land on your site and prompt you to set a password

### 4. Use it
Go to `https://<your-site>.netlify.app/admin`, log in with the password you
just set. Edit anything, hit **Publish** — Decap commits the change to
GitHub, Netlify rebuilds (`node build.js`), and the live site updates in
about a minute.

### Custom domain
Site configuration → Domain management → Add a domain — free on Netlify,
works the same whether it's a domain bought elsewhere or through Netlify.

## Local preview server

```bash
npx serve .
```
or use whatever static server you like — just don't open `index.html`
directly via `file://`, since fonts and animation need a real HTTP origin.
