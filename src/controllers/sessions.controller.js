import { generateToken, validatePassword, createHash } from "../services/auth.js";
import UsersDTO from "../dtos/user/UsersDTO.js";
import { usersService } from '../services/index.js';
import MailingService from "../services/MailingService.js";
import DTemplates from "../constants/DTemplates.js";
import config from "../config.js";

const getCurrent = (req,res) => {
  const currentUser = req.user;
  res.sendSuccessWithPayload(currentUser);
}

const register = async (req, res) => {
  const mailingService = new MailingService();
  try {
    const result = await mailingService.sendMail(req.user.email, DTemplates.WELCOME, {user: req.user})
    console.log(result);
    res.sendSuccess("Registered");
  } catch (error) {
    res.sendInternalError(error);
  }
  
}

const loginWithToken = (req, res) => {
  const token = generateToken(req.user);

  //Aqui envío el token generado para el usuario, al frontend, por una cookie.
  //El siguiente paso es extraer el token de la cookie con la estrategia 'jwt' -> passport.config.js :72
  res.cookie(config.jwt.COOKIE, token, {
    maxAge: 1000 * 3600 * 24,   //1seg*1hr*24hrs = 24hrs
    httpOnly: true
  }).sendSuccess("Logged In")   //Logeado con exito
}

const githubInit = (req, res) => { }

const githubLoginWithToken = (req, res) => {
  const userDTO = new UsersDTO.GithubTokenDTO(req);
  const user = {...userDTO}
  const accessToken = generateToken(user);

  res.cookie(config.jwt.COOKIE, accessToken, {
    maxAge: 1000*3600*24,
    httpOnly:true
  }).sendSuccess("Github login success")
}

const logout = async (req, res) => {
  // Borra la cookie en la respuesta
  res.clearCookie(config.jwt.COOKIE);
  // Envía una respuesta JSON que indica el logout exitoso
  res.sendSuccess("Logged Out");
}

const restorePassword = async (req,res) => {
  const {email, password} = req.body;
  
  //¿El usuario si existe?
  const user = await usersService.getUserBy({email});
  if(!user) return res.status(400).send({status:"error", error:"User doesn't exist"})

  //Verificar que no se repita el mismo password
  const isSamePassword = await validatePassword(password, user.password);
  if(isSamePassword) return res.status(400).send({status:"error", error: "Cannot replace password with current password"})
  //Si es el usuario y es un password diferente, ahora si, actualizamos su contraseña
  //OJO, este password es plano nuevamente, debemos encriptarlo
  const newHashedPassword = await createHash(password);
  await usersService.updateOneUser(email, newHashedPassword);
  res.status(200).send({status:"success", message: "Contraseña restablecida exitosamente"});
};

export default {
  getCurrent,
  register,
  loginWithToken,
  githubInit,
  githubLoginWithToken,
  logout,
  restorePassword,
}