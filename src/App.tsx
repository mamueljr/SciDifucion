/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  User, 
  Lock, 
  Search, 
  PlusCircle, 
  LogOut, 
  Database, 
  ShieldCheck, 
  FileText,
  Video,
  Mic,
  Layout
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---
interface UserInfo {
  id: number;
  nombre: string;
  email: string;
  role: string;
}

interface ContentItem {
  id: number;
  titulo: string;
  cuerpo: string;
  autor: string;
  tipo: string;
  created_at: string;
  archivo_nombre?: string | null;
  archivo_url?: string | null;
  archivo_mime_type?: string | null;
}

const API_PREFIX = 'api';

export default function App() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [view, setView] = useState<'home' | 'login' | 'register' | 'admin' | 'create'>('home');
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [role, setRole] = useState('publico');
  
  // Content form
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [typeId, setTypeId] = useState(1);
  const [status, setStatus] = useState<'publicado' | 'borrador'>('publicado');
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    checkAuth();
    fetchContent();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch(`${API_PREFIX}/auth/me.php`);
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      }
    } catch (e) {
      console.error("Auth check failed", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchContent = async () => {
    try {
      const res = await fetch(`${API_PREFIX}/contenido.php`);
      if (res.ok) {
        const data = await res.json();
        setContent(data);
      }
    } catch (e) {
      console.error("Fetch content failed", e);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`${API_PREFIX}/auth/login.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (res.ok) {
      const data = await res.json();
      setUser(data.user);
      setView('home');
      fetchContent();
    } else {
      alert("Credenciales inválidas");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`${API_PREFIX}/auth/register.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, email, password, role })
    });
    if (res.ok) {
      alert("Registrado correctamente. Ahora puedes iniciar sesión.");
      setView('login');
    } else {
      alert("Error al registrar");
    }
  };

  const handleLogout = async () => {
    await fetch(`${API_PREFIX}/auth/logout.php`, { method: 'POST' });
    setUser(null);
    setView('home');
  };

  const handleCreateContent = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('titulo', title);
    formData.append('cuerpo', body);
    formData.append('tipo_id', String(typeId));
    formData.append('estado', status);
    if (file) {
      formData.append('archivo', file);
    }

    const res = await fetch(`${API_PREFIX}/contenido.php`, {
      method: 'POST',
      body: formData
    });
    if (res.ok) {
      alert("Contenido publicado");
      setTitle('');
      setBody('');
      setTypeId(1);
      setStatus('publicado');
      setFile(null);
      setView('home');
      fetchContent();
    } else {
      const err = await res.json();
      alert(err.error || "Error al publicar");
    }
  };

  if (loading) return (
    <div className="h-screen bg-[#0A0A0B] flex flex-col items-center justify-center font-mono text-sky-500 gap-4">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-sky-500 animate-pulse"></div>
        <span className="uppercase tracking-[0.3em] text-xs">Iniciando Sistema</span>
      </div>
      <div className="w-48 h-1 bg-white/5 rounded-full overflow-hidden">
        <motion.div 
          initial={{ x: "-100%" }}
          animate={{ x: "100%" }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
          className="w-1/2 h-full bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.8)]"
        />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0A0A0B] font-sans text-slate-300">
      {/* Header */}
      <header className="bg-[#111114] border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('home')}>
            <div className="bg-sky-500 p-1.5 rounded-lg shadow-lg shadow-sky-500/20">
              <BookOpen className="text-white size-6" />
            </div>
            <div>
              <span className="text-sm font-bold tracking-widest text-white uppercase block leading-none">SciDifusión</span>
              <span className="text-[9px] text-sky-400 font-mono uppercase tracking-tighter">Plataforma SciDifusión v1.0.4</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-[11px] font-mono uppercase tracking-wider text-slate-500">
            <button onClick={() => setView('home')} className="hover:text-sky-400 transition-colors cursor-pointer">Repositorio</button>
            <button className="hover:text-sky-400 transition-colors cursor-pointer">Sala Virtual</button>
            <button className="hover:text-sky-400 transition-colors cursor-pointer">Directorio</button>
          </nav>

          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-bold text-white uppercase tracking-tight">{user.nombre}</p>
                  <p className="text-[9px] uppercase tracking-widest text-sky-400 font-mono font-bold">{user.role}</p>
                </div>
                <button 
                  onClick={handleLogout}
                  className="p-2 hover:bg-white/5 rounded-lg transition-colors text-slate-500 group border border-white/5"
                  title="Cerrar sesión"
                >
                  <LogOut size={18} className="group-hover:text-red-400" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setView('login')}
                  className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-white transition-colors"
                >
                  Login
                </button>
                <button 
                  onClick={() => setView('register')}
                  className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest bg-sky-500/10 text-sky-400 rounded border border-sky-500/30 hover:bg-sky-500/20 transition-all"
                >
                  Registro
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {view === 'home' && (
            <motion.div 
              key="home"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-white tracking-tight">Repositorio Científico</h1>
                  <p className="text-slate-500 mt-1 max-w-xl">Acceso centralizado a hallazgos académicos y documentación técnica verificada por la arquitectura de red SciDifusión.</p>
                </div>
                {(user?.role === 'admin' || user?.role === 'investigador') && (
                  <button 
                    onClick={() => setView('create')}
                    className="flex items-center gap-2 px-6 py-3 bg-sky-500 text-white rounded font-bold uppercase tracking-widest text-[10px] hover:bg-sky-400 transition-all shadow-lg shadow-sky-500/20 w-fit"
                  >
                    <PlusCircle size={16} />
                    Nueva Publicación
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {content.length > 0 ? content.map(item => (
                  <motion.div 
                    layoutId={`content-${item.id}`}
                    key={item.id}
                    className="bg-[#111114] p-8 rounded border border-white/10 hover:border-sky-500/50 transition-all group flex flex-col h-full relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 w-1 h-full bg-sky-500/30 group-hover:bg-sky-500 transition-colors"></div>
                    <div className="flex items-center justify-between mb-6">
                      <span className="px-3 py-1 bg-white/5 text-sky-400 text-[9px] font-mono font-bold uppercase rounded border border-white/10 tracking-widest">
                        {item.tipo}
                      </span>
                      <time className="text-[9px] text-slate-500 font-mono uppercase tracking-tighter">
                        FECHA: {new Date(item.created_at).toISOString().split('T')[0]}
                      </time>
                    </div>
                    <h3 className="text-lg font-bold text-white group-hover:text-sky-400 transition-colors mb-4 tracking-tight leading-tight">
                      {item.titulo}
                    </h3>
                    <p className="text-slate-400 text-sm leading-relaxed mb-8 flex-grow">
                      {item.cuerpo}
                    </p>
                    {item.archivo_url && (
                      <a
                        href={item.archivo_url}
                        target="_blank"
                        rel="noreferrer"
                        className="mb-6 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-sky-400 hover:text-white transition-colors"
                      >
                        <FileText size={14} />
                        {item.archivo_nombre || 'Ver adjunto'}
                      </a>
                    )}
                    <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="size-8 bg-white/5 rounded flex items-center justify-center text-slate-500 border border-white/10">
                          <User size={14} />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-300 leading-none uppercase tracking-wide">{item.autor}</p>
                          <p className="text-[8px] text-slate-500 font-mono uppercase mt-1">Autor Verificado</p>
                        </div>
                      </div>
                      <button className="text-[10px] font-bold text-sky-400 uppercase tracking-widest hover:text-white transition-colors">Detalles</button>
                    </div>
                  </motion.div>
                )) : (
                  <div className="col-span-full py-32 bg-[#0D0D10] border border-dashed border-white/10 rounded flex flex-col items-center justify-center text-slate-600">
                    <Database size={48} className="mb-4 opacity-20" />
                    <p className="font-mono text-xs uppercase tracking-widest text-slate-500">No se encontraron resultados</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {(view === 'login' || view === 'register') && (
            <motion.div 
              key="auth"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-md mx-auto mt-12"
            >
              <div className="bg-[#111114] p-10 rounded border border-white/10 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-sky-500 to-indigo-500"></div>
                <div className="flex justify-center mb-8">
                  <div className="bg-sky-500/10 p-5 rounded-2xl border border-sky-500/30">
                    {view === 'login' ? <Lock className="text-sky-400 size-10" /> : <User className="text-sky-400 size-10" />}
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-center mb-2 text-white">
                  {view === 'login' ? 'Inicio de Sesión' : 'Crear Cuenta'}
                </h2>
                <p className="text-center text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-10">Acceso Seguro al Sistema</p>
                
                <form onSubmit={view === 'login' ? handleLogin : handleRegister} className="space-y-6">
                  {view === 'register' && (
                    <>
                      <div className="space-y-2">
                        <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest ml-1">Nombre Completo</label>
                        <input 
                          type="text" 
                          required 
                          value={nombre}
                          onChange={(e) => setNombre(e.target.value)}
                          className="w-full px-4 py-3 bg-[#0D0D10] border border-white/10 rounded text-white focus:border-sky-500 outline-none transition-all font-mono text-xs"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest ml-1">Rol Asignado</label>
                        <select 
                          value={role}
                          onChange={(e) => setRole(e.target.value)}
                          className="w-full px-4 py-3 bg-[#0D0D10] border border-white/10 rounded text-white focus:border-sky-500 outline-none transition-all font-mono text-xs appearance-none"
                        >
                          <option value="publico">Público General</option>
                          <option value="investigador">Investigador</option>
                        </select>
                      </div>
                    </>
                  )}
                  <div className="space-y-2">
                    <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest ml-1">Correo Electrónico</label>
                    <input 
                      type="email" 
                      required 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 bg-[#0D0D10] border border-white/10 rounded text-white focus:border-sky-500 outline-none transition-all font-mono text-xs"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest ml-1">Contraseña</label>
                    <input 
                      type="password" 
                      required 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-[#0D0D10] border border-white/10 rounded text-white focus:border-sky-500 outline-none transition-all font-mono text-xs"
                    />
                  </div>
                  <button 
                    type="submit"
                    className="w-full py-4 bg-sky-600 text-white font-bold uppercase tracking-widest text-xs rounded hover:bg-sky-500 transition-all shadow-lg shadow-sky-600/20 active:scale-[0.99]"
                  >
                    {view === 'login' ? 'Ingresar' : 'Registrarse'}
                  </button>
                </form>
                
                <p className="text-center mt-8 text-[11px] font-mono text-slate-500 uppercase">
                  {view === 'login' ? (
                    <>¿No tienes cuenta? <button onClick={() => setView('register')} className="text-sky-400 font-bold hover:underline">Crear nueva cuenta</button></>
                  ) : (
                    <>¿Ya tienes cuenta? <button onClick={() => setView('login')} className="text-sky-400 font-bold hover:underline">Volver al Login</button></>
                  )}
                </p>
              </div>
            </motion.div>
          )}

          {view === 'create' && (
            <motion.div 
              key="create"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="max-w-4xl mx-auto"
            >
              <div className="bg-[#111114] p-10 rounded border border-white/10 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-sky-500"></div>
                <div className="flex items-center gap-4 mb-10 border-b border-white/5 pb-8">
                  <div className="bg-sky-500/10 p-3 rounded border border-sky-500/30">
                    <Layout size={24} className="text-sky-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white tracking-tight leading-none">Nueva Publicación</h2>
                    <p className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.2em] mt-2">Módulo de Publicación v1.0.4</p>
                  </div>
                </div>

                <form onSubmit={handleCreateContent} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest ml-1">Título de la Publicación</label>
                        <input 
                          type="text" 
                          required 
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          className="w-full px-4 py-4 bg-[#0D0D10] border border-white/10 rounded text-white focus:border-sky-500 outline-none transition-all font-mono text-xs"
                          placeholder="Tema de investigación..."
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest ml-1">Tipo de Contenido</label>
                          <select 
                            className="w-full px-4 py-4 bg-[#0D0D10] border border-white/10 rounded text-white focus:border-sky-500 outline-none transition-all font-mono text-xs appearance-none"
                            value={typeId}
                            onChange={(e) => setTypeId(Number(e.target.value))}
                          >
                            <option value={1}>Articulo (Type 01)</option>
                            <option value={2}>Video (Type 02)</option>
                            <option value={3}>Podcast (Type 03)</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest ml-1">Estado de Publicación</label>
                          <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value as 'publicado' | 'borrador')}
                            className="w-full px-4 py-4 bg-[#0D0D10] border border-white/10 rounded text-white focus:border-sky-500 outline-none transition-all font-mono text-xs appearance-none"
                          >
                            <option value="publicado">Publicado</option>
                            <option value="borrador">Borrador Privado</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest ml-1">Archivo Adjunto</label>
                        <input
                          type="file"
                          accept=".pdf,image/png,image/jpeg,image/webp,audio/mpeg,audio/wav,video/mp4"
                          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                          className="w-full px-4 py-3 bg-[#0D0D10] border border-white/10 rounded text-slate-300 focus:border-sky-500 outline-none transition-all font-mono text-xs file:mr-4 file:border-0 file:bg-sky-500/10 file:px-3 file:py-2 file:text-[10px] file:font-bold file:uppercase file:tracking-widest file:text-sky-400"
                        />
                        <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wide">
                          Opcional. Formatos: PDF, JPG, PNG, WebP, MP3, WAV o MP4. Límite: 20 MB.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest ml-1">Cuerpo del Contenido</label>
                      <textarea 
                        rows={8}
                        required
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        className="w-full px-4 py-4 bg-[#0D0D10] border border-white/10 rounded text-white focus:border-sky-500 outline-none transition-all font-mono text-xs h-full min-h-[180px]"
                        placeholder="Escribe los hallazgos detallados aquí..."
                      ></textarea>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-8 border-t border-white/5">
                    <button 
                      type="submit"
                      className="flex-grow py-5 bg-sky-600 text-white font-bold uppercase tracking-widest text-xs rounded hover:bg-sky-500 transition-all shadow-lg shadow-sky-600/20 active:scale-[0.99]"
                    >
                      Autenticar y Publicar
                    </button>
                    <button 
                      type="button"
                      onClick={() => setView('home')}
                      className="px-10 py-5 bg-white/5 text-slate-400 font-bold uppercase tracking-widest text-xs rounded border border-white/10 hover:bg-white/10 transition-all"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="bg-[#0A0A0B] border-t border-white/10 pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-12 text-[11px] font-mono">
          <div className="md:col-span-1">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-sky-500 p-1.5 rounded">
                 <BookOpen className="text-white size-4" />
              </div>
              <span className="text-sm font-bold text-white uppercase tracking-[0.2em]">SciDifusión</span>
            </div>
            <p className="text-slate-500 leading-relaxed uppercase">
              Repositorio distribuido para el intercambio de datos científicos de alta fidelidad.
            </p>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-bold text-white uppercase tracking-widest text-[10px] mb-6">Arquitectura del Sistema</h4>
            <ul className="space-y-3 text-slate-500 uppercase">
              <li className="flex items-center gap-2"><ProtectIcon /> RBAC Engine: Active</li>
              <li className="flex items-center gap-2"><ProtectIcon /> API Layer: REST/JSON</li>
              <li className="flex items-center gap-2"><ProtectIcon /> DB Instance: MySQL-8</li>
              <li className="flex items-center gap-2"><ProtectIcon /> Auth Strategy: JWT</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-bold text-white uppercase tracking-widest text-[10px] mb-6">Nodos de Red</h4>
            <ul className="space-y-3 text-slate-500 uppercase">
              <li className="flex items-center gap-2 hover:text-sky-400 transition-colors cursor-pointer"><div className="w-1 h-1 bg-sky-500 rounded-full"></div> Virtual Labs</li>
              <li className="flex items-center gap-2 hover:text-sky-400 transition-colors cursor-pointer"><div className="w-1 h-1 bg-sky-500 rounded-full"></div> Peer Review Console</li>
              <li className="flex items-center gap-2 hover:text-sky-400 transition-colors cursor-pointer"><div className="w-1 h-1 bg-sky-500 rounded-full"></div> Archive Index</li>
            </ul>
          </div>

          <div className="bg-[#111114] p-6 rounded border border-white/5 space-y-6">
             <div>
               <div className="text-[9px] uppercase text-slate-500 mb-2">Latencia del Servidor</div>
               <div className="text-2xl font-bold text-white">12ms <span className="text-[10px] font-normal text-emerald-500">OPERATIONAL</span></div>
               <div className="w-full bg-white/5 h-1 mt-3 rounded-full overflow-hidden">
                 <div className="bg-sky-500 h-full w-[94%] shadow-[0_0_8px_rgba(14,165,233,0.5)]"></div>
               </div>
             </div>
             <div>
               <div className="text-[9px] uppercase text-slate-500 mb-2">Disponibilidad del Sistema</div>
               <div className="text-2xl font-bold text-white">99.98%</div>
             </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 mt-20 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-mono text-slate-600">
           <div className="flex items-center gap-4">
              <span>© {new Date().getFullYear()} NEXUS SCI PLATFORM</span>
              <span className="flex items-center gap-1.5"><div className="size-1.5 bg-emerald-500 rounded-full animate-pulse"></div> TODOS LOS SISTEMAS EN LÍNEA</span>
           </div>
           <div className="flex gap-6 uppercase tracking-widest">
              <a href="#" className="hover:text-sky-400">Privacy Policy</a>
              <a href="#" className="hover:text-sky-400">Terms of Nexus</a>
           </div>
        </div>
      </footer>
    </div>
  );
}

function ProtectIcon() {
  return <ShieldCheck size={12} className="text-sky-500" />;
}
