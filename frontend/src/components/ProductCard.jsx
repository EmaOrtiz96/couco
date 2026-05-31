import { useState } from 'react'
import { useCart, useAuth } from '../context'
import { api } from '../api'
import s from './ProductCard.module.css'

const emo = n=>{const l=(n||'').toLowerCase();if(l.includes('noir'))return'🌑';if(l.includes('fleur'))return'🌺';if(l.includes('bosque'))return'🌿';if(l.includes('rosa'))return'🌹';if(l.includes('lavanda'))return'💜';if(l.includes('carbón')||l.includes('carbon'))return'⚫';if(l.includes('ámbar')||l.includes('vainilla'))return'🕯️';if(l.includes('meditación'))return'☮️';if(l.includes('bambú')||l.includes('bambu'))return'🎋';if(l.includes('set'))return'🎁';if(l.includes('jabón')||l.includes('jabon'))return'🧼';if(l.includes('vela'))return'🕯️';if(l.includes('difusor'))return'💨';return'✨'}

function Stars({v}) {
  return <div className={s.stars}>{[1,2,3,4,5].map(i=><span key={i} className={i<=Math.round(v)?'stars':'star-empty'}>★</span>)}</div>
}

export default function ProductCard({product, onOpen, favIds=[], onFavToggle}) {
  const {dispatch} = useCart()
  const {user} = useAuth()
  const [added, setAdded] = useState(false)
  const [isFav, setIsFav] = useState(favIds.includes(product.id))
  const price = product.precio_oferta ?? product.precio

  function handleAdd(e) {
    e.stopPropagation()
    dispatch({type:'ADD', item:product})
    setAdded(true); setTimeout(()=>setAdded(false),1500)
  }

  async function handleFav(e) {
    e.stopPropagation()
    if (!user) { alert('Inicia sesión para guardar favoritos'); return }
    const r = await api.toggleFavorito(product.id).catch(()=>null)
    if (r) { setIsFav(r.favorito); onFavToggle?.() }
  }

  return (
    <div className={s.card} onClick={()=>onOpen(product)}>
      {product.destacado===1&&!product.precio_oferta&&<span className={s.badge}>Destacado</span>}
      {product.precio_oferta&&<span className={`${s.badge} ${s.oferta}`}>Oferta</span>}

      <div className={s.imgWrap}>
        {product.imagen
          ? <img src={'/api'+product.imagen} alt={product.nombre} className={s.prodImg}/>
          : <span className={s.emoji}>{emo(product.nombre)}</span>}
        <div className={s.overlay}>
          <button className="btn-primary" style={{fontSize:'.65rem',padding:'.55rem 1.1rem'}} onClick={handleAdd}>
            {added?'✓ Agregado':'+ Al carrito'}
          </button>
        </div>
        <button className={`${s.favBtn} ${isFav?s.favActive:''}`} onClick={handleFav} title="Favorito">
          {isFav?'♥':'♡'}
        </button>
      </div>

      <div className={s.info}>
        <div className={s.cat}>{product.categoria_nombre}</div>
        <div className={s.name}>{product.nombre}</div>
        {product.calificacion_promedio>0&&(
          <div className={s.rating}>
            <Stars v={product.calificacion_promedio}/>
            <span className={s.ratingN}>({product.total_resenas})</span>
          </div>
        )}
        <div className={s.desc}>{product.descripcion_corta}</div>
        <div className={s.footer}>
          <div className={s.price}>
            {product.precio_oferta&&<span className={s.old}>${product.precio.toFixed(2)}</span>}
            ${price.toFixed(2)}
          </div>
          <button className={s.addBtn} onClick={handleAdd}>{added?'✓':'+'}</button>
        </div>
      </div>
    </div>
  )
}
