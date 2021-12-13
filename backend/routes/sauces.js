const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth');
const saucesCtrl = require('../controllers/sauces');
const multer = require('../middleware/multer-config');

router.get('/', auth, saucesCtrl.getAllThings);
router.post('/', auth, multer, saucesCtrl.createThing);
router.get('/:id', auth, saucesCtrl.getOneThing);
router.put('/:id', auth, multer, saucesCtrl.modifyThing);
router.post('/:id/like', auth, saucesCtrl.likeSauce);
router.delete('/:id', auth, saucesCtrl.deleteThing);

module.exports = router;