---
{"dg-publish":true,"permalink":"/library-halls/","tags":["gardenEntry"],"dg-note-properties":{"cssclasses":["round-corners"]}}
---

<span style="float: right; width: 25%; margin-left: 5%;">![abbey.jpg](/img/user/_imgs/abbey.jpg)<br>The Abbey of Hallowstead[^1]
</span>
> [!summary]
> One can still see the scorch marks etched into the ground.
> Maybe they will stay there forever, a constant reminder of the past,
> never fully invisible

Now The Library accepts all kinds of books to recover their former glory, scientific studies, fairy tales, collections of poems...

```base
filters:
  and:
    - file.name != "Library Halls"
    - "!file.tags.isEmpty()"
views:
  - type: cards
    name: Library
    groupBy:
      property: tags
      direction: ASC
    order:
      - file.name
      - author
    sort:
      - property: author
        direction: ASC
      - property: file.name
        direction: ASC

```
[^1]: <span style="max-width: 50%">Image temporary, will be changed in future</span><a href="https://discord.com/invite/zHS6av77ws" style="float: right; margin: .5%;"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="ionicon" width="25"><path d="M464 66.52A50 50 0 0 0 414.12 17L97.64 16A49.65 49.65 0 0 0 48 65.52V392c0 27.3 22.28 48 49.64 48H368l-13-44 109 100ZM324.65 329.81s-8.72-10.39-16-19.32C340.39 301.55 352.5 282 352.5 282a139 139 0 0 1-27.85 14.25 173.3 173.3 0 0 1-35.11 10.39 170 170 0 0 1-62.72-.24 184.5 184.5 0 0 1-35.59-10.4 141.5 141.5 0 0 1-17.68-8.21c-.73-.48-1.45-.72-2.18-1.21-.49-.24-.73-.48-1-.48-4.36-2.42-6.78-4.11-6.78-4.11s11.62 19.09 42.38 28.26c-7.27 9.18-16.23 19.81-16.23 19.81-53.51-1.69-73.85-36.47-73.85-36.47 0-77.06 34.87-139.62 34.87-139.62 34.87-25.85 67.8-25.12 67.8-25.12l2.42 2.9c-43.59 12.32-63.44 31.4-63.44 31.4s5.32-2.9 14.28-6.77c25.91-11.35 46.5-14.25 55-15.21a24 24 0 0 1 4.12-.49 205.6 205.6 0 0 1 48.91-.48 201.6 201.6 0 0 1 72.89 22.95s-19.13-18.15-60.3-30.45l3.39-3.86s33.17-.73 67.81 25.16c0 0 34.87 62.56 34.87 139.62 0-.28-20.35 34.5-73.86 36.19" fill="#5865f2"/><path d="M212.05 218c-13.8 0-24.7 11.84-24.7 26.57s11.14 26.57 24.7 26.57c13.8 0 24.7-11.83 24.7-26.57.25-14.76-10.9-26.57-24.7-26.57M300.43 218c-13.8 0-24.7 11.84-24.7 26.57s11.14 26.57 24.7 26.57c13.81 0 24.7-11.83 24.7-26.57S314 218 300.43 218" fill="#5865f2"/></svg></a><a href="mailto:elionvonhallowstead+submit-book@gmail.com" style="float: right; margin: .5%;"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="ionicon" width="25"><path d="M473.66 210c-14-10.38-31.2-18-49.36-22.11a16.11 16.11 0 0 1-12.19-12.22c-7.8-34.75-24.59-64.55-49.27-87.13C334.15 62.25 296.21 47.79 256 47.79c-35.35 0-68 11.08-94.37 32.05a150.1 150.1 0 0 0-42.06 53 16 16 0 0 1-11.31 8.87c-26.75 5.4-50.9 16.87-69.34 33.12C13.46 197.33 0 227.24 0 261.39c0 34.52 14.49 66 40.79 88.76 25.12 21.69 58.94 33.64 95.21 33.64h104V230.42l-36.69 36.69a16 16 0 0 1-23.16-.56c-5.8-6.37-5.24-16.3.85-22.39l63.69-63.68a16 16 0 0 1 22.62 0L331 244.14c6.28 6.29 6.64 16.6.39 22.91a16 16 0 0 1-22.68.06L272 230.42v153.37h124c31.34 0 59.91-8.8 80.45-24.77 23.26-18.1 35.55-44 35.55-74.83 0-29.94-13.26-55.61-38.34-74.19M240 448.21a16 16 0 1 0 32 0v-64.42h-32Z" fill="#f4b036"/></svg></a>