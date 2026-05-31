import { useCart } from '../context'
import { useNavigate } from 'react-router-dom'
import s from './CartSidebar.module.css'

const emo = n=>{const l=n.toLowerCase();if(l.includes('noir')||l.includes('perfume')||l.includes('fleur')||l.includes('bosque'))return'🌸';if(l.includes('jabón')||l.includes('jabon'))return'🧼';if(l.includes('vela'))return'🕯️';if(l.includes('difusor'))return'💨';if(l.includes('set'))return'🎁';return'✨'}

export default function CartSidebar({open, onClose}) {
  const {cart, dispatch, total, count} = useCart()
  const navigate = useNavigate()

  function goCheckout() { onClose(); navigate('/checkout') }

  return (
    <>
      <div className={`${s.overlay} ${open?s.open:''}`} onClick={onClose}/>
      <aside className={`${s.sidebar} ${open?s.open:''}`}>
        <div className={s.header}>
          <h3>Carrito {count>0&&<span className={s.cnt}>{count}</span>}</h3>
          <button className={s.close} onClick={onClose}>✕</button>
        </div>

        <div className={s.items}>
          {cart.length===0
            ? <div className={s.empty}><div>🛒</div><p>Tu carrito está vacío</p></div>
            : cart.map(item=>(
              <div key={item.id} className={s.item}>
                <div className={s.img}>
                  {item.imagen ? <img src={'/api'+item.imagen} alt={item.nombre} style={{width:'100%',height:'100%',objectFit:'cover'}}/> : emo(item.nombre)}
                </div>
                <div className={s.info}>
                  <div className={s.name}>{item.nombre}</div>
                  <div className={s.price}>${(item.precio_oferta??item.precio).toFixed(2)}</div>
                  <div className={s.qty}>
                    <button onClick={()=>dispatch({type:'QTY',id:item.id,qty:item.qty-1})}>−</button>
                    <span>{item.qty}</span>
                    <button onClick={()=>dispatch({type:'QTY',id:item.id,qty:item.qty+1})}>+</button>
                  </div>
                </div>
                <button className={s.rm} onClick={()=>dispatch({type:'REMOVE',id:item.id})}>✕</button>
              </div>
            ))
          }
        </div>

        {cart.length>0 && (
          <div className={s.footer}>
            <div className={s.totalRow}><span>Total</span><span className={s.totalAmt}>${total.toFixed(2)}</span></div>
            <button className="btn-primary" style={{width:'100%'}} onClick={goCheckout}>Finalizar Compra →</button>
            <button className="btn-outline" style={{width:'100%',marginTop:'.6rem'}} onClick={()=>dispatch({type:'CLEAR'})}>Vaciar Carrito</button>
          </div>
        )}
      </aside>
    </>
  )
}
