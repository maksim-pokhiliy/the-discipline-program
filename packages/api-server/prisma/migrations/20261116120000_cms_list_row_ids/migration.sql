-- SetLockTimeout
SET LOCAL lock_timeout = '5s';

-- AssertListRowIdsAreText
DO $$
DECLARE
  non_text_id_count bigint;
  repeated_id_count bigint;
BEGIN
  WITH list_fields (section, field) AS (
    VALUES
      ('home:whyChoose', 'features'),
      ('about:journey', 'timeline'),
      ('about:credentials', 'items'),
      ('faq:content', 'items'),
      ('offer:requisites', 'items'),
      ('offer:terms', 'blocks')
  ),
  list_rows AS (
    SELECT section_row.id AS section_row_id, list_row.element
    FROM "marketing_page_sections" AS section_row
    JOIN list_fields ON list_fields.section = section_row.section
    CROSS JOIN LATERAL jsonb_array_elements(
      CASE WHEN jsonb_typeof(section_row.data -> list_fields.field) = 'array'
        THEN section_row.data -> list_fields.field
        ELSE '[]'::jsonb
      END
    ) AS list_row (element)
    WHERE jsonb_typeof(list_row.element) = 'object' AND list_row.element -> 'id' IS NOT NULL
  )
  SELECT
    (SELECT count(*) FROM list_rows WHERE jsonb_typeof(element -> 'id') <> 'string'),
    (SELECT count(*) FROM (
      SELECT section_row_id, element ->> 'id'
      FROM list_rows
      WHERE jsonb_typeof(element -> 'id') = 'string' AND element ->> 'id' <> ''
      GROUP BY section_row_id, element ->> 'id'
      HAVING count(*) > 1
    ) AS repeated_ids)
  INTO non_text_id_count, repeated_id_count;

  IF non_text_id_count > 0 OR repeated_id_count > 0 THEN
    RAISE EXCEPTION 'Migration 20261116120000_cms_list_row_ids refused: the page sections hold % list row id(s) that are not text and % id(s) repeated inside one list, and the editor cannot tell those rows apart. Inspect and fix these rows by hand, then run "prisma migrate resolve --rolled-back 20261116120000_cms_list_row_ids" and deploy again.', non_text_id_count, repeated_id_count;
  END IF;
END $$;

-- AddEnglishListRowIds
UPDATE "marketing_page_sections" AS section_row
SET data = jsonb_set(
  section_row.data,
  ARRAY[list_fields.field],
  (
    SELECT coalesce(
      jsonb_agg(
        CASE
          WHEN jsonb_typeof(list_row.element) = 'object'
            AND coalesce(list_row.element ->> 'id', '') = ''
          THEN list_row.element || jsonb_build_object('id', gen_random_uuid()::text)
          ELSE list_row.element
        END
        ORDER BY list_row.ordinal
      ),
      '[]'::jsonb
    )
    FROM jsonb_array_elements(section_row.data -> list_fields.field)
      WITH ORDINALITY AS list_row (element, ordinal)
  )
)
FROM (
  VALUES
    ('home:whyChoose', 'features'),
    ('about:journey', 'timeline'),
    ('about:credentials', 'items'),
    ('faq:content', 'items'),
    ('offer:requisites', 'items'),
    ('offer:terms', 'blocks')
) AS list_fields (section, field)
WHERE section_row.section = list_fields.section
  AND section_row.locale = 'en'
  AND jsonb_typeof(section_row.data -> list_fields.field) = 'array'
  AND EXISTS (
    SELECT 1
    FROM jsonb_array_elements(
      CASE WHEN jsonb_typeof(section_row.data -> list_fields.field) = 'array'
        THEN section_row.data -> list_fields.field
        ELSE '[]'::jsonb
      END
    ) AS list_row (element)
    WHERE jsonb_typeof(list_row.element) = 'object'
      AND coalesce(list_row.element ->> 'id', '') = ''
  );

-- CopyEnglishListRowIds
UPDATE "marketing_page_sections" AS section_row
SET data = jsonb_set(
  section_row.data,
  ARRAY[list_fields.field],
  (
    SELECT coalesce(
      jsonb_agg(
        CASE
          WHEN jsonb_typeof(list_row.element) = 'object'
            AND coalesce(list_row.element ->> 'id', '') = ''
            AND jsonb_typeof(english_row.element) = 'object'
            AND coalesce(english_row.element ->> 'id', '') <> ''
          THEN list_row.element || jsonb_build_object('id', english_row.element -> 'id')
          ELSE list_row.element
        END
        ORDER BY list_row.ordinal
      ),
      '[]'::jsonb
    )
    FROM jsonb_array_elements(section_row.data -> list_fields.field)
      WITH ORDINALITY AS list_row (element, ordinal)
    LEFT JOIN jsonb_array_elements(english.data -> list_fields.field)
      WITH ORDINALITY AS english_row (element, ordinal)
      ON english_row.ordinal = list_row.ordinal
  )
)
FROM (
  VALUES
    ('home:whyChoose', 'features'),
    ('about:journey', 'timeline'),
    ('about:credentials', 'items'),
    ('faq:content', 'items'),
    ('offer:requisites', 'items'),
    ('offer:terms', 'blocks')
) AS list_fields (section, field),
  "marketing_page_sections" AS english
WHERE section_row.section = list_fields.section
  AND section_row.locale <> 'en'
  AND english."pageSlug" = section_row."pageSlug"
  AND english.section = section_row.section
  AND english.locale = 'en'
  AND jsonb_typeof(section_row.data -> list_fields.field) = 'array'
  AND jsonb_typeof(english.data -> list_fields.field) = 'array'
  AND EXISTS (
    SELECT 1
    FROM jsonb_array_elements(
      CASE WHEN jsonb_typeof(section_row.data -> list_fields.field) = 'array'
        THEN section_row.data -> list_fields.field
        ELSE '[]'::jsonb
      END
    ) WITH ORDINALITY AS list_row (element, ordinal)
    JOIN jsonb_array_elements(
      CASE WHEN jsonb_typeof(english.data -> list_fields.field) = 'array'
        THEN english.data -> list_fields.field
        ELSE '[]'::jsonb
      END
    ) WITH ORDINALITY AS english_row (element, ordinal)
      ON english_row.ordinal = list_row.ordinal
    WHERE jsonb_typeof(list_row.element) = 'object'
      AND coalesce(list_row.element ->> 'id', '') = ''
      AND jsonb_typeof(english_row.element) = 'object'
      AND coalesce(english_row.element ->> 'id', '') <> ''
  );
