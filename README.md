# Tutorly 3.0

## Arrancar en Windows

Descomprime el ZIP y abre la carpeta Tutorly en Visual Studio Code. Inicia el servicio de MongoDB. Si tu versión anterior utilizaba una conexión personalizada, copia su archivo de configuración local .env a la carpeta tutorly Backend de esta versión. La conexión predeterminada es mongodb://127.0.0.1:27017/tutorly_db.

En la terminal PowerShell de la carpeta Tutorly ejecuta:

~~~powershell
cd ".\tutorly Backend"
npm.cmd ci
npm.cmd start
~~~

Abre http://localhost:3000 e inicia sesión con tu cuenta anterior. Si el puerto ya está ocupado por Tutorly 2.0, presiona Ctrl+C en la terminal del servidor anterior antes de arrancar el nuevo.

Solo para una instalación sin administrador, ejecuta desde tutorly Backend el comando siguiente. La contraseña inicial aparece en tu terminal.

~~~powershell
npm.cmd run admin -- admin@universidad.edu
~~~

## Probar como administrador, estudiante y asesor

1. En Gestión académica → Materias crea una materia si la base está vacía. En Cuentas selecciona un perfil existente por nombre o elige Registrar una persona nueva. Para un asesor nuevo selecciona las materias que orienta. Define el correo y la contraseña de acceso. El código del perfil nuevo se genera automáticamente.
2. Entra como estudiante y abre Solicitar asesoría. Elige la materia y el profesor, describe el ejercicio y adjunta opcionalmente un PDF, JPG o PNG de hasta 3 MB. En Solicitudes puedes descargar el archivo enviado, escribirle al profesor o cancelar una solicitud pendiente.
3. Entra como asesor y abre Solicitudes. Descarga el material, responde al estudiante y pulsa Aprobar. Elige fecha, hora y salón o enlace virtual. Al guardar, la sesión aparecerá en Mi agenda. Las franjas de disponibilidad registradas se respetan en hora de Colombia.
4. Para una tutoría grupal, usa Publicar tutoría en la cuenta del asesor. Como estudiante, abre Explorar tutorías, busca el tema e inscríbete. En Mi agenda puedes confirmar que asistirás, cancelar antes del inicio o subir material. Cada inscripción admite un archivo que el estudiante puede actualizar.
5. Una vez iniciada la sesión, el asesor registra la asistencia de cada participante desde Mi agenda. Después de finalizarla, cada estudiante presente puede valorarla una vez. Avisos muestra cambios en las sesiones y solicitudes. En administración, Demanda por materia muestra solicitudes pendientes, grupos llenos y asistencias registradas en las nuevas sesiones.
6. En Cuentas un administrador puede otorgar administración a otra cuenta académica activa. La confirmación cambia su rol y requiere un nuevo inicio de sesión de esa persona.

La aplicación usa el frontend JavaScript existente, Express y MongoDB. Las solicitudes guardan el archivo y el hilo de mensajes en solicitudes. Los adjuntos de una inscripción se guardan en materiales. Los listados omiten el contenido binario. Las descargas requieren una sesión autorizada. Ejecuta una única instancia del servidor para las reservas locales de horario.

## Verificación

Con MongoDB local activo, desde tutorly Backend ejecuta npm.cmd test. La prueba usa una base local nueva con prefijo tutorly_test_, conserva esa base para inspección y no utiliza tutorly_db. Cubre la colección original de 52 peticiones y los flujos de la agenda por rol. Para revisar los datos de la aplicación, conecta MongoDB Compass al mismo servidor que usa el backend y abre tutorly_db o el nombre configurado en MONGO_URI.

Para una demostración manual con Thunder Client, envía POST http://localhost:3000/api/auth/login con tu correo y clave en Body → JSON. Mantén la cookie tutorly y el mismo host durante las pruebas. GET /api/auth/yo muestra el rol de la sesión. GET /api/agenda devuelve el calendario visible. Con un estudiante, PUT /api/agenda/ID/inscripcion con {"accion":"inscribir"} reserva cupo en un grupo. Sustituye ID por el tutoria_id del GET. Los errores 401 y 403 indican respectivamente que hace falta iniciar sesión o que el rol carece del permiso. La colección Pruebas/Thunder-Tutorly.json incluye operaciones de creación y eliminación de registros de laboratorio y se debe utilizar en una base de pruebas.
