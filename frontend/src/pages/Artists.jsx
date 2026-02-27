import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star, MapPin, Package } from 'lucide-react';
import axios from 'axios';

export default function Artists() {
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/artists')
      .then(({ data }) => setArtists(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-enter max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <p className="label-sm mb-3">The Creators</p>
        <h1 className="section-title">Meet Our Artisans</h1>
        <p className="font-body text-stone-500 mt-3 max-w-lg mx-auto">
          Talented craftspeople from across South Asia, sharing their heritage and skill with the world.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => <div key={i} className="h-64 skeleton" />)}
        </div>
      ) : artists.length === 0 ? (
        <div className="text-center py-20">
          <p className="font-display text-2xl text-stone-400">No artists yet</p>
          <Link to="/register?role=artist" className="btn-primary mt-6 inline-block">Become the First Artist</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {artists.map(artist => (
            <Link key={artist._id} to={`/artist/${artist._id}`} className="group card overflow-hidden">
              <div className="h-40 bg-gradient-to-br from-craft-100 to-stone-200 overflow-hidden relative">
                {artist.coverImage ? (
                  <img src={artist.coverImage} alt={artist.brandName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="font-display text-6xl text-craft-300">{artist.brandName?.[0]}</span>
                  </div>
                )}
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-display text-lg text-ink-900 group-hover:text-craft-600 transition-colors">{artist.brandName}</h3>
                    <p className="font-body text-xs text-stone-500 mt-0.5">{artist.user?.name}</p>
                  </div>
                  {artist.isVerified && (
                    <span className="bg-sage-100 text-sage-500 text-xs font-body px-2 py-1">Verified</span>
                  )}
                </div>
                {artist.specialty && <p className="font-body text-sm text-craft-600 mt-2">{artist.specialty}</p>}
                <div className="flex items-center gap-4 mt-3 text-xs text-stone-500 font-body">
                  {artist.location && <span className="flex items-center gap-1"><MapPin size={11} /> {artist.location}</span>}
                  <span className="flex items-center gap-1"><Package size={11} /> {artist.totalSales} sold</span>
                  {artist.averageRating > 0 && (
                    <span className="flex items-center gap-1"><Star size={11} className="text-amber-400 fill-amber-400" /> {Number(artist.averageRating).toFixed(1)}</span>
                  )}
                </div>
                {artist.bio && <p className="font-body text-sm text-stone-500 mt-3 line-clamp-2 leading-relaxed">{artist.bio}</p>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}