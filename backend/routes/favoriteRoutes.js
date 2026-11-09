const express = require("express");
const favoriteController = require("../controllers/favoriteController");
const isAuth = require("../middlewares/isAuth");
const validate = require("../middlewares/validate");
const { csrfProtection } = require("../middlewares/csrf");
const asyncHandler = require("../utils/asyncHandler");
const schemas = require("../validations/schemas");

const router = express.Router();

router.use(csrfProtection, isAuth);

router.get("/", asyncHandler(favoriteController.listFavorites));
router.post(
  "/:id",
  validate(schemas.id, "params"),
  asyncHandler(favoriteController.addFavorite),
);
router.delete(
  "/:id",
  validate(schemas.id, "params"),
  asyncHandler(favoriteController.removeFavorite),
);

module.exports = router;
