export interface MusicTrack {
  trackId: string;
  title: string;
  artist: string;
  album: string;
  thumbnail: string;
  previewUrl: string;
  isExplicit: boolean; // 19금 여부 추가
}

export interface Song extends MusicTrack {
  id: string;
  createdAt: any;
}

export async function searchMusic(query: string): Promise<MusicTrack[]> {
  const ITUNES_URL = "https://itunes.apple.com/search";
  
  try {
    const response = await fetch(
      `${ITUNES_URL}?term=${encodeURIComponent(query)}&entity=song&limit=20&country=kr&explicit=Yes`
    );

    if (!response.ok) {
      throw new Error("iTunes API request failed");
    }

    const data = await response.json();

    return data.results.map((item: any) => ({
      trackId: item.trackId.toString(),
      title: item.trackName,
      artist: item.artistName,
      album: item.collectionName,
      thumbnail: item.artworkUrl100.replace("100x100", "300x300"),
      previewUrl: item.previewUrl,
      isExplicit: item.trackExplicitness === "explicit", // 19금 판별
    }));
  } catch (error) {
    console.error("Error searching music:", error);
    return [];
  }
}
