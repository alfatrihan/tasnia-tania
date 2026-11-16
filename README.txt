TANIA GIFT WEBSITE - plain HTML, CSS and JavaScript (no build step, no libraries)

index.html   the page structure and all the text (edit captions, letter, timeline here)
style.css    colours, fonts, layout and animations (colours are the variables at the very top)
script.js    scroll animation, falling petals, tap-to-bloom, flip cards, petals picker, envelope
images/      put main.jpg and photo1.jpg to photo4.jpg here (see images/README.txt)

To view: open index.html in a browser (internet needed once for the Google Fonts).
To publish for free: drag this whole folder into Vercel or Netlify.

MAP (About section, scroll-driven zoom)
  data/bangladesh.js   Bangladesh outline, built from bangladesh-geojson (done)
  data/bogura.js       Bogura district outline, built from bangladesh-geojson (done)
                       note: Sahajanpur and Sonatala upazilas have no polygon in that dataset
  data/world.js        World outline: EMPTY until you add it (see below)

  To fill world.js, download a world countries GeoJSON (Natural Earth 110m countries works well),
  then run from this folder:
      python3 tools/make_world.py countries.geojson data/world.js
  Until then the first scroll stage shows only the grid, then the zoom continues to Bangladesh.

  To rebuild the Bangladesh / Bogura files from a newer bangladesh-geojson release:
      python3 tools/make_shapes.py path/to/bangladesh.geojson data/bangladesh.js data/bogura.js
