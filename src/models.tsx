export interface Usuario {
    id: int;
    email: string;
    senha: string;
    nome: string ;
    url: string | null ;
    admin: boolean ;
    autor: boolean;
    created_at: Date;
}

export interface Artista {
    id: int;
    nome: string;
    slug?: string | null;
}

export interface Autor {
    id: int;
    nome: string;
    slug?: string | null;
}

export interface Genero {
    id: int;
    nome: string;
    slug?: string | null;
}

export interface Manga{
    id: int;
    titulo: string;
    slug: string;
    views: int;
    created_at: Date,
    created_by: int,
    updated_at: Date,
    sinopse: string;
    ano: int;
    thumbnail: string;
    adulto: boolean;
    finalizado: boolean;

    autores: [] | null;
    generos: [] | null;
    artistas: [] | null;
}