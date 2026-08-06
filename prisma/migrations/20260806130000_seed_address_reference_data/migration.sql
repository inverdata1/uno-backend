-- Seed reference data for addresses.
--
-- AddressType and VenezuelanState were never populated, so the API served a
-- hardcoded fallback list whose ids ('1', '2', ...) did not exist in the tables.
-- Picking one of those in the app produced a foreign key violation on insert.
-- The ids below intentionally match that fallback so any client already holding
-- them keeps working.

INSERT INTO "AddressType" ("id", "name", "icon") VALUES
  ('1', 'Casa', 'home-outline'),
  ('2', 'Trabajo', 'briefcase-outline'),
  ('3', 'Otro', 'location-outline')
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "VenezuelanState" ("id", "name") VALUES
  ('1', 'Zulia'),
  ('2', 'Distrito Capital'),
  ('3', 'Miranda'),
  ('4', 'Carabobo'),
  ('5', 'Aragua'),
  ('6', 'Amazonas'),
  ('7', 'Anzoátegui'),
  ('8', 'Apure'),
  ('9', 'Barinas'),
  ('10', 'Bolívar'),
  ('11', 'Cojedes'),
  ('12', 'Delta Amacuro'),
  ('13', 'Falcón'),
  ('14', 'Guárico'),
  ('15', 'La Guaira'),
  ('16', 'Lara'),
  ('17', 'Mérida'),
  ('18', 'Monagas'),
  ('19', 'Nueva Esparta'),
  ('20', 'Portuguesa'),
  ('21', 'Sucre'),
  ('22', 'Táchira'),
  ('23', 'Trujillo'),
  ('24', 'Yaracuy'),
  ('25', 'Dependencias Federales')
ON CONFLICT ("id") DO NOTHING;
