from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional
from app.database import get_connection
from app.auth import require_admin

# ── CATEGORÍAS ────────────────────────────────────
cats = APIRouter(prefix="/categorias", tags=["Categorías"])

class CatIn(BaseModel):
    nombre:str; slug:str; descripcion:Optional[str]=None; orden:int=0

@cats.get("/")
def listar():
    conn = get_connection()
    try:
        with conn.cursor() as c:
            c.execute("SELECT * FROM categorias WHERE activo=1 ORDER BY orden")
            return c.fetchall()
    finally: conn.close()

@cats.post("/")
def crear(d: CatIn, admin=Depends(require_admin)):
    conn = get_connection()
    try:
        with conn.cursor() as c:
            c.execute("INSERT INTO categorias (nombre,slug,descripcion,orden) VALUES (%s,%s,%s,%s)",
                      (d.nombre,d.slug,d.descripcion,d.orden))
            conn.commit()
        return {"success":True,"id":c.lastrowid}
    finally: conn.close()

@cats.put("/{cat_id}")
def editar(cat_id:int, d: CatIn, admin=Depends(require_admin)):
    conn = get_connection()
    try:
        with conn.cursor() as c:
            c.execute("UPDATE categorias SET nombre=%s,slug=%s,descripcion=%s,orden=%s WHERE id=%s",
                      (d.nombre,d.slug,d.descripcion,d.orden,cat_id))
            conn.commit()
        return {"success":True}
    finally: conn.close()

# ── CONTACTO ──────────────────────────────────────
contact = APIRouter(tags=["Contacto"])

class ContactoIn(BaseModel):
    nombre:str; email:str; telefono:Optional[str]=None; mensaje:str

class SuscriptorIn(BaseModel):
    email:str

@contact.post("/contacto")
def send_contact(d: ContactoIn):
    conn = get_connection()
    try:
        with conn.cursor() as c:
            c.execute("INSERT INTO mensajes (nombre,email,telefono,mensaje) VALUES (%s,%s,%s,%s)",
                      (d.nombre,d.email,d.telefono,d.mensaje))
            conn.commit()
        return {"success":True,"message":"¡Mensaje enviado!"}
    finally: conn.close()

@contact.post("/suscribir")
def suscribir(d: SuscriptorIn):
    conn = get_connection()
    try:
        with conn.cursor() as c:
            c.execute("INSERT IGNORE INTO suscriptores (email) VALUES (%s)",(d.email,))
            conn.commit()
        return {"success":True}
    finally: conn.close()

# ── ADMIN ─────────────────────────────────────────
adm = APIRouter(prefix="/admin", tags=["Admin"])

@adm.get("/stats")
def stats(admin=Depends(require_admin)):
    conn = get_connection()
    try:
        with conn.cursor() as c:
            c.execute("SELECT COUNT(*) t FROM productos WHERE activo=1"); prods=c.fetchone()["t"]
            c.execute("SELECT COUNT(*) t FROM pedidos"); peds=c.fetchone()["t"]
            c.execute("SELECT COUNT(*) t FROM mensajes WHERE leido=0"); msgs=c.fetchone()["t"]
            c.execute("SELECT COUNT(*) t FROM suscriptores WHERE activo=1"); subs=c.fetchone()["t"]
            c.execute("SELECT COALESCE(SUM(total),0) t FROM pedidos WHERE estado NOT IN ('cancelado','pendiente')"); ventas=c.fetchone()["t"]
            c.execute("SELECT COUNT(*) t FROM usuarios WHERE rol='cliente'"); clientes=c.fetchone()["t"]
            # ventas por mes (últimos 6 meses)
            c.execute("""SELECT DATE_FORMAT(created_at,'%Y-%m') mes, SUM(total) total, COUNT(*) cantidad
                         FROM pedidos WHERE estado NOT IN ('cancelado','pendiente') AND created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
                         GROUP BY mes ORDER BY mes""")
            ventas_mes = c.fetchall()
            # productos más vendidos
            c.execute("""SELECT pi.nombre_producto, SUM(pi.cantidad) total_vendido
                         FROM pedido_items pi JOIN pedidos p ON pi.pedido_id=p.id
                         WHERE p.estado NOT IN ('cancelado','pendiente')
                         GROUP BY pi.nombre_producto ORDER BY total_vendido DESC LIMIT 5""")
            top_productos = c.fetchall()
        return {"productos":prods,"pedidos":peds,"mensajes_sin_leer":msgs,"suscriptores":subs,
                "ventas_total":float(ventas),"clientes":clientes,
                "ventas_mes":ventas_mes,"top_productos":top_productos}
    finally: conn.close()

@adm.get("/mensajes")
def mensajes(admin=Depends(require_admin)):
    conn = get_connection()
    try:
        with conn.cursor() as c:
            c.execute("SELECT * FROM mensajes ORDER BY created_at DESC"); return c.fetchall()
    finally: conn.close()

@adm.put("/mensajes/{msg_id}/leido")
def marcar_leido(msg_id:int, admin=Depends(require_admin)):
    conn = get_connection()
    try:
        with conn.cursor() as c:
            c.execute("UPDATE mensajes SET leido=1 WHERE id=%s",(msg_id,)); conn.commit()
        return {"success":True}
    finally: conn.close()

@adm.get("/suscriptores")
def suscriptores(admin=Depends(require_admin)):
    conn = get_connection()
    try:
        with conn.cursor() as c:
            c.execute("SELECT * FROM suscriptores WHERE activo=1 ORDER BY created_at DESC"); return c.fetchall()
    finally: conn.close()
