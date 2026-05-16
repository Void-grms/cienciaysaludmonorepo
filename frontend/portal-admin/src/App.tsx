import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './components/Layout/AdminLayout';
import Dashboard from './pages/Dashboard/Dashboard';
import ListadoPacientes from './pages/Pacientes/ListadoPacientes';
import FormPaciente from './pages/Pacientes/FormPaciente';
import ListadoPerfiles from './pages/Catalogo/ListadoPerfiles';
import FormPerfil from './pages/Catalogo/FormPerfil';
import ListadoAtenciones from './pages/Recepcion/ListadoAtenciones';
import NuevaAtencion from './pages/Recepcion/NuevaAtencion';
import TomaMuestras from './pages/Laboratorio/TomaMuestras';
import IngresoResultados from './pages/Laboratorio/IngresoResultados';

import LoginScreen from './LoginScreen';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginScreen />} />
        
        {/* Rutas Protegidas */}
        <Route path="/" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="pacientes" element={<ListadoPacientes />} />
          <Route path="pacientes/nuevo" element={<FormPaciente />} />
          <Route path="referencias" element={<div className="p-4">Listado de Referencias (Próximamente)</div>} />
          <Route path="catalogo" element={<ListadoPerfiles />} />
          <Route path="catalogo/nuevo" element={<FormPerfil />} />
          <Route path="recepcion" element={<ListadoAtenciones />} />
          <Route path="recepcion/nueva" element={<NuevaAtencion />} />
          <Route path="laboratorio/muestras" element={<TomaMuestras />} />
          <Route path="laboratorio/resultados" element={<IngresoResultados />} />
        </Route>
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
