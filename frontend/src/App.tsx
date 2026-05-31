import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Areas from './pages/Areas'
import Procuradores from './pages/Procuradores'
import MapaRelotacao from './pages/MapaRelotacao'
import Nomeacoes from './pages/Nomeacoes'
import EscolhaChefes from './pages/EscolhaChefes'
import Designacoes from './pages/Designacoes'
import AlocarAcervo from './pages/AlocarAcervo'
import EncerrarCiclo from './pages/EncerrarCiclo'
import HistoricoCiclos from './pages/HistoricoCiclos'
import Relatorios from './pages/Relatorios'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/areas" element={<Areas />} />
        <Route path="/procuradores" element={<Procuradores />} />
        <Route path="/mapa" element={<MapaRelotacao />} />
        <Route path="/nomeacoes" element={<Nomeacoes />} />
        <Route path="/escolhas" element={<EscolhaChefes />} />
        <Route path="/designacoes" element={<Designacoes />} />
        <Route path="/alocar" element={<AlocarAcervo />} />
        <Route path="/encerrar" element={<EncerrarCiclo />} />
        <Route path="/historico" element={<HistoricoCiclos />} />
        <Route path="/relatorios" element={<Relatorios />} />
      </Routes>
    </Layout>
  )
}
