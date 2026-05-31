from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from app.database import get_connection
from app.auth import get_current_user

router = APIRouter(tags=["Reseñas y Favoritos"])

class ResenaIn(BaseModel):
    calificacion: int
    comentario:   Optional[str]=None

# ── RESEÑAS ───────────────────────────────────────
@router.post("/productos/{producto_id}/resenas")
def crear_resena(producto_id:int, d: ResenaIn, user=Depends(get_current_user)):
    if not 1 <= d.calificacion <= 5: raise HTTPException(400,"Calificación 1-5")
    conn = get_connection()
    try:
        with conn.cursor() as c:
            c.execute("SELECT id FROM resenas WHERE usuario_id=%s AND producto_id=%s",(user["id"],producto_id))
            if c.fetchone():
                c.execute("UPDATE resenas SET calificacion=%s,comentario=%s WHERE usuario_id=%s AND producto_id=%s",
                          (d.calificacion,d.comentario,user["id"],producto_id))
            else:
                c.execute("INSERT INTO resenas (producto_id,usuario_id,calificacion,comentario) VALUES (%s,%s,%s,%s)",
                          (producto_id,user["id"],d.calificacion,d.comentario))
            conn.commit()
        return {"success":True}
    finally: conn.close()

# ── FAVORITOS ─────────────────────────────────────
@router.get("/favoritos")
def mis_favoritos(user=Depends(get_current_user)):
    conn = get_connection()
    try:
        with conn.cursor() as c:
            c.execute("""SELECT p.*,c.nombre AS categoria_nombre FROM favoritos f
                         JOIN productos p ON f.producto_id=p.id
                         JOIN categorias c ON p.categoria_id=c.id
                         WHERE f.usuario_id=%s AND p.activo=1""",(user["id"],))
            return c.fetchall()
    finally: conn.close()

@router.post("/favoritos/{producto_id}")
def toggle_favorito(producto_id:int, user=Depends(get_current_user)):
    conn = get_connection()
    try:
        with conn.cursor() as c:
            c.execute("SELECT id FROM favoritos WHERE usuario_id=%s AND producto_id=%s",(user["id"],producto_id))
            if c.fetchone():
                c.execute("DELETE FROM favoritos WHERE usuario_id=%s AND producto_id=%s",(user["id"],producto_id))
                conn.commit()
                return {"favorito":False}
            else:
                c.execute("INSERT INTO favoritos (usuario_id,producto_id) VALUES (%s,%s)",(user["id"],producto_id))
                conn.commit()
                return {"favorito":True}
    finally: conn.close()

@router.get("/favoritos/ids")
def favoritos_ids(user=Depends(get_current_user)):
    conn = get_connection()
    try:
        with conn.cursor() as c:
            c.execute("SELECT producto_id FROM favoritos WHERE usuario_id=%s",(user["id"],))
            return [r["producto_id"] for r in c.fetchall()]
    finally: conn.close()
