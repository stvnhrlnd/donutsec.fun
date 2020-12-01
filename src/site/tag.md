---
layout: layouts/tag.njk
eleventyComputed:
  title: Posts filed under “{{ tag }}”
  description: Posts filed under “{{ tag }}”
pagination:
  data: collections
  size: 1
  alias: tag
  filter:
    - all
    - posts
    - generated
permalink: /tags/{{ tag }}/
---
