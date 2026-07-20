---
{"dg-publish":true,"permalink":"/library-halls/","tags":["gardenEntry"],"dg-note-properties":{}}
---


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
      - file.basename
      - author
      - tags
    sort:
      - property: author
        direction: ASC
      - property: file.name
        direction: ASC

```