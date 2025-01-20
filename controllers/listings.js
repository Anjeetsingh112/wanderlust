const Listing = require("../models/listing.js");
const mbxgeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxgeocoding({ accessToken: mapToken });
const isValidCountry = require('../schema.js').isValidCountry;

module.exports.index = async (req, res) => {
  const { category } = req.query; // Extract category from query
  let filter = {};

  // Apply category filter if provided
  if (category) {
    filter.category = category;
  }

  // Fetch listings based on the filter
  const allListings = await Listing.find(filter);
  res.render("listings/index.ejs", { allListings });
};

module.exports.renderNewForm = (req, res) => {
  res.render("listings/new.ejs");
};

module.exports.showListing = async (req, res) => {
  let { id } = req.params;
  let listing = await Listing.findById(id)
    .populate({ path: "reviews", populate: { path: "author" } })
    .populate("owner");
  if (!listing) {
    req.flash("error", "Listing you requested for does not exist!");
    res.redirect("/listings");
  }
  res.render("listings/show.ejs", { listing });
};
module.exports.createListing = async (req, res, next) => {
  try {


    // Geocode the location
    let response = await geocodingClient
      .forwardGeocode({
        query: req.body.listing.location,
        limit: 1,
      })
      .send();

    // Check if an image file is uploaded
    if (!req.file) {
      req.flash("error", "Image is required!");
      return res.redirect("/listings/new");
    }

    // Check if the category is present
    if (!req.body.listing.category) {
      req.flash("error", "Category is required!");
      return res.redirect("/listings/new");
    }

    // Check if a valid location was returned
    if (!response.body.features || response.body.features.length === 0) {
      req.flash("error", "Invalid location. Please enter a valid address.");
      return res.redirect("/listings/new");
    }

    // Validate the country using the isValidCountry function
    if (!isValidCountry(req.body.listing.country)) {
      req.flash("error", "Invalid country name. Please enter a valid country.");
      return res.redirect("/listings/new");
    }

    // Destructure and save listing details
    const { title, description, location, country, price, category } = req.body.listing;

    // Convert price to a number
    const priceNumber = parseFloat(price);

    const newListing = new Listing({
      title,
      description,
      location,
      country,
      price: priceNumber, // Ensure price is a number
      category, // Ensure category is included
      image: { url: req.file.path, filename: req.file.filename },
      owner: req.user._id,
    });

    // Assign geometry from geocoding response
    newListing.geometry = response.body.features[0].geometry;
     
    // Save the listing
    await newListing.save();

    // Flash success message and redirect
    req.flash("success", "New Listing Created!");
    res.redirect("/listings");
  } catch (error) {
    console.error(error);
    req.flash("error", "An error occurred while creating the listing.");
    res.redirect("/listings/new");
  }
};


module.exports.renderEditForm = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id);
  
  if (!listing) {
    req.flash("error", "Listing you requested for does not exist!");
    return res.redirect("/listings");
  }

  // Prepare the original image URL for display
  let originalImageUrl = listing.image.url.replace("/upload", "/upload/w_250");
  
  // Render the edit form with the listing data
  res.render("listings/edit.ejs", { listing, originalImageUrl });
};

module.exports.updateListing = async (req, res) => {
  let { id } = req.params;

  // Check if a valid category is present
  if (!req.body.listing.category) {
    req.flash("error", "Category is required!");
    return res.redirect(`/listings/${id}/edit`);
  }

  // Check if a valid country is provided
  if (!isValidCountry(req.body.listing.country)) {
    req.flash("error", "Invalid country name. Please enter a valid country.");
    return res.redirect(`/listings/${id}/edit`);
  }
  if (!req.body.listing.location) {
    req.flash("error", "Location is required!");
    return res.redirect(`/listings/${id}/edit`);
  }
  // Geocode the updated location
  const response = await geocodingClient
    .forwardGeocode({
      query: req.body.listing.location,
      limit: 1,
    })
    .send();

  // Check if a valid location was returned
  if (!response.body.features || response.body.features.length === 0) {
    req.flash("error", "Invalid location. Please enter a valid address.");
    return res.redirect(`/listings/${id}/edit`);
  }

  // Update listing details
  const updatedData = {
    ...req.body.listing,
    geometry: response.body.features[0].geometry,
  };

  // Check if a new file is uploaded
  if (req.file) {
    updatedData.image = { url: req.file.path, filename: req.file.filename };
  }

  // Update the listing in the database
  const listing = await Listing.findByIdAndUpdate(id, updatedData, { new: true });

  // Flash success message and redirect
  req.flash("success", "Listing Updated!");
  res.redirect(`/listings/${id}`);
};
module.exports.deleteListing = async (req, res) => {
  let { id } = req.params;
  await Listing.findByIdAndDelete(id);
  req.flash("success", "Listing Deleted!");
  res.redirect("/listings");
};
