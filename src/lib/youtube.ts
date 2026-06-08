export function getYouTubeVideoId(url?: string | null): string | null {
  if (!url) return null;
  const match = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([^&?/\s]{11})/,
  );
  return match?.[1] ?? null;
}

export function buildYouTubeBackgroundEmbedUrl(videoId: string) {
  const params = new URLSearchParams({
    autoplay: "1",
    controls: "0",
    loop: "1",
    modestbranding: "1",
    mute: "1",
    playsinline: "1",
    playlist: videoId,
    rel: "0",
    showinfo: "0",
  });
  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
}
