// src/pages/Playlists.tsx

import Image from 'next/image';
import { useEffect, useState } from 'react';

// --- 型定義例: 必要に応じてカスタマイズ ---
interface Playlist {
  id: string;
  name: string;
  images: Array<{ url: string }>;
  owner: {
    display_name: string;
  };
  tracks: {
    total: number;
  };
}

interface PlaylistTrack {
  track: {
    id: string;
    name: string;
    album?: {
      name?: string;
      images?: Array<{ url: string }>;
    };
    artists?: Array<{ name: string }>;
  };
}

interface FetchPlaylistsResponse {
  playlists: Playlist[];
}

interface FetchTracksResponse {
  tracks: PlaylistTrack[];
}

const Playlists = () => {
  // プレイリスト一覧
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  // 選択中のプレイリストID
  const [selectedPlaylist, setSelectedPlaylist] = useState<string | null>(null);
  // 選択中プレイリストの楽曲一覧
  const [tracks, setTracks] = useState<PlaylistTrack[]>([]);
  // エラーメッセージ
  const [error, setError] = useState<string | null>(null);
  // ローディング状態
  const [loadingPlaylists, setLoadingPlaylists] = useState<boolean>(false);
  const [loadingTracks, setLoadingTracks] = useState<boolean>(false);

  // --- (A) マウント時にプレイリスト一覧を取得 ---
  useEffect(() => {
    const fetchPlaylists = async () => {
      setLoadingPlaylists(true);
      try {
        const response = await fetch('/api/playlists');
        if (!response.ok) {
          throw new Error('Failed to fetch playlists');
        }
        const data: FetchPlaylistsResponse = await response.json();
        setPlaylists(data.playlists || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setLoadingPlaylists(false);
      }
    };
    fetchPlaylists();
  }, []);

  // --- (B) プレイリストIDをクリックしたときにトラックを取得 ---
  const fetchTracks = async (playlistId: string) => {
    // 同じプレイリストを再選択した場合は選択解除して一覧を非表示
    if (playlistId === selectedPlaylist) {
      setSelectedPlaylist(null);
      setTracks([]);
      return;
    }

    setLoadingTracks(true);
    try {
      setSelectedPlaylist(playlistId);
      const response = await fetch(`/api/playlists/${playlistId}/tracks`);
      if (!response.ok) {
        throw new Error(`Failed to fetch tracks for playlist ${playlistId}`);
      }
      const data: FetchTracksResponse = await response.json();
      setTracks(data.tracks || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      console.error('Error fetching tracks:', err);
    } finally {
      setLoadingTracks(false);
    }
  };

  // --- エラー表示 ---
  if (error) {
    return <div className="text-red-500 text-center mt-10">Error: {error}</div>;
  }

  // --- JSX (表示) ---
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">Your Playlists</h1>
      {loadingPlaylists && <p className="text-center text-gray-500">Loading Playlists...</p>}

      {/* プレイリスト一覧 */}
      <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
        {playlists.map((playlist) => (
          <li
            key={playlist.id}
            className="bg-gray-800 text-white rounded-lg shadow-lg overflow-hidden cursor-pointer hover:bg-gray-700"
            onClick={() => fetchTracks(playlist.id)}
          >
            <div className="relative w-full h-48">
              <Image
                src={playlist.images[0]?.url || '/placeholder.png'}
                alt={playlist.name}
                layout="fill"
                objectFit="cover"
              />
            </div>
            <div className="p-4">
              <h2 className="text-lg font-semibold truncate">{playlist.name}</h2>
              <p className="text-sm text-gray-400">By: {playlist.owner.display_name}</p>
              <p className="text-sm text-gray-500 italic truncate">
                Tracks: {playlist.tracks.total}
              </p>
            </div>
          </li>
        ))}
      </ul>

      {/* 選択中プレイリストのトラック一覧 */}
      {selectedPlaylist && (
        <div>
          <h2 className="text-2xl font-semibold mb-4">Tracks</h2>
          {loadingTracks ? (
            <p className="text-center text-gray-500">Loading tracks...</p>
          ) : (
            <>
              {tracks.length > 0 ? (
                <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {tracks.map((item) => {
                    const { track } = item;
                    return (
                      <li
                        key={track.id}
                        className="bg-gray-800 text-white rounded-lg shadow-lg overflow-hidden"
                      >
                        {/* アルバム画像 */}
                        <div className="relative w-full h-48">
                          <Image
                            src={track.album?.images?.[0]?.url || '/placeholder.png'}
                            alt={track.album?.name || 'No Album'}
                            layout="fill"
                            objectFit="cover"
                          />
                        </div>

                        {/* トラック情報 */}
                        <div className="p-4">
                          <h2 className="text-lg font-semibold truncate">
                            {track.name || 'No Title'}
                          </h2>
                          <p className="text-sm text-gray-400">
                            {track.artists
                              ?.map((artist) => artist.name)
                              .join(', ') || 'Unknown Artist'}
                          </p>
                          <p className="text-sm text-gray-500 italic truncate">
                            {track.album?.name || 'No Album'}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-center text-gray-500">
                  No tracks found in this playlist.
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Playlists;
