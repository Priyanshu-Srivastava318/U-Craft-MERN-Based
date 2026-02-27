import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-ink-900 text-stone-300 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="md:col-span-2">
            <span className="font-display text-3xl font-bold text-white">
              U<span className="text-craft-400">·</span>Craft
            </span>
            <p className="font-accent italic text-stone-400 mt-2 text-lg leading-relaxed">
              Where every purchase tells a story
            </p>
            <p className="font-body text-sm text-stone-500 mt-4 leading-relaxed max-w-xs">
              Connecting talented artisans from South Asia with customers who value authentic, handcrafted goods.
            </p>
          </div>

          <div>
            <h4 className="font-body text-xs uppercase tracking-widest text-craft-400 mb-4">Explore</h4>
            <ul className="space-y-3">
              {[['Shop', '/shop'], ['Artists', '/artists'], ['About', '/about']].map(([label, path]) => (
                <li key={path}>
                  <Link to={path} className="font-body text-sm text-stone-400 hover:text-white transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-body text-xs uppercase tracking-widest text-craft-400 mb-4">Join</h4>
            <ul className="space-y-3">
              {[['Sign Up as User', '/register'], ['Become an Artist', '/register?role=artist'], ['Login', '/login']].map(([label, path]) => (
                <li key={path}>
                  <Link to={path} className="font-body text-sm text-stone-400 hover:text-white transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-stone-800 mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="font-body text-xs text-stone-600">© 2024 U-Craft. All rights reserved.</p>
          <p className="font-accent italic text-sm text-stone-500">Celebrating artisanal talent, one craft at a time.</p>
        </div>
      </div>
    </footer>
  );
}
