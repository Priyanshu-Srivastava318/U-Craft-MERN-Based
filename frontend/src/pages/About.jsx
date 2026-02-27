import { Link } from 'react-router-dom';
import { Heart, Globe, Star, Users } from 'lucide-react';

const values = [
  { icon: Heart, title: 'Fair to Artisans', desc: 'We ensure every artisan receives fair compensation for their labor and talent, far above market rates.' },
  { icon: Globe, title: 'Global Reach', desc: 'Connecting skilled craftspeople from South Asia with customers around the world who appreciate authentic goods.' },
  { icon: Star, title: 'Quality Always', desc: 'Every product is curated to meet our standards of craftsmanship, authenticity, and honest representation.' },
  { icon: Users, title: 'Community First', desc: 'We are building a community, not just a marketplace. Every transaction is a relationship.' },
];

export default function About() {
  return (
    <div className="page-enter">
      {/* Hero */}
      <section className="bg-ink-900 py-24 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, #e48c3a, transparent 50%), radial-gradient(circle at 20% 80%, #7da577, transparent 50%)' }} />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <p className="label-sm !text-craft-400 mb-4">Our Story</p>
          <h1 className="font-display text-5xl md:text-6xl text-white leading-tight mb-6">
            Born from a Simple<br/>
            <em className="text-craft-400">Observation</em>
          </h1>
          <p className="font-accent text-xl text-stone-300 leading-relaxed">
            The world is full of incredibly talented artisans whose work deserves to be celebrated, yet many struggle to find stable income and global reach.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div>
            <p className="label-sm mb-4">The Beginning</p>
            <h2 className="font-display text-3xl text-ink-900 mb-6">A Gap Worth Closing</h2>
            <div className="space-y-4 font-body text-stone-600 leading-relaxed">
              <p>
                Our founder, inspired by encounters with craftspeople across South Asia, realized there was a massive gap: artisans needed a platform that honored their craft and paid them fairly, and customers needed a place where every purchase supported a real creator's dream.
              </p>
              <p>
                Thus, U-Craft was created — not as just another marketplace, but as a <strong className="text-ink-900">movement to celebrate artisanal talent</strong>, foster direct relationships between makers and buyers, and prove that commerce can be a force for good.
              </p>
              <p>
                Today, U-Craft stands as a thriving ecosystem where creativity meets commerce, where every transaction is a celebration of human skill and ingenuity, and where the line between purchasing and patronage is beautifully blurred.
              </p>
            </div>
          </div>
          <div className="bg-craft-50 border border-craft-100 p-8">
            <blockquote className="font-accent italic text-2xl text-ink-900 leading-relaxed">
              "Commerce can be a force for good in the world."
            </blockquote>
            <p className="font-body text-sm text-stone-500 mt-4">— U-Craft Founding Philosophy</p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-stone-50 py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="label-sm mb-3">What We Stand For</p>
            <h2 className="section-title">Our Values</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white border border-stone-200 p-6">
                <div className="w-12 h-12 bg-craft-50 flex items-center justify-center mb-4">
                  <Icon size={20} className="text-craft-500" />
                </div>
                <h3 className="font-display text-lg text-ink-900 mb-2">{title}</h3>
                <p className="font-body text-sm text-stone-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 text-center">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="section-title mb-4">Join the Movement</h2>
          <p className="font-body text-stone-500 mb-8">
            Whether you're a buyer who values authentic craftsmanship or an artisan ready to share your talent with the world — U-Craft is your home.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/shop" className="btn-primary">Shop Now</Link>
            <Link to="/register?role=artist" className="btn-outline">Become an Artist</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
