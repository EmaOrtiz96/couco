from fastapi import APIRouter, HTTPException, Request, Depends
from pydantic import BaseModel
from typing import Optional, List
from app.database import get_connection
from app.auth import get_current_user_optional, require_admin
from app.utils.email import email_confirmacion_pedido
import os, mercadopago

router = APIRouter(tags=["Pedidos"])
MP_ACCESS_TOKEN = os.getenv("MP_ACCESS_TOKEN","TEST-token")
MP_PUBLIC_KEY   = os.getenv("MP_PUBLIC_KEY","TEST-key")
FRONTEND_URL    = os.getenv("FRONTEND_URL","http://localhost:5173")

sdk = mercadopago.SDK(MP_ACCESS_TOKEN)

class ItemIn(BaseModel):
    producto_id:    int
    nombre_producto:str
    cantidad:       int
    precio:         float

class PedidoIn(BaseModel):
    nombre_cliente: str
    email:          str
    telefono:       Optional[str]=None
    direccion:      str
    ciudad:         str
    provincia:      str
    codigo_postal:  Optional[str]=None
    notas:          Optional[str]=None
    items:          List[ItemIn]

# ── CREAR PEDIDO + PREFERENCIA MP ─────────────────
@router.post("/pedidos")
def crear_pedido(data: PedidoIn, user=Depends(get_current_user_optional)):
    total = sum(i.precio * i.cantidad for i in data.items)
    conn  = get_connection()
    try:
        with conn.cursor() as c:
            c.execute("""INSERT INTO pedidos
                (usuario_id,nombre_cliente,email,telefono,direccion,ciudad,provincia,codigo_postal,total,notas)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
                (user["id"] if user else None, data.nombre_cliente,data.email,
                 data.telefono,data.direccion,data.ciudad,data.provincia,
                 data.codigo_postal,total,data.notas))
            pedido_id = c.lastrowid
            for item in data.items:
                c.execute("INSERT INTO pedido_items (pedido_id,producto_id,nombre_producto,cantidad,precio) VALUES (%s,%s,%s,%s,%s)",
                          (pedido_id,item.producto_id,item.nombre_producto,item.cantidad,item.precio))
                # descontar stock
                c.execute("UPDATE productos SET stock=GREATEST(stock-%s,0) WHERE id=%s",(item.cantidad,item.producto_id))
            conn.commit()

        # Crear preferencia MercadoPago
        preference_data = {
            "items": [{"title":i.nombre_producto,"quantity":i.cantidad,"unit_price":float(i.precio),"currency_id":"ARS"} for i in data.items],
            "payer": {"name":data.nombre_cliente,"email":data.email},
            "back_urls": {
                "success": f"{FRONTEND_URL}/pedido/{pedido_id}?status=success",
                "failure": f"{FRONTEND_URL}/pedido/{pedido_id}?status=failure",
                "pending": f"{FRONTEND_URL}/pedido/{pedido_id}?status=pending",
            },
            "auto_return": "approved",
            "external_reference": str(pedido_id),
            "notification_url": f"{FRONTEND_URL.replace('5173','8000')}/pagos/webhook",
        }
        pref = sdk.preference().create(preference_data)
        mp_id = pref["response"].get("id","")

        with conn.cursor() as c:
            c.execute("UPDATE pedidos SET mp_preference_id=%s WHERE id=%s",(mp_id,pedido_id))
            conn.commit()

        return {
            "pedido_id": pedido_id,
            "total": total,
            "mp_preference_id": mp_id,
            "mp_public_key": MP_PUBLIC_KEY,
            "init_point": pref["response"].get("init_point",""),
            "sandbox_init_point": pref["response"].get("sandbox_init_point",""),
        }
    finally: conn.close()

# ── WEBHOOK MP ────────────────────────────────────
@router.post("/pagos/webhook")
async def webhook(request: Request):
    body = await request.json()
    if body.get("type") == "payment":
        payment_id = body["data"]["id"]
        payment = sdk.payment().get(payment_id)
        p = payment["response"]
        if p.get("status") == "approved":
            pedido_id = int(p.get("external_reference",0))
            conn = get_connection()
            try:
                with conn.cursor() as c:
                    c.execute("UPDATE pedidos SET estado='pagado',mp_payment_id=%s WHERE id=%s",
                              (str(payment_id),pedido_id))
                    conn.commit()
                    # Enviar email confirmación
                    c.execute("SELECT * FROM pedidos WHERE id=%s",(pedido_id,))
                    pedido = c.fetchone()
                    c.execute("SELECT * FROM pedido_items WHERE pedido_id=%s",(pedido_id,))
                    items = c.fetchall()
                if pedido:
                    email_confirmacion_pedido(pedido["email"],pedido["nombre_cliente"],pedido_id,float(pedido["total"]),items)
            finally: conn.close()
    return {"status":"ok"}

# ── MIS PEDIDOS (cliente) ─────────────────────────
@router.get("/mis-pedidos")
def mis_pedidos(user=Depends(get_current_user_optional)):
    if not user: raise HTTPException(401,"No autenticado")
    conn = get_connection()
    try:
        with conn.cursor() as c:
            c.execute("SELECT * FROM pedidos WHERE usuario_id=%s ORDER BY created_at DESC",(user["id"],))
            pedidos = c.fetchall()
            for p in pedidos:
                c.execute("SELECT * FROM pedido_items WHERE pedido_id=%s",(p["id"],))
                p["items"] = c.fetchall()
        return pedidos
    finally: conn.close()

# ── DETALLE PEDIDO ────────────────────────────────
@router.get("/pedidos/{pedido_id}")
def detalle_pedido(pedido_id: int, user=Depends(get_current_user_optional)):
    conn = get_connection()
    try:
        with conn.cursor() as c:
            c.execute("SELECT * FROM pedidos WHERE id=%s",(pedido_id,))
            pedido = c.fetchone()
            if not pedido: raise HTTPException(404,"Pedido no encontrado")
            c.execute("SELECT * FROM pedido_items WHERE pedido_id=%s",(pedido_id,))
            pedido["items"] = c.fetchall()
        return pedido
    finally: conn.close()

# ── ADMIN: todos los pedidos ──────────────────────
@router.get("/admin/pedidos")
def admin_pedidos(admin=Depends(require_admin)):
    conn = get_connection()
    try:
        with conn.cursor() as c:
            c.execute("SELECT * FROM pedidos ORDER BY created_at DESC")
            pedidos = c.fetchall()
            for p in pedidos:
                c.execute("SELECT * FROM pedido_items WHERE pedido_id=%s",(p["id"],))
                p["items"] = c.fetchall()
        return pedidos
    finally: conn.close()

@router.put("/admin/pedidos/{pedido_id}/estado")
def cambiar_estado(pedido_id:int, estado:str, admin=Depends(require_admin)):
    estados = {"pendiente","pagado","preparando","enviado","entregado","cancelado"}
    if estado not in estados: raise HTTPException(400,"Estado no válido")
    conn = get_connection()
    try:
        with conn.cursor() as c:
            c.execute("UPDATE pedidos SET estado=%s WHERE id=%s",(estado,pedido_id))
            conn.commit()
        return {"success":True}
    finally: conn.close()
