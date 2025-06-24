import React from 'react';
import Section from '@/components/Section';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-gray-200">
      <Section fullWidth indented>
        <div className="py-5 flex justify-between items-center">
                  <div className="text-2xl font-medium tracking-widest">
            TANIA CANDIANI <span className="text-lg">©</span>
          </div>
          <div className="flex-1 flex justify-center">
            <nav className="mx-auto">
              <ul className="flex space-x-8">
                <li>
                  <a href="/proyectos" className="hover:underline">
                    Proyectos
                  </a>
                </li>
                <li>
                  <a href="/noticias" className="hover:underline">
                    Noticias
                  </a>
                </li>
                <li>
                  <a href="/acerca" className="hover:underline">
                    Acerca
                  </a>
                </li>
                <li>
                  <a href="/contacto" className="hover:underline">
                    Contacto
                  </a>
                </li>
              </ul>
            </nav>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <button className="hover:text-gray-600 font-bold">Español</button>
              <span className="text-gray-400">|</span>
              <button className="hover:text-gray-600">English</button>
            </div>
          </div>
        </div>
      </Section>
    </footer>
  );
};

export default Footer; 