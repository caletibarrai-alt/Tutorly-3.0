const { Router } = require('express')
const disponibilidadController = require('../controllers/disponibilidadController')

const router = Router()

router.get('/', disponibilidadController.obtenerDisponibilidades)
router.get('/:id', disponibilidadController.obtenerDisponibilidad)
router.post('/', disponibilidadController.crearDisponibilidad)
router.put('/:id', disponibilidadController.actualizarDisponibilidad)
router.delete('/:id', disponibilidadController.eliminarDisponibilidad)

module.exports = router
