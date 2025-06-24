  import Image from "next/image";
  import Section from '@/components/Section';
  import Hero from '@/components/Hero';

  export default function Home() {
    const slides = [
      {
        image: 'fondo1.jpg',
        title: 'Desminar',
        text:  'Las placas de metal que conforman Fragmentos, Espacio de Arte y Memoria, creado en 2017 por la artista Doris Salcedo en la ciudad de Bogotá, son para Candiani una alegoría del campo tras la batalla, su pavimento de violencia reconfigurada guarda los restos de la guerra',
      },
      {
        image: 'fondo2.jpg',
        title: 'Desminar',
        text:  'Las placas de metal que conforman Fragmentos, Espacio de Arte y Memoria, creado en 2017 por la artista Doris Salcedo en la ciudad de Bogotá, son para Candiani una alegoría del campo tras la batalla, su pavimento de violencia reconfigurada guarda los restos de la guerra',
      },
      {
        image: 'fondo3.jpg',
        title: 'Desminar',
        text:  'Las placas de metal que conforman Fragmentos, Espacio de Arte y Memoria, creado en 2017 por la artista Doris Salcedo en la ciudad de Bogotá, son para Candiani una alegoría del campo tras la batalla, su pavimento de violencia reconfigurada guarda los restos de la guerra',
      },
    ];

    return (
      <div>
        <Hero slides={slides} />

        <Section>
          <div className="py-40">
            <h3 className="text-5xl font-bold mb-12">Noticias</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* News Column 1 */}
              <div className="flex flex-col">
                <div className="border-b border-gray-200 pb-12 h-[300px]">
                  <Image
                    src="/fondo1.jpg"
                    alt="News 1"
                    width={400}
                    height={300}
                    className="w-full h-full object-cover rounded-[5px]"
                  />
                </div>
                <h4 className="text-2xl font-semibold mt-8 mb-4">Lorem Ipsum</h4>
                <p className="text-gray-700 mb-4">
                  Las placas de metal que conforman Fragmentos, Espacio de Arte y Memoria, 
                  creado en 2017 por la artista Doris Salcedo en la ciudad de Bogotá
                </p>
                <a href="#" className="flex items-center text-2xl pt-5 text-black hover:underline">
                  Leer Más 
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              </div>

              {/* News Column 2 */}
              <div className="flex flex-col">
                <div className="border-b border-gray-200 pb-12 h-[300px]">
                  <Image
                    src="/fondo2.jpg"
                    alt="News 2"
                    width={400}
                    height={300}
                    className="w-full h-full object-cover rounded-[5px]"
                  />
                </div>
                <h4 className="text-2xl font-semibold mt-8 mb-4">Lorem Ipsum</h4>
                <p className="text-gray-700 mb-4">
                  Las placas de metal que conforman Fragmentos, Espacio de Arte y Memoria, 
                  creado en 2017 por la artista Doris Salcedo en la ciudad de Bogotá
                </p>
                <a href="#" className="flex items-center text-2xl pt-5 text-black hover:underline">
                  Leer Más 
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              </div>

              {/* News Column 3 */}
              <div className="flex flex-col">
                <div className="border-b border-gray-200 pb-12 h-[300px]">
                  <Image
                    src="/fondo3.jpg"
                    alt="News 3"
                    width={400}
                    height={300}
                    className="w-full h-full object-cover rounded-[5px]"
                  />
                </div>
                <h4 className="text-2xl font-semibold mt-8 mb-4">Lorem Ipsum</h4>
                <p className="text-gray-700 mb-4">
                  Las placas de metal que conforman Fragmentos, Espacio de Arte y Memoria, 
                  creado en 2017 por la artista Doris Salcedo en la ciudad de Bogotá
                </p>
                <a href="#" className="flex items-center text-2xl pt-5 text-black hover:underline">
                  Leer Más 
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </Section>
      </div>
    );
  }
