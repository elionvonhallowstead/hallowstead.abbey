---
{"dg-publish":true,"permalink":"/library-halls/","tags":["gardenEntry"],"dg-note-properties":{}}
---


```base
filters:
  and:
    - file.name != "Library Halls"
views:
  - type: cards
    name: Library
    groupBy:
      property: tags
      direction: ASC
    sort:
      - property: file.name
        direction: ASC
```