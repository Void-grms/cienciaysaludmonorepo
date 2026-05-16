import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, UserPlus, ShoppingCart, Trash } from 'lucide-react';

export default function NuevaAtencion() {
  const navigate = useNavigate();
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [searchPac, setSearchPac] = useState('');
  const [selectedPaciente, setSelectedPaciente] = useState<any>(null);

  const [catalogo, setCatalogo] = useState<any[]>([]);
  const [carrito, setCarrito] = useState<any[]>([]);

  useEffect(() => {
    if (searchPac.length > 2) {
      fetch(`/api/v1/pacientes/buscar?q=${searchPac}`, { headers: { 'Authorization': 'Bearer fake' } })
        .then(res => res.json())
        .then(data => setPacientes(data.data || []));
    }
  }, [searchPac]);

  useEffect(() => {
    // Cargar paquetes (y podríamos cargar pruebas también) para el catálogo
    fetch('/api/v1/paquetes', { headers: { 'Authorization': 'Bearer fake' } })
      .then(res => res.json())
      .then(data => {
        const items = (data.data || []).map((p: any) => ({ ...p, tipoItem: 'PAQUETE' }));
        setCatalogo(items);
      });
  }, []);

  const total = carrito.reduce((sum, item) => sum + Number(item.precio_total), 0);

  const generarOrden = async () => {
    if (!selectedPaciente) return alert('Seleccione un paciente');
    if (carrito.length === 0) return alert('El carrito está vacío');

    const payload = {
      id_paciente: selectedPaciente.id,
      items: carrito.map(i => ({ id_producto: i.id, tipo: i.tipoItem, precio: Number(i.precio_total) })),
      descuento: 0,
    };

    const res = await fetch('/api/v1/atenciones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer fake' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      alert('Orden generada con éxito. Pase a toma de muestras.');
      navigate('/recepcion');
    } else {
      alert('Error al generar la orden');
    }
  };

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Columna Izquierda: Selección */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* Paciente */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-bold text-slate-900 mb-4">1. Identificar Paciente</h2>
          {!selectedPaciente ? (
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-3 text-slate-400" />
              <input 
                type="text" placeholder="Buscar por DNI o Apellidos..."
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                value={searchPac} onChange={e => setSearchPac(e.target.value)}
              />
              {pacientes.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg">
                  {pacientes.map(p => (
                    <div key={p.id} onClick={() => { setSelectedPaciente(p); setPacientes([]); }} className="p-3 hover:bg-slate-50 cursor-pointer border-b last:border-0">
                      <p className="font-semibold text-slate-800">{p.nombres} {p.apellidos}</p>
                      <p className="text-sm text-slate-500">DNI: {p.nro_doc}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex justify-between items-center p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <div>
                <p className="font-bold text-primary">{selectedPaciente.nombres} {selectedPaciente.apellidos}</p>
                <p className="text-sm text-slate-600">DNI: {selectedPaciente.nro_doc}</p>
              </div>
              <button onClick={() => setSelectedPaciente(null)} className="text-sm text-red-500 hover:underline">Cambiar</button>
            </div>
          )}
        </div>

        {/* Catálogo */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-bold text-slate-900 mb-4">2. Seleccionar Exámenes</h2>
          <div className="grid grid-cols-2 gap-4">
            {catalogo.map(item => (
              <div key={item.id} onClick={() => setCarrito([...carrito, item])} className="cursor-pointer border border-slate-200 rounded-lg p-4 hover:border-primary hover:shadow-md transition-all">
                <p className="font-bold text-slate-800">{item.nombre}</p>
                <p className="text-sm text-slate-500 mb-2">{item.descripcion}</p>
                <p className="text-lg font-black text-primary">S/. {Number(item.precio_total).toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Columna Derecha: Carrito */}
      <div className="lg:col-span-1">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 sticky top-6 flex flex-col h-[calc(100vh-8rem)]">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
            <ShoppingCart className="w-5 h-5 mr-2" /> Resumen de Orden
          </h2>
          
          <div className="flex-1 overflow-y-auto space-y-3 pr-2">
            {carrito.length === 0 ? (
              <p className="text-slate-500 text-sm text-center mt-10">No hay exámenes seleccionados.</p>
            ) : (
              carrito.map((item, i) => (
                <div key={i} className="flex justify-between items-center p-3 border border-slate-100 rounded-lg bg-slate-50">
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">{item.nombre}</p>
                    <p className="text-xs text-slate-500">S/. {Number(item.precio_total).toFixed(2)}</p>
                  </div>
                  <button onClick={() => setCarrito(carrito.filter((_, index) => index !== i))} className="text-red-400 hover:text-red-600">
                    <Trash className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-200">
            <div className="flex justify-between items-center mb-4">
              <span className="text-slate-600">Total a Pagar:</span>
              <span className="text-2xl font-black text-slate-900">S/. {total.toFixed(2)}</span>
            </div>
            <button 
              onClick={generarOrden}
              disabled={!selectedPaciente || carrito.length === 0}
              className="w-full py-3 bg-primary text-white rounded-lg font-bold hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              Generar Orden
            </button>
          </div>

        </div>
      </div>

    </div>
  );
}
