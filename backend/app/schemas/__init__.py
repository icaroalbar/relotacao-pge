from app.schemas.area import AreaCreate, AreaUpdate, AreaOut
from app.schemas.procurador import ProcuradorCreate, ProcuradorUpdate, ProcuradorOut, ProcuradorDetalhe
from app.schemas.vaga import VagaCreate, VagaUpdate, VagaOut
from app.schemas.ciclo import CicloCreate, CicloUpdate, CicloOut
from app.schemas.preferencia import PreferenciaCreate, PreferenciaOut
from app.schemas.lotacao import LotacaoOut

__all__ = [
    "AreaCreate", "AreaUpdate", "AreaOut",
    "ProcuradorCreate", "ProcuradorUpdate", "ProcuradorOut", "ProcuradorDetalhe",
    "VagaCreate", "VagaUpdate", "VagaOut",
    "CicloCreate", "CicloUpdate", "CicloOut",
    "PreferenciaCreate", "PreferenciaOut",
    "LotacaoOut",
]
