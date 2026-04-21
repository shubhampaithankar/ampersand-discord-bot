import type { SpotifyUrlInfoModule, Track } from "spotify-url-info";

// spotify-url-info's default export is typed as an interface (not a value),
// so a normal `import x from "spotify-url-info"` is treated as a type-only
// symbol. Load it via CJS require to keep the runtime callable while still
// getting Track/SpotifyUrlInfoModule types at compile time.
const spotifyUrlInfo = require("spotify-url-info") as SpotifyUrlInfoModule;
const spotify = spotifyUrlInfo(fetch);

const SPOTIFY_URL = /^https?:\/\/open\.spotify\.com\/(track|playlist|album)\//i;

export type SpotifyResolvedTrack = { name: string; artists: string };

export const isSpotifyUrl = (s: string) => SPOTIFY_URL.test(s);

export const spotifyKind = (url: string): "track" | "playlist" | "album" | null => {
  const m = url.match(SPOTIFY_URL);
  return (m?.[1] as "track" | "playlist" | "album" | undefined) ?? null;
};

export const resolveSpotifyUrl = async (url: string): Promise<SpotifyResolvedTrack[]> => {
  const tracks = await spotify.getTracks(url);
  return tracks
    .filter((t: Track) => t.name && t.artist)
    .map((t: Track) => ({ name: t.name, artists: t.artist }));
};
