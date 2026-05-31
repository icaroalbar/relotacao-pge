from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.relatorios import (
    gerar_mapa_xlsx,
    gerar_lotacoes_xlsx,
    gerar_procuradores_xlsx,
    gerar_areas_xlsx,
    gerar_mapa_pdf,
    gerar_ato_pdf,
)

router = APIRouter()

_XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
_PDF  = "application/pdf"


def _stream(buf, media_type: str, filename: str) -> StreamingResponse:
    return StreamingResponse(
        buf,
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


# ── por ciclo ─────────────────────────────────────────────────────────────────

@router.get("/{ciclo_id}/mapa.xlsx")
def mapa_xlsx(ciclo_id: str, db: Session = Depends(get_db)):
    try:
        buf = gerar_mapa_xlsx(ciclo_id, db)
    except ValueError as e:
        raise HTTPException(404, str(e))
    return _stream(buf, _XLSX, f"mapa_{ciclo_id}.xlsx")


@router.get("/{ciclo_id}/lotacoes.xlsx")
def lotacoes_xlsx(ciclo_id: str, db: Session = Depends(get_db)):
    try:
        buf = gerar_lotacoes_xlsx(ciclo_id, db)
    except ValueError as e:
        raise HTTPException(404, str(e))
    return _stream(buf, _XLSX, f"lotacoes_{ciclo_id}.xlsx")


@router.get("/{ciclo_id}/mapa.pdf")
def mapa_pdf(ciclo_id: str, db: Session = Depends(get_db)):
    try:
        buf = gerar_mapa_pdf(ciclo_id, db)
    except ValueError as e:
        raise HTTPException(404, str(e))
    return _stream(buf, _PDF, f"mapa_{ciclo_id}.pdf")


@router.get("/{ciclo_id}/ato.pdf")
def ato_pdf(ciclo_id: str, db: Session = Depends(get_db)):
    try:
        buf = gerar_ato_pdf(ciclo_id, db)
    except ValueError as e:
        raise HTTPException(404, str(e))
    return _stream(buf, _PDF, f"ato_{ciclo_id}.pdf")


# ── gerais ────────────────────────────────────────────────────────────────────

@router.get("/procuradores.xlsx")
def procuradores_xlsx(db: Session = Depends(get_db)):
    buf = gerar_procuradores_xlsx(db)
    return _stream(buf, _XLSX, "procuradores.xlsx")


@router.get("/areas.xlsx")
def areas_xlsx(db: Session = Depends(get_db)):
    buf = gerar_areas_xlsx(db)
    return _stream(buf, _XLSX, "areas.xlsx")
