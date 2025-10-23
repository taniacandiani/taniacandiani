'use client';

import { useState, useMemo, useRef, useEffect, useCallback, memo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Project, ProjectCategory, SortOption, ViewMode, FilterState } from '@/types';
import ProjectCard from '@/components/ui/ProjectCard';
import { useLanguage } from '@/contexts/LanguageContext';

interface ProjectsSectionProps {
  projects: Project[];
  categories: ProjectCategory[];
}

const ProjectsSection: React.FC<ProjectsSectionProps> = ({ projects, categories }) => {
  const { language } = useLanguage();
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
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [categoriesAccordionOpen, setCategoriesAccordionOpen] = useState(false);
  const [yearAccordionOpen, setYearAccordionOpen] = useState(false);
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
    // Asegurar que no hay proyectos duplicados por ID
    const uniqueProjects = projects.filter((project, index, self) => 
      index === self.findIndex(p => p.id === project.id)
    );

    let filtered = uniqueProjects;

    // Filtrar por término de búsqueda
    if (filterState.searchTerm) {
      const searchLower = filterState.searchTerm.toLowerCase();
      filtered = filtered.filter(project =>
        project.title.toLowerCase().includes(searchLower) ||
        project.categories?.some(cat => cat.toLowerCase().includes(searchLower)) ||
        project.description?.toLowerCase().includes(searchLower) ||
        project.tags?.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    // Filtrar por categoría
    if (filterState.selectedCategory) {
      filtered = filtered.filter(project => 
        project.categories?.includes(filterState.selectedCategory!)
      );
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
        const aFirstCat = a.categories?.[0] || '';
        const bFirstCat = b.categories?.[0] || '';
        return aFirstCat.localeCompare(bFirstCat);
      }
      return a.title.localeCompare(b.title);
    });

    return filtered;
  }, [projects, filterState]);

  return (
    <div className="container-mobile py-4 lg:py-8 pt-8 lg:pt-16">
      {/* Header */}
      <div className="mb-8 lg:mb-16 flex justify-between items-center">
        <div className="flex items-center gap-3">
          {/* Toggle sidebar button - solo desktop */}
          <button
            onClick={() => setSidebarVisible(!sidebarVisible)}
            className="hidden lg:flex p-1 hover:bg-gray-100 rounded-md transition-colors items-center justify-center cursor-pointer"
            aria-label={sidebarVisible ? "Ocultar sidebar" : "Mostrar sidebar"}
          >
            <span
              className="material-symbols-outlined leading-none -mt-1"
              style={{ fontSize: '32px' }}
            >
              thumbnail_bar
            </span>
          </button>

          {/* Botón de cambio de vista - a la izquierda en mobile */}
          <button
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            className="lg:hidden flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-100 p-2 rounded-md transition-all duration-300 ease-in-out hover:scale-105"
          >
            <span
              className="material-symbols-outlined transition-all duration-300 ease-in-out"
              style={{ fontSize: '32px' }}
            >
              {viewMode === 'grid' ? 'calendar_view_day' : 'calendar_view_month'}
            </span>
          </button>

          <h1 className="text-2xl md:text-4xl font-medium tracking-widest text-black">{language === 'en' ? 'PROJECTS' : 'PROYECTOS'}</h1>
        </div>
        <div className="flex items-center gap-4">
          {/* Botón de cambio de vista - solo desktop */}
          <button
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            className="hidden lg:flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-100 p-2 rounded-md transition-all duration-300 ease-in-out hover:scale-105"
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
                {filterState.sortBy === 'date' && (language === 'en' ? 'Order by date' : 'Orden por fecha')}
                {filterState.sortBy === 'title' && (language === 'en' ? 'Order by name' : 'Orden por nombre')}
                {filterState.sortBy === 'category' && (language === 'en' ? 'Order by category' : 'Orden por categoría')}
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
                  {language === 'en' ? 'Order by date' : 'Orden por fecha'}
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
                  {language === 'en' ? 'Order by name' : 'Orden por nombre'}
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
                  {language === 'en' ? 'Order by category' : 'Orden por categoría'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filters - Acordeones arriba */}
      <div className="lg:hidden mb-8 space-y-4">
        {/* Búsqueda - siempre visible */}
        <div className="pb-4">
          <div className="relative">
            <input
              type="text"
              placeholder={language === 'en' ? 'Search projects...' : 'Buscar proyectos...'}
              value={filterState.searchTerm}
              onChange={(e) => updateFilter({ searchTerm: e.target.value })}
              className="w-full border-0 border-b border-gray-300 pl-0 pr-7 py-2 text-base bg-transparent placeholder-black"
            />
            <svg
              className="absolute right-0 top-1/2 -translate-y-1/2 w-5 h-5 text-black"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Categorías Accordion */}
        <div className="border-b border-gray-300">
          <button
            onClick={() => setCategoriesAccordionOpen(!categoriesAccordionOpen)}
            className="w-full flex justify-between items-center py-3 text-left"
          >
            <h4 className="text-lg font-medium">{language === 'en' ? 'Categories' : 'Categorías'}</h4>
            <svg
              className={`w-5 h-5 transition-transform ${categoriesAccordionOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {categoriesAccordionOpen && (
            <div className="pb-4 space-y-2">
              <button
                onClick={() => updateFilter({ selectedCategory: null })}
                className={`block w-full text-left py-1 text-base ${
                  filterState.selectedCategory === null ? 'text-black font-medium' : 'text-gray-500'
                }`}
              >
                {language === 'en' ? 'All categories' : 'Todas las categorías'}
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => updateFilter({ selectedCategory: category.name })}
                  className={`block w-full text-left py-1 text-base ${
                    filterState.selectedCategory === category.name ? 'text-black font-medium' : 'text-gray-500'
                  }`}
                >
                  {language === 'en' && category.nameEn ? category.nameEn : category.name} ({category.count})
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Año Accordion */}
        <div className="border-b border-gray-300">
          <button
            onClick={() => setYearAccordionOpen(!yearAccordionOpen)}
            className="w-full flex justify-between items-center py-3 text-left"
          >
            <h4 className="text-lg font-medium">{language === 'en' ? 'Year' : 'Año'}</h4>
            <svg
              className={`w-5 h-5 transition-transform ${yearAccordionOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {yearAccordionOpen && (
            <div className="pb-4 space-y-2">
              <button
                onClick={() => updateFilter({ selectedYear: null })}
                className={`block w-full text-left py-1 text-base ${
                  filterState.selectedYear === null ? 'text-black font-medium' : 'text-gray-500'
                }`}
              >
                {language === 'en' ? 'All years' : 'Todos los años'}
              </button>
              {availableYears.map((year) => (
                <button
                  key={year}
                  onClick={() => updateFilter({ selectedYear: year })}
                  className={`block w-full text-left py-1 text-base ${
                    filterState.selectedYear === year ? 'text-black font-medium' : 'text-gray-500'
                  }`}
                >
                  {year}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className={`flex ${sidebarVisible ? 'gap-8' : 'gap-0'} transition-all duration-300 ease-in-out`}>
        {/* Desktop Sidebar */}
        <div className={`hidden lg:block transition-all duration-300 ease-in-out overflow-hidden ${
          sidebarVisible ? 'w-64' : 'w-0'
        }`}>
          <div className="w-64">
            {/* Búsqueda */}
            <div className="mb-8">
              <div className="relative">
                <svg
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-5 text-black"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder={language === 'en' ? 'Search projects...' : 'Buscar proyectos...'}
                  value={filterState.searchTerm}
                  onChange={(e) => updateFilter({ searchTerm: e.target.value })}
                  className="w-full border-0 border-b border-gray-300 pl-7 pr-0 py-2 text-base bg-transparent placeholder-black"
                />
              </div>
            </div>

            {/* Categorías */}
            <div className="mb-8 pb-6 border-b border-[#E6E0E0]">
              <h4 className="projects-h4 text-lg font-normal mb-4">{language === 'en' ? 'Categories' : 'Categorías'}</h4>
              <div className="space-y-2">
                <button
                  onClick={() => updateFilter({ selectedCategory: null })}
                  className={`block w-full text-left py-1 text-base transition-all duration-200 ${
                    filterState.selectedCategory === null ? 'text-black' : 'text-gray-500 hover:text-black'
                  }`}
                >
                  {language === 'en' ? 'All categories' : 'Todas las categorías'}
                </button>
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => updateFilter({ selectedCategory: category.name })}
                    className={`block w-full text-left py-1 text-base transition-all duration-200 ${
                      filterState.selectedCategory === category.name ? 'text-black' : 'text-gray-500 hover:text-black'
                    }`}
                  >
                    {language === 'en' && category.nameEn ? category.nameEn : category.name} ({category.count})
                  </button>
                ))}
              </div>
            </div>

            {/* Años */}
            <div className="mb-8 pb-6 border-b border-[#E6E0E0]">
              <h4 className="projects-h4 text-lg font-normal mb-4">{language === 'en' ? 'Year' : 'Año'}</h4>
              <div className="space-y-2">
                <button
                  onClick={() => updateFilter({ selectedYear: null })}
                  className={`block w-full text-left py-1 text-base transition-all duration-200 ${
                    filterState.selectedYear === null ? 'text-black' : 'text-gray-500 hover:text-black'
                  }`}
                >
                  {language === 'en' ? 'All years' : 'Todos los años'}
                </button>
                {availableYears.map((year) => (
                  <button
                    key={year}
                    onClick={() => updateFilter({ selectedYear: year })}
                    className={`block w-full text-left py-1 text-base transition-all duration-200 ${
                      filterState.selectedYear === year ? 'text-black' : 'text-gray-500 hover:text-black'
                    }`}
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
              <p className="text-gray-500">{language === 'en' ? 'No projects found matching the selected filters.' : 'No se encontraron proyectos que coincidan con los filtros seleccionados.'}</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-fadeIn">
              {filteredAndSortedProjects.map((project, index) => (
                <ProjectCard key={project.id} project={project} priority={index === 0} />
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