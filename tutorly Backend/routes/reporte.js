const { Router } = require('express')
const reporteController = require('../controllers/reporteController')

const router = Router()

router.get('/tutores', reporteController.tutores)
router.get('/materias', reporteController.materias)
router.get('/estudiantes', reporteController.estudiantes)
router.get('/asistencia', reporteController.asistencia)
router.get('/valoraciones', reporteController.valoraciones)
router.get('/resumen', reporteController.resumen)

module.exports = router
