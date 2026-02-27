import { Star } from 'lucide-react';

export default function StarRating({ rating, onRate, size = 20, readonly = false }) {
  const stars = [1, 2, 3, 4, 5];
  return (
    <div className="flex gap-1">
      {stars.map(star => (
        <button
          key={star}
          onClick={() => !readonly && onRate && onRate(star)}
          disabled={readonly}
          className={`transition-colors ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110 transition-transform'}`}
        >
          <Star
            size={size}
            className={star <= rating ? 'text-amber-400 fill-amber-400' : 'text-stone-300'}
          />
        </button>
      ))}
    </div>
  );
}
