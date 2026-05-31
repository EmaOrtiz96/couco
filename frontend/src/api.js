const BASE = 'https://couco-production.up.railway.app'
const tok = () => localStorage.getItem('couco_token')

async function req(path, opts={}) {
  const t = tok()
  const headers = {'Content-Type':'application/json',...opts.headers}
  if (t) headers['Authorization'] = `Bearer ${t}`
  const r = await fetch(BASE+path, {...opts, headers})
  if (!r.ok) { const e=await r.json().catch(()=>({})); throw new Error(e.detail||'Error') }
  return r.json()
}

async function form(path, data, method='POST') {
  const t = tok()
  const headers = {}
  if (t) headers['Authorization'] = `Bearer ${t}`
  const r = await fetch(BASE+path, {method, headers, body:data})
  if (!r.ok) { const e=await r.json().catch(()=>({})); throw new Error(e.detail||'Error') }
  return r.json()
}

export const api = {
  register: d => req('/auth/register',{method:'POST',body:JSON.stringify(d)}),
  login:    d => req('/auth/login',   {method:'POST',body:JSON.stringify(d)}),
  google:   t => req('/auth/google',  {method:'POST',body:JSON.stringify({token:t})}),
  me:       () => req('/auth/me'),
  forgot:   e => req('/auth/forgot-password',{method:'POST',body:JSON.stringify({email:e})}),
  reset:    d => req('/auth/reset-password', {method:'POST',body:JSON.stringify(d)}),
  changePass: d => req('/auth/cambiar-password',{method:'PUT',body:JSON.stringify(d)}),
  getProductos: (p={}) => { const q=new URLSearchParams(Object.entries(p).filter(([,v])=>v!=null&&v!=='')).toString(); return req('/productos'+(q?'?'+q:'')) },
  getProducto:  id => req(`/productos/${id}`),
  createProducto: fd => form('/productos', fd),
  updateProducto: (id,fd) => form(`/productos/${id}`,fd,'PUT'),
  deleteProducto: id => req(`/productos/${id}`,{method:'DELETE'}),
  getCategorias: () => req('/categorias'),
  createCategoria: d => req('/categorias',{method:'POST',body:JSON.stringify(d)}),
  updateCategoria: (id,d) => req(`/categorias/${id}`,{method:'PUT',body:JSON.stringify(d)}),
  createPedido: d => req('/pedidos',{method:'POST',body:JSON.stringify(d)}),
  misPedidos:   () => req('/mis-pedidos'),
  getPedido:    id => req(`/pedidos/${id}`),
  crearResena: (pid,d) => req(`/productos/${pid}/resenas`,{method:'POST',body:JSON.stringify(d)}),
  getFavoritos:    () => req('/favoritos'),
  getFavoritosIds: () => req('/favoritos/ids'),
  toggleFavorito:  id => req(`/favoritos/${id}`,{method:'POST'}),
  sendContacto: d => req('/contacto',{method:'POST',body:JSON.stringify(d)}),
  suscribir:    e => req('/suscribir',{method:'POST',body:JSON.stringify({email:e})}),
  getStats:        () => req('/admin/stats'),
  getMensajes:     () => req('/admin/mensajes'),
  marcarLeido:     id => req(`/admin/mensajes/${id}/leido`,{method:'PUT'}),
  getSuscriptores: () => req('/admin/suscriptores'),
  getAdminPedidos: () => req('/admin/pedidos'),
  cambiarEstado:   (id,estado) => req(`/admin/pedidos/${id}/estado?estado=${estado}`,{method:'PUT'}),
  getUsuarios:     () => req('/auth/admin/usuarios'),
}