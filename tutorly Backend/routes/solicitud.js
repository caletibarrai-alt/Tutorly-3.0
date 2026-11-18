const { Router } = require('express')
const solicitudController = require('../controllers/solicitudController')

const router = Router()

router.get('/', solicitudController.obtenerSolicitudes)
router.get('/:id', solicitudController.obtenerSolicitud)
router.post('/', solicitudController.crearSolicitud)
router.put('/:id', solicitudController.actualizarSolicitud)
router.delete('/:id', solicitudController.eliminarSolicitud)

module.exports = router
