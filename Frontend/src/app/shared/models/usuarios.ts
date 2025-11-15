export class Usuario {
    idUsuario: number;
    nombre: string;
    email: string;
    rol: number;
    constructor(usr?: Usuario) {
    this.idUsuario = usr != undefined ? usr.idUsuario : 0;
    this.nombre = usr != undefined ? usr.nombre : '';
    this.email = usr != undefined ? usr.email : '';
    this.rol = usr != undefined ? usr.rol : 0;
    }
}

