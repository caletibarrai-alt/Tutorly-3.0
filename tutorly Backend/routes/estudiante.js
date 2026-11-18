const { Router } = require('express')
const estudianteController = require('../controllers/estudianteController')

const router = Router()

router.get('/', estudianteController.obtenerEstudiantes)
router.get('/:id', estudianteController.obtenerEstudiante)
router.post('/', estudianteController.crearEstudiante)
router.put('/:id', estudianteController.actualizarEstudiante)
router.delete('/:id', estudianteController.eliminarEstudiante)

module.exports = router
