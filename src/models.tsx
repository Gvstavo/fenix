export interface Usuario {
    id: int;
    email: string;
    senha: string;
    nome: string ;
    url: string | null ;
    admin: boolean ;
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