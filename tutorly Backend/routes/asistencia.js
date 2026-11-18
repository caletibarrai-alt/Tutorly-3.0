const { Router } = require('express')
const asistenciaController = require('../controllers/asistenciaController')

const router = Router()

router.get('/', asistenciaController.obtenerAsistencias)
router.get('/:id', asistenciaController.obtenerAsistencia)
router.post('/', asistenciaController.crearAsistencia)
router.put('/:id', asistenciaController.actualizarAsistencia)
router.delete('/:id', asistenciaController.eliminarAsistencia)

module.exports = router
