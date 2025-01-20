mapboxgl.accessToken = mapToken; // Ensure mapToken is defined

const map = new mapboxgl.Map({
  container: "map", // container ID
  center: listing.geometry.coordinates, // starting position [lng, lat]
  zoom: 9, // initial zoom level

});
// Add a marker to the map
const marker = new mapboxgl.Marker({ color: "red" })
  .setLngLat(listing.geometry.coordinates) // Marker position
  .setPopup(
    new mapboxgl.Popup({ offset: 25 }) // Popup configuration
      .setHTML(
        `<h4>${listing.title}</h4><p>Exact location will be provided after booking.</p>`
      )
  )
  .addTo(map);
