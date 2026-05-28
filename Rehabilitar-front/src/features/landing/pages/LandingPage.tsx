import { Link } from "react-router-dom";
import { Activity, MapPin, Phone, Mail, Clock, ShieldCheck, ChevronRight, Menu, X, Sun, Moon } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../../../hooks/useAuth";
import { useTheme } from "../../../context/ThemeContext";
import logo from "../../../assets/logo.png";

export const LandingPage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-[#2f4858] dark:text-gray-200 transition-colors duration-300">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 shadow-sm transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex-shrink-0 flex items-center gap-2">
              <img src={logo} alt="RehabilitAR Logo" className="h-8 w-auto dark:brightness-200" />
              <span className="font-bold text-xl text-[#2F6274] dark:text-[#6DD3A8]">RehabilitAR</span>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#nosotros" className="text-[#2F6274] dark:text-gray-300 hover:text-[#48B7A5] dark:hover:text-[#6DD3A8] font-medium transition-colors">
                Nosotros
              </a>
              <a href="#servicios" className="text-[#2F6274] dark:text-gray-300 hover:text-[#48B7A5] dark:hover:text-[#6DD3A8] font-medium transition-colors">
                Servicios
              </a>
              
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full text-gray-500 hover:text-[#48B7A5] dark:text-gray-400 dark:hover:text-[#6DD3A8] focus:outline-none transition-colors"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
              </button>

              {isAuthenticated ? (
                <Link
                  to="/dashboard"
                  className="bg-[#48B7A5] hover:bg-[#309B9B] dark:bg-[#309B9B] dark:hover:bg-[#48B7A5] text-white px-5 py-2 rounded-md font-medium transition-colors"
                >
                  Ir al sistema
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="bg-[#48B7A5] hover:bg-[#309B9B] dark:bg-[#309B9B] dark:hover:bg-[#48B7A5] text-white px-5 py-2 rounded-md font-medium transition-colors"
                >
                  Iniciar sesión
                </Link>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center gap-4">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full text-gray-500 hover:text-[#48B7A5] dark:text-gray-400 dark:hover:text-[#6DD3A8] focus:outline-none transition-colors"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-[#2F6274] dark:text-gray-300 hover:text-[#48B7A5] dark:hover:text-[#6DD3A8] p-2 transition-colors"
                aria-label="Menú principal"
              >
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 px-2 pt-2 pb-3 space-y-1 sm:px-3 shadow-lg transition-colors duration-300">
            <a
              href="#nosotros"
              className="block px-3 py-2 rounded-md text-base font-medium text-[#2F6274] dark:text-gray-300 hover:bg-[#EAF2F8] dark:hover:bg-gray-800 hover:text-[#48B7A5] dark:hover:text-[#6DD3A8] transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Nosotros
            </a>
            <a
              href="#servicios"
              className="block px-3 py-2 rounded-md text-base font-medium text-[#2F6274] dark:text-gray-300 hover:bg-[#EAF2F8] dark:hover:bg-gray-800 hover:text-[#48B7A5] dark:hover:text-[#6DD3A8] transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Servicios
            </a>
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="block w-full text-center mt-4 bg-[#48B7A5] dark:bg-[#309B9B] hover:bg-[#309B9B] dark:hover:bg-[#48B7A5] text-white px-5 py-2 rounded-md font-medium transition-colors"
              >
                Ir al Sistema
              </Link>
            ) : (
              <Link
                to="/login"
                className="block w-full text-center mt-4 bg-[#48B7A5] dark:bg-[#309B9B] hover:bg-[#309B9B] dark:hover:bg-[#48B7A5] text-white px-5 py-2 rounded-md font-medium transition-colors"
              >
                Iniciar Sesión
              </Link>
            )}
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-24 pb-16 md:pt-32 md:pb-24 lg:pt-40 lg:pb-32 overflow-hidden bg-[#EAF2F8] dark:bg-gray-800 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl tracking-tight font-extrabold text-[#2F6274] dark:text-gray-100 sm:text-5xl md:text-6xl">
              <span className="block">Rehabilitación</span>
              <span className="block text-[#48B7A5] dark:text-[#6DD3A8]">personalizada</span>
            </h1>
            <p className="mt-6 max-w-md mx-auto text-lg text-[#2f4858] dark:text-gray-300 sm:text-xl md:mt-8 md:max-w-3xl">
              Mejorá tu calidad de vida con profesionales capacitados. Llevamos más de 16 años acompañando a nuestros pacientes en su recuperación y bienestar.
            </p>
            <div className="mt-8 max-w-md mx-auto sm:flex sm:justify-center md:mt-10">
              <div className="rounded-md shadow">
                <Link
                  to={isAuthenticated ? "/dashboard" : "/register"}
                  className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-[#48B7A5] hover:bg-[#309B9B] dark:bg-[#309B9B] dark:hover:bg-[#48B7A5] transition-colors md:py-4 md:text-lg md:px-10"
                >
                  Comenzar ahora
                  <ChevronRight className="ml-2 -mr-1 h-5 w-5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
        {/* Decorative background shape */}
        <div className="absolute inset-y-0 right-0 w-1/2 bg-[#6DD3A8] opacity-10 dark:opacity-5 rounded-l-[100%] pointer-events-none"></div>
      </section>

      {/* About Us (Nosotros) */}
      <section id="nosotros" className="py-16 md:py-24 bg-white dark:bg-gray-900 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
            <div>
              <h2 className="text-3xl font-extrabold text-[#2F6274] dark:text-gray-100 tracking-tight sm:text-4xl">
                Nuestra historia
              </h2>
              <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
                Somos RehabilitAR, un centro de kinesiología fundado en 2010 con el objetivo de ofrecer un espacio personalizado para el entrenamiento y la rehabilitación kinesiológica. 
              </p>
              <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
                Contamos con un equipo plenamente calificado, que garantiza una rehabilitación eficiente y respetuosa con las necesidades de cada paciente.
              </p>
              <div className="mt-8 flex items-center gap-4 text-[#2C7E8B] dark:text-gray-200">
                <ShieldCheck size={32} className="text-[#6DD3A8]" />
                <span className="font-semibold text-lg">Profesionales kinesiólogos matriculados</span>
              </div>
            </div>
            <div className="mt-12 lg:mt-0 relative rounded-2xl p-8 bg-[#F0F6FB] dark:bg-gray-800 shadow-sm border border-[#D8E3ED] dark:border-gray-700 transition-colors duration-300">
               <div className="flex flex-col gap-6">
                 <div className="flex gap-4">
                   <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-md bg-[#48B7A5] text-white">
                     <Activity size={24} />
                   </div>
                   <div>
                     <h3 className="text-lg font-medium text-[#2F6274] dark:text-gray-100">Enfoque especializado</h3>
                     <p className="mt-2 text-gray-600 dark:text-gray-400">Localización y tratamiento de problemas específicos en diferentes partes del cuerpo.</p>
                   </div>
                 </div>
                 <div className="flex gap-4">
                   <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-md bg-[#48B7A5] text-white">
                     <Activity size={24} />
                   </div>
                   <div>
                     <h3 className="text-lg font-medium text-[#2F6274] dark:text-gray-100">Actividades grupales</h3>
                     <p className="mt-2 text-gray-600 dark:text-gray-400">Ambiente de apoyo y motivación para lograr mejores resultados en la rehabilitación.</p>
                   </div>
                 </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services (Servicios) */}
      <section id="servicios" className="py-16 md:py-24 bg-[#EAF2F8] dark:bg-gray-800 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-[#2F6274] dark:text-gray-100 tracking-tight sm:text-4xl">
              Nuestros servicios
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-600 dark:text-gray-400">
              Ofrecemos clases especializadas, guiadas por profesores expertos.
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {/* Service 1 */}
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 hover:shadow-md transition-all duration-300">
              <div className="w-14 h-14 bg-[#EAF2F8] dark:bg-gray-800 rounded-full flex items-center justify-center mb-6 transition-colors duration-300">
                <Activity className="text-[#309B9B] dark:text-[#6DD3A8]" size={28} />
              </div>
              <h3 className="text-xl font-bold text-[#2F6274] dark:text-gray-100 mb-3">Tren superior</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Ejercicios enfocados en fortalecer y rehabilitar brazos, hombros, pecho y espalda. Ideal para corrección postural y recuperación de lesiones en miembros superiores.
              </p>
            </div>

            {/* Service 2 */}
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 hover:shadow-md transition-all duration-300">
              <div className="w-14 h-14 bg-[#EAF2F8] dark:bg-gray-800 rounded-full flex items-center justify-center mb-6 transition-colors duration-300">
                <Activity className="text-[#309B9B] dark:text-[#6DD3A8]" size={28} />
              </div>
              <h3 className="text-xl font-bold text-[#2F6274] dark:text-gray-100 mb-3">Tren medio</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Trabajo centrado en la zona abdominal y lumbar. Fundamental para la estabilidad del cuerpo, equilibrio y prevención de dolores de espalda.
              </p>
            </div>

            {/* Service 3 */}
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 hover:shadow-md transition-all duration-300">
              <div className="w-14 h-14 bg-[#EAF2F8] dark:bg-gray-800 rounded-full flex items-center justify-center mb-6 transition-colors duration-300">
                <Activity className="text-[#309B9B] dark:text-[#6DD3A8]" size={28} />
              </div>
              <h3 className="text-xl font-bold text-[#2F6274] dark:text-gray-100 mb-3">Tren inferior</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Rutinas destinadas a piernas y glúteos. Mejora la fuerza, resistencia y movilidad, asistiendo en la recuperación de rodillas, caderas y tobillos.
              </p>
            </div>
          </div>

          {/* Abonado Benefits */}
          <div className="mt-16 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-[#6DD3A8] overflow-hidden lg:flex transition-colors duration-300">
            <div className="p-8 lg:w-2/3">
              <h3 className="text-2xl font-bold text-[#2F6274] dark:text-gray-100 mb-4">¿Por qué ser abonado?</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Accedé a beneficios exclusivos pagando una cuota mensual. Garantizá tu lugar en las actividades recurrentes y organizá tu rutina con anticipación.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <ShieldCheck className="text-[#48B7A5] dark:text-[#6DD3A8] mr-2 flex-shrink-0" size={20} />
                  <span className="text-gray-700 dark:text-gray-300">Turnos fijos por semana.</span>
                </li>
                <li className="flex items-start">
                  <ShieldCheck className="text-[#48B7A5] dark:text-[#6DD3A8] mr-2 flex-shrink-0" size={20} />
                  <span className="text-gray-700 dark:text-gray-300">Sistema de créditos y reintegros ante cancelaciones.</span>
                </li>
                <li className="flex items-start">
                  <ShieldCheck className="text-[#48B7A5] dark:text-[#6DD3A8] mr-2 flex-shrink-0" size={20} />
                  <span className="text-gray-700 dark:text-gray-300">Prioridad preferencial en listas de espera.</span>
                </li>
              </ul>
            </div>
            <div className="bg-[#48B7A5] dark:bg-[#2F6274] p-8 lg:w-1/3 flex flex-col justify-center items-center text-center transition-colors duration-300">
              <h4 className="text-white text-xl font-bold mb-2">Planes flexibles</h4>
              <p className="text-[#EAF2F8] dark:text-gray-300 mb-6">
                También podés asistir a clases esporádicas abonando por sesión.
              </p>
              <Link
                to="/register"
                className="bg-white dark:bg-[#48B7A5] text-[#2F6274] dark:text-white font-bold py-3 px-6 rounded-md hover:bg-gray-100 dark:hover:bg-[#309B9B] transition-colors w-full"
              >
                Sumate a RehabilitAR
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#2f4858] dark:bg-gray-950 text-white py-12 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img src={logo} alt="RehabilitAR Logo" className="h-8 w-auto brightness-0 invert" />
              <span className="font-bold text-xl">RehabilitAR</span>
            </div>
            <p className="text-gray-300 dark:text-gray-400">
              Centro de entrenamiento y rehabilitación.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-lg mb-4 text-[#6DD3A8]">Contacto</h4>
            <ul className="space-y-3">
              <li className="flex items-center text-gray-300 dark:text-gray-400">
                <MapPin size={18} className="mr-2 text-[#48B7A5] dark:text-[#6DD3A8]" />
                <span>La Plata, Buenos Aires, Argentina</span>
              </li>
              <li className="flex items-center text-gray-300 dark:text-gray-400">
                <Phone size={18} className="mr-2 text-[#48B7A5] dark:text-[#6DD3A8]" />
                <span>+54 9 221 XXX-XXXX</span>
              </li>
              <li className="flex items-center text-gray-300 dark:text-gray-400">
                <Mail size={18} className="mr-2 text-[#48B7A5] dark:text-[#6DD3A8]" />
                <span>contacto@rehabilitar.com</span>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-lg mb-4 text-[#6DD3A8]">Horarios</h4>
            <ul className="space-y-3">
              <li className="flex items-center text-gray-300 dark:text-gray-400">
                <Clock size={18} className="mr-2 text-[#48B7A5] dark:text-[#6DD3A8]" />
                <span>Lunes a Viernes: 08:00 - 20:00</span>
              </li>
              <li className="flex items-center text-gray-300 dark:text-gray-400">
                <Clock size={18} className="mr-2 text-[#48B7A5] dark:text-[#6DD3A8]" />
                <span>Sábados: 09:00 - 13:00</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-8 border-t border-gray-600 dark:border-gray-800 text-sm text-gray-400 flex flex-col md:flex-row justify-between items-center transition-colors duration-300">
          <p>&copy; 2026 RehabilitAR. Todos los derechos reservados.</p>
          <div className="mt-4 md:mt-0 space-x-4">
            <a href="#" className="hover:text-white transition-colors">Términos y Condiciones</a>
            <a href="#" className="hover:text-white transition-colors">Política de Privacidad</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
