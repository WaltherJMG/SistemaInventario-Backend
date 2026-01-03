const {Router} = require('express')
const {create_user, open_login, list_products, add_products, category, update_product, delete_products, regist_movements, obtain_movements, list_users, delete_movement} = require('../controllers/test.controller')

const router = Router();

router.post('/signin', create_user)
router.post('/login', open_login)
router.get('/products', list_products)
router.post('/add-products', add_products)
router.get('/categories', category)
router.put('/products/:id', update_product)
router.delete('/products/:id', delete_products)
router.get("/movements", obtain_movements)
router.post("/movements",regist_movements)
router.get("/users", list_users);
router.delete("/movements/:id", delete_movement);
module.exports = router