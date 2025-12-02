export type RedditScrapeResult = {
  subreddit: string;
  author: string;
  title: string;
  body: string;
  createdUtc: number | null;
  permalink: string;
};

const REDDIT_HOST = "www.reddit.com";
const POST_ID_REGEX = /^[a-z0-9]+$/i;

export function canonicalizeRedditPostPermalink(rawUrl: string):
  | { permalink: string; postId: string }
  | never {
  const trimmed = rawUrl.trim();
  if (!trimmed) {
    throw new Error("raw_reddit_url is empty");
  }

  const withScheme = trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;
  let parsed: URL;

  try {
    parsed = new URL(withScheme);
  } catch (error) {
    throw new Error("raw_reddit_url is not a valid URL");
  }

  const hostname = parsed.hostname.toLowerCase();
  if (!hostname.includes("reddit.com")) {
    throw new Error("URL does not point to reddit.com");
  }

  const segments = parsed.pathname.split("/").filter(Boolean);
  const commentsIndex = segments.findIndex((segment) => segment.toLowerCase() === "comments");

  if (commentsIndex === -1 || segments.length <= commentsIndex + 1) {
    throw new Error("URL does not look like a Reddit post permalink");
  }

  const postId = segments[commentsIndex + 1];
  if (!POST_ID_REGEX.test(postId)) {
    throw new Error("Could not determine a valid Reddit post ID");
  }

  const canonicalPermalink = `https://${REDDIT_HOST}/comments/${postId}/`;
  return { permalink: canonicalPermalink, postId };
}

export async function fetchRedditPostDetails(permalink: string): Promise<RedditScrapeResult> {
  const jsonUrl = `${permalink.replace(/\/+$/, "")}.json`;
  const response = await fetch(jsonUrl, {
    headers: {
      "User-Agent": "wizardlab-reddit-ingest/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch Reddit post (status ${response.status})`);
  }

  const payload = await response.json().catch(() => null);
  const postData = payload?.[0]?.data?.children?.[0]?.data;

  if (!postData) {
    throw new Error("Reddit response did not include post data");
  }

  return {
    subreddit: typeof postData.subreddit === "string" ? postData.subreddit : "",
    author: typeof postData.author === "string" ? postData.author : "",
    title: typeof postData.title === "string" ? postData.title : "",
    body: typeof postData.selftext === "string" ? postData.selftext : "",
    createdUtc: typeof postData.created_utc === "number" ? postData.created_utc : null,
    permalink: postData.permalink ? postData.permalink : permalink,
  };
}
