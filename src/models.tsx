export interface Usuario {
    id: int;
    email: string;
    senha: string;
    nome: string ;
    url: string | null ;
    admin: boolean ;
    created_at: Date;
}