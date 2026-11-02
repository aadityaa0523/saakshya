const COLUMNS = "id, act, section, text, source_url";

export const keywordSearchSql = `SELECT ${COLUMNS} FROM law_sections
  WHERE search @@ to_tsquery('english', $1)
  ORDER BY ts_rank(search, to_tsquery('english', $1), 1) DESC LIMIT 12`;

// Reciprocal rank fusion: a section ranked well by either search rises, and one ranked well by both rises most
export const hybridSearchSql = `WITH keyword AS (
    SELECT id, row_number() OVER (ORDER BY ts_rank(search, to_tsquery('english', $1), 1) DESC) AS place
    FROM law_sections WHERE search @@ to_tsquery('english', $1) LIMIT 30
  ), meaning AS (
    SELECT id, row_number() OVER (ORDER BY embedding <=> $2::vector) AS place
    FROM law_sections WHERE embedding IS NOT NULL ORDER BY embedding <=> $2::vector LIMIT 30
  ), fused AS (
    SELECT id, sum(1.0 / (60 + place)) AS score FROM (SELECT * FROM keyword UNION ALL SELECT * FROM meaning) AS ranked GROUP BY id
  )
  SELECT ${COLUMNS} FROM law_sections JOIN fused USING (id) ORDER BY score DESC, id LIMIT 12`;

export function orQuery(terms) {
  return terms.toLowerCase().match(/[a-z]{3,}/g)?.join(" | ") || "cheating";
}
