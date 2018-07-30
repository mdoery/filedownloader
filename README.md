# A tool to download (MP4) files from a website.

usage: ``node index.js``

It is assumed that you have a file, ``list.txt``, in your current directory.

This file is a JSON-formatted Array. The Array has "video objects" which have a url where the mp4 can be found, a title for the video (not necessarily unique), a date. An optional property is downloaded which if true indicates that the mp4 file in this video object has already been downloaded so it should not be downloaded again.

Example content of list.txt:

```
[
  {
    "url": "http://example.com/video1.mp4",
    "title": "A title of interest",
    "date": "July 24, 2018",
    "downloaded": true
  },
  {
    "url": "http://example.com/video2.mp4",
    "title": "another title",
    "date": "July 17, 2018",
  },
  ...
]
```