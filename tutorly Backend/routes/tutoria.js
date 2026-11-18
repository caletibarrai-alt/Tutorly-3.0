const { Router } = require('express')
const tutoriaController = require('../controllers/tutoriaController')

const router = Router()

router.get('/estudiante/:id', tutoriaController.tutoriasPorEstudiante)
router.get('/tutor/:id', tutoriaController.tutoriasPorTutor)
router.get('/materia/:id', tutoriaController.tutoriasPorMateria)
router.get('/', tutoriaController.obtenerTutorias)
router.get('/:id', tutoriaController.obtenerTutoria)
router.post('/', tutoriaController.crearTutoria)
router.put('/:id', tutoriaController.actualizarTutoria)
router.delete('/:id', tutoriaController.eliminarTutoria)

module.exports = router
