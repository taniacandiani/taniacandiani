'use client';

import { useEffect, useState } from 'react';
import MainLayout from '@/components/MainLayout';
import { ContactContent } from '@/types';
import { ContactStorage } from '@/lib/contactStorage';
import { CONTACT_CONTENT } from '@/data/content';

export default function ContactPage() {
  const [contactContent, setContactContent] = useState<ContactContent | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    const stored = ContactStorage.get();
    if (stored) {
      setContactContent(stored);
    } else {
      // initialize with defaults
      ContactStorage.save(CONTACT_CONTENT);
      setContactContent(CONTACT_CONTENT);
    }

    const handleUpdated = (e: Event) => {
      const detail = (e as CustomEvent<ContactContent>).detail;
      setContactContent(detail || CONTACT_CONTENT);
    };
    window.addEventListener('contactContentUpdated', handleUpdated as EventListener);
    return () => window.removeEventListener('contactContentUpdated', handleUpdated as EventListener);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simular envío del formulario
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setSubmitStatus('success');
    setFormData({ name: '', email: '', subject: '', message: '' });
    setIsSubmitting(false);
    
    // Resetear el estado después de 3 segundos
    setTimeout(() => setSubmitStatus('idle'), 3000);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (!contactContent) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="text-gray-400 text-6xl mb-4">📧</div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">Cargando...</h1>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {contactContent.title}
            </h1>
            <p className="text-lg text-black max-w-2xl">
              {contactContent.description}
            </p>
          </div>

          {/* Contact Form */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            {submitStatus === 'success' ? (
              <div className="text-center py-8">
                <div className="text-green-500 text-6xl mb-4">✓</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">¡Mensaje enviado!</h3>
                <p className="text-gray-600">Gracias por contactarnos. Te responderemos pronto.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent transition-colors"
                      placeholder="Tu nombre completo"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent transition-colors"
                      placeholder="tu@email.com"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                    Asunto *
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    required
                    value={formData.subject}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent transition-colors"
                    placeholder="¿En qué podemos ayudarte?"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    Mensaje *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows={6}
                    value={formData.message}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent transition-colors resize-none"
                    placeholder="Escribe tu mensaje aquí..."
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-black text-white px-8 py-3 rounded-md hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    {isSubmitting ? 'Enviando...' : 'Enviar Mensaje'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
