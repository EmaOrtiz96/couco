import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../api'
import { useCart, useAuth } from '../context'
import { useToast } from '../hooks/useToast'
import ProductCard from '../components/ProductCard'
import s from './Home.module.css'

const CATS=[{slug:'perfumes',icon:'🌸',label:'Perfumes',sub:'Fragancias únicas'},{slug:'jabones',icon:'🧼',label:'Jabones',sub:'Artesanales'},{slug:'velas',icon:'🕯️',label:'Velas',sub:'Cera de soja'},{slug:'difusores',icon:'💨',label:'Difusores',sub:'Para el hogar'},{slug:'sets',icon:'🎁',label:'Sets & Regalos',sub:'Edición especial'}]
const MARQUEE=['Ingredientes Naturales','Elaboración Artesanal','Aromas Exclusivos','Libre de Parabenos','Hecho con Amor','Envío a Todo el País']
const ORDERS=[{v:'nuevo',l:'Más nuevos'},{v:'precio_asc',l:'Precio ↑'},{v:'precio_desc',l:'Precio ↓'},{v:'nombre',l:'A-Z'}]

export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [productos, setProductos] = useState([])
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [page, setPage] = useState(1)
  const [filter, setFilter] = useState('all')
  const [orden, setOrden] = useState('nuevo')
  const [modal, setModal] = useState(null)
  const [favIds, setFavIds] = useState([])
  const [selectedProd, setSelectedProd] = useState(null)
  const [resena, setResena] = useState({calificacion:5,comentario:''})
  const [contacto, setContacto] = useState({nombre:'',email:'',telefono:'',mensaje:''})
  const [contactMsg, setContactMsg] = useState(null)
  const [nlEmail, setNlEmail] = useState('')
  const {user} = useAuth()
  const {dispatch} = useCart()
  const {toast, ToastEl} = useToast()
  const buscar = searchParams.get('buscar') || ''

  useEffect(() => { loadProductos() }, [filter, orden, page, buscar])
  useEffect(() => { if(user) api.getFavoritosIds().then(setFavIds).catch(()=>{}) }, [user])
  useEffect(() => { if(buscar && document.getElementById('productos')) document.getElementById('productos').scrollIntoView({behavior:'smooth'}) }, [buscar])

  async function loadProductos() {
    const params = {page, limit:12, orden}
    if (filter !== 'all') params.categoria = filter
    if (buscar) params.buscar = buscar
    const r = await api.getProductos(params).catch(()=>({items:[],total:0,pages:1,page:1}))
    setProductos(r.items||[]); setTotal(r.total||0); setPages(r.pages||1)
  }

  async function openModal(p) {
    const full = await api.getProducto(p.id).catch(()=>p)
    setSelectedProd(full); setModal('product')
  }

  async function submitResena(e) {
    e.preventDefault()
    await api.crearResena(selectedProd.id, resena).catch(e=>{ toast(e.message); return null })
    toast('¡Reseña enviada!')
    const fresh = await api.getProducto(selectedProd.id)
    setSelectedProd(fresh); setResena({calificacion:5,comentario:''})
  }

  async function sendContacto(e) {
    e.preventDefault()
    try { await api.sendContacto(contacto); setContactMsg({ok:true,text:'¡Mensaje enviado!'}); setContacto({nombre:'',email:'',telefono:'',mensaje:''}) }
    catch(err) { setContactMsg({ok:false,text:err.message}) }
  }

  async function suscribir(e) {
    e.preventDefault()
    await api.suscribir(nlEmail).catch(()=>{}); toast('¡Gracias por suscribirte!'); setNlEmail('')
  }

  function setFilterAndScroll(slug) {
    setFilter(slug); setPage(1); setSearchParams({})
    document.getElementById('productos').scrollIntoView({behavior:'smooth'})
  }

  const FILTERS=[{v:'all',l:'Todos'},...CATS.map(c=>({v:c.slug,l:c.label}))]

  return (
    <>
      {/* HERO */}
      <section className={s.hero}>
        <div className={s.heroLeft}>
          <p className="section-eyebrow">✦ Fragancias Artesanales ✦</p>
          <h1 className={s.heroTitle}>El arte de los<br/><em>aromas puros</em></h1>
          <p className={s.heroDesc}>Creamos perfumes, jabones y aromas artesanales que despiertan los sentidos.</p>
          <div className={s.heroBtns}>
            <a href="#productos" className="btn-primary">Explorar Colección</a>
            <a href="#filosofia" className="btn-outline">Nuestra Historia</a>
          </div>
        </div>
        <div className={s.heroRight}>
          <span className={s.d1}>✿</span><span className={s.d2}>❧</span>
          <div className={s.heroVisual}>
            <div className={s.circBg}>
              <img src="/logo.png" alt="Couco Aromas" className={s.heroLogo}
                onError={e=>{e.target.style.display='none';e.target.nextSibling.style.display='flex'}}/>
              <div className={s.logoFb} style={{display:'none'}}><span>COUCO</span><small>AROMAS</small></div>
            </div>
            <div className={s.tags}>{['Perfumes','Jabones','Velas','Difusores'].map(t=><span key={t} className={s.tag}>{t}</span>)}</div>
          </div>
        </div>
      </section>

      {/* MARQUEE */}
      <div className={s.marquee}><div className={s.track}>{[...MARQUEE,...MARQUEE].map((t,i)=><span key={i} className={s.mi}>{t} <span className={s.dot}>◆</span></span>)}</div></div>

      {/* CATEGORIES */}
      <section id="categorias" className={s.catsSec}>
        <div className={s.secHead}><p className="section-eyebrow">Nuestras Líneas</p><h2 className="section-title">Colecciones <em>artesanales</em></h2><div className="section-line"/></div>
        <div className={s.catsGrid}>{CATS.map(c=><div key={c.slug} className={s.catCard} onClick={()=>setFilterAndScroll(c.slug)}><span className={s.catIcon}>{c.icon}</span><div className={s.catName}>{c.label}</div><div className={s.catSub}>{c.sub}</div></div>)}</div>
      </section>

      {/* PRODUCTS */}
      <section id="productos" className={s.prodSec}>
        <div className={s.secHead}>
          <p className="section-eyebrow">Tienda{buscar&&` — "${buscar}"`}</p>
          <h2 className="section-title">Productos <em>destacados</em></h2>
          <div className="section-line"/>
        </div>
        <div className={s.prodControls}>
          <div className={s.filterTabs}>{FILTERS.map(f=><button key={f.v} className={`${s.ftab} ${filter===f.v?s.active:''}`} onClick={()=>{setFilter(f.v);setPage(1);setSearchParams({})}}>{f.l}</button>)}</div>
          <select className={s.orderSel} value={orden} onChange={e=>{setOrden(e.target.value);setPage(1)}}>
            {ORDERS.map(o=><option key={o.v} value={o.v}>{o.l}</option>)}
          </select>
        </div>
        {buscar && <p className={s.searchInfo}>Mostrando {total} resultado{total!==1?'s':''} para "{buscar}" <button className={s.clearSearch} onClick={()=>{setSearchParams({});setFilter('all')}}>✕ Limpiar</button></p>}
        <div className={s.prodGrid}>
          {productos.length===0
            ? <div className={s.noProd}>No hay productos{buscar?` para "${buscar}"`:' en esta categoría'}</div>
            : productos.map(p=><ProductCard key={p.id} product={p} onOpen={openModal} favIds={favIds} onFavToggle={()=>api.getFavoritosIds().then(setFavIds)}/>)
          }
        </div>
        {pages>1&&<div className={s.pagination}>{Array.from({length:pages},(_,i)=><button key={i} className={`${s.pgBtn} ${page===i+1?s.pgActive:''}`} onClick={()=>setPage(i+1)}>{i+1}</button>)}</div>}
      </section>

      {/* PHILOSOPHY */}
      <section id="filosofia" className={s.philoSec}>
        <div className={s.philoGrid}>
          <div>
            <p className="section-eyebrow">Nuestra Filosofía</p>
            <h2 className={s.philoTitle}>Cada aroma<br/><em>cuenta una historia</em></h2>
            <blockquote className={s.quote}>"La fragancia es la forma más íntima de la belleza, la que nos transporta sin movernos del lugar."</blockquote>
            <p className={s.philoTxt}>En Couco Aromas nacemos de la pasión por los ingredientes naturales y el arte de la perfumería artesanal.</p>
          </div>
          <div className={s.pillars}>
            {[{i:'🌿',t:'100% Natural',d:'Solo ingredientes naturales'},{i:'✋',t:'Hecho a Mano',d:'Artesanía en cada producto'},{i:'🌍',t:'Sostenible',d:'Comprometidos con el ambiente'},{i:'💎',t:'Exclusivo',d:'Fragancias únicas'}].map(p=>(
              <div key={p.t} className={s.pillar}><span>{p.i}</span><div className={s.pillarT}>{p.t}</div><div className={s.pillarD}>{p.d}</div></div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section id="testimonios" className={s.testiSec}>
        <div className={s.secHead}><p className="section-eyebrow">Lo que dicen</p><h2 className="section-title">Clientes que nos <em>eligen</em></h2><div className="section-line"/></div>
        <div className={s.testiGrid}>
          {[{n:'Sofía R.',i:'S',t:'El perfume Noir Essence es impresionante. Duración increíble y el aroma sofisticado.'},{n:'María G.',i:'M',t:'Los jabones de Rosa & Argán son los mejores. Mi piel se siente suave e hidratada.'},{n:'Carlos M.',i:'C',t:'El Set Romántico fue un éxito total. Presentación de lujo y el olor es increíble.'}].map(t=>(
            <div key={t.n} className={s.tCard}><p className={s.tTxt}>{t.t}</p><div className={s.tAuthor}><div className={s.tAvatar}>{t.i}</div><div><div className={s.tName}>{t.n}</div><div className="stars">★★★★★</div></div></div></div>
          ))}
        </div>
      </section>

      {/* CONTACT */}
      <section id="contacto" className={s.contSec}>
        <div className={s.secHead}><p className="section-eyebrow">Escríbenos</p><h2 className="section-title">Estamos para <em>ti</em></h2><div className="section-line"/></div>
        <div className={s.contGrid}>
          <div>
            <h3 className={s.contTitle}>Conecta con<br/>Couco Aromas</h3>
            <p className={s.contDesc}>¿Tienes preguntas? Estaremos encantados de ayudarte.</p>
            {[['📍','Mendoza, Argentina'],['📧','hola@coucoaromas.com'],['📱','+54 261 000-0000'],['🕐','Lun–Sáb, 9am–6pm']].map(([ic,tx])=><div key={tx} className={s.contDetail}><span>{ic}</span><span>{tx}</span></div>)}
          </div>
          <form onSubmit={sendContacto}>
            {[['Nombre *','nombre','text'],['Email *','email','email'],['Teléfono','telefono','tel']].map(([l,f,t])=>(
              <div key={f} className="form-group"><label>{l}</label><input type={t} value={contacto[f]} onChange={e=>setContacto(p=>({...p,[f]:e.target.value}))}/></div>
            ))}
            <div className="form-group"><label>Mensaje *</label><textarea value={contacto.mensaje} onChange={e=>setContacto(p=>({...p,mensaje:e.target.value}))}/></div>
            <button type="submit" className="btn-primary" style={{width:'100%'}}>Enviar Mensaje</button>
            {contactMsg&&<div className={contactMsg.ok?'msg-success':'msg-error'}>{contactMsg.text}</div>}
          </form>
        </div>
      </section>

      {/* NEWSLETTER */}
      <div className={s.nl}><h2>Descubre primero las novedades</h2><p>Suscríbete y recibe ofertas exclusivas</p><form onSubmit={suscribir} className={s.nlForm}><input type="email" placeholder="tu@email.com" value={nlEmail} onChange={e=>setNlEmail(e.target.value)}/><button type="submit">Suscribirme</button></form></div>

      {/* FOOTER */}
      <footer className={s.footer}>
        <div className={s.fGrid}>
          <div><span className={s.fBrand}>COUCO AROMAS</span><p className={s.fDesc}>Fragancias artesanales elaboradas a mano con ingredientes naturales.</p><div className={s.socials}>{['ig','fb','wa','tt'].map(sc=><a key={sc} href="#" className={s.social}>{sc}</a>)}</div></div>
          {[{t:'Tienda',l:['Perfumes','Jabones','Velas','Difusores','Sets']},{t:'Info',l:['Historia','Contacto','Envíos','Devoluciones']},{t:'Legal',l:['Términos','Privacidad','Cookies']}].map(c=>(
            <div key={c.t}><h4 className={s.fColT}>{c.t}</h4>{c.l.map(l=><a key={l} href="#" className={s.fLink}>{l}</a>)}</div>
          ))}
        </div>
        <div className={s.fBottom}><span>© 2025 Couco Aromas.</span><span>Hecho con ❤️</span></div>
      </footer>

      {/* PRODUCT MODAL */}
      {modal==='product'&&selectedProd&&(
        <div className={s.modalOverlay} onClick={e=>e.target===e.currentTarget&&setModal(null)}>
          <div className={s.modalBox}>
            <button className={s.modalClose} onClick={()=>setModal(null)}>✕</button>
            <div className={s.modalGrid}>
              <div className={s.modalImg}>
                {selectedProd.imagen?<img src={'/api'+selectedProd.imagen} alt={selectedProd.nombre} style={{width:'100%',height:'100%',objectFit:'cover'}}/>:<span style={{fontSize:'5rem'}}>{selectedProd.nombre?'✨':'✨'}</span>}
              </div>
              <div className={s.modalInfo}>
                <div className={s.mCat}>{selectedProd.categoria_nombre} · {selectedProd.volumen}</div>
                <h2 className={s.mName}>{selectedProd.nombre}</h2>
                <div className={s.mPrice}>
                  {selectedProd.precio_oferta&&<span className={s.mOld}>${selectedProd.precio.toFixed(2)}</span>}
                  ${(selectedProd.precio_oferta??selectedProd.precio).toFixed(2)}
                </div>
                <p className={s.mDesc}>{selectedProd.descripcion}</p>
                {selectedProd.notas_olfativas&&<div className={s.mNotes}><strong>Notas Olfativas:</strong><br/>{selectedProd.notas_olfativas}</div>}
                <button className="btn-primary" style={{width:'100%'}} onClick={()=>{dispatch({type:'ADD',item:selectedProd});toast('Agregado al carrito');setModal(null)}}>
                  Agregar al Carrito
                </button>
                {/* RESEÑAS */}
                <div className={s.resenas}>
                  <h4 className={s.resenasTitle}>Reseñas ({selectedProd.total_resenas||0})</h4>
                  {user&&(
                    <form onSubmit={submitResena} className={s.resenaForm}>
                      <div className={s.stars}>
                        {[1,2,3,4,5].map(n=><button type="button" key={n} className={n<=resena.calificacion?s.starOn:s.starOff} onClick={()=>setResena(r=>({...r,calificacion:n}))}>★</button>)}
                      </div>
                      <textarea placeholder="Tu opinión (opcional)" value={resena.comentario} onChange={e=>setResena(r=>({...r,comentario:e.target.value}))} style={{width:'100%',padding:'.5rem',border:'1px solid var(--border)',fontSize:'.8rem',resize:'none',height:'65px',fontFamily:'var(--font-b)'}}/>
                      <button type="submit" className="btn-outline" style={{fontSize:'.65rem',padding:'.4rem 1rem',marginTop:'.4rem'}}>Enviar Reseña</button>
                    </form>
                  )}
                  <div className={s.resenaList}>
                    {(selectedProd.resenas||[]).slice(0,3).map(r=>(
                      <div key={r.id} className={s.resenaItem}>
                        <div className={s.resenaHead}>
                          <span className={s.resenaUser}>{r.usuario_nombre}</span>
                          <span className="stars">{'★'.repeat(r.calificacion)}{'☆'.repeat(5-r.calificacion)}</span>
                        </div>
                        {r.comentario&&<p className={s.resenaTxt}>{r.comentario}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <ToastEl/>
    </>
  )
}
