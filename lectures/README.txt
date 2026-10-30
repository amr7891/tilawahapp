Lectures play from YouTube through YouTube's own embedded player (nothing is copied or hosted here).
catalog.json lists each series (book slug, scholar, YouTube playlist).
<series-id>.json, when present, holds the follow-along timings for each lesson:
  { "videos": { "<youtube video id>": { "sync": [[seconds, part, block], ...] } } }
where part/block point into arbooks/<book>/p<part>.json.
