import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(request: NextRequest) {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY no configurada');
      return NextResponse.json(
        { error: 'Servicio de email no configurado' },
        { status: 500 }
      );
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    const { name, email, subject, message } = await request.json();

    // Validación básica
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'Todos los campos son obligatorios' },
        { status: 400 }
      );
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Email inválido' },
        { status: 400 }
      );
    }

    const contactEmail = process.env.CONTACT_EMAIL || 'info@taniacandiani.com';

    // Enviar email con Resend
    const { data, error } = await resend.emails.send({
      from: 'Tania Candiani <info@taniacandiani.com>',
      to: [contactEmail],
      replyTo: email,
      subject: `[Contacto Web] ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333; border-bottom: 2px solid #000; padding-bottom: 10px;">
            Nuevo mensaje de contacto
          </h2>

          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr>
              <td style="padding: 8px 12px; font-weight: bold; color: #555; width: 100px;">Nombre:</td>
              <td style="padding: 8px 12px; color: #333;">${escapeHtml(name)}</td>
            </tr>
            <tr style="background-color: #f9f9f9;">
              <td style="padding: 8px 12px; font-weight: bold; color: #555;">Email:</td>
              <td style="padding: 8px 12px; color: #333;">
                <a href="mailto:${escapeHtml(email)}" style="color: #000;">${escapeHtml(email)}</a>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 12px; font-weight: bold; color: #555;">Asunto:</td>
              <td style="padding: 8px 12px; color: #333;">${escapeHtml(subject)}</td>
            </tr>
          </table>

          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin-top: 20px;">
            <h3 style="color: #555; margin-top: 0;">Mensaje:</h3>
            <p style="color: #333; line-height: 1.6; white-space: pre-wrap;">${escapeHtml(message)}</p>
          </div>

          <p style="color: #999; font-size: 12px; margin-top: 30px; text-align: center;">
            Este mensaje fue enviado desde el formulario de contacto de taniacandiani.com
          </p>
        </div>
      `,
    });

    if (error) {
      console.error('Resend error:', JSON.stringify(error));
      return NextResponse.json(
        { error: `Error al enviar: ${error.message || 'Unknown error'}` },
        { status: 500 }
      );
    }

    console.log('Email enviado exitosamente:', data);
    return NextResponse.json({ success: true, id: data?.id });

  } catch (error) {
    console.error('Error en /api/contact/submit:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// Sanitizar HTML para prevenir XSS
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
