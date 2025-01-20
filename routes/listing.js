const express = require("express");
const router = express.Router({ mergeParams: true });
const Listing = require("../models/listing.js");
const wrapAsync = require("../utils/wrapAsync.js");
const { isLoggedIn, isOwner, validateListing } = require("../middleware.js");
const listingController = require("../controllers/listings.js");
const multer = require("multer");
const { storage } = require("../cloudConfig.js");
const upload = multer({ storage });
router
  .route("/")
  //index Route
  .get(wrapAsync(listingController.index))
  //create route
  .post(
    isLoggedIn,
    validateListing,
    upload.single("listing[image]"),
    wrapAsync(listingController.createListing)
  );

//new route
router.get("/new", isLoggedIn, listingController.renderNewForm);

router
  .route("/:id")
  // show route
  .get(wrapAsync(listingController.showListing))
  //update route
  .patch(
    isLoggedIn,
    isOwner,
    upload.single("listing[image]"),
    validateListing,
    wrapAsync(listingController.updateListing)
  )
  //delete route
  .delete(isLoggedIn, isOwner, wrapAsync(listingController.deleteListing));

// Edit route

router.get(
  "/:id/edit",
  isLoggedIn,
  isOwner,
  validateListing,
  wrapAsync(listingController.renderEditForm)
);

module.exports = router;
