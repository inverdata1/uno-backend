# Manifiesto de media para los datos demo

Checklist para armar la carpeta de fotos. Cada negocio es una subcarpeta
con el nombre de su *slug* (el mismo que va antes de la @ en su correo).

## Cómo se cargan

Hay dos formas, ambas válidas:

**A. Directa (recomendada de aquí en adelante).** Coloca los archivos en
`uploads/demo/<slug>/` con los nombres exactos de este documento y corre el
seeder. Toma lo que exista y deja la imagen genérica en lo que falte.

```bash
node scripts/seed-demo-data.js
```

**B. Desde una carpeta suelta.** Si tienes las fotos con nombres cualquiera,
declara en `scripts/demo-media-map.js` qué archivo es de qué negocio y corre el
organizador, que las copia a la estructura de arriba. Con `--dry` solo muestra
el plan sin tocar nada.

```bash
node scripts/organize-demo-media.js "C:/ruta/a/las/fotos"
```

Cuando un negocio tiene menos fotos que slots, el organizador las cicla y
desfasa las de producto respecto a las de post para que no se repita la misma
imagen en el mismo índice.


## Totales

| Tipo | Archivo | Cantidad | Formato | Tamaño mínimo |
|---|---|---:|---|---|
| Logo | `logo.jpg` | 20 | cuadrada 1:1 | 500×500 |
| Portada | `banner.jpg` | 20 | apaisada 2:1 | 1400×700 |
| Fotos de post | `post-1..4.jpg` | 80 | cuadrada 1:1 | 1080×1080 |
| Fotos de producto | `prod-NN.jpg` | 124 | cuadrada 1:1 | 800×800 |
| Video | `video.mp4` | 20 | vertical o 16:9 | 720p, 10-30s |

**Total: 244 fotos + 20 videos.**

## Orden de prioridad

No hace falta tener todo para empezar: el cargador usa lo que exista y
rellena el resto con las imágenes genéricas actuales. Conviene ir en este orden:

1. **Logos** (20) — es lo que más se repite: feed, Descubre, perfil, comentarios y chat.
2. **Fotos de post** (80) — llenan el feed y el grid del perfil del negocio.
3. **Fotos de producto** (124) — la pestaña Tienda y los productos etiquetados en los posts.
4. **Videos** (20) — uno por negocio.
5. **Portadas** (20) — solo se ven al entrar al perfil del negocio.

## Estructura

```
demo-media/
  arepera-candelaria/
    logo.jpg
    banner.jpg
    post-1.jpg  post-2.jpg  post-3.jpg  post-4.jpg
    video.mp4
    prod-01.jpg ... prod-07.jpg
  pizzeria-don-ciccio/
    logo.jpg
    banner.jpg
    post-1.jpg  post-2.jpg  post-3.jpg  post-4.jpg
    video.mp4
    prod-01.jpg ... prod-06.jpg
  ... (18 carpetas más)
```

## Qué va en cada carpeta

Los `prod-NN` van **en el orden exacto** de la lista de cada negocio.

### 1. `arepera-candelaria` — Arepera La Candelaria

*Comida Venezolana* · Arepas de maíz pilado hechas al budare, rellenas como en casa. Más de 20 años en La Candelaria.

- **logo.jpg** — identidad del negocio (isotipo o fachada)
- **banner.jpg** — local, ambiente o plano general del rubro
- **post-1..4.jpg** — 4 fotos del día a día: ambiente, preparación o producto terminado
- **video.mp4** — clip corto del local o de la preparación
- **prod-01..07.jpg** — un producto por foto, en este orden:

  01. `prod-01.jpg` — Reina Pepiada  ($4.50)
  02. `prod-02.jpg` — Pelúa  ($4.80)
  03. `prod-03.jpg` — Domino  ($3.90)
  04. `prod-04.jpg` — Catira  ($4.60)
  05. `prod-05.jpg` — Pabellón Criollo  ($7.50)
  06. `prod-06.jpg` — Cachapa con Queso de Mano  ($6.20)
  07. `prod-07.jpg` — Jugo de Papelón  ($1.80)

### 2. `pizzeria-don-ciccio` — Pizzería Don Ciccio

*Italiana* · Masa madre fermentada 48 horas y horno de leña. Recetas napolitanas de la familia Ciccio.

- **logo.jpg** — identidad del negocio (isotipo o fachada)
- **banner.jpg** — local, ambiente o plano general del rubro
- **post-1..4.jpg** — 4 fotos del día a día: ambiente, preparación o producto terminado
- **video.mp4** — clip corto del local o de la preparación
- **prod-01..06.jpg** — un producto por foto, en este orden:

  01. `prod-01.jpg` — Margherita  ($9.50)
  02. `prod-02.jpg` — Pepperoni  ($11.00)
  03. `prod-03.jpg` — Cuatro Quesos  ($12.50)
  04. `prod-04.jpg` — Diavola  ($11.80)
  05. `prod-05.jpg` — Calzone Clásico  ($10.90)
  06. `prod-06.jpg` — Lasaña Boloñesa  ($13.00)

### 3. `sushi-sakura` — Sushi Sakura

*Japonesa* · Pescado fresco del día y arroz preparado al momento. Barra de sushi y delivery en Chacao.

- **logo.jpg** — identidad del negocio (isotipo o fachada)
- **banner.jpg** — local, ambiente o plano general del rubro
- **post-1..4.jpg** — 4 fotos del día a día: ambiente, preparación o producto terminado
- **video.mp4** — clip corto del local o de la preparación
- **prod-01..07.jpg** — un producto por foto, en este orden:

  01. `prod-01.jpg` — Roll California  ($8.50)
  02. `prod-02.jpg` — Roll Filadelfia  ($9.20)
  03. `prod-03.jpg` — Nigiri Salmón (2u)  ($6.00)
  04. `prod-04.jpg` — Sashimi Atún  ($12.50)
  05. `prod-05.jpg` — Tempura Roll  ($10.00)
  06. `prod-06.jpg` — Sopa Miso  ($3.50)
  07. `prod-07.jpg` — Gyozas (6u)  ($7.00)

### 4. `burger-house-ccs` — Burger House CCS

*Hamburguesas* · Carne 100% de res molida en casa, pan brioche y papas rústicas. Smash burgers desde 2019.

- **logo.jpg** — identidad del negocio (isotipo o fachada)
- **banner.jpg** — local, ambiente o plano general del rubro
- **post-1..4.jpg** — 4 fotos del día a día: ambiente, preparación o producto terminado
- **video.mp4** — clip corto del local o de la preparación
- **prod-01..06.jpg** — un producto por foto, en este orden:

  01. `prod-01.jpg` — Clásica Doble  ($8.90)
  02. `prod-02.jpg` — BBQ Bacon  ($10.50)
  03. `prod-03.jpg` — Pollo Crispy  ($8.20)
  04. `prod-04.jpg` — Veggie Portobello  ($7.90)
  05. `prod-05.jpg` — Papas con Queso  ($4.50)
  06. `prod-06.jpg` — Malteada de Chocolate  ($5.00)

### 5. `pollos-el-fogon` — Pollos El Fogón

*Pollo a la Brasa* · Pollo marinado 12 horas y asado a la brasa. Combos familiares con yuca y ensalada.

- **logo.jpg** — identidad del negocio (isotipo o fachada)
- **banner.jpg** — local, ambiente o plano general del rubro
- **post-1..4.jpg** — 4 fotos del día a día: ambiente, preparación o producto terminado
- **video.mp4** — clip corto del local o de la preparación
- **prod-01..06.jpg** — un producto por foto, en este orden:

  01. `prod-01.jpg` — Pollo Entero  ($14.00)
  02. `prod-02.jpg` — Medio Pollo  ($7.50)
  03. `prod-03.jpg` — Combo Familiar  ($22.00)
  04. `prod-04.jpg` — Yuca Frita  ($3.20)
  05. `prod-05.jpg` — Ensalada Rallada  ($2.80)
  06. `prod-06.jpg` — Refresco 1.5L  ($2.50)

### 6. `cafe-altamira` — Café Altamira

*Cafetería* · Café de origen venezolano tostado cada semana. Espacio para trabajar con wifi y buena música.

- **logo.jpg** — identidad del negocio (isotipo o fachada)
- **banner.jpg** — local, ambiente o plano general del rubro
- **post-1..4.jpg** — 4 fotos del día a día: ambiente, preparación o producto terminado
- **video.mp4** — clip corto del local o de la preparación
- **prod-01..07.jpg** — un producto por foto, en este orden:

  01. `prod-01.jpg` — Espresso  ($1.50)
  02. `prod-02.jpg` — Cortado  ($2.00)
  03. `prod-03.jpg` — Latte  ($2.80)
  04. `prod-04.jpg` — Capuchino  ($3.00)
  05. `prod-05.jpg` — Cold Brew  ($3.50)
  06. `prod-06.jpg` — Croissant de Mantequilla  ($2.60)
  07. `prod-07.jpg` — Tequeños (5u)  ($4.50)

### 7. `tostadas-el-molino` — Tostadas El Molino

*Desayunos* · Desayunos criollos servidos todo el día. Perico, empanadas y café guayoyo.

- **logo.jpg** — identidad del negocio (isotipo o fachada)
- **banner.jpg** — local, ambiente o plano general del rubro
- **post-1..4.jpg** — 4 fotos del día a día: ambiente, preparación o producto terminado
- **video.mp4** — clip corto del local o de la preparación
- **prod-01..06.jpg** — un producto por foto, en este orden:

  01. `prod-01.jpg` — Desayuno Criollo  ($6.50)
  02. `prod-02.jpg` — Perico con Arepa  ($4.20)
  03. `prod-03.jpg` — Empanada de Queso  ($1.80)
  04. `prod-04.jpg` — Empanada de Carne Mechada  ($2.20)
  05. `prod-05.jpg` — Café Guayoyo  ($1.20)
  06. `prod-06.jpg` — Batido de Lechosa  ($2.50)

### 8. `panaderia-la-espiga` — Panadería La Espiga

*Panadería* · Pan canilla recién horneado cada tres horas. Pastelería, charcutería y café al paso.

- **logo.jpg** — identidad del negocio (isotipo o fachada)
- **banner.jpg** — local, ambiente o plano general del rubro
- **post-1..4.jpg** — 4 fotos del día a día: ambiente, preparación o producto terminado
- **video.mp4** — clip corto del local o de la preparación
- **prod-01..06.jpg** — un producto por foto, en este orden:

  01. `prod-01.jpg` — Pan Canilla  ($1.00)
  02. `prod-02.jpg` — Pan Campesino  ($2.50)
  03. `prod-03.jpg` — Cachito de Jamón  ($2.00)
  04. `prod-04.jpg` — Golfeado con Queso  ($2.40)
  05. `prod-05.jpg` — Pastel de Pollo  ($3.00)
  06. `prod-06.jpg` — Torta de Auyama (porción)  ($2.80)

### 9. `dulceria-dona-carmen` — Dulcería Doña Carmen

*Repostería* · Tortas por encargo y dulces criollos. Quesillo, bienmesabe y torta negra de la abuela.

- **logo.jpg** — identidad del negocio (isotipo o fachada)
- **banner.jpg** — local, ambiente o plano general del rubro
- **post-1..4.jpg** — 4 fotos del día a día: ambiente, preparación o producto terminado
- **video.mp4** — clip corto del local o de la preparación
- **prod-01..06.jpg** — un producto por foto, en este orden:

  01. `prod-01.jpg` — Quesillo (porción)  ($3.00)
  02. `prod-02.jpg` — Bienmesabe  ($3.50)
  03. `prod-03.jpg` — Torta Tres Leches  ($4.20)
  04. `prod-04.jpg` — Marquesa de Chocolate  ($3.80)
  05. `prod-05.jpg` — Torta Negra (kg)  ($18.00)
  06. `prod-06.jpg` — Suspiros (12u)  ($2.50)

### 10. `heladeria-frescolita` — Heladería Frescolita

*Heladería* · Helados artesanales con frutas de temporada. Más de 30 sabores rotativos.

- **logo.jpg** — identidad del negocio (isotipo o fachada)
- **banner.jpg** — local, ambiente o plano general del rubro
- **post-1..4.jpg** — 4 fotos del día a día: ambiente, preparación o producto terminado
- **video.mp4** — clip corto del local o de la preparación
- **prod-01..06.jpg** — un producto por foto, en este orden:

  01. `prod-01.jpg` — Barquilla Simple  ($2.00)
  02. `prod-02.jpg` — Barquilla Doble  ($3.20)
  03. `prod-03.jpg` — Copa Sundae  ($4.50)
  04. `prod-04.jpg` — Helado de Parchita  ($2.80)
  05. `prod-05.jpg` — Tina 1L  ($9.00)
  06. `prod-06.jpg` — Milkshake de Fresa  ($4.00)

### 11. `farmacia-saludmax` — Farmacia SaludMax

*Farmacia* · Medicamentos, cuidado personal y tensiómetro gratis. Delivery en menos de una hora.

- **logo.jpg** — identidad del negocio (isotipo o fachada)
- **banner.jpg** — local, ambiente o plano general del rubro
- **post-1..4.jpg** — 4 fotos del día a día: ambiente, preparación o producto terminado
- **video.mp4** — clip corto del local o de la preparación
- **prod-01..06.jpg** — un producto por foto, en este orden:

  01. `prod-01.jpg` — Acetaminofén 500mg (20u)  ($3.50)
  02. `prod-02.jpg` — Ibuprofeno 400mg (20u)  ($4.00)
  03. `prod-03.jpg` — Alcohol Isopropílico  ($2.50)
  04. `prod-04.jpg` — Vitamina C 1000mg  ($8.50)
  05. `prod-05.jpg` — Gel Antibacterial 500ml  ($3.20)
  06. `prod-06.jpg` — Tensiómetro Digital  ($32.00)

### 12. `farmacia-los-palos` — Farmacia Los Palos Grandes

*Farmacia* · Atención farmacéutica las 24 horas. Convenios con los principales seguros del país.

- **logo.jpg** — identidad del negocio (isotipo o fachada)
- **banner.jpg** — local, ambiente o plano general del rubro
- **post-1..4.jpg** — 4 fotos del día a día: ambiente, preparación o producto terminado
- **video.mp4** — clip corto del local o de la preparación
- **prod-01..06.jpg** — un producto por foto, en este orden:

  01. `prod-01.jpg` — Omeprazol 20mg (14u)  ($5.50)
  02. `prod-02.jpg` — Loratadina 10mg (10u)  ($3.00)
  03. `prod-03.jpg` — Suero Fisiológico  ($2.00)
  04. `prod-04.jpg` — Protector Solar FPS50  ($14.00)
  05. `prod-05.jpg` — Termómetro Infrarrojo  ($22.00)
  06. `prod-06.jpg` — Mascarillas (50u)  ($6.50)

### 13. `super-el-trigal` — Supermercado El Trigal

*Supermercado* · Surtido completo de víveres, frutas y verduras frescas. Ofertas semanales.

- **logo.jpg** — identidad del negocio (isotipo o fachada)
- **banner.jpg** — local, ambiente o plano general del rubro
- **post-1..4.jpg** — 4 fotos del día a día: ambiente, preparación o producto terminado
- **video.mp4** — clip corto del local o de la preparación
- **prod-01..07.jpg** — un producto por foto, en este orden:

  01. `prod-01.jpg` — Harina de Maíz 1kg  ($1.40)
  02. `prod-02.jpg` — Arroz Blanco 1kg  ($1.80)
  03. `prod-03.jpg` — Aceite de Maíz 1L  ($3.20)
  04. `prod-04.jpg` — Café Molido 500g  ($5.50)
  05. `prod-05.jpg` — Queso Blanco (kg)  ($7.00)
  06. `prod-06.jpg` — Docena de Huevos  ($3.60)
  07. `prod-07.jpg` — Azúcar 1kg  ($1.50)

### 14. `minimarket-chacao` — Minimarket 24/7 Chacao

*Minimarket* · Abierto las 24 horas. Lo esencial cerca de casa, con delivery nocturno.

- **logo.jpg** — identidad del negocio (isotipo o fachada)
- **banner.jpg** — local, ambiente o plano general del rubro
- **post-1..4.jpg** — 4 fotos del día a día: ambiente, preparación o producto terminado
- **video.mp4** — clip corto del local o de la preparación
- **prod-01..06.jpg** — un producto por foto, en este orden:

  01. `prod-01.jpg` — Leche Completa 1L  ($2.20)
  02. `prod-02.jpg` — Pan de Sándwich  ($2.80)
  03. `prod-03.jpg` — Jamón de Pierna (kg)  ($9.50)
  04. `prod-04.jpg` — Refresco 2L  ($2.40)
  05. `prod-05.jpg` — Papas Fritas 150g  ($2.00)
  06. `prod-06.jpg` — Agua Mineral 5L  ($3.00)

### 15. `licoreria-el-barril` — Licorería El Barril

*Licores* · Rones venezolanos, cervezas artesanales y destilados importados. Hielo siempre disponible.

- **logo.jpg** — identidad del negocio (isotipo o fachada)
- **banner.jpg** — local, ambiente o plano general del rubro
- **post-1..4.jpg** — 4 fotos del día a día: ambiente, preparación o producto terminado
- **video.mp4** — clip corto del local o de la preparación
- **prod-01..06.jpg** — un producto por foto, en este orden:

  01. `prod-01.jpg` — Ron Añejo 750ml  ($16.00)
  02. `prod-02.jpg` — Cerveza Artesanal IPA  ($3.50)
  03. `prod-03.jpg` — Six Pack Nacional  ($8.00)
  04. `prod-04.jpg` — Whisky 12 años  ($42.00)
  05. `prod-05.jpg` — Vino Tinto Reserva  ($14.50)
  06. `prod-06.jpg` — Hielo 2kg  ($1.80)

### 16. `vinos-y-mas` — Vinos y Más

*Licores* · Cava climatizada con etiquetas de Argentina, Chile y España. Asesoría de sommelier.

- **logo.jpg** — identidad del negocio (isotipo o fachada)
- **banner.jpg** — local, ambiente o plano general del rubro
- **post-1..4.jpg** — 4 fotos del día a día: ambiente, preparación o producto terminado
- **video.mp4** — clip corto del local o de la preparación
- **prod-01..06.jpg** — un producto por foto, en este orden:

  01. `prod-01.jpg` — Malbec Mendoza  ($18.00)
  02. `prod-02.jpg` — Carménère Reserva  ($16.50)
  03. `prod-03.jpg` — Rioja Crianza  ($21.00)
  04. `prod-04.jpg` — Espumante Brut  ($15.00)
  05. `prod-05.jpg` — Set de Copas (2u)  ($12.00)
  06. `prod-06.jpg` — Sacacorchos Profesional  ($9.00)

### 17. `parrilla-el-budare` — Parrilla El Budare

*Parrilla* · Carnes a la parrilla al carbón, cortes argentinos y guarniciones criollas.

- **logo.jpg** — identidad del negocio (isotipo o fachada)
- **banner.jpg** — local, ambiente o plano general del rubro
- **post-1..4.jpg** — 4 fotos del día a día: ambiente, preparación o producto terminado
- **video.mp4** — clip corto del local o de la preparación
- **prod-01..06.jpg** — un producto por foto, en este orden:

  01. `prod-01.jpg` — Punta Trasera (400g)  ($16.00)
  02. `prod-02.jpg` — Churrasco  ($18.50)
  03. `prod-03.jpg` — Chorizo Parrillero  ($5.00)
  04. `prod-04.jpg` — Parrilla Mixta (2 personas)  ($34.00)
  05. `prod-05.jpg` — Yuca con Mojo  ($4.00)
  06. `prod-06.jpg` — Ensalada César  ($6.50)

### 18. `empanadas-la-costena` — Empanadas La Costeña

*Empanadas* · Empanadas fritas al momento con relleno de la costa oriental. Salsas de la casa.

- **logo.jpg** — identidad del negocio (isotipo o fachada)
- **banner.jpg** — local, ambiente o plano general del rubro
- **post-1..4.jpg** — 4 fotos del día a día: ambiente, preparación o producto terminado
- **video.mp4** — clip corto del local o de la preparación
- **prod-01..06.jpg** — un producto por foto, en este orden:

  01. `prod-01.jpg` — Empanada de Cazón  ($2.50)
  02. `prod-02.jpg` — Empanada de Pabellón  ($2.80)
  03. `prod-03.jpg` — Empanada de Queso  ($1.80)
  04. `prod-04.jpg` — Empanada de Pollo  ($2.20)
  05. `prod-05.jpg` — Tequeños (6u)  ($5.00)
  06. `prod-06.jpg` — Jugo de Melón  ($2.00)

### 19. `jugos-vitamina` — Jugos Naturales Vitamina

*Jugos y Batidos* · Jugos exprimidos al momento, sin azúcar añadida. Bowls de fruta y meriendas saludables.

- **logo.jpg** — identidad del negocio (isotipo o fachada)
- **banner.jpg** — local, ambiente o plano general del rubro
- **post-1..4.jpg** — 4 fotos del día a día: ambiente, preparación o producto terminado
- **video.mp4** — clip corto del local o de la preparación
- **prod-01..06.jpg** — un producto por foto, en este orden:

  01. `prod-01.jpg` — Jugo de Naranja 500ml  ($3.00)
  02. `prod-02.jpg` — Batido de Fresa  ($3.50)
  03. `prod-03.jpg` — Detox Verde  ($4.00)
  04. `prod-04.jpg` — Bowl de Açaí  ($6.50)
  05. `prod-05.jpg` — Ensalada de Frutas  ($4.20)
  06. `prod-06.jpg` — Merengada de Cambur  ($3.80)

### 20. `charcuteria-la-italiana` — Charcutería La Italiana

*Charcutería* · Quesos madurados, embutidos importados y pastas frescas hechas en casa.

- **logo.jpg** — identidad del negocio (isotipo o fachada)
- **banner.jpg** — local, ambiente o plano general del rubro
- **post-1..4.jpg** — 4 fotos del día a día: ambiente, preparación o producto terminado
- **video.mp4** — clip corto del local o de la preparación
- **prod-01..06.jpg** — un producto por foto, en este orden:

  01. `prod-01.jpg` — Jamón Serrano (100g)  ($6.50)
  02. `prod-02.jpg` — Queso Parmesano (200g)  ($9.00)
  03. `prod-03.jpg` — Mortadela Italiana (kg)  ($8.50)
  04. `prod-04.jpg` — Pasta Fresca Fettuccine  ($4.50)
  05. `prod-05.jpg` — Aceitunas Rellenas  ($3.50)
  06. `prod-06.jpg` — Salsa Pesto Artesanal  ($5.00)

## Especificaciones técnicas

- **Formato**: JPG para fotos (PNG solo si el logo lleva transparencia), MP4 H.264 para video.
- **Peso**: idealmente menos de 400 KB por foto y menos de 5 MB por video. Se sirven desde el VPS,
  así que el peso impacta directo en lo que tarda en cargar el feed.
- **Recorte**: las fotos cuadradas se muestran recortadas al centro; deja el motivo centrado.
- **Nombres**: exactamente como están arriba, en minúsculas. El cargador los busca por nombre.
- **Faltantes**: si falta un archivo no pasa nada, ese slot cae en la imagen genérica de siempre.
