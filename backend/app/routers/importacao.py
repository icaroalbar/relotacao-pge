from __future__ import annotations

import tempfile
import os
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.area import Area
from app.models.procurador import Procurador
from app.models.preferencia import Preferencia
from app.models.vaga import Vaga
from app.services.importacao import ler_planilha, ImportResult

router = APIRouter()


@router.post("/planilha", status_code=201)
def importar_planilha(
    ciclo_id: str,
    arquivo: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """
    Importa dados de uma planilha .xlsx.
    Upsert: cria ou atualiza áreas e procuradores; substitui preferências.
    Vincula vagas manuais ao ciclo informado.
    """
    if not arquivo.filename or not arquivo.filename.endswith(".xlsx"):
        raise HTTPException(400, "Arquivo deve ser .xlsx")

    with tempfile.NamedTemporaryFile(delete=False, suffix=".xlsx") as tmp:
        tmp.write(arquivo.file.read())
        tmp_path = tmp.name

    try:
        resultado: ImportResult = ler_planilha(tmp_path)
    finally:
        os.unlink(tmp_path)

    stats: dict = {
        "areas_criadas": 0,
        "areas_atualizadas": 0,
        "procuradores_criados": 0,
        "procuradores_atualizados": 0,
        "preferencias": 0,
        "vagas_manuais": 0,
        "erros": resultado.erros,
    }

    # ── Áreas ──────────────────────────────────────────────────────────────────
    for a in resultado.areas:
        existente = db.get(Area, a.codigo)
        if existente:
            existente.nome = a.nome
            existente.tipo = a.tipo
            existente.vagas_pg = a.vagas_pg
            existente.vagas_nomeacao = a.vagas_nomeacao
            existente.vagas_escolha = a.vagas_escolha
            existente.vagas_designacao = a.vagas_designacao
            existente.vagas_acervo = a.vagas_acervo
            stats["areas_atualizadas"] += 1
        else:
            db.add(Area(
                codigo=a.codigo, nome=a.nome, tipo=a.tipo,
                vagas_pg=a.vagas_pg, vagas_nomeacao=a.vagas_nomeacao,
                vagas_escolha=a.vagas_escolha, vagas_designacao=a.vagas_designacao,
                vagas_acervo=a.vagas_acervo,
            ))
            stats["areas_criadas"] += 1

    db.flush()

    # ── Procuradores ────────────────────────────────────────────────────────────
    antig_to_id: dict = {}
    for p in resultado.procuradores:
        existente = db.query(Procurador).filter(Procurador.antiguidade == p.antiguidade).first()
        if existente:
            existente.nome = p.nome
            existente.status = p.status
            existente.lotacao_atual_codigo = p.lotacao_atual_codigo
            existente.ativo = p.ativo
            db.flush()
            antig_to_id[p.antiguidade] = existente.id
            stats["procuradores_atualizados"] += 1
        else:
            novo = Procurador(
                nome=p.nome, antiguidade=p.antiguidade, status=p.status,
                lotacao_atual_codigo=p.lotacao_atual_codigo, ativo=p.ativo,
            )
            db.add(novo)
            db.flush()
            antig_to_id[p.antiguidade] = novo.id
            stats["procuradores_criados"] += 1

    # ── Preferências ────────────────────────────────────────────────────────────
    prefs_por_proc: dict = {}
    for pref in resultado.preferencias:
        proc_id = antig_to_id.get(pref.antiguidade)
        if proc_id:
            prefs_por_proc.setdefault(proc_id, []).append(pref)

    for proc_id, prefs in prefs_por_proc.items():
        db.query(Preferencia).filter(Preferencia.procurador_id == proc_id).delete()
        for pref in prefs:
            db.add(Preferencia(procurador_id=proc_id, area_codigo=pref.area_codigo, ordem=pref.ordem))
        stats["preferencias"] += len(prefs)

    # ── Vagas manuais ───────────────────────────────────────────────────────────
    for vm in resultado.vagas_manuais:
        ocupante_id = None
        if vm.procurador_antiguidade is not None:
            ocupante_id = antig_to_id.get(vm.procurador_antiguidade)

        existente = (
            db.query(Vaga)
            .filter(
                Vaga.area_codigo == vm.area_codigo,
                Vaga.numero == vm.numero,
                Vaga.tipo == vm.tipo,
            )
            .first()
        )
        if existente:
            existente.cargo = vm.cargo
            existente.ocupante_id = ocupante_id
            existente.origem = "MANUAL"
        else:
            db.add(Vaga(
                area_codigo=vm.area_codigo,
                numero=vm.numero,
                tipo=vm.tipo,
                cargo=vm.cargo,
                ocupante_id=ocupante_id,
                origem="MANUAL",
                ciclo_id=ciclo_id,
            ))
        stats["vagas_manuais"] += 1

    db.commit()
    return stats
