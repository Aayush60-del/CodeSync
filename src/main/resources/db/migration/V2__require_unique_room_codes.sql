DO $$
DECLARE
    room_record RECORD;
    candidate TEXT;
    alphabet CONSTANT TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
BEGIN
    FOR room_record IN SELECT id FROM rooms WHERE code IS NULL LOOP
        LOOP
            candidate := '';
            FOR character_index IN 1..6 LOOP
                candidate := candidate || substr(
                    alphabet,
                    floor(random() * length(alphabet))::INTEGER + 1,
                    1
                );
            END LOOP;

            EXIT WHEN NOT EXISTS (SELECT 1 FROM rooms WHERE code = candidate);
        END LOOP;

        UPDATE rooms SET code = candidate WHERE id = room_record.id;
    END LOOP;
END $$;

ALTER TABLE rooms ALTER COLUMN code SET NOT NULL;
ALTER TABLE rooms ALTER COLUMN owner_id DROP NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_rooms_code_unique ON rooms(code);
