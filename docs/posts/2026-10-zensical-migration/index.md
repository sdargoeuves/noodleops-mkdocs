---
authors:
  - sdargoeuves
# categories:
#   - blog
date:
  created: 2026-10-20
  # updated: 2026-10-02
draft: false
tags:
  - blog
title: "NoodleOps Migration: from Material for MkDocs to Zensical"
---

With the recent release of the `blog` plugin in Zensical, it was time to start the migration of this blog.

<!-- more -->

![AI generated image - Network cables are used as a visual stand-in for noodles, a playful reference to Noodle(Ops). Chopsticks lift the cables from an old, worn bowl into a clean, new bowl, illustrating the migration from Material for MkDocs to Zensical.](zensical-migration.png){ width=600 }
/// caption
NoodleOps Migration: from Material for MkDocs to Zensical
///

## Introduction

When I started this blog, I picked Material for MkDocs for a few reasons, which you can read about in [Getting started with the blog](../2025-02-getting-started-with-blog/index.md). In November 2025, the Material for MkDocs team [announced Zensical](https://squidfunk.github.io/mkdocs-material/blog/2025/11/05/zensical/), their next generation static site generator.

The reason behind it: MkDocs has been unmaintained since August 2024, and the team hit limits they couldn't work around. For more context, this is an interesting read: [The Slow Collapse of MkDocs](https://fpgmaas.com/blog/collapse-of-mkdocs/).

Plugins were still being ported from Material for MkDocs to Zensical, so I couldn't migrate right away. I had to wait until the `blog` plugin became available, in late September 2026.

## What I had to do

The good news is that Zensical reads an existing `mkdocs.yml`, so I didn't have to rewrite my config. The less good news is that it doesn't run MkDocs plugins directly. It has its own replacements for the most common ones, so a few things needed attention.

### 1. Switch to a new project setup

I started from a fresh virtual environment with `uv` and installed `zensical`, following the [Zensical installation guide](https://zensical.org/docs/get-started/). Nothing fancy here. These are the two commands I use now:

- `uv run zensical serve` to preview the blog locally
- `uv run zensical build` to build it

### 2. Fix the social cards crash

Social cards are the preview images generated for each page, shown when you share a link. My first build failed with this error:

```text
RuntimeError: failed to render social layout expression: unknown method: none has no method named replace
```

The social card layout reads the `primary` color from the theme palette, and mine didn't have one. The fix was a single line in the first palette entry of `mkdocs.yml`:

```yaml
  palette:
    - media: "(prefers-color-scheme)"
      primary: indigo # required by zensical's social card layout
```

### 3. Check the plugins

The plugins that matter most to me, `blog`, `tags`, `search` and `social`, all work in Zensical. The `blog` plugin was the one I was waiting for.

I didn't spend long testing the others. According to the [list of supported MkDocs plugins](https://zensical.org/docs/compatibility/mkdocs/plugins/), `glightbox` (image zoom) is supported, but `git-revision-date-localized` is not yet. Zensical silently ignores the config of plugins it doesn't support, so the build won't warn you.

- [ ] `git-revision-date-localized`: not supported yet
- [x] `glightbox`: supported
- [x] `open-in-new-tab`: replaced by a small script, see below

### Open links in a new tab

Without the `open-in-new-tab` plugin, I have two options. For a single link, `attr_list` (already enabled in my `markdown_extensions`) does the job:

```markdown
[NoodleOps](https://noodleops.space){ target="_blank" rel="noopener" }
```

To apply it to every external link, I use a small JavaScript file. It takes two steps.

First, create the file `docs/assets/js/external-links.js`:

```js
document$.subscribe(() => {
  document.querySelectorAll('a[href^="http"]').forEach(a => {
    if (a.hostname !== location.hostname) {
      a.target = "_blank";
      a.rel = "noopener";
    }
  });
});
```

Then declare it in `mkdocs.yml`, next to `extra_css`. The path is relative to the `docs` folder:

```yaml
extra_javascript:
  - assets/js/external-links.js
```

The script runs on every page and adds `target="_blank"` to any link that points to another domain. Wrapping it in `document$.subscribe` makes it run again after each page change, because the theme loads pages without a full reload (`navigation.instant`). Internal links are left alone.

### 4. Review the requirements file

Zensical replaces the whole Material for MkDocs stack, so my `requirements.txt` shrank a lot. This is what it looked like before:

```text
# Mkdocs
mkdocs-git-revision-date-localized-plugin==1.4.7
mkdocs-glightbox==0.4.0
mkdocs-material==9.6.14
mkdocs-material-extensions==1.3.1
mkdocs-material[imaging]
mkdocs-open-in-new-tab==1.0.8

# Markdown
mdx_truly_sane_lists==1.3

# Reloading / Live issue
click==8.2.1
```

And this is what it looks like now:

```text
zensical>=0.0.68
mdx_truly_sane_lists==1.3
```

The plugins I kept are built into Zensical, so they no longer need their own package. The one line worth keeping is the Markdown extension I use for list indentation. Zensical imports every extension listed in `markdown_extensions`, so each one has to be in the requirements file, or the build fails with a `ModuleNotFoundError`. I learned that the hard way on my first Cloudflare build.

## Deploying on Cloudflare Pages

The blog is hosted on Cloudflare Pages, and the build runs there on every push. Cloudflare doesn't have `uv` out of the box, so I kept it simple with `pip` and the `requirements.txt` above. The settings live in your project, under **Settings**, then **Build**. This is what the page looks like for the blog:

- **Git repository:** `sdargoeuves/noodleops-mkdocs`, the GitHub repository Cloudflare watches.
- **Build configuration:**
  - **Build command:** `pip install -r requirements.txt && zensical build`
  - **Build output:** `site`
  - **Root directory:** empty, the project is at the root of the repository.
  - **Build comments:** enabled.
- **Build cache:** disabled (it's still in beta, and I haven't tried it).
- **Branch control:** the production branch is `main`, and automatic deployments are enabled, so every push triggers a build.
- **Build watch paths:** `*`, a change to any file triggers a build.
- **Build system version:** Version 3.
- **Deploy hooks:** none defined.

Only the two settings under **Build configuration** needed my attention: the **Build command** and the **Build output**. The rest I left as it was.

The main difference with before is that Cloudflare used to offer a ready-made preset for MkDocs in its interface, which filled in those two settings for you. There is no preset for Zensical, at least at the time of writing, so you have to enter them yourself. It's not as bad as it sounds: the build command changes from `mkdocs build` to the one above, and the build output stays `site`.

### A confusing build failure

My first build on Cloudflare failed, and the log showed a scary Rust panic:

```text
thread 'zrx/executor/3' panicked at crates/zensical/src/compat/mkdocs/plugin/blog.rs:785:22:
ordered posts have selected pages
```

It looks like a bug in the `blog` plugin, but it isn't. The real error was a few lines further down, at the end of the Python traceback:

```text
RuntimeError: Python error: ModuleNotFoundError: No module named 'mdx_truly_sane_lists'
```

That is the missing Markdown extension from the requirements section above. Lesson learned: when a Zensical build fails, scroll to the bottom of the log, the last `Error` line is the one that matters.

### Python version

Cloudflare picked Python 3.13 on its own, which is the default of its v3 build image, and that was enough for Zensical. I didn't have to set anything.

If you need a different version, there are two ways to tell Cloudflare, according to the [build image documentation](https://developers.cloudflare.com/pages/configuration/build-image/):

- Set the `PYTHON_VERSION` environment variable in the Pages project settings.
- Commit a `.python-version` file at the root of the repository, containing just the version number. It's the same file tools like `uv` use locally.

In my case, `.python-version` is in my `.gitignore`, so Cloudflare never sees it, and the default was fine.

## Conclusion

The migration was a lot less painful than I expected: one config line, one missing dependency, and a few plugin checks. The blog even ended up with a fresher look.

So, the foundations are rebuilt (again). Hopefully a few more posts will follow in the coming months.
