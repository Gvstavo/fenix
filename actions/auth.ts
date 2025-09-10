'use server';

import bcrypt from 'bcryptjs';
import { z } from 'zod';
// Importando nossas funções de sessão
import { createSession, deleteSession } from '@/app/lib/session';
import pool  from '@/src/db.ts';

const SignUpSchema = z.object({
  name: z.string().min(3, { message: "O nome deve ter pelo menos 3 caracteres." }),
  email: z.string().email({ message: "Por favor, insira um e-mail válido." }),
  password: z.string().min(6, { message: "A senha deve ter pelo menos 6 caracteres." }),
});

export interface SignUpState {
  message: string;
  errors?: {
    name?: string[];
    email?: string[];
    password?: string[];
  };
  success: boolean;
}
export interface LoginState{
	password: string,
	email: string,
	success: boolean;
}

export async function registerUser(
  prevState: SignUpState,
  formData: FormData
) {
  const validatedFields = SignUpSchema.safeParse(
    Object.fromEntries(formData.entries())
  );

  if (!validatedFields.success) {
    return {
      message: 'Erro de validação.',
      errors: validatedFields.error.flatten().fieldErrors,
      success: false,
    };
  }

  const { name, email, password } = validatedFields.data;

  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
     const insertQuery = "INSERT INTO usuarios(email, senha, nome, url, admin, created_at) VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING id";

	  const values = [
	    email,
	    hashedPassword,
	    name,
	   "default.webp", 
	    false,
	  ];

	  const result = await pool.query(insertQuery, values);
	  const insertedId = result.rows[0].id;
	  //console.log("id criado: ",insertedId);
    
    await createSession({name: name, email: email, admin: false, id: insertedId});
    
    return { message: 'Cadastro realizado com sucesso!', success: true };

  } catch (error) {
    return { message: 'Ocorreu um erro interno no servidor.', success: false };
  }
}

export async function login(
  prevState: LoginState,
  formData: FormData
) {
	console.log(formData);
	const senha = formData.get("senha");
	const email = formData.get("email");

  try {

  	const query = "SELECT email,senha,admin,id,nome FROM usuarios WHERE email = $1";
  	const values = [email];

  	const result = await pool.query(query,values);
  	//console.log(result);
  	if(result.rowCount == 1){
  		if(await bcrypt.compare(senha, result.rows[0].senha)){
  			    await createSession({email: email, admin:  result.rows[0].admin, id:  result.rows[0].id, name:  result.rows[0].nome});
    				return { message: 'login realizado com sucesso!', success: true };
  		}else return  { message: 'Senha incorrecta', success: false };
  	}else return  { message: 'email incorrecto', success: false };


  } catch (error) {
  	  	console.log("erro login:",error);
    return { message: 'Ocorreu um erro interno no servidor.', success: false };
  }

}





export async function logout() {
  await deleteSession();
}