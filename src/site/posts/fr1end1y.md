---
title: fr1end1y
icon: 🧡🎈
date: 2025-02-11
description: A website starter kit I am developing that combines Umbraco, "the friendly CMS", with Eleventy, "a simpler static site generator".
tags:
  - umbraco
  - eleventy
  - dotnet
  - nodejs
metaImage: /images/donut-heart.png
metaImageAlt: A heart made of donuts
---

I recently published the source code and .NET template package for a website starter kit I'm working on called [*fr1end1y*](https://fr1end1y.fullhack.dev/).

This post gives some background about the project, my goals with it, potential issues and limitations of the starter kit in its current state, and of course, some security considerations.

---

## Contents

- [Inspiration](#inspiration)
- [Project Goals](#project-goals)
- [Limitations and Known Issues](#limitations-and-known-issues)
- [Security Considerations](#security-considerations)
- [Contributing](#contributing)

---

## Inspiration

Lots of folks in the Umbraco community have been experimenting with static site generators, such as Astro and Next.js, and combining these with the Umbraco Delivery API to retrieve content.

Here are but a few great articles:

- [A next.js Frontend for Your Umbraco Site](https://www.etive-mor.com/blog/a-nextjs-frontend-for-your-umbraco-site/) by Liam Laverty
- [Rebuilding with Astro and Umbraco 13](https://harrygordon.co.uk/blog/rebuilding-with-astro-and-umbraco-13/) by Harry Gordon
- [Quick n' dirty blog with Astro and Umbraco](https://kjac.dev/posts/quick-n-dirty-blog-with-astro-and-umbraco/) by Kenn Jacobsen
- [Astro-nomically Performant Websites using the Content Delivery API](https://24days.in/umbraco-cms/2023/sustainable-performant/astronomically-performant/) by Louie Richardson

And I'm sure there are more (let me know and I will link them here!).

### Eleventy has joined the game 🎮

[Eleventy](https://www.11ty.dev/) is my favourite static site generator and as far as I know nobody has done an Umbraco-Eleventy integration, so this is my attempt.

![The Umbraco CMS and Eleventy site running side by side in web browser windows.](/images/fr1end1y/umbraco-and-eleventy-screenshot.png)

---

## Project Goals

### Learn stuff!

As I foray back into the world of software development, I've had to get back up to speed with some things and learn how to *build* applications again (as opposed to just breaking them 🔨).

I mainly wanted to get familiar with the new (to me) Delivery API and make use of the latest versions of Umbraco and Eleventy (15 and 3 respectively, at the time of writing).

I also wanted to take things right back to basics and build a website from scratch using plain old HTML and CSS &mdash; no heavy frameworks. More on that later.

### Release *something*

*Anything...* I have so many half-finished (ok ok, barely-started) research projects and blog posts that get left in private GitHub repos to rot. I want to get used to sharing more stuff, even if it's not as polished as I would like.

There are some issues with the starter kit I am aware of, and probably more I am not. As such, it should not be considered stable and will remain on major version zero for now 🧪.

### Keep it simple

This is intended to be a minimal starting point for anyone wanting to use Umbraco and Eleventy together. It is not a complete framework by any means. Users are encouraged to rip it apart, modify it, bring in their own tooling, etc.

I've tried to keep the number of direct dependencies and features light so that I might actually be able to keep up with maintenance and upgrades (and I'm already behind 😬). Aside from Umbraco and Eleventy, there are just a few utility libraries/plugins, and the mighty [uSync](https://www.jumoo.co.uk/usync/) from Kevin Jump.

It really only supports rich text content at the moment. I haven't looked at doing block lists/grids or anything more complex like that. The initial aim will be to fully support the new [Tiptap](https://tiptap.dev/)-based rich text editor.

### Write documentation

As a way of [dogfooding](https://en.wikipedia.org/wiki/Eating_your_own_dog_food) the starter kit and getting used to the new rich text editor from a content editor's perspective, I built the [documentation site](https://fr1end1y.fullhack.dev/) on top of it.

The `dotnet new` template actually uses the documentation site as its source, so the documentation site effectively *is* the starter kit (so meta 😂).

### Support rapid development

The starter kit is distributed as a .NET template package on [NuGet](https://www.nuget.org/packages/Umbraco.Community.Templates.Fr1end1y) for easy installation. This approach was very much inspired by Dean Leigh's excellent [UmBootstrap](https://umbootstrap.com/) starter kit.

As I mentioned, uSync is included and is configured for [FirstBoot](https://docs.jumoo.co.uk/usync/uSync/guides/firstboot/) so that all content and settings are imported automatically when Umbraco is first launched. Unattended installs are also supported so you can have a fully working site spun up in minutes (at least, that is the aim).

I also wanted to try and reduce some of the "wiring up" and boilerplate code that often needs written to connect a frontend and an API. To that end, Umbraco nodes are automatically rendered to Eleventy Nunjucks templates based on their content type. For example, a node of type `webPage` will be rendered with the template `_includes/pages/webPage.njk`. All pages inherit a base layout by default.

Within templates, the currently rendering page can be accessed in the `currentPage` variable. Umbraco content and settings are also exposed via the  `umbraco` global data variable (for more details, see the [documentation](https://fr1end1y.fullhack.dev/docs/important-concepts/#how-to-access-umbraco-data-in-templates)).

A JavaScript Delivery API client (generated with [@hey-api/openapi-ts](https://github.com/hey-api/openapi-ts) and TypeScript) is included in the project, and there is an npm script to regenerate the client if need be.

Finally, the Eleventy Dev Server is configured to watch the uSync directory for changed files (indicating that either content, media, or settings were changed in Umbraco) and will rebuild and reload the dev site in the browser automatically 🚀.

### HTML-first

The [HTML First](https://html-first.com/guidelines) approach is:

- If you can do it with HTML, use HTML
- If you can't do it with HTML, use CSS
- If you can't do it with HTML or CSS, use Javascript

In my opinion, all websites should endeavour to work without CSS and JavaScript. But try disabling CSS and/or JavaScript in your browser and see how many *Completely Broken™* websites there are out there (I built some of them myself!).

There are [several reasons](https://piccalil.li/blog/a-handful-of-reasons-javascript-wont-be-available/) why CSS or JavaScript might not be available and so a robust website should aim to work with HTML *only* (in other words, *degrade gracefully*). Yes, browser default styles might look like [crap](https://motherfuckingwebsite.com/), but not everyone *sees* them.

We should care deeply about the HTML we serve up to users, ensuring that it is well-formed and semantic (no `div`s pretending to be buttons, no buttons that don't do anything without JavaScript, etc). In doing so, we make our sites more accessible and ensure a *minimum viable experience* for *everyone*.

I'm not a front-end or accessibility expert though, so I won't make any grand claims about the accessibility of the starter kit. I'm open to any feedback on how to improve it as its something I'm keen to learn more about!

### Progressive enhancement

Of course, we will want to make our websites look [less crap](https://perfectmotherfuckingwebsite.com/) for those who *can* see them, so we *progressively enhance* the HTML with CSS.

Like I said, I didn't want to depend on any big frameworks if I could help it. I initially considered releasing the starter kit without any styling at all, but I bought Andy Bell's excellent [Complete CSS](https://piccalil.li/complete-css/) course last year and I just *had* to apply some of what I learned from it.

I've opted for a vanilla CSS approach based on the [CUBE CSS](https://cube.fyi/) methodology:

> With CUBE CSS, we embrace the cascade and inheritance to style as much as possible at a high level. This means that when nothing but your global styles make it to the browser, the page will still look great. It's progressive enhancement in action and enables us to write as little CSS as possible.

Sensible global styles have been defined for (almost) all HTML elements and CSS variables are used to configure the overall theme and ensure things like colours, fonts, borders, and spacing are kept consistent across the site.

Some compositions from [Every Layout](https://every-layout.dev/) have been brought in, and fluid type/space scales from [Utopia](https://utopia.fyi/) (both fantastic resources). Bundling is handled by the Eleventy [Bundle](https://www.11ty.dev/docs/plugins/bundle/) plugin so there are no extra dependencies or build steps.

### Zero-JavaScript output

By default, Eleventy does not include any costly runtime JavaScript bundles which can impact site performance.

I've also not *needed* any client-side JavaScript, so there simply... *isn't any*. Less code, better performance, fewer dependencies on frameworks developed by evil corporations, and a whole class of security vulnerabilities avoided. Wild.

### Tabs not spaces 😱

Just because I seen Eleventy do [this](https://github.com/11ty/eleventy/issues/3098) for its 3.0.0 release, I decided to do the same (*cue the pitchforks* 😂). I've always used spaces to indent my code, but now that I know there are accessibility benefits to using tabs, I'm trying to switch. [EditorConfig](https://editorconfig.org/) and [Prettier](https://prettier.io/) made this change fairly painless.

---

## Limitations and Known Issues

Like I said, this should be considered an unstable release of the starter kit, my [*sid*](https://www.debian.org/releases/sid/) if you will, and there are some things to be aware of if you decide to use it.

### Dynamic content

Eleventy produces a truly static site. That is, just flat HTML files. There is no runtime rendering of pages, so we need to think about how to handle when content in the CMS changes and trigger a new Eleventy build to update the site.

I've experimented with Umbraco [notifications](https://docs.umbraco.com/umbraco-cms/reference/notifications) to trigger a local Eleventy build when CMS content is published. There is an example in the project but it is disabled by default.

At some point I'd also like to explore using Umbraco [webhooks](https://docs.umbraco.com/umbraco-cms/reference/webhooks) to trigger Eleventy builds on a build server somewhere. If anyone has done anything like this I'd love to hear about it.

For more interactive, client-side components, there's the Eleventy [`<is-land>`](https://www.11ty.dev/docs/plugins/is-land/) plugin which can be used to progressively enhance pages with *islands* of dynamic/interactive content, but I haven't experimented with it yet.

### Build performance for big sites

Right now the Eleventy build grabs *all* Umbraco content at build time (well, really it just sets the API `take` parameter to a high value so it might not get "all" nodes if you have a lot). This is fine for my small documentation site, but large sites or sites with lots of media may take longer to build.

I simply haven't done any testing with big node trees yet. There are definitely some performance optimisations I know of that could be made, but builds have not become slow enough to annoy me yet. The Eleventy [Image](https://www.11ty.dev/docs/plugins/image/) plugin *is* included which caches Umbraco media images locally, so that should help speed things up a bit.

### Eleventy output site structure reflects Umbraco node tree structure

There is a direct mapping between the Umbraco node tree structure and the static site directory structure. Editors will see the same URL in the backoffice as they do on the front end, and it gives editors full control over the URLs for SEO purposes.

Some may prefer to do their own routing on the front end application and just use Umbraco as a data source, which is fine, and may even be the preferred approach depending on your application.

However, in this instance I wanted the URLs in the backoffice to match up with the generated site because that makes sense to me at least for *websites* (as opposed to, say, [*spas*](https://heydonworks.com/article/what-is-a-single-page-application/), which is not what this starter kit is for).

### Only Nunjucks templates are supported

At one point during development I got sidetracked experimenting with Eleventy's [WebC](https://www.11ty.dev/docs/languages/webc/) and even built a version of the starter kit using WebC templates. I thought WebC was cool but ultimately I decided Nunjucks would be more familiar and easier to grasp. I may revisit WebC one day.

### Unsupported property editors

Like I said, I'm only looking to support the rich text editor at the moment, to keep things simple and maintainable. I might look into others in future.

### No Umbraco preview

[Preview](https://docs.umbraco.com/umbraco-cms/reference/content-delivery-api/additional-preview-environments-support) is not yet implemented, but I'm looking into it.

### Unpublished content on first boot

The content imported by uSync FirstBoot currently needs to be manually published. And sometimes the Delivery API index needs rebuilt after that. I've documented this and a bunch of other issues I ran into during development on the [troubleshooting](https://fr1end1y.fullhack.dev/docs/troubleshooting/#ensure-the-cms-is-running-and-content-is-published) docs page.

### Deployment & hosting

I haven't really explored any advanced deployment and hosting scenarios. The docs site is just pushed to the `/docs` folder in the [GitHub repo](https://github.com/Full-Hack-Developer/fr1end1y) which has [GitHub Pages](https://pages.github.com/) enabled on it.

Refer to the [Umbraco](https://docs.umbraco.com/umbraco-cms/fundamentals/setup/server-setup) and [Eleventy](https://www.11ty.dev/docs/deployment/) docs for information about deployment and hosting options for each.

---

## Security Considerations

Ok, I suppose I should also say *some* stuff about security in this blog 👀.

The [Umbraco security docs](https://docs.umbraco.com/umbraco-cms/reference/security) provide some general guidance on how to deploy Umbraco securely. I won't repeat those here. However, the following are some things worth mentioning relevant to the starter kit.

### Delivery API configuration and keys

By default, the starter kit disables `PublicAccess` on the API and sets a random GUID as the API key in both the `appsettings.json` (in the `CMS` project) and `.env` (in the `Site` project).

I'm not sure how *good* a *GUID* is for this purpose, but it was an easy way to generate a random value during the solution creation. It can be changed to any string you want.

It's important to keep API keys (and other secrets) out of source code repositories, use different keys for different environments, rotate keys occasionally, and store them securely. See the [OWASP Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html) for further guidance.

### Delivery API data exposure

I always recommend keeping sensitive information out of the node tree, more so now because by default the Delivery API, when enabled, will return *every property of every content type* unless configured not to.

I have seen things like API keys and credentials being stored in Umbraco "Site Settings" nodes (and I'm sure I've done this myself before 👀), which means they could also be stored in the database, content cache, Examine indexes, and who knows where else.

If you *really* need to store something in the node tree that you don't want exposed through the API, consider adding the content type to the `DisallowedContentTypeAliases` [configuration option](https://docs.umbraco.com/umbraco-cms/reference/content-delivery-api#additional-configuration) and rebuilding the Delivery API index to stop exposing content of that type.

### HTML injection attacks coming from the CMS

Content coming from rich text editors in the CMS is passed through [DOMPurify](https://github.com/cure53/DOMPurify) during the Eleventy build to prevent cross-site scripting (XSS) attacks. Of course, the editor in the Umbraco backoffice prevents the injection of scripts to some degree, but this gives some extra protection in the event the underlying HTML is tampered with somehow. Defence in depth and all that.

This *could* cause issues and strip out tags or attributes that you might want to allow, but exceptions can be allow-listed in the DOMPurify configuration.

### Other?

I've probably missed something, but this post has gotten way too long. Issues will be patched accordingly and hopefully blogged about here if they are interesting 🙂.

---

## Contributing

The starter kit is open source on [GitHub](https://github.com/Full-Hack-Developer/fr1end1y) and I welcome contributions via issues or pull requests.

If you found this interesting or useful in any way, let me know on [Discord](https://community.umbraco.com/get-involved/community-discord-server/) (I am `stvnhrlnd`) or [Mastodon](https://umbracocommunity.social/@stvnhrlnd).

✌️
