-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Users
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email           VARCHAR(255) UNIQUE NOT NULL,
    password_hash   VARCHAR(255),
    google_id       VARCHAR(255),
    display_name    VARCHAR(255),
    avatar_url      TEXT,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email    ON users(email);
CREATE INDEX idx_users_google_id ON users(google_id);

-- Notes
CREATE TABLE notes (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title           VARCHAR(500),
    content         TEXT,
    note_type       VARCHAR(20)  NOT NULL DEFAULT 'text',
    color           VARCHAR(20)  NOT NULL DEFAULT 'default',
    detected_mood   VARCHAR(20),
    manual_color    VARCHAR(20),
    is_pinned       BOOLEAN NOT NULL DEFAULT false,
    is_archived     BOOLEAN NOT NULL DEFAULT false,
    deleted_at      TIMESTAMP,
    canvas_x        FLOAT,
    canvas_y        FLOAT,
    canvas_width    FLOAT,
    embedding       VECTOR(768),
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notes_user_id    ON notes(user_id);
CREATE INDEX idx_notes_is_archived ON notes(is_archived);
CREATE INDEX idx_notes_is_pinned  ON notes(is_pinned);
CREATE INDEX idx_notes_deleted_at ON notes(deleted_at);
CREATE INDEX idx_notes_created_at ON notes(created_at DESC);

-- Labels
CREATE TABLE labels (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name        VARCHAR(50) NOT NULL,
    color       VARCHAR(20) NOT NULL DEFAULT 'default',
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, name)
);

CREATE INDEX idx_labels_user_id ON labels(user_id);

-- Note <-> Label join
CREATE TABLE note_labels (
    note_id     UUID NOT NULL REFERENCES notes(id)  ON DELETE CASCADE,
    label_id    UUID NOT NULL REFERENCES labels(id) ON DELETE CASCADE,
    PRIMARY KEY (note_id, label_id)
);

-- Note images
CREATE TABLE note_images (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    note_id     UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    url         TEXT NOT NULL,
    r2_key      VARCHAR(500),
    file_size   INTEGER,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_note_images_note_id ON note_images(note_id);

-- Note versions (history)
CREATE TABLE note_versions (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    note_id     UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    title       VARCHAR(500),
    content     TEXT,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_note_versions_note_id    ON note_versions(note_id);
CREATE INDEX idx_note_versions_created_at ON note_versions(created_at DESC);

-- Collaborators
CREATE TABLE note_collaborators (
    note_id     UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permission  VARCHAR(10) NOT NULL DEFAULT 'view',
    invited_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (note_id, user_id)
);
