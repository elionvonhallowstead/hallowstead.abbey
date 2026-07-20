---
{"dg-publish":true,"permalink":"/library-halls/","tags":["gardenEntry"],"dg-note-properties":{}}
---

<span style="border-radius: 5px; float: right; width: 25%; margin-left: 5%; margin-bottom: 3%">![abbey.jpg](/img/user/abbey.jpg)<br>The Abbey of Hallowstead
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