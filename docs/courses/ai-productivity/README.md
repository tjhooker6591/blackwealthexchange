# Microsoft Copilot Training for Business — course videos

The course lives at `/courses/copilot-training`. The lesson text and quizzes are in
`src/lib/courses/aiProductivity/`. Video players stay as placeholders until a video is
added in `src/lib/courses/aiProductivity/videos.ts`.

## Two kinds of video

| Kind | What it is | Who sees it | Where to host |
|---|---|---|---|
| Trailer | The 12 short Marcus intros (35–42 s, `BWE_Workshop_—_NN_*.mp4`) | Everyone, on the public course page | YouTube, Unlisted or Public (free) |
| Lesson | Marcus teaching the full lesson (3–4 min, scripts in `marcus-scripts/`) | Learners with access only | Start: YouTube Unlisted (free). Later: Cloudflare Stream (~$5/mo) to keep them private |

## Making a lesson video in HeyGen

1. Open HeyGen → Create video → choose the Marcus avatar.
2. Open the lesson's script in `marcus-scripts/`, copy everything **below the `---` line**, paste it as the script.
3. Preview the first few lines for pronunciation (numbers like "404" are written out already).
4. Render, then download the MP4 **and the captions file** (SRT/VTT) if offered.
5. The 12 scripts total about 41 minutes of video. Check your HeyGen plan's minutes before rendering.

## Adding a video to the site

Upload the MP4 to YouTube (Unlisted), copy the link, and put it in `videos.ts`:

```ts
1: { trailer: "https://youtu.be/XXXXXXXXXXX", lesson: "https://youtu.be/YYYYYYYYYYY" },
```

A YouTube link or ID, or an `https://` link to an MP4 file, both work. Anything else is
ignored and the placeholder stays. Deploy as usual.

Note: an Unlisted YouTube link can be watched by anyone who has the link. That is fine for
trailers. For lesson videos, it is an acceptable start; move to Cloudflare Stream signed
links when the lessons should be fully private.
