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
    id: number;
    titulo: string;
    slug: string;
    views: number;
    created_at: Date,
    created_by: number,
    updated_at: Date,
    sinopse: string;
    ano: number;
    thumbnail: string;
    adulto: boolean;
    finalizado: boolean;

    autores: [] | null;
    generos: [] | null;
    artistas: [] | null;
}

export interface Capitulo{
    id: int;
    manga_id: int;
    titulo: string;
    numero: int;
    thumbnail: string;
    created_by: int; 
    created_at: Date;

}