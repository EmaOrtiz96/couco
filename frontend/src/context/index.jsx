import { createContext, useContext, useState, useEffect, useReducer } from 'react'

// ── AUTH ──────────────────────────────────────────
const AuthCtx = createContext()
export function AuthProvider({children}) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('couco_token'))
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    if (!token) { setLoading(false); return }
    fetch('/api/auth/me',{headers:{Authorization:`Bearer ${token}`}})
      .then(r => r.ok?r.json():null).then(d=>{if(d)setUser(d);else logout()})
      .catch(logout).finally(()=>setLoading(false))
  },[])
  function saveSession(d) { localStorage.setItem('couco_token',d.access_token); setToken(d.access_token); setUser(d.user) }
  function logout() { localStorage.removeItem('couco_token'); setToken(null); setUser(null) }
  return <AuthCtx.Provider value={{user,token,loading,isAdmin:user?.rol==='admin',saveSession,logout}}>{children}</AuthCtx.Provider>
}
export const useAuth = () => useContext(AuthCtx)

// ── CART ──────────────────────────────────────────
const CartCtx = createContext()
function cartReducer(state, action) {
  switch(action.type) {
    case 'ADD': { const e=state.find(i=>i.id===action.item.id); return e?state.map(i=>i.id===action.item.id?{...i,qty:i.qty+1}:i):[...state,{...action.item,qty:1}] }
    case 'REMOVE': return state.filter(i=>i.id!==action.id)
    case 'QTY': return state.map(i=>i.id===action.id?{...i,qty:action.qty}:i).filter(i=>i.qty>0)
    case 'CLEAR': return []
    case 'LOAD': return action.items
    default: return state
  }
}
export function CartProvider({children}) {
  const [cart, dispatch] = useReducer(cartReducer,[])
  useEffect(()=>{ const s=localStorage.getItem('couco_cart'); if(s) dispatch({type:'LOAD',items:JSON.parse(s)}) },[])
  useEffect(()=>{ localStorage.setItem('couco_cart',JSON.stringify(cart)) },[cart])
  const total = cart.reduce((s,i)=>s+(i.precio_oferta??i.precio)*i.qty,0)
  const count = cart.reduce((s,i)=>s+i.qty,0)
  return <CartCtx.Provider value={{cart,dispatch,total,count}}>{children}</CartCtx.Provider>
}
export const useCart = () => useContext(CartCtx)
