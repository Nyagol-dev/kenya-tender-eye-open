const { Router } = require("express");
const categories = require("../controllers/serviceCategoryController");

const router = Router();

router.get("/", categories.list);

module.exports = router;
