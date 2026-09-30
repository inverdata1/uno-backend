/**
 * Maps the photos in the source folder to each demo business.
 *
 * Built by reviewing the images one by one. `logo` is the brand mark, `photos`
 * are the shots the loader cycles through to fill post and product slots, and
 * `banner` is a wide crop when one is available.
 *
 * DISCARDED, do not reintroduce without replacing the file first:
 *   images (23).jpg  logo TOSTADAS  - Shutterstock watermark
 *   images (45).jpg  logo EMPANADA  - Shutterstock watermark
 *   images (6).jpg   logo Arepas    - Shutterstock watermark
 *   images (29).jpg  catálogo de chucherías con texto en inglés, no es una foto de producto
 */

module.exports = {
  'arepera-candelaria': {
    logo: null, // descartado por watermark
    photos: ['images (3).jpg', 'images (4).jpg', 'images (5).jpg'],
  },
  'pizzeria-don-ciccio': {
    logo: 'images.png',
    banner: 'images (1).jpg',
    photos: ['images (2).jpg', 'images.jpg'],
  },
  'sushi-sakura': {
    logo: 'images (10).jpg',
    photos: ['images (7).jpg', 'images (8).jpg', 'images (9).jpg'],
  },
  'burger-house-ccs': {
    logo: 'images (14).jpg',
    photos: ['images (11).jpg', 'images (12).jpg', 'images (13).jpg'],
  },
  'pollos-el-fogon': {
    logo: 'images (17).jpg',
    photos: ['images (15).jpg', 'images (16).jpg'],
  },
  'cafe-altamira': {
    logo: 'images (1).png',
    photos: ['images (18).jpg', 'images (19).jpg'],
  },
  'tostadas-el-molino': {
    logo: null, // descartado por watermark
    photos: ['images (20).jpg', 'images (21).jpg', 'images (22).jpg'],
  },
  'panaderia-la-espiga': {
    logo: 'images (26).jpg',
    photos: ['images (24).jpg', 'images (25).jpg'],
  },
  'dulceria-dona-carmen': {
    logo: 'images (30).jpg',
    photos: ['images (28).jpg', 'images (27).jpg'],
  },
  'heladeria-frescolita': {
    logo: 'images (33).jpg',
    photos: ['images (31).jpg', 'images (32).jpg'],
  },
  'farmacia-saludmax': {
    logo: 'images (37).jpg',
    photos: ['images (34).jpg', 'images (35).jpg', 'images (36).jpg'],
  },
  'farmacia-los-palos': {
    logo: null,
    // Dos farmacias compartiendo fotos de anaquel es plausible y se ve mejor
    // que imágenes genéricas sin relación con el rubro.
    photos: ['images (35).jpg', 'images (36).jpg'],
  },
  'super-el-trigal': {
    logo: null,
    photos: [], // sin material: cae en Picsum
  },
  'minimarket-chacao': {
    logo: null,
    photos: [], // sin material: cae en Picsum
  },
  'licoreria-el-barril': {
    logo: null,
    photos: ['images (39).jpg', 'images (40).jpg', 'images (41).jpg', 'images (42).jpg', 'images (43).jpg'],
  },
  'vinos-y-mas': {
    logo: null,
    photos: ['images (38).jpg'],
  },
  'parrilla-el-budare': {
    logo: null,
    photos: ['images (51).jpg'],
  },
  'empanadas-la-costena': {
    logo: null, // descartado por watermark
    photos: ['download.jpg', 'images (44).jpg'],
  },
  'jugos-vitamina': {
    logo: 'images (48).jpg',
    photos: ['images (46).jpg', 'images (47).jpg'],
  },
  'charcuteria-la-italiana': {
    logo: 'images (52).jpg',
    photos: ['images (49).jpg', 'images (50).jpg'],
  },
};
