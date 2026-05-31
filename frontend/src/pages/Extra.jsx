// ── FAVORITOS ─────────────────────────────────────
import { useState, useEffect } from 'react'
import { api } from '../api'
import Navbar from '../components/Navbar'
import ProductCard from '../components/ProductCard'

export function Favoritos() {
  const [favs, setFavs] = useState([])
  const [favIds, setFavIds] = useState([])
  useEffect(()=>{ load() },[])
  async function load() {
    const [f,ids] = await Promise.all([api.getFavoritos().catch(()=>[]),api.getFavoritosIds().catch(()=>[])])
    setFavs(f); setFavIds(ids)
  }
  return (
    <>
      <Navbar/>
      <div style={{padding:'8rem 4rem 4rem',maxWidth:1200,margin:'0 auto'}}>
        <p style={{fontSize:'.62rem',letterSpacing:'.35em',textTransform:'uppercase',color:'var(--copper)',marginBottom:'.8rem'}}>Mi Lista</p>
        <h1 style={{fontFamily:'var(--font-d)',fontSize:'2.5rem',fontWeight:300,marginBottom:'3rem'}}>Mis <em style={{fontStyle:'italic',color:'var(--copper)'}}>Favoritos</em></h1>
        {favs.length===0
          ? <div style={{textAlign:'center',padding:'4rem',color:'var(--muted)'}}>
              <div style={{fontSize:'3rem',marginBottom:'1rem'}}>♡</div>
              <p>No tienes favoritos aún. ¡Explora la tienda!</p>
              <a href="/#productos" className="btn-primary" style={{marginTop:'1.5rem',display:'inline-block'}}>Ver Productos</a>
            </div>
          : <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(250px,1fr))',gap:'1.8rem'}}>
              {favs.map(p=><ProductCard key={p.id} product={p} onOpen={()=>{}} favIds={favIds} onFavToggle={load}/>)}
            </div>
        }
      </div>
    </>
  )
}

// ── MIS PEDIDOS ───────────────────────────────────
export function MisPedidos() {
  const [pedidos, setPedidos] = useState([])
  const ESTADOS = {pendiente:'⏳',pagado:'✅',preparando:'📦',enviado:'🚚',entregado:'🎉',cancelado:'❌'}
  const COLORS   = {pendiente:'#f5a623',pagado:'#4a90d9',preparando:'#9b59b6',enviado:'#27ae60',entregado:'#1abc9c',cancelado:'#e74c3c'}
  useEffect(()=>{ api.misPedidos().then(setPedidos).catch(()=>{}) },[])
  return (
    <>
      <Navbar/>
      <div style={{padding:'8rem 4rem 4rem',maxWidth:900,margin:'0 auto'}}>
        <p style={{fontSize:'.62rem',letterSpacing:'.35em',textTransform:'uppercase',color:'var(--copper)',marginBottom:'.8rem'}}>Mi cuenta</p>
        <h1 style={{fontFamily:'var(--font-d)',fontSize:'2.5rem',fontWeight:300,marginBottom:'3rem'}}>Mis <em style={{fontStyle:'italic',color:'var(--copper)'}}>Pedidos</em></h1>
        {pedidos.length===0
          ? <div style={{textAlign:'center',padding:'4rem',color:'var(--muted)'}}>
              <div style={{fontSize:'3rem',marginBottom:'1rem'}}>📦</div>
              <p>No tienes pedidos aún.</p>
              <a href="/#productos" className="btn-primary" style={{marginTop:'1.5rem',display:'inline-block'}}>Hacer mi primer pedido</a>
            </div>
          : pedidos.map(p=>(
            <div key={p.id} style={{background:'white',border:'1px solid var(--border)',marginBottom:'1.5rem',padding:'1.5rem'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem',flexWrap:'wrap',gap:'.5rem'}}>
                <div>
                  <span style={{fontFamily:'var(--font-d)',fontSize:'1.1rem'}}>Pedido #{p.id}</span>
                  <span style={{fontSize:'.72rem',color:'var(--muted)',marginLeft:'1rem'}}>{new Date(p.created_at).toLocaleDateString('es-AR',{day:'numeric',month:'long',year:'numeric'})}</span>
                </div>
                <span style={{fontSize:'.62rem',letterSpacing:'.12em',textTransform:'uppercase',padding:'.2rem .7rem',background:COLORS[p.estado]+'22',color:COLORS[p.estado]}}>
                  {ESTADOS[p.estado]} {p.estado}
                </span>
              </div>
              {(p.items||[]).map(item=>(
                <div key={item.id} style={{display:'flex',justifyContent:'space-between',padding:'.5rem 0',borderBottom:'1px solid rgba(196,173,138,.1)',fontSize:'.82rem'}}>
                  <span>{item.nombre_producto} <span style={{color:'var(--muted)'}}>x{item.cantidad}</span></span>
                  <span>${(item.precio*item.cantidad).toFixed(2)}</span>
                </div>
              ))}
              <div style={{display:'flex',justifyContent:'flex-end',marginTop:'.8rem',fontFamily:'var(--font-d)',fontSize:'1.2rem'}}>
                Total: ${parseFloat(p.total).toFixed(2)}
              </div>
            </div>
          ))
        }
      </div>
    </>
  )
}
