import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart, useAuth } from '../context'
import CartSidebar from './CartSidebar'
import s from './Navbar.module.css'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQ, setSearchQ] = useState('')
  const { count } = useCart()
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()
  const menuRef = useRef()
  const searchRef = useRef()

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', h)
    return () => window.removeEventListener('scroll', h)
  }, [])

  useEffect(() => {
    const h = e => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  function handleSearch(e) {
    e.preventDefault()
    if (!searchQ.trim()) return
    navigate(`/?buscar=${encodeURIComponent(searchQ.trim())}`)
    setSearchOpen(false); setSearchQ('')
  }

  return (
    <>
      <nav className={`${s.nav} ${scrolled?s.scrolled:''}`}>
        <Link to="/" className={s.logo}>
          <img src="/logo.png" alt="Couco Aromas"
            onError={e=>{e.target.style.display='none';e.target.nextSibling.style.display='flex'}}/>
          <span className={s.logoFallback} style={{display:'none'}}>C</span>
          <span className={s.logoText}>
            <span className={s.logoName}>COUCO</span>
            <span className={s.logoSub}>Aromas</span>
          </span>
        </Link>

        <ul className={s.links}>
          {[['/#categorias','Colecciones'],['/#productos','Tienda'],['/#filosofia','Historia'],['/#contacto','Contacto']].map(([h,l])=>(
            <li key={h}><a href={h}>{l}</a></li>
          ))}
          {isAdmin && <li><Link to="/admin" style={{color:'var(--copper)'}}>⚙️ Admin</Link></li>}
        </ul>

        <div className={s.actions}>
          {/* Buscador */}
          <div className={s.searchWrap} ref={searchRef}>
            <button className={s.iconBtn} onClick={()=>setSearchOpen(o=>!o)} title="Buscar">🔍</button>
            {searchOpen && (
              <form className={s.searchBox} onSubmit={handleSearch}>
                <input autoFocus placeholder="Buscar productos..." value={searchQ}
                  onChange={e=>setSearchQ(e.target.value)}/>
                <button type="submit">→</button>
              </form>
            )}
          </div>

          {/* Favoritos */}
          {user && <Link to="/favoritos" className={s.iconBtn} title="Favoritos">♡</Link>}

          {/* Carrito */}
          <button className={s.cartBtn} onClick={()=>setCartOpen(true)}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 01-8 0"/>
            </svg>
            {count>0 && <span className={s.badge}>{count}</span>}
          </button>

          {/* Usuario */}
          {user ? (
            <div className={s.userMenu} ref={menuRef}>
              <button className={s.userBtn} onClick={()=>setMenuOpen(o=>!o)}>
                {user.avatar
                  ? <img src={user.avatar} alt="" className={s.avatar}/>
                  : <span className={s.initial}>{user.nombre[0].toUpperCase()}</span>}
                <span className={s.uname}>{user.nombre.split(' ')[0]}</span>
                <span style={{fontSize:'.5rem',color:'var(--muted)'}}>{menuOpen?'▲':'▼'}</span>
              </button>
              {menuOpen && (
                <div className={s.dropdown}>
                  <div className={s.dropHead}>
                    <div className={s.dropName}>{user.nombre}</div>
                    <div className={s.dropEmail}>{user.email}</div>
                    {isAdmin && <span className={s.adminTag}>Admin</span>}
                  </div>
                  <Link to="/mis-pedidos" className={s.dropItem} onClick={()=>setMenuOpen(false)}>📦 Mis Pedidos</Link>
                  <Link to="/favoritos"   className={s.dropItem} onClick={()=>setMenuOpen(false)}>♡ Favoritos</Link>
                  {isAdmin && <Link to="/admin" className={s.dropItem} onClick={()=>setMenuOpen(false)}>⚙️ Panel Admin</Link>}
                  <button className={s.dropItem} onClick={()=>{logout();setMenuOpen(false);navigate('/')}}>→ Cerrar Sesión</button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className={s.loginBtn}>Iniciar Sesión</Link>
          )}
        </div>
      </nav>
      <CartSidebar open={cartOpen} onClose={()=>setCartOpen(false)}/>
    </>
  )
}
