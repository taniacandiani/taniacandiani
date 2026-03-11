'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/MainLayout';
import { ContactContent } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import RichContent from '@/components/ui/RichContent';

export default function ContactPage() {
  const { language } = useLanguage();
  const [contactContent, setContactContent] = useState<ContactContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    const loadContent = async () => {
      try {
        setLoading(true);
        
        const response = await fetch('/api/contact');
        if (response.ok) {
          const data = await response.json();
          console.log('Contenido de contacto cargado desde API:', data);
          setContactContent(data);
        } else {
          console.log('No se pudo cargar el contenido de contacto desde la API');
          setContactContent(null);
        }
      } catch (error) {
        console.error('Error loading contact data:', error);
        setContactContent(null);
      } finally {
        setLoading(false);
      }
    };

    loadContent();
  }, []);

  // Listen for updates from admin
  useEffect(() => {
    const handleContactUpdate = async () => {
      try {
        const response = await fetch('/api/contact');
        if (response.ok) {
          const data = await response.json();
          setContactContent(data);
        }
      } catch (error) {
        console.error('Error updating contact content:', error);
      }
    };

    window.addEventListener('contactContentUpdated', handleContactUpdate);

    return () => {
      window.removeEventListener('contactContentUpdated', handleContactUpdate);
    };
  }, []);

  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const response = await fetch('/api/contact/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al enviar el mensaje');
      }

      setSubmitStatus('success');
      setFormData({ name: '', email: '', subject: '', message: '' });

      // Resetear el estado después de 5 segundos
      setTimeout(() => setSubmitStatus('idle'), 5000);
    } catch (error) {
      console.error('Error submitting form:', error);
      setSubmitStatus('error');
      setErrorMessage(
        error instanceof Error ? error.message : 'Error al enviar el mensaje'
      );

      // Resetear el error después de 5 segundos
      setTimeout(() => {
        setSubmitStatus('idle');
        setErrorMessage('');
      }, 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto"></div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!contactContent) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="text-gray-400 text-6xl mb-4">📧</div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">{language === 'en' ? 'No content available' : 'No hay contenido'}</h1>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-white pt-16 pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl md:text-4xl font-medium tracking-widest text-black mb-3">
              {language === 'en' && contactContent.title_en ? contactContent.title_en : contactContent.title}
            </h1>
            <div className="text-lg text-black max-w-2xl">
              <RichContent
                content={language === 'en' && contactContent.description_en ? contactContent.description_en : contactContent.description}
                className="text-black leading-relaxed"
              />
            </div>
          </div>

          {/* Direct Email */}
          <div className="mb-8 flex items-center gap-3 text-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-black" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
            </svg>
            <span className="text-sm text-gray-500">
              {language === 'en' ? 'Or email us directly at:' : 'O escríbenos directamente a:'}
            </span>
            <a
              href="mailto:info@taniacandiani.com"
              className="text-black font-medium hover:underline"
            >
              info@taniacandiani.com
            </a>
          </div>

          {/* Contact Form */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            {submitStatus === 'success' ? (
              <div className="text-center py-8">
                <div className="text-green-500 text-6xl mb-4">✓</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{language === 'en' ? 'Message sent!' : '¡Mensaje enviado!'}</h3>
                <p className="text-gray-600">{language === 'en' ? 'Thank you for contacting us. We will respond soon.' : 'Gracias por contactarnos. Te responderemos pronto.'}</p>
              </div>
            ) : submitStatus === 'error' ? (
              <div className="text-center py-8">
                <div className="text-red-500 text-6xl mb-4">✕</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{language === 'en' ? 'Error sending message' : 'Error al enviar el mensaje'}</h3>
                <p className="text-gray-600 mb-4">{errorMessage || (language === 'en' ? 'Please try again later.' : 'Por favor intenta de nuevo más tarde.')}</p>
                <button
                  onClick={() => setSubmitStatus('idle')}
                  className="bg-black text-white px-6 py-2 rounded-md hover:bg-gray-800 transition-colors"
                >
                  {language === 'en' ? 'Try again' : 'Intentar de nuevo'}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      {language === 'en' ? 'Name *' : 'Nombre *'}
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent transition-colors"
                      placeholder={language === 'en' ? 'Your full name' : 'Tu nombre completo'}
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
                      placeholder={language === 'en' ? 'your@email.com' : 'tu@email.com'}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'en' ? 'Subject *' : 'Asunto *'}
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    required
                    value={formData.subject}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent transition-colors"
                    placeholder={language === 'en' ? 'How can we help you?' : '¿En qué podemos ayudarte?'}
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'en' ? 'Message *' : 'Mensaje *'}
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows={6}
                    value={formData.message}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent transition-colors resize-none"
                    placeholder={language === 'en' ? 'Write your message here...' : 'Escribe tu mensaje aquí...'}
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-black text-white px-8 py-3 rounded-md hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    {isSubmitting
                      ? (language === 'en' ? 'Sending...' : 'Enviando...')
                      : (language === 'en' ? 'Send Message' : 'Enviar Mensaje')}
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
