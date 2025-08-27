'use client';

import { useState, useMemo, useRef, useEffect, useCallback, memo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Project, ProjectCategory, SortOption, ViewMode, FilterState } from '@/types';
import ProjectCard from '@/components/ui/ProjectCard';

interface ProjectsSectionProps {
  projects: Project[];
  categories: ProjectCategory[];
}

const ProjectsSection: React.FC<ProjectsSectionProps> = ({ projects, categories }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filterState, setFilterState] = useState<FilterState>({
    searchTerm: '',
    selectedCategory: null,
    selectedYear: null,
    sortBy: 'date'
  });
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Initialize filters from URL params
  useEffect(() => {
    const category = searchParams.get('category');
    const year = searchParams.get('year');
    const search = searchParams.get('search');
    
    setFilterState(prev => ({
      ...prev,
      selectedCategory: category || null,
      selectedYear: year ? parseInt(year) : null,
      searchTerm: search || ''
    }));
  }, [searchParams]);

  // Manejar click fuera del dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Obtener años únicos de los proyectos
  const availableYears = useMemo(() => {
    const years = [...new Set(projects.map(p => p.year))];
    return years.sort((a, b) => b - a);
  }, [projects]);

  // Filter update functions
  const updateFilter = useCallback((updates: Partial<FilterState>) => {
    setFilterState(prev => ({ ...prev, ...updates }));
  }, []);



  // Filtrar y ordenar proyectos
  const filteredAndSortedProjects = useMemo(() => {
    let filtered = projects;

    // Filtrar por término de búsqueda
    if (filterState.searchTerm) {
      const searchLower = filterState.searchTerm.toLowerCase();
      filtered = filtered.filter(project =>
        project.title.toLowerCase().includes(searchLower) ||
        project.category.toLowerCase().includes(searchLower) ||
        project.description?.toLowerCase().includes(searchLower) ||
        project.tags?.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    // Filtrar por categoría
    if (filterState.selectedCategory) {
      filtered = filtered.filter(project => project.category === filterState.selectedCategory);
    }

    // Filtrar por año
    if (filterState.selectedYear) {
      filtered = filtered.filter(project => project.year === filterState.selectedYear);
    }

    // Ordenar
    filtered = [...filtered].sort((a, b) => {
      if (filterState.sortBy === 'date') {
        return b.year - a.year;
      } else if (filterState.sortBy === 'category') {
        return a.category.localeCompare(b.category);
      }
      return a.title.localeCompare(b.title);
    });

    return filtered;
  }, [projects, filterState]);

  return (
    <div className="container-mobile py-8 pt-16">
      {/* Header con Toggle Button y Título alineados */}
      <div className="mb-16 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setSidebarVisible(!sidebarVisible)}
            className="p-1 hover:bg-gray-100 rounded-md transition-colors flex items-center justify-center cursor-pointer"
            aria-label={sidebarVisible ? "Ocultar sidebar" : "Mostrar sidebar"}
          >
            <span 
              className="material-symbols-outlined leading-none -mt-1" 
              style={{ fontSize: '32px' }}
            >
              thumbnail_bar
            </span>
          </button>
          <h4 className="text-2xl leading-none">Proyectos</h4>
        </div>
        <div className="flex items-center gap-4">
          {/* Botón de cambio de vista */}
          <button
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            className="flex items-center gap-2 text-sm cursor-pointer  hover:bg-gray-100 p-2 rounded-md transition-all duration-300 ease-in-out hover:scale-105"
          >
            <span 
              className="material-symbols-outlined transition-all duration-300 ease-in-out" 
              style={{ fontSize: '32px' }}
            >
              {viewMode === 'grid' ? 'calendar_view_day' : 'calendar_view_month'}
            </span>
          </button>
          
          {/* Dropdown de ordenamiento */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 text-sm cursor-pointer "
            >
              <span>
                {filterState.sortBy === 'date' && 'Orden por fecha'}
                {filterState.sortBy === 'title' && 'Orden por nombre'} 
                {filterState.sortBy === 'category' && 'Orden por categoría'}
              </span>
              <svg 
                width="12" 
                height="8" 
                viewBox="0 0 12 8" 
                fill="none" 
                className={`transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
              >
                <path 
                  d="M1 1L6 6L11 1" 
                  stroke="#000000" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            
            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-2 bg-black text-white rounded-sm shadow-lg z-50 min-w-[160px]">
                <button
                  onClick={() => {
                    updateFilter({ sortBy: 'date' });
                    setDropdownOpen(false);
                  }}
                  className={`block w-full text-left px-4 py-3 text-sm hover:bg-gray-800 transition-colors ${
                    filterState.sortBy === 'date' ? 'bg-gray-800' : ''
                  }`}
                >
                  Orden por fecha
                </button>
                <button
                  onClick={() => {
                    updateFilter({ sortBy: 'title' });
                    setDropdownOpen(false);
                  }}
                  className={`block w-full text-left px-4 py-3 text-sm hover:bg-gray-800 transition-colors ${
                    filterState.sortBy === 'title' ? 'bg-gray-800' : ''
                  }`}
                >
                  Orden por nombre
                </button>
                <button
                  onClick={() => {
                    updateFilter({ sortBy: 'category' });
                    setDropdownOpen(false);
                  }}
                  className={`block w-full text-left px-4 py-3 text-sm hover:bg-gray-800 transition-colors ${
                    filterState.sortBy === 'category' ? 'bg-gray-800' : ''
                  }`}
                >
                  Orden por categoría
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={`flex ${sidebarVisible ? 'gap-8' : 'gap-0'} transition-all duration-300 ease-in-out`}>
        {/* Sidebar */}
        <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
          sidebarVisible ? 'w-64' : 'w-0'
        }`}>
          <div className="w-64">
            
            {/* Búsqueda */}
            <div className="mb-8">
              <h4 className="projects-h4 text-lg font-normal mb-4">Búsqueda</h4>
              <input
                type="text"
                placeholder="Buscar proyectos..."
                value={filterState.searchTerm}
                onChange={(e) => updateFilter({ searchTerm: e.target.value })}
                className="w-full border-0 border-b border-gray-300 px-0 py-2 text-base   bg-transparent"
                aria-label="Buscar proyectos por título, categoría o descripción"
              />
            </div>

          {/* Categorías */}
          <div className="mb-8 pb-6 border-b border-[#E6E0E0]">
            <h4 className="projects-h4 text-lg font-normal mb-4">Categorías</h4>
            <div className="space-y-2">
              <button
                onClick={() => updateFilter({ selectedCategory: null })}
                className={`block w-full text-left py-1 text-base transition-all duration-200 ${
                  filterState.selectedCategory === null
                    ? 'text-black'
                    : 'text-gray-500 hover:text-black'
                }`}
                aria-pressed={filterState.selectedCategory === null}
              >
                Todas las categorías
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => updateFilter({ selectedCategory: category.name })}
                  className={`block w-full text-left py-1 text-base transition-all duration-200 ${
                    filterState.selectedCategory === category.name
                      ? 'text-black'
                      : 'text-gray-500 hover:text-black'
                  }`}
                  aria-pressed={filterState.selectedCategory === category.name}
                >
                  {category.name} ({category.count})
                </button>
              ))}
            </div>
          </div>

          {/* Años */}
          <div className="mb-8 pb-6 border-b border-[#E6E0E0]">
            <h4 className="projects-h4 text-lg font-normal mb-4">Año</h4>
            <div className="space-y-2">
              <button
                onClick={() => updateFilter({ selectedYear: null })}
                className={`block w-full text-left py-1 text-base transition-all duration-200 ${
                  filterState.selectedYear === null
                    ? 'text-black'
                    : 'text-gray-500 hover:text-black'
                }`}
                aria-pressed={filterState.selectedYear === null}
              >
                Todos los años
              </button>
              {availableYears.map((year) => (
                <button
                  key={year}
                  onClick={() => updateFilter({ selectedYear: year })}
                  className={`block w-full text-left py-1 text-base transition-all duration-200 ${
                    filterState.selectedYear === year
                      ? 'text-black'
                      : 'text-gray-500 hover:text-black'
                  }`}
                  aria-pressed={filterState.selectedYear === year}
                >
                  {year}
                </button>
              ))}
            </div>
          </div>
          </div>
        </div>

        {/* Grilla de proyectos */}
        <div className={`flex-1 transition-all duration-300 ease-in-out ${
          !sidebarVisible ? '-ml-0' : ''
        }`}>
          
          {filteredAndSortedProjects.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No se encontraron proyectos que coincidan con los filtros seleccionados.</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-fadeIn">
              {filteredAndSortedProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          ) : (
            <div className="space-y-12 animate-fadeIn">
              {filteredAndSortedProjects.map((project) => (
                <div 
                  key={project.id} 
                  className="relative w-full h-[500px] bg-cover bg-center rounded-lg overflow-hidden group cursor-pointer"
                  style={{
                    backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(${project.image})`
                  }}
                  onClick={() => {
                    router.push(`/proyectos/${project.slug}`);
                  }}
                >
                  <div className="absolute inset-0 p-8 flex flex-col justify-end text-white">
                    <div>
                      <h2 className="text-4xl font-bold mb-4">{project.title}</h2>
                      <div className="max-w-2xl">
                        <p className="text-lg leading-relaxed">
                          {project.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default memo(ProjectsSection); 