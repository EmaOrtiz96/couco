import { useState, useEffect, useRef } from 'react'
import { api } from '../api'
import { useAuth } from '../context'
import s from './Admin.module.css'

const PAGES = ['Dashboard','Productos','Categorías','Pedidos','Mensajes','Suscriptores','Usuarios']
const ICONS = {Dashboard:'📊',Productos:'🛍️','Categorías':'🏷️',Pedidos:'📦',Mensajes:'💬',Suscriptores:'📧',Usuarios:'👥'}

const EMPTY_PROD = {id:null,nombre:'',categoria_id:1,descripcion_corta:'',descripcion:'',precio:'',precio_oferta:'',stock:0,volumen:'',notas_olfativas:'',destacado:0,activo:1}
const EMPTY_CAT  = {id:null,nombre:'',slug:'',descripcion:'',orden:0}

export default function Admin() {
  const [page, setPage]           = useState('Dashboard')
  const [stats, setStats]         = useState(null)
  const [productos, setProductos] = useState([])
  const [categorias, setCats]     = useState([])
  const [pedidos, setPedidos]     = useState([])
  const [mensajes, setMensajes]   = useState([])
  const [subs, setSubs]           = useState([])
  const [usuarios, setUsuarios]   = useState([])
  const [search, setSearch]       = useState('')
  const [prodModal, setProdModal] = useState(false)
  const [catModal, setCatModal]   = useState(false)
  const [prodForm, setProdForm]   = useState(EMPTY_PROD)
  const [catForm, setCatForm]     = useState(EMPTY_CAT)
  const [imgFile, setImgFile]     = useState(null)
  const [imgPreview, setImgPreview]= useState(null)
  const [saving, setSaving]       = useState(false)
  const [formErr, setFormErr]     = useState('')
  const {logout} = useAuth()
  const fileRef = useRef()

  useEffect(()=>{ loadPage(page) },[page])

  async function loadPage(p) {
    if (p==='Dashboard') { const r=await api.getStats().catch(()=>null); setStats(r) }
    if (p==='Productos') { const r=await api.getProductos({limit:100}).catch(()=>({items:[]})); setProductos(r.items||[]) }
    if (p==='Categorías') { const r=await api.getCategorias().catch(()=>[]); setCats(r) }
    if (p==='Pedidos') { const r=await api.getAdminPedidos().catch(()=>[]); setPedidos(r) }
    if (p==='Mensajes') { const r=await api.getMensajes().catch(()=>[]); setMensajes(r) }
    if (p==='Suscriptores') { const r=await api.getSuscriptores().catch(()=>[]); setSubs(r) }
    if (p==='Usuarios') { const r=await api.getUsuarios().catch(()=>[]); setUsuarios(r) }
  }

  function openNewProd() { setProdForm(EMPTY_PROD); setImgFile(null); setImgPreview(null); setFormErr(''); setProdModal(true) }
  function openEditProd(p) {
    setProdForm({...p,precio:p.precio||'',precio_oferta:p.precio_oferta||''})
    setImgPreview(p.imagen ? '/api'+p.imagen : null)
    setImgFile(null); setFormErr(''); setProdModal(true)
  }

  function handleImgChange(e) {
    const f = e.target.files[0]; if(!f) return
    setImgFile(f)
    setImgPreview(URL.createObjectURL(f))
  }

  async function saveProd(e) {
    e.preventDefault(); setSaving(true); setFormErr('')
    try {
      const fd = new FormData()
      Object.entries(prodForm).forEach(([k,v])=>{ if(k!=='id'&&v!==null&&v!==undefined) fd.append(k,v) })
      if (imgFile) fd.append('imagen', imgFile)
      if (prodForm.id) await api.updateProducto(prodForm.id, fd)
      else await api.createProducto(fd)
      setProdModal(false)
      const r = await api.getProductos({limit:100}); setProductos(r.items||[])
    } catch(err) { setFormErr(err.message) }
    finally { setSaving(false) }
  }

  async function deleteProd(id) {
    if (!confirm('¿Eliminar producto?')) return
    await api.deleteProducto(id).catch(()=>{})
    const r = await api.getProductos({limit:100}); setProductos(r.items||[])
  }

  async function saveCat(e) {
    e.preventDefault(); setSaving(true); setFormErr('')
    try {
      if (catForm.id) await api.updateCategoria(catForm.id, catForm)
      else await api.createCategoria(catForm)
      setCatModal(false)
      const r = await api.getCategorias(); setCats(r)
    } catch(err) { setFormErr(err.message) }
    finally { setSaving(false) }
  }

  async function cambiarEstado(id, estado) {
    await api.cambiarEstado(id, estado).catch(()=>{})
    const r = await api.getAdminPedidos(); setPedidos(r)
  }

  async function marcarLeido(id) {
    await api.marcarLeido(id).catch(()=>{})
    setMensajes(m=>m.map(msg=>msg.id===id?{...msg,leido:1}:msg))
  }

  const filteredProds = productos.filter(p=>p.nombre.toLowerCase().includes(search.toLowerCase())||p.categoria_nombre?.toLowerCase().includes(search.toLowerCase()))

  const ESTADO_COLORS = {pendiente:'#f5a623',pagado:'#4a90d9',preparando:'#9b59b6',enviado:'#27ae60',entregado:'#1abc9c',cancelado:'#e74c3c'}

  return (
    <div className={s.layout}>
      {/* SIDEBAR */}
      <aside className={s.sidebar}>
        <div className={s.sidebarLogo}><span className={s.brandName}>COUCO AROMAS</span><span className={s.brandSub}>Panel Admin</span></div>
        {PAGES.map(p=><button key={p} className={`${s.navItem} ${page===p?s.active:''}`} onClick={()=>setPage(p)}><span>{ICONS[p]}</span>{p}</button>)}
        <a href="/" className={s.viewSite}>← Ver Tienda</a>
        <button className={s.logoutBtn} onClick={logout}>Cerrar Sesión</button>
      </aside>

      <div className={s.main}>
        <div className={s.topbar}>
          <h1 className={s.pageTitle}>{page}</h1>
          <div style={{display:'flex',gap:'.8rem',alignItems:'center'}}>
            {page==='Productos'&&<input className={s.searchInput} placeholder="Buscar producto..." value={search} onChange={e=>setSearch(e.target.value)}/>}
            {page==='Productos'&&<button className="btn-primary" style={{padding:'.5rem 1rem',fontSize:'.68rem'}} onClick={openNewProd}>+ Nuevo</button>}
            {page==='Categorías'&&<button className="btn-primary" style={{padding:'.5rem 1rem',fontSize:'.68rem'}} onClick={()=>{setCatForm(EMPTY_CAT);setFormErr('');setCatModal(true)}}>+ Nueva</button>}
          </div>
        </div>

        <div className={s.content}>
          {/* DASHBOARD */}
          {page==='Dashboard'&&stats&&(
            <>
              <div className={s.statsGrid}>
                {[{l:'Productos',v:stats.productos,i:'🛍️'},{l:'Pedidos',v:stats.pedidos,i:'📦'},{l:'Clientes',v:stats.clientes,i:'👥'},{l:'Suscriptores',v:stats.suscriptores,i:'📧'}].map(st=>(
                  <div key={st.l} className={s.statCard}><span className={s.stIcon}>{st.i}</span><div className={s.stLabel}>{st.l}</div><div className={s.stVal}>{st.v}</div></div>
                ))}
              </div>
              <div className={s.dashGrid}>
                <div className={s.card}>
                  <div className={s.cardHead}>Ventas por Mes</div>
                  <div className={s.chartWrap}>
                    {stats.ventas_mes.length===0
                      ? <p style={{color:'var(--muted)',fontSize:'.82rem',padding:'2rem',textAlign:'center'}}>No hay ventas aún</p>
                      : <div className={s.barChart}>
                          {stats.ventas_mes.map(m=>{
                            const maxVal = Math.max(...stats.ventas_mes.map(x=>parseFloat(x.total)))
                            const pct = maxVal>0?(parseFloat(m.total)/maxVal)*100:0
                            return <div key={m.mes} className={s.barCol}>
                              <span className={s.barVal}>${parseFloat(m.total).toFixed(0)}</span>
                              <div className={s.bar} style={{height:`${pct}%`}}/>
                              <span className={s.barLabel}>{m.mes.slice(5)}</span>
                            </div>
                          })}
                        </div>
                    }
                  </div>
                </div>
                <div className={s.card}>
                  <div className={s.cardHead}>Top Productos</div>
                  {stats.top_productos.length===0
                    ? <p style={{color:'var(--muted)',fontSize:'.82rem',padding:'1rem'}}>Sin ventas aún</p>
                    : stats.top_productos.map((p,i)=>(
                      <div key={p.nombre_producto} className={s.topItem}>
                        <span className={s.topRank}>#{i+1}</span>
                        <span className={s.topName}>{p.nombre_producto}</span>
                        <span className={s.topQty}>{p.total_vendido} vendidos</span>
                      </div>
                    ))
                  }
                </div>
              </div>
              <div className={s.card}>
                <div className={s.cardHead}>Mensajes Recientes</div>
                <table className={s.table}>
                  <thead><tr><th>Nombre</th><th>Email</th><th>Mensaje</th><th>Estado</th></tr></thead>
                  <tbody>
                    {mensajes.length===0
                      ? <tr><td colSpan={4} className={s.empty}>No hay mensajes</td></tr>
                      : mensajes.slice(0,5).map(m=>(
                        <tr key={m.id}>
                          <td>{m.nombre}</td><td>{m.email}</td>
                          <td style={{maxWidth:250,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{m.mensaje}</td>
                          <td>{m.leido?<span className={s.badgeGreen}>Leído</span>:<span className={s.badgeOrange}>Nuevo</span>}</td>
                        </tr>
                      ))
                    }
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* PRODUCTOS */}
          {page==='Productos'&&(
            <div className={s.card}>
              <table className={s.table}>
                <thead><tr><th>Imagen</th><th>Nombre</th><th>Categoría</th><th>Precio</th><th>Oferta</th><th>Stock</th><th>⭐</th><th>Activo</th><th>Acciones</th></tr></thead>
                <tbody>
                  {filteredProds.length===0?<tr><td colSpan={9} className={s.empty}>No hay productos</td></tr>
                    :filteredProds.map(p=>(
                    <tr key={p.id}>
                      <td><div className={s.tImg}>{p.imagen?<img src={'/api'+p.imagen} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>:'✨'}</div></td>
                      <td className={s.tName}>{p.nombre}</td>
                      <td>{p.categoria_nombre}</td>
                      <td>${parseFloat(p.precio).toFixed(2)}</td>
                      <td>{p.precio_oferta?'$'+parseFloat(p.precio_oferta).toFixed(2):'—'}</td>
                      <td><span className={p.stock<5?s.lowStock:''}>{p.stock}</span></td>
                      <td>{p.destacado?'⭐':'—'}</td>
                      <td><span className={p.activo?s.badgeGreen:s.badgeGray}>{p.activo?'Sí':'No'}</span></td>
                      <td>
                        <button className={s.actionBtn} onClick={()=>openEditProd(p)}>✏️</button>
                        <button className={s.actionBtn} style={{marginLeft:'.3rem'}} onClick={()=>deleteProd(p.id)}>🗑️</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* CATEGORÍAS */}
          {page==='Categorías'&&(
            <div className={s.card}>
              <table className={s.table}>
                <thead><tr><th>Nombre</th><th>Slug</th><th>Descripción</th><th>Orden</th><th>Acciones</th></tr></thead>
                <tbody>
                  {categorias.map(c=>(
                    <tr key={c.id}>
                      <td className={s.tName}>{c.nombre}</td><td>{c.slug}</td>
                      <td style={{maxWidth:200,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.descripcion||'—'}</td>
                      <td>{c.orden}</td>
                      <td><button className={s.actionBtn} onClick={()=>{setCatForm(c);setFormErr('');setCatModal(true)}}>✏️ Editar</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* PEDIDOS */}
          {page==='Pedidos'&&(
            <div className={s.card}>
              <table className={s.table}>
                <thead><tr><th>#</th><th>Cliente</th><th>Email</th><th>Total</th><th>Estado</th><th>Fecha</th><th>Cambiar Estado</th></tr></thead>
                <tbody>
                  {pedidos.length===0?<tr><td colSpan={7} className={s.empty}>No hay pedidos</td></tr>
                    :pedidos.map(p=>(
                    <tr key={p.id}>
                      <td>#{p.id}</td><td>{p.nombre_cliente}</td><td>{p.email}</td>
                      <td>${parseFloat(p.total).toFixed(2)}</td>
                      <td><span className={s.estadoBadge} style={{background:ESTADO_COLORS[p.estado]+'22',color:ESTADO_COLORS[p.estado]}}>{p.estado}</span></td>
                      <td>{new Date(p.created_at).toLocaleDateString()}</td>
                      <td>
                        <select className={s.estadoSel} value={p.estado} onChange={e=>cambiarEstado(p.id,e.target.value)}>
                          {['pendiente','pagado','preparando','enviado','entregado','cancelado'].map(e=><option key={e} value={e}>{e}</option>)}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* MENSAJES */}
          {page==='Mensajes'&&(
            <div className={s.card}>
              {mensajes.map(m=>(
                <div key={m.id} className={`${s.msgCard} ${!m.leido?s.msgUnread:''}`}>
                  <div className={s.msgHead}>
                    <span className={s.msgName}>{m.nombre}</span>
                    <span className={s.msgEmail}>{m.email}</span>
                    {m.telefono&&<span className={s.msgPhone}>{m.telefono}</span>}
                    <span className={s.msgDate}>{new Date(m.created_at).toLocaleDateString()}</span>
                    {!m.leido&&<button className={s.actionBtn} onClick={()=>marcarLeido(m.id)}>✓ Marcar leído</button>}
                  </div>
                  <p className={s.msgBody}>{m.mensaje}</p>
                </div>
              ))}
              {mensajes.length===0&&<p className={s.empty}>No hay mensajes</p>}
            </div>
          )}

          {/* SUSCRIPTORES */}
          {page==='Suscriptores'&&(
            <div className={s.card}>
              <div className={s.cardHead}>{subs.length} suscriptores activos</div>
              <table className={s.table}>
                <thead><tr><th>Email</th><th>Fecha</th></tr></thead>
                <tbody>
                  {subs.length===0?<tr><td colSpan={2} className={s.empty}>No hay suscriptores</td></tr>
                    :subs.map(s=><tr key={s.id}><td>{s.email}</td><td>{new Date(s.created_at).toLocaleDateString()}</td></tr>)
                  }
                </tbody>
              </table>
            </div>
          )}

          {/* USUARIOS */}
          {page==='Usuarios'&&(
            <div className={s.card}>
              <table className={s.table}>
                <thead><tr><th>Nombre</th><th>Email</th><th>Rol</th><th>Registro</th></tr></thead>
                <tbody>
                  {usuarios.map(u=>(
                    <tr key={u.id}>
                      <td className={s.tName}>{u.nombre}</td><td>{u.email}</td>
                      <td><span className={u.rol==='admin'?s.badgeCopper:s.badgeGreen}>{u.rol}</span></td>
                      <td>{new Date(u.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* MODAL PRODUCTO */}
      {prodModal&&(
        <div className={s.modalOverlay} onClick={e=>e.target===e.currentTarget&&setProdModal(false)}>
          <div className={s.modalBox}>
            <h3 className={s.modalTitle}>{prodForm.id?'Editar Producto':'Nuevo Producto'}</h3>
            <form onSubmit={saveProd}>
              {/* Imagen */}
              <div className={s.imgUpload} onClick={()=>fileRef.current.click()}>
                {imgPreview?<img src={imgPreview} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>:<div className={s.imgPlaceholder}><span>📷</span><p>Click para subir imagen</p></div>}
                <input ref={fileRef} type="file" accept="image/*" style={{display:'none'}} onChange={handleImgChange}/>
              </div>
              <div className={s.formRow}>
                <div className="form-group"><label>Nombre *</label><input required value={prodForm.nombre} onChange={e=>setProdForm(p=>({...p,nombre:e.target.value}))}/></div>
                <div className="form-group"><label>Categoría *</label>
                  <select value={prodForm.categoria_id} onChange={e=>setProdForm(p=>({...p,categoria_id:+e.target.value}))}>
                    {categorias.map(c=><option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group"><label>Descripción Corta</label><input value={prodForm.descripcion_corta} onChange={e=>setProdForm(p=>({...p,descripcion_corta:e.target.value}))}/></div>
              <div className="form-group"><label>Descripción</label><textarea value={prodForm.descripcion} onChange={e=>setProdForm(p=>({...p,descripcion:e.target.value}))}/></div>
              <div className={s.formRow}>
                <div className="form-group"><label>Precio *</label><input required type="number" step=".01" value={prodForm.precio} onChange={e=>setProdForm(p=>({...p,precio:e.target.value}))}/></div>
                <div className="form-group"><label>Precio Oferta</label><input type="number" step=".01" value={prodForm.precio_oferta} onChange={e=>setProdForm(p=>({...p,precio_oferta:e.target.value}))}/></div>
              </div>
              <div className={s.formRow}>
                <div className="form-group"><label>Stock</label><input type="number" value={prodForm.stock} onChange={e=>setProdForm(p=>({...p,stock:+e.target.value}))}/></div>
                <div className="form-group"><label>Volumen/Tamaño</label><input value={prodForm.volumen} onChange={e=>setProdForm(p=>({...p,volumen:e.target.value}))}/></div>
              </div>
              <div className="form-group"><label>Notas Olfativas</label><input value={prodForm.notas_olfativas} onChange={e=>setProdForm(p=>({...p,notas_olfativas:e.target.value}))}/></div>
              <div className={s.formRow}>
                <div className="form-group"><label>Destacado</label><select value={prodForm.destacado} onChange={e=>setProdForm(p=>({...p,destacado:+e.target.value}))}><option value={1}>Sí</option><option value={0}>No</option></select></div>
                <div className="form-group"><label>Activo</label><select value={prodForm.activo} onChange={e=>setProdForm(p=>({...p,activo:+e.target.value}))}><option value={1}>Sí</option><option value={0}>No</option></select></div>
              </div>
              {formErr&&<div className="msg-error">{formErr}</div>}
              <div className={s.modalFooter}>
                <button type="button" className="btn-outline" onClick={()=>setProdModal(false)}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={saving}>{saving?'Guardando...':'Guardar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CATEGORÍA */}
      {catModal&&(
        <div className={s.modalOverlay} onClick={e=>e.target===e.currentTarget&&setCatModal(false)}>
          <div className={s.modalBox} style={{maxWidth:420}}>
            <h3 className={s.modalTitle}>{catForm.id?'Editar Categoría':'Nueva Categoría'}</h3>
            <form onSubmit={saveCat}>
              <div className="form-group"><label>Nombre *</label><input required value={catForm.nombre} onChange={e=>setCatForm(p=>({...p,nombre:e.target.value}))}/></div>
              <div className="form-group"><label>Slug * (sin espacios)</label><input required value={catForm.slug} onChange={e=>setCatForm(p=>({...p,slug:e.target.value.toLowerCase().replace(/\s+/g,'-')}))}/></div>
              <div className="form-group"><label>Descripción</label><textarea value={catForm.descripcion||''} onChange={e=>setCatForm(p=>({...p,descripcion:e.target.value}))}/></div>
              <div className="form-group"><label>Orden</label><input type="number" value={catForm.orden} onChange={e=>setCatForm(p=>({...p,orden:+e.target.value}))}/></div>
              {formErr&&<div className="msg-error">{formErr}</div>}
              <div className={s.modalFooter}>
                <button type="button" className="btn-outline" onClick={()=>setCatModal(false)}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={saving}>{saving?'Guardando...':'Guardar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
