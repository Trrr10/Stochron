"""
GET    /dictionary          → returns all 4 dictionaries
POST   /dictionary/{name}   → adds a word to a dictionary
DELETE /dictionary/{name}/{word} → removes a word

Dictionaries are stored in Supabase table: db_dictionary
Schema:
  id       BIGSERIAL PRIMARY KEY
  name     TEXT NOT NULL   -- 'rootForeboding' | 'foreboding' | 'assurance' | 'geopolitical'
  word     TEXT NOT NULL
  UNIQUE(name, word)

NOTE: Run this SQL in Supabase to create the dictionary table:

  CREATE TABLE IF NOT EXISTS db_dictionary (
    id    BIGSERIAL PRIMARY KEY,
    name  TEXT NOT NULL,
    word  TEXT NOT NULL,
    UNIQUE(name, word)
  );

  ALTER TABLE db_dictionary ENABLE ROW LEVEL SECURITY;

  CREATE POLICY "Public read dictionary"
    ON db_dictionary FOR SELECT USING (true);

  CREATE POLICY "Public insert dictionary"
    ON db_dictionary FOR INSERT WITH CHECK (true);

  CREATE POLICY "Public delete dictionary"
    ON db_dictionary FOR DELETE USING (true);

  -- Seed default words
  INSERT INTO db_dictionary (name, word) VALUES
    ('rootForeboding', 'uncertainty'), ('rootForeboding', 'risk'),
    ('rootForeboding', 'concern'),     ('rootForeboding', 'doubt'),
    ('rootForeboding', 'hesitation'),  ('rootForeboding', 'worry'),
    ('foreboding', 'decline'),   ('foreboding', 'decrease'),
    ('foreboding', 'fall'),      ('foreboding', 'drop'),
    ('foreboding', 'negative'),  ('foreboding', 'adverse'),
    ('foreboding', 'challenge'),
    ('assurance', 'confident'), ('assurance', 'stable'),
    ('assurance', 'strong'),    ('assurance', 'positive'),
    ('assurance', 'growth'),    ('assurance', 'success'),
    ('geopolitical', 'regulation'), ('geopolitical', 'policy'),
    ('geopolitical', 'tariff'),     ('geopolitical', 'sanction'),
    ('geopolitical', 'compliance'), ('geopolitical', 'government')
  ON CONFLICT DO NOTHING;
"""

from fastapi import APIRouter, HTTPException
from core.supabase import supabase
from models.schemas import DictionaryWord, DictionaryOut

router = APIRouter(prefix="/dictionary", tags=["Dictionary"])

VALID_DICTS = {"rootForeboding", "foreboding", "assurance", "geopolitical"}


@router.get("", response_model=DictionaryOut)
def get_dictionaries():
    """Returns all 4 dictionaries as word lists — used by DictionaryEditor on load."""
    res = supabase.table("db_dictionary") \
        .select("name, word") \
        .order("word") \
        .execute()

    result = {k: [] for k in VALID_DICTS}
    for row in (res.data or []):
        if row["name"] in result:
            result[row["name"]].append(row["word"])

    return DictionaryOut(**result)


@router.post("/{dict_name}", response_model=dict)
def add_word(dict_name: str, body: DictionaryWord):
    """Adds a word to a dictionary. Duplicate words are silently ignored."""
    if dict_name not in VALID_DICTS:
        raise HTTPException(400, f"Invalid dictionary '{dict_name}'. Must be one of: {VALID_DICTS}")

    word = body.word.strip().lower()
    if not word:
        raise HTTPException(400, "Word cannot be empty")

    res = supabase.table("db_dictionary") \
        .insert({"name": dict_name, "word": word}) \
        .execute()

    if not res.data:
        raise HTTPException(500, "Failed to add word")

    return {"added": word, "dictionary": dict_name}


@router.delete("/{dict_name}/{word}", response_model=dict)
def remove_word(dict_name: str, word: str):
    """Removes a word from a dictionary."""
    if dict_name not in VALID_DICTS:
        raise HTTPException(400, f"Invalid dictionary '{dict_name}'")

    res = supabase.table("db_dictionary") \
        .delete() \
        .eq("name", dict_name) \
        .eq("word", word.lower()) \
        .execute()

    return {"deleted": word, "dictionary": dict_name}