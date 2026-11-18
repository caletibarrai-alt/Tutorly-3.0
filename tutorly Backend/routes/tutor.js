const { Router } = require('express')
const tutorController = require('../controllers/tutorController')

const router = Router()

router.get('/buscar', tutorController.buscarTutoresPorMateria)
router.get('/', tutorController.obtenerTutores)
router.get('/:id', tutorController.obtenerTutor)
router.post('/', tutorController.crearTutor)
router.put('/:id', tutorController.actualizarTutor)
router.delete('/:id', tutorController.eliminarTutor)

module.exports = router
