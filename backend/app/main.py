from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import areas, procuradores, vagas, ciclos, importacao, relatorios

app = FastAPI(title="Relotação PGE-RJ", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(areas.router, prefix="/areas", tags=["areas"])
app.include_router(procuradores.router, prefix="/procuradores", tags=["procuradores"])
app.include_router(vagas.router, prefix="/vagas", tags=["vagas"])
app.include_router(ciclos.router, prefix="/ciclos", tags=["ciclos"])
app.include_router(importacao.router, prefix="/importacao", tags=["importacao"])
app.include_router(relatorios.router, prefix="/relatorios", tags=["relatorios"])


@app.get("/health")
def health():
    return {"status": "ok"}
