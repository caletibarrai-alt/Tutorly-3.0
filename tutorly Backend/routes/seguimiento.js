const { Router } = require('express')
const seguimientoController = require('../controllers/seguimientoController')

const router = Router()

router.get('/', seguimientoController.obtenerSeguimientos)
router.get('/:id', seguimientoController.obtenerSeguimiento)
router.post('/', seguimientoController.crearSeguimiento)
router.put('/:id', seguimientoController.actualizarSeguimiento)
router.delete('/:id', seguimientoController.eliminarSeguimiento)

module.exports = router
