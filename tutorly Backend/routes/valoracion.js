const { Router } = require('express')
const valoracionController = require('../controllers/valoracionController')

const router = Router()

router.get('/', valoracionController.obtenerValoraciones)
router.get('/:id', valoracionController.obtenerValoracion)
router.post('/', valoracionController.crearValoracion)
router.put('/:id', valoracionController.actualizarValoracion)
router.delete('/:id', valoracionController.eliminarValoracion)

module.exports = router
