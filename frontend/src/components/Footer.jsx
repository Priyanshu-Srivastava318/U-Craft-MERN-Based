import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Instagram, Twitter, Linkedin } from 'lucide-react';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer style={{ background:'#111008', color:'#A09080', fontFamily:"'DM Sans',sans-serif" }}>
      <style>{`
        .ft-grid{display:grid;grid-template-columns:1fr;gap:40px;}
        @media(min-width:640px){.ft-grid{grid-template-columns:1fr 1fr;gap:32px;}}
        @media(min-width:1024px){.ft-grid{grid-template-columns:2fr 1fr 1fr 1.4fr;gap:48px;}}

        .ft-bottom{display:flex;flex-direction:column;align-items:center;gap:12px;text-align:center;}
        @media(min-width:768px){.ft-bottom{flex-direction:row;justify-content:space-between;text-align:left;}}

        .ft-links{display:flex;flex-wrap:wrap;justify-content:center;gap:16px;}
        @media(min-width:768px){.ft-links{justify-content:flex-start;}}

        .ft-contact a,.ft-contact div{display:flex;align-items:flex-start;gap:10px;text-decoration:none;color:#8C7B6B;font-size:.85rem;transition:color .2s;margin-bottom:14px;}
        .ft-contact a:hover{color:white;}

        .ft-nav-link{font-size:.85rem;color:#8C7B6B;text-decoration:none;transition:color .2s;display:flex;align-items:center;gap:6px;margin-bottom:12px;}
        .ft-nav-link:hover{color:white;}

        .ft-social a{width:36px;height:36px;border:1px solid rgba(255,255,255,.1);display:flex;align-items:center;justify-content:center;color:#8C7B6B;text-decoration:none;transition:all .2s;flex-shrink:0;}
        .ft-social a:hover{border-color:#C4622D;color:#C4622D;}

        .ft-strip{border-top:1px solid rgba(255,255,255,.06);padding:14px 0;background:rgba(196,98,45,.08);}
        .ft-strip-inner{max-width:1280px;margin:0 auto;padding:0 20px;display:flex;align-items:center;justify-content:center;gap:8px;text-align:center;}
        @media(min-width:640px){.ft-strip-inner{padding:0 40px;}}

        .ft-section-title{font-size:.67rem;font-weight:600;letter-spacing:.18em;text-transform:uppercase;color:#C4622D;margin-bottom:20px;display:block;}

        .ft-support{margin-top:20px;padding:12px 16px;border:1px solid rgba(196,98,45,.2);background:rgba(196,98,45,.06);}
      `}</style>

      {/* ── Top trust strip ── */}
      <div className="ft-strip">
        <div className="ft-strip-inner">
          <span style={{ width:24, height:1.5, background:'#C4622D', display:'inline-block', flexShrink:0 }}/>
          <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:'.7rem', fontWeight:600, letterSpacing:'.18em', textTransform:'uppercase', color:'#C4622D' }}>
            100% Handmade · Verified Artisans · Secure Payments
          </span>
          <span style={{ width:24, height:1.5, background:'#C4622D', display:'inline-block', flexShrink:0 }}/>
        </div>
      </div>

      {/* ── Main grid ── */}
      <div style={{ maxWidth:1280, margin:'0 auto', padding:'56px 20px 44px' }}>
        <div className="ft-grid">

          {/* Brand col */}
          <div>
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'2rem', fontWeight:700, color:'white', letterSpacing:'-0.02em', marginBottom:4 }}>
              U<span style={{ color:'#C4622D' }}>·</span>Craft
            </div>
            <p style={{ fontFamily:"'Instrument Serif',Georgia,serif", fontStyle:'italic', fontSize:'1rem', color:'#8C7B6B', marginBottom:16, lineHeight:1.5 }}>
              Where every purchase tells a story
            </p>
            <p style={{ fontSize:'.82rem', color:'#6B5E52', lineHeight:1.8, maxWidth:280, marginBottom:28 }}>
              Connecting talented artisans from South Asia with customers who value authentic, handcrafted goods.
            </p>
            <div className="ft-social" style={{ display:'flex', gap:10 }}>
              {[
                { icon:<Instagram size={15}/>, href:'https://instagram.com', label:'Instagram' },
                { icon:<Twitter   size={15}/>, href:'https://twitter.com',   label:'Twitter'   },
                { icon:<Linkedin  size={15}/>, href:'https://linkedin.com',  label:'LinkedIn'  },
              ].map(s => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" title={s.label}>
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Explore col */}
          <div>
            <span className="ft-section-title">Explore</span>
            {[['Shop', '/shop'], ['Artists', '/artists'], ['About', '/about']].map(([label, path]) => (
              <Link key={path} to={path} className="ft-nav-link">
                <span style={{ width:12, height:1, background:'#C4622D', display:'inline-block', flexShrink:0 }}/>
                {label}
              </Link>
            ))}
          </div>

          {/* Join col */}
          <div>
            <span className="ft-section-title">Join</span>
            {[['Sign Up as User', '/register'], ['Become an Artist', '/register?role=artist'], ['Login', '/login']].map(([label, path]) => (
              <Link key={path} to={path} className="ft-nav-link">
                <span style={{ width:12, height:1, background:'#C4622D', display:'inline-block', flexShrink:0 }}/>
                {label}
              </Link>
            ))}
          </div>

          {/* Contact col */}
          <div>
            <span className="ft-section-title">Contact Us</span>
            <div className="ft-contact">
              <a href="mailto:ucraft.noreply@gmail.com">
                <Mail size={14} style={{ marginTop:2, flexShrink:0, color:'#C4622D' }}/>
                ucraft.noreply@gmail.com
              </a>
              <a href="tel:+917006193940">
                <Phone size={14} style={{ flexShrink:0, color:'#C4622D' }}/>
                +91 70061 93940
              </a>
              <div>
                <MapPin size={14} style={{ marginTop:2, flexShrink:0, color:'#C4622D' }}/>
                <span>South Asia · Serving Worldwide</span>
              </div>
            </div>
            <div className="ft-support">
              <p style={{ fontSize:'.7rem', fontWeight:600, letterSpacing:'.1em', textTransform:'uppercase', color:'#C4622D', marginBottom:4 }}>Support Hours</p>
              <p style={{ fontSize:'.78rem', color:'#8C7B6B', lineHeight:1.6 }}>Mon – Sat · 10am to 7pm IST</p>
            </div>
          </div>

        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div style={{ borderTop:'1px solid rgba(255,255,255,.06)', padding:'20px' }}>
        <div style={{ maxWidth:1280, margin:'0 auto' }} className="ft-bottom">
          <p style={{ fontSize:'.75rem', color:'#4A3F35' }}>© {year} U-Craft. All rights reserved.</p>

          <div className="ft-links">
            {[['Privacy Policy','/privacy'],['Terms of Service','/terms'],['Refund Policy','/refunds']].map(([label,path]) => (
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