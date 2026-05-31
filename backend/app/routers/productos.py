from fastapi import APIRouter, HTTPException, Query, UploadFile, File, Form, Depends
from typing import Optional
from app.database import get_connection
from app.auth import require_admin, get_current_user_optional
from PIL import Image
import os, uuid, shutil

router = APIRouter(prefix="/productos", tags=["Productos"])
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

def save_image(file: UploadFile) -> str:
    ext = file.filename.rsplit(".",1)[-1].lower()
    if ext not in ("jpg","jpeg","png","webp"): raise HTTPException(400,"Formato no soportado")
    fname = f"{uuid.uuid4().hex}.webp"
    path  = os.path.join(UPLOAD_DIR, fname)
    img   = Image.open(file.file).convert("RGB")
    img.thumbnail((800,800))
    img.save(path, "WEBP", quality=85)
    return f"/uploads/{fname}"

# ── LISTAR ────────────────────────────────────────
@router.get("/")
def listar(
    categoria: Optional[str] = Query(None),
    buscar:    Optional[str] = Query(None),
    destacados:Optional[bool]= Query(None),
    orden:     Optional[str] = Query("nuevo"),  # nuevo|precio_asc|precio_desc|nombre
    page:      int = Query(1, ge=1),
    limit:     int = Query(12, ge=1, le=50),
):
    conn = get_connection()
    try:
        with conn.cursor() as c:
            sql    = "SELECT p.*, c.nombre AS categoria_nombre FROM productos p LEFT JOIN categorias c ON p.categoria_id=c.id WHERE p.activo=1"
            params = []
            if categoria: sql += " AND c.slug=%s"; params.append(categoria)
            if destacados: sql += " AND p.destacado=1"
            if buscar:
                sql += " AND (p.nombre LIKE %s OR p.descripcion_corta LIKE %s OR p.descripcion LIKE %s)"
                params += [f"%{buscar}%"]*3
            order_map = {"nuevo":"p.id DESC","precio_asc":"p.precio ASC","precio_desc":"p.precio DESC","nombre":"p.nombre ASC"}
            sql += f" ORDER BY {order_map.get(orden,'p.id DESC')}"
            # total count
            c.execute(sql.replace("SELECT p.*, c.nombre AS categoria_nombre","SELECT COUNT(*) AS total"), params)
            total = c.fetchone()["total"]
            # paginated
            sql += " LIMIT %s OFFSET %s"
            params += [limit, (page-1)*limit]
            c.execute(sql, params)
            items = c.fetchall()
        return {"items": items, "total": total, "pages": (total+limit-1)//limit, "page": page}
    finally: conn.close()

# ── DETALLE ───────────────────────────────────────
@router.get("/{producto_id}")
def detalle(producto_id: int):
    conn = get_connection()
    try:
        with conn.cursor() as c:
            c.execute("SELECT p.*,c.nombre AS categoria_nombre FROM productos p LEFT JOIN categorias c ON p.categoria_id=c.id WHERE p.id=%s AND p.activo=1",(producto_id,))
            p = c.fetchone()
            if not p: raise HTTPException(404,"Producto no encontrado")
            # reseñas
            c.execute("""SELECT r.*,u.nombre AS usuario_nombre,u.avatar AS usuario_avatar
                         FROM resenas r JOIN usuarios u ON r.usuario_id=u.id
                         WHERE r.producto_id=%s AND r.activo=1 ORDER BY r.created_at DESC""",(producto_id,))
            p["resenas"] = c.fetchall()
            c.execute("SELECT AVG(calificacion) AS promedio, COUNT(*) AS total FROM resenas WHERE producto_id=%s AND activo=1",(producto_id,))
            stats = c.fetchone()
            p["calificacion_promedio"] = round(float(stats["promedio"] or 0),1)
            p["total_resenas"] = stats["total"]
        return p
    finally: conn.close()

# ── CREAR ─────────────────────────────────────────
@router.post("/")
async def crear(
    nombre:           str  = Form(...),
    categoria_id:     int  = Form(...),
    descripcion_corta:str  = Form(""),
    descripcion:      str  = Form(""),
    precio:           float= Form(...),
    precio_oferta:    Optional[float]= Form(None),
    stock:            int  = Form(0),
    volumen:          str  = Form(""),
    notas_olfativas:  str  = Form(""),
    destacado:        int  = Form(0),
    imagen:           Optional[UploadFile]=File(None),
    admin=Depends(require_admin),
):
    img_url = save_image(imagen) if imagen and imagen.filename else None
    slug = nombre.lower().replace(" ","-")
    conn = get_connection()
    try:
        with conn.cursor() as c:
            # slug único
            base = slug; i = 1
            while True:
                c.execute("SELECT id FROM productos WHERE slug=%s",(slug,))
                if not c.fetchone(): break
                slug = f"{base}-{i}"; i+=1
            c.execute("""INSERT INTO productos
                (categoria_id,nombre,slug,descripcion_corta,descripcion,precio,precio_oferta,
                 stock,imagen,notas_olfativas,volumen,destacado)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
                (categoria_id,nombre,slug,descripcion_corta,descripcion,precio,precio_oferta,
                 stock,img_url,notas_olfativas,volumen,destacado))
            conn.commit()
            return {"success":True,"id":c.lastrowid}
    finally: conn.close()

# ── EDITAR ────────────────────────────────────────
@router.put("/{producto_id}")
async def editar(
    producto_id:      int,
    nombre:           str  = Form(...),
    categoria_id:     int  = Form(...),
    descripcion_corta:str  = Form(""),
    descripcion:      str  = Form(""),
    precio:           float= Form(...),
    precio_oferta:    Optional[float]= Form(None),
    stock:            int  = Form(0),
    volumen:          str  = Form(""),
    notas_olfativas:  str  = Form(""),
    destacado:        int  = Form(0),
    activo:           int  = Form(1),
    imagen:           Optional[UploadFile]=File(None),
    admin=Depends(require_admin),
):
    conn = get_connection()
    try:
        with conn.cursor() as c:
            c.execute("SELECT * FROM productos WHERE id=%s",(producto_id,))
            prod = c.fetchone()
            if not prod: raise HTTPException(404,"Producto no encontrado")
            img_url = prod["imagen"]
            if imagen and imagen.filename:
                # borrar imagen vieja
                if img_url:
                    old = img_url.lstrip("/")
                    if os.path.exists(old): os.remove(old)
                img_url = save_image(imagen)
            c.execute("""UPDATE productos SET
                categoria_id=%s,nombre=%s,descripcion_corta=%s,descripcion=%s,
                precio=%s,precio_oferta=%s,stock=%s,imagen=%s,
                notas_olfativas=%s,volumen=%s,destacado=%s,activo=%s
                WHERE id=%s""",
                (categoria_id,nombre,descripcion_corta,descripcion,precio,precio_oferta,
                 stock,img_url,notas_olfativas,volumen,destacado,activo,producto_id))
            conn.commit()
        return {"success":True}
    finally: conn.close()

# ── ELIMINAR (soft) ───────────────────────────────
@router.delete("/{producto_id}")
def eliminar(producto_id: int, admin=Depends(require_admin)):
    conn = get_connection()
    try:
        with conn.cursor() as c:
            c.execute("UPDATE productos SET activo=0 WHERE id=%s",(producto_id,))
            conn.commit()
        return {"success":True}
    finally: conn.close()
