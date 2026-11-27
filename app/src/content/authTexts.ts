/**
 * Textos de autenticación. Contenido propio (CLAUDE.md §9.10). R-33 aprobada.
 *
 * El aviso describe la Entrega 1: todos los datos se guardan solo en el
 * teléfono (P-57). Hay que revisarlo cuando (1) exista el backend, (2) exista
 * el correo de soporte (P-40) y (3) se confirme la ley aplicable con la
 * universidad o un asesor (P-56). No sustituye una revisión jurídica.
 */
export const PRIVACY_NOTICE_TITLE = 'Aviso de privacidad';
export const PRIVACY_NOTICE_UPDATED_AT = 'Última actualización: 27 de noviembre de 2026';

export interface NoticeSection {
  heading: string;
  body: string;
}

export const PRIVACY_NOTICE_SECTIONS: readonly NoticeSection[] = [
  {
    heading: '1. Responsable',
    body: 'El responsable del tratamiento de los datos personales es el equipo TechPhic, desarrollador de The Life Game (en adelante, "la aplicación").',
  },
  {
    heading: '2. Datos que se recogen',
    body: 'La aplicación trata los siguientes datos que usted proporciona: nombre de usuario, correo electrónico, contraseña (almacenada únicamente de forma cifrada mediante una función hash con sal, que impide leerla), propósito personal, metas y sus categorías, hábitos y su programación, registro de cumplimiento, desafíos, progreso de juego (nivel, experiencia, vidas y moneda virtual) y, de forma opcional, los estados de ánimo que decida registrar.',
  },
  {
    heading: '3. Finalidad',
    body: 'Los datos se utilizan exclusivamente para prestar el servicio: crear y gestionar su cuenta, registrar sus hábitos y su progreso, y adaptar los desafíos y los mensajes motivacionales a su propósito, a sus metas y a su estado de ánimo. No se utilizan con fines publicitarios ni para elaborar perfiles comerciales.',
  },
  {
    heading: '4. Datos de estado de ánimo',
    body: 'El registro del estado de ánimo es voluntario. Si lo realiza, consiente expresamente su tratamiento con la única finalidad de ajustar la dificultad de los desafíos y el tono de los mensajes. Puede usar la aplicación sin registrarlo.',
  },
  {
    heading: '5. Almacenamiento y seguridad',
    body: 'En la versión actual, todos los datos se almacenan únicamente en este dispositivo. No se envían a servidores del responsable ni de terceros. El identificador de sesión se guarda en el almacenamiento seguro del sistema operativo. Cerrar sesión no elimina los datos del dispositivo; desinstalar la aplicación sí los elimina de forma definitiva.',
  },
  {
    heading: '6. Comunicación a terceros',
    body: 'Los datos no se ceden, venden ni comparten con terceros, salvo obligación legal.',
  },
  {
    heading: '7. Derechos del titular',
    body: 'Usted puede conocer, actualizar, rectificar y suprimir sus datos, así como revocar este consentimiento, de acuerdo con la normativa de protección de datos aplicable. Puede ejercer estos derechos desde la propia aplicación cuando la función esté disponible o escribiendo al canal de soporte (próximamente).',
  },
  {
    heading: '8. Menores de edad',
    body: 'Si es menor de edad, debe contar con la autorización de su padre, madre o representante legal para usar la aplicación.',
  },
  {
    heading: '9. Cambios en este aviso',
    body: 'Este aviso se actualizará cuando cambie el tratamiento de los datos, en particular cuando la aplicación incorpore copias de seguridad en servidores. Los cambios relevantes se le comunicarán en la aplicación y, cuando sea necesario, se le pedirá de nuevo su consentimiento.',
  },
];

/** P-40 abierta: aún no existe el correo de soporte. */
export const FORGOT_PASSWORD_TEXT =
  'Escríbenos a soporte (próximamente). El equipo restablece la contraseña a mano después de verificar tu identidad.';
