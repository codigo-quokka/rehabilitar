import { useEffect, useState } from 'react';
import { MainLayout } from '../../../components/layout';
import { Card } from '../../../components/ui';
import { actividadesApi } from '../../../api';
import { Actividad } from '../../../types';

export function CalendarioPage() {
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const data = await actividadesApi.getAll({ fecha: `${year}-${month}` });
        setActividades(data);
      } catch (err) {
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [currentDate]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days: (number | null)[] = [];
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  const getActividadesForDay = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return actividades.filter((a) => a.fechaYHora.startsWith(dateStr));
  };

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ];

  const days = getDaysInMonth(currentDate);
  const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  return (
    <MainLayout title="Calendario">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-dark dark:text-gray-100">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={prevMonth}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={nextMonth}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        <Card padding="none">
          <div className="grid grid-cols-7 border-b border-border dark:border-gray-700">
            {weekDays.map((day) => (
              <div key={day} className="p-3 text-center text-sm font-medium text-gray-500 dark:text-gray-400">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {days.map((day, index) => {
              const dayActividades = day ? getActividadesForDay(day) : [];
              const isToday = day === new Date().getDate() &&
                currentDate.getMonth() === new Date().getMonth() &&
                currentDate.getFullYear() === new Date().getFullYear();

              return (
                <div
                  key={index}
                  className={`min-h-24 p-2 border-b border-r border-border dark:border-gray-700 ${
                    day ? 'hover:bg-gray-50 dark:hover:bg-gray-800/50' : 'bg-gray-50 dark:bg-gray-800/30'
                  }`}
                >
                  {day && (
                    <>
                      <div className={`text-sm font-medium mb-1 ${isToday ? 'text-primary' : 'text-dark dark:text-gray-100'}`}>
                        {day}
                        {isToday && (
                          <span className="ml-1 text-xs text-primary">Hoy</span>
                        )}
                      </div>
                      <div className="space-y-1">
                        {dayActividades.slice(0, 2).map((act) => (
                          <div
                            key={act.id}
                            className="text-xs p-1 bg-primary/10 text-primary rounded truncate"
                          >
                            {new Date(act.fechaYHora).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} {act.nombre}
                          </div>
                        ))}
                        {dayActividades.length > 2 && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            +{dayActividades.length - 2} más
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </MainLayout>
  );
}