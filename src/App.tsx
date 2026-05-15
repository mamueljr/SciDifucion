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
  Sun,
  Moon,
  Pencil,
  Trash2,
  PlusCircle, 
  LogOut, 
  Database, 
  ShieldCheck, 
  FileText,
  Video,
  Mic,
  Layout,
  Grid,
  List,
  X,
  Heart
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---
interface UserInfo {
  id: number;
  nombre: string;
  email: string;
  role: string;
  biografia?: string | null;
  institucion?: string | null;
  telefono?: string | null;
  ubicacion?: string | null;
  sitio_web?: string | null;
  foto_nombre?: string | null;
  foto_url?: string | null;
  foto_mime_type?: string | null;
}

interface ContentItem {
  id: number;
  titulo: string;
  cuerpo: string;
  autor: string;
  autor_id: number;
  tipo: string;
  tipo_id: number;
  estado: 'publicado' | 'borrador' | 'archivado';
  created_at: string;
  archivo_nombre?: string | null;
  archivo_url?: string | null;
  archivo_mime_type?: string | null;
  likes_count: number;
  user_liked: boolean;
  autor_rol: string;
}

const API_PREFIX = 'api';

export default function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window === 'undefined') return 'dark';
    const storedTheme = window.localStorage.getItem('scidifusion-theme');
    return storedTheme === 'light' ? 'light' : 'dark';
  });
  const [user, setUser] = useState<UserInfo | null>(null);
  const [view, setView] = useState<'home' | 'login' | 'register' | 'admin' | 'create'>('home');
  const [layoutView, setLayoutView] = useState<'grid' | 'list'>('grid');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [adminContent, setAdminContent] = useState<any[]>([]);
  const [editingRoleUserId, setEditingRoleUserId] = useState<number | null>(null);
  const [editingRoleValue, setEditingRoleValue] = useState<string>('');
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);

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
  const [editingContentId, setEditingContentId] = useState<number | null>(null);
  const [currentAttachment, setCurrentAttachment] = useState<{ name: string; url: string } | null>(null);
  const [removeAttachment, setRemoveAttachment] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profileBio, setProfileBio] = useState('');
  const [profileInstitution, setProfileInstitution] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileLocation, setProfileLocation] = useState('');
  const [profileWebsite, setProfileWebsite] = useState('');
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [removeProfilePhoto, setRemoveProfilePhoto] = useState(false);
  const isDark = theme === 'dark';
  const isEditing = editingContentId !== null;

  const shellClass = isDark ? 'bg-[#0A0A0B] text-slate-300' : 'bg-[#f3f6fb] text-slate-800';
  const headerClass = isDark ? 'bg-[#111114] border-white/10' : 'bg-white/90 border-slate-200 shadow-sm';
  const panelClass = isDark ? 'bg-[#111114] border-white/10' : 'bg-white border-slate-200 shadow-[0_12px_40px_rgba(15,23,42,0.08)]';
  const panelSoftClass = isDark ? 'bg-[#0D0D10] border-white/10' : 'bg-slate-50 border-slate-200';
  const titleClass = isDark ? 'text-white' : 'text-slate-900';
  const textClass = isDark ? 'text-slate-300' : 'text-slate-700';
  const mutedClass = isDark ? 'text-slate-500' : 'text-slate-500';
  const monoMutedClass = isDark ? 'text-slate-500' : 'text-slate-600';
  const inputClass = isDark
    ? 'bg-[#0D0D10] border-white/10 text-white focus:border-sky-500'
    : 'bg-white border-slate-300 text-slate-900 focus:border-sky-500';
  const ghostButtonClass = isDark
    ? 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'
    : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200';
  const statPanelClass = isDark ? 'bg-[#111114] border-white/5' : 'bg-white border-slate-200 shadow-[0_12px_32px_rgba(15,23,42,0.06)]';

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem('scidifusion-theme', theme);
  }, [theme]);

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
        syncProfileForm(data);
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

  const fetchAdminData = async () => {
    try {
      const usersRes = await fetch(`${API_PREFIX}/admin/users.php`);
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setAdminUsers(usersData);
      }
      const contentRes = await fetch(`${API_PREFIX}/admin/content.php`);
      if (contentRes.ok) {
        const contentData = await contentRes.json();
        setAdminContent(contentData);
      }
    } catch (e) {
      console.error("Fetch admin data failed", e);
    }
  };

  useEffect(() => {
    if (view === 'admin') {
      fetchAdminData();
    }
  }, [view]);

  const handleDeleteAdminUser = async (id: number) => {
    if (!window.confirm("¿Eliminar usuario? Esta acción es irreversible.")) return;
    const res = await fetch(`${API_PREFIX}/admin/users.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', id })
    });
    if (res.ok) {
      fetchAdminData();
    } else {
      alert("Error al eliminar usuario.");
    }
  };

  const handleSaveAdminUserRole = async (userId: number, newRole: string) => {
    if (!newRole) {
      setEditingRoleUserId(null);
      return;
    }
    const res = await fetch(`${API_PREFIX}/admin/users.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update_role', id: userId, role: newRole })
    });
    if (res.ok) {
      fetchAdminData();
      setEditingRoleUserId(null);
    } else {
      alert("Error al actualizar rol.");
    }
  };

  const handleDeleteAdminContent = async (id: number) => {
    if (!window.confirm("¿Eliminar publicación? Esta acción es irreversible.")) return;
    const formData = new FormData();
    formData.append('action', 'delete');
    formData.append('id', String(id));
    const res = await fetch(`${API_PREFIX}/admin/content.php`, {
      method: 'POST',
      body: formData
    });
    if (res.ok) {
      fetchAdminData();
    } else {
      alert("Error al eliminar publicación.");
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
      await checkAuth();
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
    setIsProfileOpen(false);
    setView('home');
  };

  const syncProfileForm = (profile: UserInfo) => {
    setProfileName(profile.nombre || '');
    setProfileBio(profile.biografia || '');
    setProfileInstitution(profile.institucion || '');
    setProfilePhone(profile.telefono || '');
    setProfileLocation(profile.ubicacion || '');
    setProfileWebsite(profile.sitio_web || '');
    setProfilePhoto(null);
    setRemoveProfilePhoto(false);
  };

  const handleCreateContent = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('accion', isEditing ? 'actualizar' : 'crear');
    formData.append('titulo', title);
    formData.append('cuerpo', body);
    formData.append('tipo_id', String(typeId));
    formData.append('estado', status);
    if (isEditing) {
      formData.append('id', String(editingContentId));
      formData.append('remove_attachment', removeAttachment ? '1' : '0');
    }
    if (file) {
      formData.append('archivo', file);
    }

    const res = await fetch(`${API_PREFIX}/contenido.php`, {
      method: 'POST',
      body: formData
    });
    if (res.ok) {
      alert(isEditing ? "Publicación actualizada" : "Contenido publicado");
      resetContentForm();
      setView('home');
      fetchContent();
    } else {
      const err = await res.json();
      alert(err.error || "Error al publicar");
    }
  };

  const resetContentForm = () => {
    setTitle('');
    setBody('');
    setTypeId(1);
    setStatus('publicado');
    setFile(null);
    setEditingContentId(null);
    setCurrentAttachment(null);
    setRemoveAttachment(false);
  };

  const handleStartCreate = () => {
    resetContentForm();
    setView('create');
  };

  const handleStartEdit = (item: ContentItem) => {
    setEditingContentId(item.id);
    setTitle(item.titulo);
    setBody(item.cuerpo);
    setTypeId(item.tipo_id);
    setStatus(item.estado === 'borrador' ? 'borrador' : 'publicado');
    setFile(null);
    setCurrentAttachment(item.archivo_url ? { name: item.archivo_nombre || 'Adjunto actual', url: item.archivo_url } : null);
    setRemoveAttachment(false);
    setView('create');
  };

  const handleDeleteContent = async (item: ContentItem) => {
    const confirmed = window.confirm(`¿Eliminar la publicación "${item.titulo}"? Esta acción no se puede deshacer.`);
    if (!confirmed) return;

    const formData = new FormData();
    formData.append('accion', 'eliminar');
    formData.append('id', String(item.id));

    const res = await fetch(`${API_PREFIX}/contenido.php`, {
      method: 'POST',
      body: formData
    });

    if (res.ok) {
      if (editingContentId === item.id) {
        resetContentForm();
        setView('home');
      }
      fetchContent();
      return;
    }

    const err = await res.json();
    alert(err.error || 'No se pudo eliminar la publicación');
  };

  const handleToggleLike = async (id: number) => {
    if (!user) {
      alert("Debes iniciar sesión para dar me gusta.");
      return;
    }
    const res = await fetch(`${API_PREFIX}/like.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contenido_id: id })
    });
    if (res.ok) {
      const data = await res.json();
      setContent(prev => {
        const newContent = prev.map(item => 
          item.id === id 
            ? { ...item, likes_count: data.likes_count, user_liked: data.liked }
            : item
        );
        return newContent.sort((a, b) => {
            if (b.likes_count !== a.likes_count) return b.likes_count - a.likes_count;
            const roleWeight = (role: string) => role === 'admin' ? 3 : role === 'investigador' ? 2 : 1;
            const weightA = roleWeight(a.autor_rol);
            const weightB = roleWeight(b.autor_rol);
            if (weightB !== weightA) return weightB - weightA;
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
      });
      if (selectedContent && selectedContent.id === id) {
          setSelectedContent(prev => prev ? { ...prev, likes_count: data.likes_count, user_liked: data.liked } : null);
      }
    } else {
      alert("Error al dar me gusta.");
    }
  };

  const handleOpenProfile = () => {
    if (!user) return;
    syncProfileForm(user);
    setIsProfileOpen(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('nombre', profileName);
    formData.append('biografia', profileBio);
    formData.append('institucion', profileInstitution);
    formData.append('telefono', profilePhone);
    formData.append('ubicacion', profileLocation);
    formData.append('sitio_web', profileWebsite);
    formData.append('remove_photo', removeProfilePhoto ? '1' : '0');
    if (profilePhoto) {
      formData.append('foto', profilePhoto);
    }

    const res = await fetch(`${API_PREFIX}/auth/profile.php`, {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();
    if (!res.ok) {
      alert(data.error || 'No se pudo actualizar el perfil');
      return;
    }

    setUser((prev) => (prev ? { ...prev, ...data.profile, role: prev.role } : prev));
    syncProfileForm(data.profile);
    setIsProfileOpen(false);
    alert('Perfil actualizado');
  };

  if (loading) return (
    <div className={`h-screen flex flex-col items-center justify-center font-mono text-sky-500 gap-4 ${shellClass}`}>
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-sky-500 animate-pulse"></div>
        <span className="uppercase tracking-[0.3em] text-xs">Iniciando Sistema</span>
      </div>
      <div className={`w-48 h-1 rounded-full overflow-hidden ${isDark ? 'bg-white/5' : 'bg-slate-200'}`}>
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
    <div className={`min-h-screen font-sans transition-colors duration-300 ${shellClass}`}>
      {/* Header */}
      <header className={`sticky top-0 z-50 border-b transition-colors duration-300 ${headerClass}`}>
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('home')}>
            <div className="bg-sky-500 p-1.5 rounded-lg shadow-lg shadow-sky-500/20">
              <BookOpen className="text-white size-6" />
            </div>
            <div>
              <span className={`text-sm font-bold tracking-widest uppercase block leading-none ${titleClass}`}>SciDifusión</span>
              <span className="text-[9px] text-sky-400 font-mono uppercase tracking-tighter">Plataforma SciDifusión v1.0.4</span>
            </div>
          </div>

          <nav className={`hidden md:flex items-center gap-8 text-[11px] font-mono uppercase tracking-wider ${monoMutedClass}`}>
            <button onClick={() => setView('home')} className="hover:text-sky-400 transition-colors cursor-pointer">Repositorio</button>
            <button onClick={() => {
              if (user) {
                window.location.href = 'https://bbb-test.investigacioneducativafccf.net/';
              } else {
                alert('necesitas registrarte para acceder a la sala virtual');
              }
            }} className="hover:text-sky-400 transition-colors cursor-pointer">Sala Virtual</button>
            <button className="hover:text-sky-400 transition-colors cursor-pointer">Directorio</button>
            {user && (
              <button onClick={() => window.location.href = 'https://investigacioneducativafccf.net/disenador_instrumentos/'} className="hover:text-sky-400 transition-colors cursor-pointer">Encuestas</button>
            )}
            {user?.role === 'admin' && (
              <button onClick={() => setView('admin')} className="hover:text-sky-400 transition-colors cursor-pointer font-bold text-sky-500">Panel</button>
            )}
          </nav>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-[10px] font-bold uppercase tracking-widest transition-colors ${ghostButtonClass}`}
              title={isDark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
            >
              {isDark ? <Sun size={14} /> : <Moon size={14} />}
              <span className="hidden sm:inline">{isDark ? 'Tema Claro' : 'Tema Oscuro'}</span>
            </button>
            {user ? (
              <div className="flex items-center gap-3">
                <button
                  onClick={handleOpenProfile}
                  className="flex items-center gap-3 text-left"
                  title="Abrir perfil"
                >
                  {user.foto_url ? (
                    <img
                      src={user.foto_url}
                      alt={user.nombre}
                      className="size-10 rounded-full object-cover border border-sky-500/30"
                    />
                  ) : (
                    <div className="size-10 rounded-full bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 font-bold">
                      {user.nombre.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  <div className="text-right hidden sm:block">
                    <p className={`text-xs font-bold uppercase tracking-tight hover:text-sky-400 transition-colors ${titleClass}`}>{user.nombre}</p>
                    <p className="text-[9px] uppercase tracking-widest text-sky-400 font-mono font-bold">
                      {user.role === 'publico' ? 'Usuario' : user.role === 'admin' ? 'Administrador' : user.role}
                    </p>
                  </div>
                </button>
                <button 
                  onClick={handleLogout}
                  className={`p-2 rounded-lg transition-colors group border ${ghostButtonClass}`}
                  title="Cerrar sesión"
                >
                  <LogOut size={18} className="group-hover:text-red-400" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setView('login')}
                  className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}
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
                  <h1 className={`text-3xl font-bold tracking-tight ${titleClass}`}>Repositorio Científico</h1>
                  <p className={`mt-1 max-w-xl ${mutedClass}`}>Acceso centralizado a hallazgos académicos y documentación técnica verificada por la arquitectura de red SciDifusión.</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className={`flex items-center p-1 rounded-lg border ${ghostButtonClass}`}>
                    <button
                      onClick={() => setLayoutView('grid')}
                      className={`p-2 rounded ${layoutView === 'grid' ? 'bg-sky-500 text-white' : ''} transition-all`}
                      title="Vista de recuadros"
                    >
                      <Grid size={16} />
                    </button>
                    <button
                      onClick={() => setLayoutView('list')}
                      className={`p-2 rounded ${layoutView === 'list' ? 'bg-sky-500 text-white' : ''} transition-all`}
                      title="Vista de lista"
                    >
                      <List size={16} />
                    </button>
                  </div>
                  {(user?.role === 'admin' || user?.role === 'investigador') && (
                    <button 
                      onClick={handleStartCreate}
                      className="flex items-center gap-2 px-6 py-3 bg-sky-500 text-white rounded font-bold uppercase tracking-widest text-[10px] hover:bg-sky-400 transition-all shadow-lg shadow-sky-500/20 w-fit"
                    >
                      <PlusCircle size={16} />
                      Nueva Publicación
                    </button>
                  )}
                </div>
              </div>

              <div className={layoutView === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" : "flex flex-col gap-6"}>
                {content.length > 0 ? content.map(item => (
                  <motion.div 
                    key={item.id}
                    className={`p-8 rounded border hover:border-sky-500/50 transition-all group flex flex-col h-full relative overflow-hidden ${panelClass}`}
                  >
                    <div className="absolute top-0 left-0 w-1 h-full bg-sky-500/30 group-hover:bg-sky-500 transition-colors"></div>
                    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-6">
                      <div className="flex items-center gap-3">
                        <span className="px-3 py-1 bg-white/5 text-sky-400 text-[9px] font-mono font-bold uppercase rounded border border-white/10 tracking-widest">
                          {item.tipo}
                        </span>
                        <time className={`text-[9px] font-mono uppercase tracking-tighter ${monoMutedClass}`}>
                          FECHA: {new Date(item.created_at).toISOString().split('T')[0]}
                        </time>
                      </div>
                      {user?.id === item.autor_id && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleStartEdit(item)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded border text-[9px] font-bold uppercase tracking-widest transition-colors ${ghostButtonClass}`}
                          >
                            <Pencil size={12} />
                            Editar
                          </button>
                          <button
                            onClick={() => handleDeleteContent(item)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded border text-[9px] font-bold uppercase tracking-widest transition-colors ${
                              isDark
                                ? 'border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20'
                                : 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100'
                            }`}
                          >
                            <Trash2 size={12} />
                            Eliminar
                          </button>
                        </div>
                      )}
                    </div>
                    <h3 className={`text-lg font-bold group-hover:text-sky-400 transition-colors mb-4 tracking-tight leading-tight ${titleClass}`}>
                      {item.titulo}
                    </h3>
                    <p className={`text-sm leading-relaxed mb-8 flex-grow line-clamp-3 ${textClass}`}>
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
                    <div className="pt-6 border-t border-white/5 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="size-8 bg-white/5 rounded flex items-center justify-center text-slate-500 border border-white/10">
                          <User size={14} />
                        </div>
                        <div>
                          <p className={`text-[10px] font-bold leading-none uppercase tracking-wide ${textClass}`}>{item.autor}</p>
                          <p className={`text-[8px] font-mono uppercase mt-1 ${monoMutedClass}`}>Autor Verificado</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div 
                          className={`flex items-center gap-1.5 px-2 py-1 rounded ${item.user_liked ? 'text-red-500' : 'text-slate-400'}`}
                          title="Me gusta"
                        >
                          <Heart size={14} className={item.user_liked ? 'fill-current' : ''} />
                          <span className="text-[10px] font-bold font-mono">{item.likes_count}</span>
                        </div>
                        {user?.id === item.autor_id && (
                          <span className={`text-[9px] font-mono uppercase tracking-widest ${monoMutedClass}`}>
                            {item.estado}
                          </span>
                        )}
                        <button onClick={() => setSelectedContent(item)} className="text-[10px] font-bold text-sky-400 uppercase tracking-widest hover:text-white transition-colors">Detalles</button>
                      </div>
                    </div>
                  </motion.div>
                )) : (
                  <div className={`col-span-full py-32 border border-dashed rounded flex flex-col items-center justify-center ${panelSoftClass} ${isDark ? 'text-slate-600' : 'text-slate-500'}`}>
                    <Database size={48} className="mb-4 opacity-20" />
                    <p className={`font-mono text-xs uppercase tracking-widest ${monoMutedClass}`}>No se encontraron resultados</p>
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
              <div className={`p-10 rounded border shadow-2xl relative overflow-hidden ${panelClass}`}>
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-sky-500 to-indigo-500"></div>
                <div className="flex justify-center mb-8">
                  <div className="bg-sky-500/10 p-5 rounded-2xl border border-sky-500/30">
                    {view === 'login' ? <Lock className="text-sky-400 size-10" /> : <User className="text-sky-400 size-10" />}
                  </div>
                </div>
                <h2 className={`text-2xl font-bold text-center mb-2 ${titleClass}`}>
                  {view === 'login' ? 'Inicio de Sesión' : 'Crear Cuenta'}
                </h2>
                <p className={`text-center text-[10px] font-mono uppercase tracking-widest mb-10 ${monoMutedClass}`}>Acceso Seguro al Sistema</p>
                
                <form onSubmit={view === 'login' ? handleLogin : handleRegister} className="space-y-6">
                  {view === 'register' && (
                    <>
                      <div className="space-y-2">
                        <label className={`block text-[10px] font-mono font-bold uppercase tracking-widest ml-1 ${monoMutedClass}`}>Nombre Completo</label>
                        <input 
                          type="text" 
                          required 
                          value={nombre}
                          onChange={(e) => setNombre(e.target.value)}
                          className={`w-full px-4 py-3 border rounded outline-none transition-all font-mono text-xs ${inputClass}`}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className={`block text-[10px] font-mono font-bold uppercase tracking-widest ml-1 ${monoMutedClass}`}>Rol Asignado</label>
                        <select 
                          value={role}
                          onChange={(e) => setRole(e.target.value)}
                          className={`w-full px-4 py-3 border rounded outline-none transition-all font-mono text-xs appearance-none ${inputClass}`}
                        >
                          <option value="publico">Usuario</option>
                          <option value="investigador">Investigador</option>
                        </select>
                      </div>
                    </>
                  )}
                  <div className="space-y-2">
                    <label className={`block text-[10px] font-mono font-bold uppercase tracking-widest ml-1 ${monoMutedClass}`}>Correo Electrónico</label>
                    <input 
                      type="email" 
                      required 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`w-full px-4 py-3 border rounded outline-none transition-all font-mono text-xs ${inputClass}`}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className={`block text-[10px] font-mono font-bold uppercase tracking-widest ml-1 ${monoMutedClass}`}>Contraseña</label>
                    <input 
                      type="password" 
                      required 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`w-full px-4 py-3 border rounded outline-none transition-all font-mono text-xs ${inputClass}`}
                    />
                  </div>
                  <button 
                    type="submit"
                    className="w-full py-4 bg-sky-600 text-white font-bold uppercase tracking-widest text-xs rounded hover:bg-sky-500 transition-all shadow-lg shadow-sky-600/20 active:scale-[0.99]"
                  >
                    {view === 'login' ? 'Ingresar' : 'Registrarse'}
                  </button>
                </form>
                
                <p className={`text-center mt-8 text-[11px] font-mono uppercase ${monoMutedClass}`}>
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
              <div className={`p-10 rounded border shadow-2xl relative overflow-hidden ${panelClass}`}>
                <div className="absolute top-0 left-0 w-1 h-full bg-sky-500"></div>
                <div className="flex items-center gap-4 mb-10 border-b border-white/5 pb-8">
                  <div className="bg-sky-500/10 p-3 rounded border border-sky-500/30">
                    <Layout size={24} className="text-sky-400" />
                  </div>
                  <div>
                    <h2 className={`text-2xl font-bold tracking-tight leading-none ${titleClass}`}>
                      {isEditing ? 'Editar Publicación' : 'Nueva Publicación'}
                    </h2>
                    <p className={`text-[10px] font-mono uppercase tracking-[0.2em] mt-2 ${monoMutedClass}`}>
                      {isEditing ? 'Módulo de Edición v1.0.4' : 'Módulo de Publicación v1.0.4'}
                    </p>
                  </div>
                </div>

                <form onSubmit={handleCreateContent} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className={`block text-[10px] font-mono font-bold uppercase tracking-widest ml-1 ${monoMutedClass}`}>Título de la Publicación</label>
                        <input 
                          type="text" 
                          required 
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          className={`w-full px-4 py-4 border rounded outline-none transition-all font-mono text-xs ${inputClass}`}
                          placeholder="Tema de investigación..."
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className={`block text-[10px] font-mono font-bold uppercase tracking-widest ml-1 ${monoMutedClass}`}>Tipo de Contenido</label>
                          <select 
                            className={`w-full px-4 py-4 border rounded outline-none transition-all font-mono text-xs appearance-none ${inputClass}`}
                            value={typeId}
                            onChange={(e) => setTypeId(Number(e.target.value))}
                          >
                            <option value={1}>Articulo (Type 01)</option>
                            <option value={2}>Video (Type 02)</option>
                            <option value={3}>Podcast (Type 03)</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className={`block text-[10px] font-mono font-bold uppercase tracking-widest ml-1 ${monoMutedClass}`}>Estado de Publicación</label>
                          <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value as 'publicado' | 'borrador')}
                            className={`w-full px-4 py-4 border rounded outline-none transition-all font-mono text-xs appearance-none ${inputClass}`}
                          >
                            <option value="publicado">Publicado</option>
                            <option value="borrador">Borrador Privado</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className={`block text-[10px] font-mono font-bold uppercase tracking-widest ml-1 ${monoMutedClass}`}>Archivo Adjunto</label>
                        <input
                          type="file"
                          accept=".pdf,image/png,image/jpeg,image/webp,audio/mpeg,audio/wav,video/mp4"
                          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                          className={`w-full px-4 py-3 border rounded focus:border-sky-500 outline-none transition-all font-mono text-xs file:mr-4 file:border-0 file:bg-sky-500/10 file:px-3 file:py-2 file:text-[10px] file:font-bold file:uppercase file:tracking-widest file:text-sky-400 ${inputClass}`}
                        />
                        <p className={`text-[10px] font-mono uppercase tracking-wide ${monoMutedClass}`}>
                          Opcional. Formatos: PDF, JPG, PNG, WebP, MP3, WAV o MP4. Límite: 20 MB.
                        </p>
                        {currentAttachment && !removeAttachment && (
                          <a
                            href={currentAttachment.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-sky-400 hover:text-white transition-colors"
                          >
                            <FileText size={14} />
                            {currentAttachment.name}
                          </a>
                        )}
                        {currentAttachment && (
                          <label className={`flex items-center gap-2 text-[10px] font-mono uppercase tracking-wide ${monoMutedClass}`}>
                            <input
                              type="checkbox"
                              checked={removeAttachment}
                              onChange={(e) => setRemoveAttachment(e.target.checked)}
                              className="accent-sky-500"
                            />
                            Quitar adjunto actual
                          </label>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className={`block text-[10px] font-mono font-bold uppercase tracking-widest ml-1 ${monoMutedClass}`}>Cuerpo del Contenido</label>
                      <textarea 
                        rows={8}
                        required
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        className={`w-full px-4 py-4 border rounded outline-none transition-all font-mono text-xs h-full min-h-[180px] ${inputClass}`}
                        placeholder="Escribe los hallazgos detallados aquí..."
                      ></textarea>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-8 border-t border-white/5">
                    <button 
                      type="submit"
                      className="flex-grow py-5 bg-sky-600 text-white font-bold uppercase tracking-widest text-xs rounded hover:bg-sky-500 transition-all shadow-lg shadow-sky-600/20 active:scale-[0.99]"
                    >
                      {isEditing ? 'Guardar Cambios' : 'Autenticar y Publicar'}
                    </button>
                    <button 
                      type="button"
                      onClick={() => {
                        resetContentForm();
                        setView('home');
                      }}
                      className={`px-10 py-5 font-bold uppercase tracking-widest text-xs rounded border transition-all ${ghostButtonClass}`}
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}

          {view === 'admin' && user?.role === 'admin' && (
            <motion.div 
              key="admin"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
            >
              <div className="mb-12">
                <h2 className={`text-3xl font-bold tracking-tight mb-2 ${titleClass}`}>Panel de Administrador</h2>
                <p className={`text-[11px] font-mono uppercase tracking-widest ${monoMutedClass}`}>Gestión de Usuarios y Publicaciones</p>
              </div>

              <div className="space-y-12">
                {/* Users Table */}
                <div className={`rounded border overflow-hidden ${panelClass}`}>
                  <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
                    <h3 className={`font-bold uppercase tracking-widest text-xs ${titleClass}`}>Usuarios Registrados</h3>
                    <span className="bg-sky-500/10 text-sky-400 px-3 py-1 rounded-full text-[10px] font-mono font-bold">{adminUsers.length}</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className={`text-[10px] uppercase font-mono tracking-widest bg-black/20 ${monoMutedClass}`}>
                        <tr>
                          <th className="px-6 py-4 font-normal">Nombre</th>
                          <th className="px-6 py-4 font-normal">Correo</th>
                          <th className="px-6 py-4 font-normal">Rol</th>
                          <th className="px-6 py-4 font-normal">Estado</th>
                          <th className="px-6 py-4 font-normal text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {adminUsers.map(u => (
                          <tr key={u.id} className="hover:bg-white/5 transition-colors">
                            <td className={`px-6 py-4 font-bold ${titleClass}`}>{u.nombre}</td>
                            <td className={`px-6 py-4 ${textClass}`}>{u.email}</td>
                            <td className="px-6 py-4">
                              {editingRoleUserId === u.id ? (
                                <select 
                                  value={editingRoleValue}
                                  onChange={e => setEditingRoleValue(e.target.value)}
                                  className="bg-black/20 border border-white/10 rounded text-[9px] font-mono uppercase px-2 py-1 outline-none text-sky-400"
                                >
                                  <option value="admin">Administrador</option>
                                  <option value="investigador">Investigador</option>
                                  <option value="publico">Usuario</option>
                                </select>
                              ) : (
                                <span className="px-2 py-1 bg-white/5 text-[9px] font-mono uppercase tracking-widest rounded border border-white/10">
                                  {u.role === 'publico' ? 'Usuario' : u.role === 'admin' ? 'Administrador' : u.role}
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-1 text-[9px] font-mono uppercase tracking-widest rounded ${u.activo ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'}`}>
                                {u.activo ? 'Activo' : 'Inactivo'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right space-x-2">
                              {editingRoleUserId === u.id ? (
                                <>
                                  <button onClick={() => handleSaveAdminUserRole(u.id, editingRoleValue)} className="px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest rounded border transition-colors border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20">Guardar</button>
                                  <button onClick={() => setEditingRoleUserId(null)} className={`px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest rounded border transition-colors ${ghostButtonClass}`}>Cancelar</button>
                                </>
                              ) : (
                                <button onClick={() => { setEditingRoleUserId(u.id); setEditingRoleValue(u.role); }} className={`px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest rounded border transition-colors ${ghostButtonClass}`}>Editar</button>
                              )}
                              <button onClick={() => handleDeleteAdminUser(u.id)} className="px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest rounded border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors">Eliminar</button>
                            </td>
                          </tr>
                        ))}
                        {adminUsers.length === 0 && (
                          <tr><td colSpan={5} className={`px-6 py-8 text-center text-xs font-mono uppercase ${monoMutedClass}`}>No hay usuarios</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Content Table */}
                <div className={`rounded border overflow-hidden ${panelClass}`}>
                  <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
                    <h3 className={`font-bold uppercase tracking-widest text-xs ${titleClass}`}>Todas las Publicaciones</h3>
                    <span className="bg-sky-500/10 text-sky-400 px-3 py-1 rounded-full text-[10px] font-mono font-bold">{adminContent.length}</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className={`text-[10px] uppercase font-mono tracking-widest bg-black/20 ${monoMutedClass}`}>
                        <tr>
                          <th className="px-6 py-4 font-normal">Título</th>
                          <th className="px-6 py-4 font-normal">Autor</th>
                          <th className="px-6 py-4 font-normal">Fecha</th>
                          <th className="px-6 py-4 font-normal">Estado</th>
                          <th className="px-6 py-4 font-normal text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {adminContent.map(c => (
                          <tr key={c.id} className="hover:bg-white/5 transition-colors">
                            <td className={`px-6 py-4 font-bold max-w-xs truncate ${titleClass}`}>{c.titulo}</td>
                            <td className={`px-6 py-4 ${textClass}`}>{c.autor}</td>
                            <td className={`px-6 py-4 text-[10px] font-mono ${textClass}`}>{new Date(c.created_at).toISOString().split('T')[0]}</td>
                            <td className="px-6 py-4">
                              <span className="px-2 py-1 bg-white/5 text-[9px] font-mono uppercase tracking-widest rounded border border-white/10">
                                {c.estado}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right space-x-2">
                              <button onClick={() => {
                                handleStartEdit(c);
                              }} className={`px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest rounded border transition-colors ${ghostButtonClass}`}>Editar</button>
                              <button onClick={() => handleDeleteAdminContent(c.id)} className="px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest rounded border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors">Eliminar</button>
                            </td>
                          </tr>
                        ))}
                        {adminContent.length === 0 && (
                          <tr><td colSpan={5} className={`px-6 py-8 text-center text-xs font-mono uppercase ${monoMutedClass}`}>No hay publicaciones</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {user && isProfileOpen && (
        <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center px-4">
          <div className={`w-full max-w-3xl rounded-2xl border overflow-hidden ${panelClass}`}>
            <div className="px-8 py-6 border-b border-white/10 flex items-center justify-between">
              <div>
                <h2 className={`text-2xl font-bold ${titleClass}`}>Perfil de Usuario</h2>
                <p className={`text-[11px] font-mono uppercase tracking-widest mt-2 ${monoMutedClass}`}>Datos generales y foto de perfil</p>
              </div>
              <button
                onClick={() => setIsProfileOpen(false)}
                className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded border transition-colors ${ghostButtonClass}`}
              >
                Cerrar
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="p-8 grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8">
              <div className={`rounded-2xl border p-6 flex flex-col items-center text-center ${panelSoftClass}`}>
                {user.foto_url && !removeProfilePhoto && !profilePhoto ? (
                  <img
                    src={user.foto_url}
                    alt={user.nombre}
                    className="size-32 rounded-full object-cover border border-sky-500/30 mb-4"
                  />
                ) : profilePhoto ? (
                  <div className="size-32 rounded-full bg-sky-500/10 border border-sky-500/30 mb-4 flex items-center justify-center text-sky-400 px-4 text-xs font-mono uppercase">
                    Foto nueva seleccionada
                  </div>
                ) : (
                  <div className="size-32 rounded-full bg-sky-500/10 border border-sky-500/30 mb-4 flex items-center justify-center text-sky-400 text-4xl font-bold">
                    {profileName.slice(0, 1).toUpperCase() || 'U'}
                  </div>
                )}

                <label className="w-full">
                  <span className={`block text-[10px] font-mono font-bold uppercase tracking-widest mb-2 ${monoMutedClass}`}>Foto de Perfil</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(e) => {
                      setProfilePhoto(e.target.files?.[0] ?? null);
                      if (e.target.files?.[0]) setRemoveProfilePhoto(false);
                    }}
                    className={`w-full px-3 py-3 border rounded outline-none transition-all font-mono text-xs file:mr-3 file:border-0 file:bg-sky-500/10 file:px-3 file:py-2 file:text-[10px] file:font-bold file:uppercase file:tracking-widest file:text-sky-400 ${inputClass}`}
                  />
                </label>

                {user.foto_url && (
                  <label className={`mt-4 flex items-center gap-2 text-[10px] font-mono uppercase tracking-wide ${monoMutedClass}`}>
                    <input
                      type="checkbox"
                      checked={removeProfilePhoto}
                      onChange={(e) => setRemoveProfilePhoto(e.target.checked)}
                      className="accent-sky-500"
                    />
                    Quitar foto actual
                  </label>
                )}
              </div>

              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className={`block text-[10px] font-mono font-bold uppercase tracking-widest ${monoMutedClass}`}>Nombre</label>
                    <input value={profileName} onChange={(e) => setProfileName(e.target.value)} className={`w-full px-4 py-3 border rounded outline-none transition-all font-mono text-xs ${inputClass}`} />
                  </div>
                  <div className="space-y-2">
                    <label className={`block text-[10px] font-mono font-bold uppercase tracking-widest ${monoMutedClass}`}>Correo</label>
                    <input value={user.email} disabled className={`w-full px-4 py-3 border rounded outline-none transition-all font-mono text-xs opacity-70 cursor-not-allowed ${inputClass}`} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className={`block text-[10px] font-mono font-bold uppercase tracking-widest ${monoMutedClass}`}>Institución</label>
                    <input value={profileInstitution} onChange={(e) => setProfileInstitution(e.target.value)} className={`w-full px-4 py-3 border rounded outline-none transition-all font-mono text-xs ${inputClass}`} />
                  </div>
                  <div className="space-y-2">
                    <label className={`block text-[10px] font-mono font-bold uppercase tracking-widest ${monoMutedClass}`}>Teléfono</label>
                    <input value={profilePhone} onChange={(e) => setProfilePhone(e.target.value)} className={`w-full px-4 py-3 border rounded outline-none transition-all font-mono text-xs ${inputClass}`} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className={`block text-[10px] font-mono font-bold uppercase tracking-widest ${monoMutedClass}`}>Ubicación</label>
                    <input value={profileLocation} onChange={(e) => setProfileLocation(e.target.value)} className={`w-full px-4 py-3 border rounded outline-none transition-all font-mono text-xs ${inputClass}`} />
                  </div>
                  <div className="space-y-2">
                    <label className={`block text-[10px] font-mono font-bold uppercase tracking-widest ${monoMutedClass}`}>Sitio Web</label>
                    <input value={profileWebsite} onChange={(e) => setProfileWebsite(e.target.value)} className={`w-full px-4 py-3 border rounded outline-none transition-all font-mono text-xs ${inputClass}`} placeholder="https://..." />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className={`block text-[10px] font-mono font-bold uppercase tracking-widest ${monoMutedClass}`}>Biografía</label>
                  <textarea
                    rows={6}
                    value={profileBio}
                    onChange={(e) => setProfileBio(e.target.value)}
                    className={`w-full px-4 py-4 border rounded outline-none transition-all font-mono text-xs min-h-[160px] ${inputClass}`}
                    placeholder="Cuéntanos sobre tu perfil académico, intereses de investigación o experiencia."
                  />
                </div>

                <div className="flex justify-end gap-4 pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsProfileOpen(false)}
                    className={`px-6 py-3 text-[10px] font-bold uppercase tracking-widest rounded border transition-colors ${ghostButtonClass}`}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-sky-600 text-white font-bold uppercase tracking-widest text-[10px] rounded hover:bg-sky-500 transition-all shadow-lg shadow-sky-600/20"
                  >
                    Guardar Perfil
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className={`border-t pt-20 pb-10 transition-colors duration-300 ${isDark ? 'bg-[#0A0A0B] border-white/10' : 'bg-[#eaf0f7] border-slate-200'}`}>
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-12 text-[11px] font-mono">
          <div className="md:col-span-1">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-sky-500 p-1.5 rounded">
                 <BookOpen className="text-white size-4" />
              </div>
              <span className={`text-sm font-bold uppercase tracking-[0.2em] ${titleClass}`}>SciDifusión</span>
            </div>
            <p className={`leading-relaxed uppercase ${mutedClass}`}>
              Repositorio distribuido para el intercambio de datos científicos de alta fidelidad.
            </p>
          </div>
          
          <div className="space-y-4">
            <h4 className={`font-bold uppercase tracking-widest text-[10px] mb-6 ${titleClass}`}>Arquitectura del Sistema</h4>
            <ul className={`space-y-3 uppercase ${mutedClass}`}>
              <li className="flex items-center gap-2"><ProtectIcon /> RBAC Engine: Active</li>
              <li className="flex items-center gap-2"><ProtectIcon /> API Layer: REST/JSON</li>
              <li className="flex items-center gap-2"><ProtectIcon /> DB Instance: MySQL-8</li>
              <li className="flex items-center gap-2"><ProtectIcon /> Auth Strategy: JWT</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className={`font-bold uppercase tracking-widest text-[10px] mb-6 ${titleClass}`}>Nodos de Red</h4>
            <ul className={`space-y-3 uppercase ${mutedClass}`}>
              <li className="flex items-center gap-2 hover:text-sky-400 transition-colors cursor-pointer"><div className="w-1 h-1 bg-sky-500 rounded-full"></div> Virtual Labs</li>
              <li className="flex items-center gap-2 hover:text-sky-400 transition-colors cursor-pointer"><div className="w-1 h-1 bg-sky-500 rounded-full"></div> Peer Review Console</li>
              <li className="flex items-center gap-2 hover:text-sky-400 transition-colors cursor-pointer"><div className="w-1 h-1 bg-sky-500 rounded-full"></div> Archive Index</li>
            </ul>
          </div>

          <div className={`p-6 rounded border space-y-6 ${statPanelClass}`}>
             <div>
               <div className={`text-[9px] uppercase mb-2 ${monoMutedClass}`}>Latencia del Servidor</div>
               <div className={`text-2xl font-bold ${titleClass}`}>12ms <span className="text-[10px] font-normal text-emerald-500">OPERATIONAL</span></div>
               <div className={`w-full h-1 mt-3 rounded-full overflow-hidden ${isDark ? 'bg-white/5' : 'bg-slate-200'}`}>
                 <div className="bg-sky-500 h-full w-[94%] shadow-[0_0_8px_rgba(14,165,233,0.5)]"></div>
               </div>
             </div>
             <div>
               <div className={`text-[9px] uppercase mb-2 ${monoMutedClass}`}>Disponibilidad del Sistema</div>
               <div className={`text-2xl font-bold ${titleClass}`}>99.98%</div>
             </div>
          </div>
        </div>

        <div className={`max-w-7xl mx-auto px-4 mt-20 pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-mono ${isDark ? 'border-white/5 text-slate-600' : 'border-slate-200 text-slate-500'}`}>
           <div className="flex items-center gap-4">
              <a
                href="https://mamueljr.github.io/esiscom/"
                target="_blank"
                rel="noreferrer"
                className="hover:text-sky-400 transition-colors"
              >
                © {new Date().getFullYear()} ESISCOM
              </a>
              <span className="flex items-center gap-1.5"><div className="size-1.5 bg-emerald-500 rounded-full animate-pulse"></div> TODOS LOS SISTEMAS EN LÍNEA</span>
           </div>
           <div className="flex gap-6 uppercase tracking-widest">
              <a href="#" className="hover:text-sky-400">Privacy Policy</a>
              <a
                href="https://mamueljr.github.io/esiscom/"
                target="_blank"
                rel="noreferrer"
                className="hover:text-sky-400"
              >
                ESISCOM
              </a>
           </div>
        </div>
      </footer>

      {/* Modal Detalles */}
      <AnimatePresence>
        {selectedContent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedContent(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className={`relative w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8 md:p-10 rounded shadow-2xl border ${panelClass}`}
              onClick={e => e.stopPropagation()}
            >
              <button 
                onClick={() => setSelectedContent(null)}
                className={`absolute top-6 right-6 p-2 rounded-full transition-colors ${ghostButtonClass}`}
              >
                <X size={16} />
              </button>
              
              <div className="flex items-center gap-3 mb-6">
                <span className="px-3 py-1 bg-white/5 text-sky-400 text-[10px] font-mono font-bold uppercase rounded border border-white/10 tracking-widest">
                  {selectedContent.tipo}
                </span>
                <time className={`text-[10px] font-mono uppercase tracking-widest ${monoMutedClass}`}>
                  FECHA: {new Date(selectedContent.created_at).toISOString().split('T')[0]}
                </time>
              </div>

              <h2 className={`text-2xl md:text-3xl font-bold mb-6 tracking-tight leading-tight ${titleClass}`}>
                {selectedContent.titulo}
              </h2>

              <div className="flex items-center gap-4 mb-8 pb-8 border-b border-white/5">
                <div className="size-10 bg-sky-500/10 rounded flex items-center justify-center text-sky-400 border border-sky-500/20">
                  <User size={18} />
                </div>
                <div>
                  <p className={`text-xs font-bold uppercase tracking-widest ${textClass}`}>{selectedContent.autor}</p>
                  <p className={`text-[9px] font-mono uppercase mt-1 ${monoMutedClass}`}>Investigador Verificado</p>
                </div>
                <div className="ml-auto">
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleToggleLike(selectedContent.id); }} 
                    className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all shadow-sm ${selectedContent.user_liked ? 'border-red-500/50 bg-red-500/10 text-red-500' : 'border-slate-500/30 text-slate-400 hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400'}`}
                  >
                    <Heart size={18} className={selectedContent.user_liked ? 'fill-current' : ''} />
                    <span className="font-bold font-mono">{selectedContent.likes_count}</span>
                  </button>
                </div>
              </div>

              <div className={`text-sm leading-relaxed mb-10 ${textClass}`}>
                {selectedContent.cuerpo.split('\n').map((paragraph, idx) => (
                  <p key={idx} className="mb-4">{paragraph}</p>
                ))}
              </div>

              {selectedContent.archivo_url && (
                <div className="mt-8 pt-8 border-t border-white/5">
                  <p className={`text-[10px] font-mono font-bold uppercase tracking-widest mb-4 ${monoMutedClass}`}>Material Adjunto</p>
                  <a
                    href={selectedContent.archivo_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-3 w-full py-4 bg-sky-500/10 text-sky-400 border border-sky-500/30 rounded font-bold uppercase tracking-widest text-xs hover:bg-sky-500 hover:text-white transition-all shadow-lg shadow-sky-500/10"
                  >
                    <FileText size={18} />
                    {selectedContent.archivo_nombre || 'Abrir Material Adjunto'}
                  </a>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ProtectIcon() {
  return <ShieldCheck size={12} className="text-sky-500" />;
}
