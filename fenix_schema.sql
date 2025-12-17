CREATE TABLE usuarios(
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    email TEXT UNIQUE,
    senha TEXT,
    nome TEXT,
    url TEXT,
    admin BOOLEAN,
    created_at TIMESTAMP
);

CREATE TABLE generos(
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  nome TEXT,
  slug TEXT
);

CREATE TABLE autores(
	id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
	nome TEXT,
	slug TEXT
);
CREATE TABLE artistas(
	id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
	nome TEXT,
	slug TEXT
);

CREATE TABLE mangas(
   id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
   titulo TEXT NOT NULL ,
   slug TEXT,
   views BIGINT,
   created_at TIMESTAMP,
   updated_at TIMESTAMP,
   sinopse TEXT,
   ano INT,
   created_by BIGINT,
   thumbnail TEXT,
   adulto BOOLEAN,
   finalizado BOOLEAN,
  FOREIGN KEY (created_by) REFERENCES usuarios(id) ON DELETE SET NULL
);

CREATE TABLE manga_capitulos(
   id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
   manga_id BIGINT,
   titulo TEXT,
   numero int,
   created_by BIGINT,
   created_at TIMESTAMP,
   FOREIGN KEY (manga_id) REFERENCES mangas(id) ON DELETE CASCADE,
   FOREIGN KEY (created_by) REFERENCES usuarios(id) ON DELETE SET NULL
);

CREATE TABLE capitulo_paginas(
   id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
   capitulo_id BIGINT,
   numero INT,
   url TEXT,
   FOREIGN KEY (capitulo_id) REFERENCES manga_capitulos(id) ON DELETE CASCADE
);

CREATE TABLE status(
   id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
	nome TEXT,
	slug TEXT
);

CREATE TABLE manga_status (
	   id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    manga_id BIGINT,
    status_id BIGINT,
    FOREIGN KEY (manga_id) REFERENCES mangas(id) ON DELETE CASCADE,
    FOREIGN KEY (status_id) REFERENCES status(id) ON DELETE CASCADE
);

CREATE TABLE manga_generos (
	   id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    manga_id BIGINT,
    genero_id BIGINT,
    FOREIGN KEY (manga_id) REFERENCES mangas(id) ON DELETE CASCADE,
    FOREIGN KEY (genero_id) REFERENCES generos(id) ON DELETE CASCADE
);

CREATE TABLE manga_autores (
		id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    manga_id BIGINT,
    autor_id BIGINT,
    FOREIGN KEY (manga_id) REFERENCES mangas(id) ON DELETE CASCADE,
    FOREIGN KEY (autor_id) REFERENCES autores(id) ON DELETE CASCADE
);

CREATE TABLE manga_artistas (
	   id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    manga_id BIGINT,
    artista_id BIGINT,
    FOREIGN KEY (manga_id) REFERENCES mangas(id) ON DELETE CASCADE,
    FOREIGN KEY (artista_id) REFERENCES artistas(id) ON DELETE CASCADE
);


CREATE TABLE manga_comentarios(
	id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
	comentario TEXT,
	usuario_id BIGINT,
	manga_id BIGINT,
	created_at TIMESTAMP,
  FOREIGN KEY (manga_id) REFERENCES mangas(id) ON DELETE CASCADE,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE capitulo_comentarios(
	id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
	comentario TEXT,
	usuario_id BIGINT,
	capitulo_id BIGINT,
	created_at TIMESTAMP,
  FOREIGN KEY (capitulo_id) REFERENCES manga_capitulos(id) ON DELETE CASCADE,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);


CREATE INDEX ON mangas (slug);
CREATE INDEX ON mangas (created_by);
CREATE INDEX ON mangas (updated_at);
CREATE INDEX ON mangas (views);
CREATE INDEX ON manga_capitulos (manga_id);
CREATE INDEX ON manga_capitulos (created_by);
CREATE INDEX ON capitulo_paginas (capitulo_id);
CREATE INDEX ON manga_comentarios (manga_id);
CREATE INDEX ON manga_comentarios (usuario_id);
CREATE INDEX ON capitulo_comentarios (capitulo_id);
CREATE INDEX ON capitulo_comentarios (usuario_id);

ALTER TABLE usuarios ADD COLUMN autor BOOLEAN DEFAULT FALSE;
ALTER TABLE manga_capitulos ADD COLUMN thumbnail TEXT;
ALTER TABLE mangas ADD CONSTRAINT unique_slug UNIQUE (slug);