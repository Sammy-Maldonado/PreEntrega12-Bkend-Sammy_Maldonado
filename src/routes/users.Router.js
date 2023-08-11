import { Router } from "express";
import { authRoles, passportCall } from "../services/auth.js";

const router = Router();


router.put('/premium/:uid', passportCall('jwt', { strategyType: 'jwt', sessions: false }), authRoles('admin'), /* usersController.changeUserRole */);


//Definir usersController, services, etc y darles la logica para el ultimo punto de la consigna.

export default router;