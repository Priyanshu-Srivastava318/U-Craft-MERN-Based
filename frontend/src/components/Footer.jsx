import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Instagram, Twitter, Linkedin } from 'lucide-react';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer style={{ background:'#111008', color:'#A09080', fontFamily:"'DM Sans',sans-serif" }}>

      {/* ── Top strip ── */}
      <div style={{ borderBottom:'1px solid rgba(255,255,255,.06)', padding:'14px 0', background:'rgba(196,98,45,.08)' }}>
        <div style={{ maxWidth:1280, margin:'0 auto', padding:'0 40px', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
          <span style={{ width:24, height:1.5, background:'#C4622D', display:'inline-block' }}/>
          <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:'.7rem', fontWeight:600, letterSpacing:'.18em', textTransform:'uppercase', color:'#C4622D' }}>
            100% Handmade · Verified Artisans · Secure Payments
          </span>
          <span style={{ width:24, height:1.5, background:'#C4622D', display:'inline-block' }}/>
        </div>
      </div>

      {/* ── Main grid ── */}
      <div style={{ maxWidth:1280, margin:'0 auto', padding:'64px 40px 48px' }}>
        <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1.4fr', gap:48 }}>

          {/* Brand col */}
          <div>
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'2rem', fontWeight:700, color:'white', letterSpacing:'-0.02em', marginBottom:4 }}>
              U<span style={{ color:'#C4622D' }}>·</span>Craft
            </div>
            <p style={{ fontFamily:"'Instrument Serif',Georgia,serif", fontStyle:'italic', fontSize:'1rem', color:'#8C7B6B', marginBottom:16, lineHeight:1.5 }}>
              Where every purchase tells a story
            </p>
            <p style={{ fontSize:'.82rem', color:'#6B5E52', lineHeight:1.8, maxWidth:260, marginBottom:28 }}>
              Connecting talented artisans from South Asia with customers who value authentic, handcrafted goods.
            </p>

            {/* Social icons */}
            <div style={{ display:'flex', gap:10 }}>
              {[
                { icon: <Instagram size={15}/>, href:'https://instagram.com', label:'Instagram' },
                { icon: <Twitter size={15}/>,   href:'https://twitter.com',   label:'Twitter'   },
                { icon: <Linkedin size={15}/>,  href:'https://linkedin.com',  label:'LinkedIn'  },
              ].map(s => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                  title={s.label}
                  style={{ width:36, height:36, border:'1px solid rgba(255,255,255,.1)', display:'flex', alignItems:'center', justifyContent:'center', color:'#8C7B6B', textDecoration:'none', transition:'all .2s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor='#C4622D'; e.currentTarget.style.color='#C4622D'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(255,255,255,.1)'; e.currentTarget.style.color='#8C7B6B'; }}>
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Explore col */}
          <div>
            <h4 style={{ fontSize:'.67rem', fontWeight:600, letterSpacing:'.18em', textTransform:'uppercase', color:'#C4622D', marginBottom:20 }}>Explore</h4>
            <ul style={{ listStyle:'none', padding:0, margin:0, display:'flex', flexDirection:'column', gap:12 }}>
              {[['Shop', '/shop'], ['Artists', '/artists'], ['About', '/about']].map(([label, path]) => (
                <li key={path}>
                  <Link to={path} style={{ fontSize:'.85rem', color:'#8C7B6B', textDecoration:'none', transition:'color .2s', display:'flex', alignItems:'center', gap:6 }}
                    onMouseEnter={e => e.currentTarget.style.color='white'}
                    onMouseLeave={e => e.currentTarget.style.color='#8C7B6B'}>
                    <span style={{ width:12, height:1, background:'#C4622D', display:'inline-block', flexShrink:0 }}/>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Join col */}
          <div>
            <h4 style={{ fontSize:'.67rem', fontWeight:600, letterSpacing:'.18em', textTransform:'uppercase', color:'#C4622D', marginBottom:20 }}>Join</h4>
            <ul style={{ listStyle:'none', padding:0, margin:0, display:'flex', flexDirection:'column', gap:12 }}>
              {[['Sign Up as User', '/register'], ['Become an Artist', '/register?role=artist'], ['Login', '/login']].map(([label, path]) => (
                <li key={path}>
                  <Link to={path} style={{ fontSize:'.85rem', color:'#8C7B6B', textDecoration:'none', transition:'color .2s', display:'flex', alignItems:'center', gap:6 }}
                    onMouseEnter={e => e.currentTarget.style.color='white'}
                    onMouseLeave={e => e.currentTarget.style.color='#8C7B6B'}>
                    <span style={{ width:12, height:1, background:'#C4622D', display:'inline-block', flexShrink:0 }}/>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact col */}
          <div>
            <h4 style={{ fontSize:'.67rem', fontWeight:600, letterSpacing:'.18em', textTransform:'uppercase', color:'#C4622D', marginBottom:20 }}>Contact Us</h4>
            <ul style={{ listStyle:'none', padding:0, margin:0, display:'flex', flexDirection:'column', gap:16 }}>
              <li>
                <a href="mailto:ucraft.noreply@gmail.com"
                  style={{ display:'flex', alignItems:'flex-start', gap:10, textDecoration:'none', color:'#8C7B6B', fontSize:'.85rem', transition:'color .2s' }}
                  onMouseEnter={e => e.currentTarget.style.color='white'}
                  onMouseLeave={e => e.currentTarget.style.color='#8C7B6B'}>
                  <Mail size={14} style={{ marginTop:2, flexShrink:0, color:'#C4622D' }}/>
                  ucraft.noreply@gmail.com
                </a>
              </li>
              <li>
                <a href="tel:+917006193940"
                  style={{ display:'flex', alignItems:'center', gap:10, textDecoration:'none', color:'#8C7B6B', fontSize:'.85rem', transition:'color .2s' }}
                  onMouseEnter={e => e.currentTarget.style.color='white'}
                  onMouseLeave={e => e.currentTarget.style.color='#8C7B6B'}>
                  <Phone size={14} style={{ flexShrink:0, color:'#C4622D' }}/>
                  +91 70061 93940
                </a>
              </li>
              <li>
                <div style={{ display:'flex', alignItems:'flex-start', gap:10, color:'#8C7B6B', fontSize:'.85rem' }}>
                  <MapPin size={14} style={{ marginTop:2, flexShrink:0, color:'#C4622D' }}/>
                  <span>South Asia · Serving Worldwide</span>
                </div>
              </li>
            </ul>

            {/* Support badge */}
            <div style={{ marginTop:24, padding:'12px 16px', border:'1px solid rgba(196,98,45,.2)', background:'rgba(196,98,45,.06)' }}>
              <p style={{ fontSize:'.7rem', fontWeight:600, letterSpacing:'.1em', textTransform:'uppercase', color:'#C4622D', marginBottom:4 }}>Support Hours</p>
              <p style={{ fontSize:'.78rem', color:'#8C7B6B', lineHeight:1.6 }}>Mon – Sat · 10am to 7pm IST</p>
            </div>
          </div>

        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div style={{ borderTop:'1px solid rgba(255,255,255,.06)', padding:'20px 40px' }}>
        <div style={{ maxWidth:1280, margin:'0 auto', display:'flex', flexWrap:'wrap', alignItems:'center', justifyContent:'space-between', gap:12 }}>
          <p style={{ fontSize:'.75rem', color:'#4A3F35' }}>© {year} U-Craft. All rights reserved.</p>

          <div style={{ display:'flex', gap:20 }}>
            {[['Privacy Policy', '/privacy'], ['Terms of Service', '/terms'], ['Refund Policy', '/refunds']].map(([label, path]) => (
              <Link key={path} to={path}
                style={{ fontSize:'.72rem', color:'#4A3F35', textDecoration:'none', transition:'color .2s' }}
                onMouseEnter={e => e.currentTarget.style.color='#8C7B6B'}
                onMouseLeave={e => e.currentTarget.style.color='#4A3F35'}>
                {label}
              </Link>
            ))}
          </div>

          <p style={{ fontFamily:"'Instrument Serif',Georgia,serif", fontStyle:'italic', fontSize:'.85rem', color:'#4A3F35' }}>
            Celebrating artisanal talent, one craft at a time.
          </p>
        </div>
      </div>

    </footer>
  );
}