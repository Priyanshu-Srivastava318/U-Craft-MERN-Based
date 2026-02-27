import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import axios from 'axios';
import ProductCard from '../components/ProductCard';
import { useAuth } from '../context/AuthContext';

if (!document.getElementById('ucraft-fonts')) {
  const link = document.createElement('link');
  link.id = 'ucraft-fonts';
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=Instrument+Serif:ital@1&display=swap';
  document.head.appendChild(link);
}

function useReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { el.dataset.visible = 'true'; obs.disconnect(); } },
      { threshold: 0.08 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

function Counter({ end, suffix = '' }) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      obs.disconnect();
      let cur = 0;
      const step = end / 50;
      const t = setInterval(() => {
        cur = Math.min(cur + step, end);
        setVal(Math.floor(cur));
        if (cur >= end) clearInterval(t);
      }, 30);
    }, { threshold: 0.5 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [end]);
  return <span ref={ref}>{val}{suffix}</span>;
}

const missions = [
  { num: '01', title: 'Fair to Artisans',   body: "Creators keep the lion's share — no exploitative cuts, ever." },
  { num: '02', title: 'Always Authentic',   body: 'Every listing is hand-verified by our team before it goes live.' },
  { num: '03', title: 'Direct Connection',  body: 'Message the maker, request customisations, build real bonds.' },
  { num: '04', title: 'Global Discovery',   body: 'Bringing South Asian craftsmanship to homes around the world.' },
];

const marqueeItems = [
  'Handmade Portraits','Explosion Boxes','Custom Sketches','Polaroid Sets',
  'Handmade Jewelry','Resin Art','Oil Paintings','Textile Art','Clay Pottery','Wood Craft',
];

export default function Home() {
  const { user, isArtist } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);

  const missionRef = useReveal();
  const productRef = useReveal();
  const ctaRef     = useReveal();

  useEffect(() => {
    axios.get('/api/products?limit=4&sort=popular')
      .then(({ data }) => setProducts(data.products ?? data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <style>{`
        :root{--ink:#1A1208;--clay:#C4622D;--clay-lt:#D97B4A;--parch:#F7F0E6;--parch-dk:#EDE3D5;--stone:#8C7B6B;--cream:#FDFAF5;}
        .ucd{font-family:'Cormorant Garamond',Georgia,serif;font-weight:600;line-height:1.05;letter-spacing:-0.01em;}
        .uci{font-family:'Instrument Serif',Georgia,serif;font-style:italic;}
        .ucl{font-family:'DM Sans',sans-serif;font-size:.67rem;font-weight:600;letter-spacing:.18em;text-transform:uppercase;color:var(--stone);}
        .ucbp{display:inline-flex;align-items:center;gap:10px;background:var(--ink);color:var(--cream);font-family:'DM Sans',sans-serif;font-size:.8rem;font-weight:600;letter-spacing:.13em;text-transform:uppercase;padding:14px 28px;border:1.5px solid var(--ink);cursor:pointer;text-decoration:none;transition:background .22s,border-color .22s,transform .18s;white-space:nowrap;}
        .ucbp:hover{background:var(--clay);border-color:var(--clay);transform:translateY(-1px);}
        .ucbo{display:inline-flex;align-items:center;gap:10px;background:transparent;color:var(--ink);font-family:'DM Sans',sans-serif;font-size:.8rem;font-weight:600;letter-spacing:.13em;text-transform:uppercase;padding:13px 28px;border:1.5px solid var(--ink);cursor:pointer;text-decoration:none;transition:background .22s,color .22s;white-space:nowrap;}
        .ucbo:hover{background:var(--ink);color:var(--cream);}
        [data-reveal]{opacity:0;transform:translateY(22px);transition:opacity .65s cubic-bezier(.22,1,.36,1),transform .65s cubic-bezier(.22,1,.36,1);}
        [data-reveal][data-visible='true']{opacity:1;transform:translateY(0);}
        @keyframes ucmq{from{transform:translateX(0)}to{transform:translateX(-50%)}}
        .ucmq{animation:ucmq 28s linear infinite;}
        .ucmq:hover{animation-play-state:paused;}
        .ucmr{border-top:1px solid rgba(255,255,255,.08);display:grid;grid-template-columns:52px 1fr 1fr;gap:24px;align-items:center;padding:26px 0;transition:padding-left .2s,border-top-color .2s;cursor:default;}
        .ucmr:hover{padding-left:10px;border-top-color:var(--clay);}
        .uc-sk{background:linear-gradient(90deg,var(--parch) 25%,var(--parch-dk) 50%,var(--parch) 75%);background-size:200% 100%;animation:skp 1.4s ease-in-out infinite;}
        @keyframes skp{0%{background-position:200% 0}100%{background-position:-200% 0}}
        .uc-card{box-shadow:12px 12px 0 var(--clay);transition:box-shadow .25s,transform .25s;}
        .uc-card:hover{box-shadow:16px 16px 0 var(--clay-lt);transform:translate(-2px,-2px);}
        .uc-ctabg{background:var(--clay);position:relative;overflow:hidden;}
        .uc-ctabg::before{content:'';position:absolute;top:-80px;right:-80px;width:300px;height:300px;border-radius:50%;background:rgba(255,255,255,.07);pointer-events:none;}
        @media(max-width:1024px){.uc-hr{display:none!important;}.uc-hg{grid-template-columns:1fr!important;}.ucmr{grid-template-columns:44px 1fr!important;}.uc-mb{display:none;}.uc-mg{grid-template-columns:1fr!important;}}
        @media(max-width:640px){.uc-sg{gap:14px!important;}.uc-cr{display:none!important;}.uc-cg{grid-template-columns:1fr!important;}}
      `}</style>

      <div style={{ fontFamily:"'DM Sans',sans-serif", background:'var(--cream)', color:'var(--ink)' }}>

        {/* ══ HERO ══ */}
        <section style={{ background:'var(--parch)', position:'relative', overflow:'hidden' }}>
          <span className="ucd" aria-hidden="true" style={{
            position:'absolute', right:'-10px', top:'50%', transform:'translateY(-52%)',
            fontSize:'clamp(130px,17vw,240px)', color:'rgba(196,98,45,.05)',
            userSelect:'none', pointerEvents:'none', lineHeight:1, zIndex:0,
          }}>UC</span>

          <div style={{ maxWidth:1280, margin:'0 auto', padding:'0 40px', position:'relative', zIndex:1 }}>
            <div className="uc-hg" style={{
              display:'grid', gridTemplateColumns:'1fr 1fr', gap:48, alignItems:'center',
              paddingTop:72, paddingBottom:72,
            }}>
              {/* Left */}
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:22 }}>
                  <span style={{ width:38, height:2, background:'var(--clay)', display:'block', flexShrink:0 }} />
                  <span className="ucl">Handcrafted with love · South Asia</span>
                </div>

                <h1 className="ucd" style={{ fontSize:'clamp(2.8rem,4.8vw,5rem)', color:'var(--ink)', marginBottom:18, letterSpacing:'-0.02em' }}>
                  Where Every{' '}
                  <span className="uci" style={{ color:'var(--clay)' }}>Craft</span>
                  <br />Tells a Story
                </h1>

                <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:'.97rem', lineHeight:1.8, color:'var(--stone)', maxWidth:400, marginBottom:32 }}>
                  Discover portraits, explosion boxes, custom sketches — unique handmade
                  treasures from artisans across South Asia. Every purchase directly
                  supports a creator's dream.
                </p>

                <div style={{ display:'flex', flexWrap:'wrap', gap:12, marginBottom:40 }}>
                  <Link to="/shop" className="ucbp">Explore the Shop <ArrowRight size={13}/></Link>
                  {/* Only show "Meet the Artisans" to guests or regular users */}
                  {!isArtist && (
                    <Link to="/artists" className="ucbo">Meet the Artisans</Link>
                  )}
                  {/* Artist sees "Go to Dashboard" instead */}
                  {isArtist && (
                    <Link to="/artist/dashboard" className="ucbo">My Dashboard</Link>
                  )}
                </div>

                {/* Stats */}
                <div className="uc-sg" style={{ display:'flex', gap:0, borderTop:'1px solid #D5CAC0', paddingTop:26 }}>
                  {[
                    { n:500,   sfx:'+', label:'Artisans' },
                    { n:12000, sfx:'+', label:'Handcrafted items' },
                    { n:50,    sfx:'+', label:'Craft categories' },
                  ].map((s,i) => (
                    <div key={s.label} style={{
                      flex:1,
                      paddingRight: i<2 ? 22 : 0,
                      paddingLeft:  i>0 ? 22 : 0,
                      borderRight:  i<2 ? '1px solid #D5CAC0' : 'none',
                    }}>
                      <p className="ucd" style={{ fontSize:'2rem', color:'var(--ink)', marginBottom:2 }}>
                        <Counter end={s.n} suffix={s.sfx}/>
                      </p>
                      <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:'.72rem', color:'var(--stone)', fontWeight:500 }}>{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right visual */}
              <div className="uc-hr" style={{ position:'relative', height:460, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <div style={{ position:'absolute', right:0, top:0, width:'58%', height:'74%', background:'var(--parch-dk)', zIndex:0 }} />
                <div className="uc-card" style={{
                  position:'relative', zIndex:2, width:250, height:325,
                  background:'var(--ink)', display:'flex', alignItems:'center', justifyContent:'center', marginRight:32,
                }}>
                  <span className="ucd" style={{ fontSize:'3rem', color:'rgba(247,240,230,.1)' }}>U·C</span>
                  <span style={{
                    position:'absolute', right:-32, top:'50%', transform:'translateY(-50%) rotate(90deg)',
                    fontFamily:"'DM Sans',sans-serif", fontSize:'.53rem', fontWeight:600,
                    letterSpacing:'.22em', textTransform:'uppercase', color:'var(--stone)', whiteSpace:'nowrap',
                  }}>ARTISAN MARKETPLACE</span>
                </div>
                <div style={{
                  position:'absolute', top:16, left:0, zIndex:3,
                  background:'var(--cream)', border:'1px solid #D5CAC0',
                  padding:'8px 14px', boxShadow:'4px 4px 0 var(--parch-dk)',
                  fontFamily:"'DM Sans',sans-serif", fontSize:'.72rem', fontWeight:600, color:'var(--ink)',
                }}>100% Handmade &amp; Verified</div>
                <div style={{
                  position:'absolute', bottom:24, left:14, zIndex:3,
                  background:'var(--clay)', padding:'10px 16px',
                }}>
                  <p className="ucl" style={{ color:'rgba(255,255,255,.6)', marginBottom:2 }}>New Arrivals</p>
                  <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'1.05rem', color:'white', fontWeight:600 }}>Fresh crafts, daily</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══ MARQUEE ══ */}
        <div style={{ borderTop:'1px solid #D5CAC0', borderBottom:'1px solid #D5CAC0', background:'var(--ink)', padding:'12px 0', overflow:'hidden' }}>
          <div className="ucmq" style={{ display:'flex', gap:40, width:'max-content' }}>
            {[...Array(2)].flatMap(() =>
              marqueeItems.map((item,i) => (
                <span key={`${item}-${i}`} style={{
                  fontFamily:"'DM Sans',sans-serif", fontSize:'.7rem', fontWeight:500,
                  letterSpacing:'.15em', textTransform:'uppercase', whiteSpace:'nowrap', flexShrink:0,
                  color: i%3===1 ? 'var(--clay-lt)' : 'rgba(247,240,230,.42)',
                }}>
                  {item}<span style={{ marginLeft:40, color:'var(--clay)', opacity:.4 }}>✦</span>
                </span>
              ))
            )}
          </div>
        </div>

        {/* ══ MISSION ══ */}
        <section style={{ background:'#111008', padding:'88px 0' }}>
          <div ref={missionRef} data-reveal style={{ maxWidth:1280, margin:'0 auto', padding:'0 40px' }}>
            <div className="uc-mg" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:52, marginBottom:52 }}>
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:18 }}>
                  <span style={{ width:32, height:2, background:'var(--clay)', display:'block' }} />
                  <span className="ucl" style={{ color:'var(--stone)' }}>Our Mission</span>
                </div>
                <h2 className="ucd" style={{ fontSize:'clamp(1.9rem,3vw,3rem)', color:'white' }}>
                  Commerce as a{' '}
                  <span className="uci" style={{ color:'var(--clay-lt)' }}>force for good</span>
                </h2>
              </div>
              <div style={{ display:'flex', flexDirection:'column', justifyContent:'flex-end' }}>
                <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:'.92rem', lineHeight:1.8, color:'rgba(247,240,230,.46)', marginBottom:18 }}>
                  U-Craft was born from a simple observation: the world is full of incredibly talented artisans
                  whose work deserves to be celebrated, yet many struggle to find stable income and global reach.
                </p>
                <Link to="/about" style={{
                  display:'inline-flex', alignItems:'center', gap:7,
                  fontFamily:"'DM Sans',sans-serif", fontSize:'.73rem', fontWeight:600,
                  letterSpacing:'.14em', textTransform:'uppercase',
                  color:'var(--clay-lt)', textDecoration:'none', width:'fit-content',
                  borderBottom:'1px solid var(--clay)', paddingBottom:3,
                }}>Read Our Story <ArrowUpRight size={12}/></Link>
              </div>
            </div>

            <div style={{ borderBottom:'1px solid rgba(255,255,255,.05)' }}>
              {missions.map(m => (
                <div
                  key={m.num}
                  className="ucmr"
                  onMouseEnter={e=>e.currentTarget.style.paddingLeft='10px'}
                  onMouseLeave={e=>e.currentTarget.style.paddingLeft='0'}
                >
                  <span className="ucd" style={{ fontSize:'.9rem', color:'var(--clay)', opacity:.5 }}>{m.num}</span>
                  <h4 className="ucd" style={{ fontSize:'1.45rem', color:'white', fontWeight:500 }}>{m.title}</h4>
                  <p className="uc-mb" style={{ fontFamily:"'DM Sans',sans-serif", fontSize:'.86rem', color:'rgba(247,240,230,.4)', lineHeight:1.7 }}>{m.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ FEATURED PRODUCTS ══ */}
        <section ref={productRef} data-reveal style={{ maxWidth:1280, margin:'0 auto', padding:'80px 40px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:44 }}>
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
                <span style={{ width:26, height:2, background:'var(--clay)', display:'block' }} />
                <span className="ucl">Handpicked</span>
              </div>
              <h2 className="ucd" style={{ fontSize:'clamp(1.8rem,2.6vw,2.6rem)', color:'var(--ink)' }}>Featured Crafts</h2>
            </div>
            <Link to="/shop" style={{
              display:'inline-flex', alignItems:'center', gap:5,
              fontFamily:"'DM Sans',sans-serif", fontSize:'.76rem', fontWeight:600,
              letterSpacing:'.12em', textTransform:'uppercase', color:'var(--ink)',
              textDecoration:'none', borderBottom:'1.5px solid var(--ink)', paddingBottom:2,
            }}>View All <ArrowRight size={12}/></Link>
          </div>

          {loading ? (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:20 }}>
              {[...Array(4)].map((_,i) => <div key={i} className="uc-sk" style={{ aspectRatio:'3/4' }}/>)}
            </div>
          ) : products.length > 0 ? (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(210px,1fr))', gap:20 }}>
              {products.map(p => <ProductCard key={p._id} product={p}/>)}
            </div>
          ) : (
            <div style={{ textAlign:'center', padding:'64px 24px', background:'var(--parch)', border:'1px solid #D5CAC0' }}>
              <p className="ucd" style={{ fontSize:'1.7rem', color:'var(--stone)', marginBottom:8 }}>No products yet</p>
              <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:'.86rem', color:'var(--stone)', marginBottom:22 }}>Be the first artisan to list something beautiful.</p>
              <Link to="/register?role=artist" className="ucbp">Start Selling</Link>
            </div>
          )}
        </section>

        {/* ══ ARTIST CTA — only shown to guests or regular users, NOT to artists or logged-in users ══ */}
        {!user && (
          <section style={{ padding:'0 40px 80px' }}>
            <div ref={ctaRef} data-reveal className="uc-ctabg uc-cg" style={{ maxWidth:1280, margin:'0 auto', display:'grid', gridTemplateColumns:'1fr 1fr' }}>
              <div style={{ padding:'60px 52px', position:'relative', zIndex:1 }}>
                <span className="uci" style={{ fontFamily:"'Instrument Serif',serif", fontSize:'1.1rem', color:'rgba(255,255,255,.58)', display:'block', marginBottom:12 }}>
                  Are you a creator?
                </span>
                <h2 className="ucd" style={{ fontSize:'clamp(1.9rem,2.6vw,2.8rem)', color:'white', lineHeight:1.1, marginBottom:16 }}>
                  Share Your Craft<br/>With The World
                </h2>
                <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:'.93rem', color:'rgba(255,255,255,.6)', lineHeight:1.75, maxWidth:300, marginBottom:32 }}>
                  Illustrators, photographers, gifting artists — find your audience. Free to get started.
                </p>
                <Link to="/register?role=artist"
                  style={{
                    display:'inline-flex', alignItems:'center', gap:9,
                    background:'white', color:'var(--clay)',
                    fontFamily:"'DM Sans',sans-serif", fontSize:'.78rem', fontWeight:700,
                    letterSpacing:'.12em', textTransform:'uppercase',
                    padding:'13px 28px', textDecoration:'none',
                    boxShadow:'5px 5px 0 rgba(26,18,8,.16)',
                    transition:'transform .18s,box-shadow .18s',
                  }}
                  onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='7px 7px 0 rgba(26,18,8,.2)';}}
                  onMouseLeave={e=>{e.currentTarget.style.transform='';e.currentTarget.style.boxShadow='5px 5px 0 rgba(26,18,8,.16)';}}
                >Become an Artist <ArrowRight size={13}/></Link>
              </div>

              <div className="uc-cr" style={{ display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(26,18,8,.13)', padding:36, position:'relative', overflow:'hidden' }}>
                <span className="ucd" style={{ fontSize:'clamp(4rem,7.5vw,7rem)', color:'rgba(255,255,255,.07)', lineHeight:.9, userSelect:'none', textAlign:'center' }}>
                  Make.<br/>Sell.<br/>Shine.
                </span>
                <div style={{ position:'absolute', top:18, right:18, width:48, height:48, border:'1.5px solid rgba(255,255,255,.16)' }}/>
                <div style={{ position:'absolute', bottom:18, left:18, width:32, height:32, border:'1.5px solid rgba(255,255,255,.1)' }}/>
              </div>
            </div>
          </section>
        )}

        {/* ══ LOGGED-IN USER CTA — shop more ══ */}
        {user && !isArtist && (
          <section style={{ padding:'0 40px 80px' }}>
            <div ref={ctaRef} data-reveal style={{
              maxWidth:1280, margin:'0 auto',
              background:'var(--parch)', border:'1px solid #D5CAC0',
              padding:'52px 56px',
              display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:24,
            }}>
              <div>
                <span className="uci" style={{ fontFamily:"'Instrument Serif',serif", fontSize:'1.1rem', color:'var(--stone)', display:'block', marginBottom:8 }}>
                  Welcome back, {user.name?.split(' ')[0]}
                </span>
                <h2 className="ucd" style={{ fontSize:'clamp(1.6rem,2.2vw,2.4rem)', color:'var(--ink)', lineHeight:1.1 }}>
                  Ready to discover<br/>something new?
                </h2>
              </div>
              <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
                <Link to="/shop" className="ucbp">Browse the Shop <ArrowRight size={13}/></Link>
                <Link to="/orders" className="ucbo">My Orders</Link>
              </div>
            </div>
          </section>
        )}

        {/* ══ ARTIST CTA — when artist is logged in ══ */}
        {isArtist && (
          <section style={{ padding:'0 40px 80px' }}>
            <div ref={ctaRef} data-reveal style={{
              maxWidth:1280, margin:'0 auto',
              background:'var(--ink)',
              padding:'52px 56px',
              display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:24,
            }}>
              <div>
                <span className="uci" style={{ fontFamily:"'Instrument Serif',serif", fontSize:'1.1rem', color:'rgba(247,240,230,.5)', display:'block', marginBottom:8 }}>
                  Welcome back, {user.name?.split(' ')[0]}
                </span>
                <h2 className="ucd" style={{ fontSize:'clamp(1.6rem,2.2vw,2.4rem)', color:'white', lineHeight:1.1 }}>
                  Your craft is waiting<br/>to be listed.
                </h2>
              </div>
              <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
                <Link to="/artist/dashboard" className="ucbp" style={{ background:'var(--clay)', borderColor:'var(--clay)' }}>
                  Go to Dashboard <ArrowRight size={13}/>
                </Link>
              </div>
            </div>
          </section>
        )}

      </div>
    </>
  );
}