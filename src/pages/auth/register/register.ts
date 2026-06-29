import { registerUser, isAuthenticated } from '../../../utils/auth';
import { navigate } from '../../../utils/navigate';

class RegisterPage {
    constructor() {
        this.init();
    }

    private init(): void {
        if (isAuthenticated()) {
            navigate('../../store/home/home.html');
            return;
        }
        this.setupForm();
    }

    private setupForm(): void {
        const form = document.getElementById('register-form') as HTMLFormElement;
        const errorMsg = document.getElementById('error-message') as HTMLElement;

        form?.addEventListener('submit', async (e) => {
            e.preventDefault();
            errorMsg.style.display = 'none';

            const nombre = (document.getElementById('nombre') as HTMLInputElement).value.trim();
            const apellido = (document.getElementById('apellido') as HTMLInputElement).value.trim();
            const email = (document.getElementById('email') as HTMLInputElement).value.trim();
            const celular = (document.getElementById('celular') as HTMLInputElement).value.trim();
            const password = (document.getElementById('password') as HTMLInputElement).value;
            const confirmPassword = (document.getElementById('confirm-password') as HTMLInputElement).value;

            // Validations
            if (!nombre || !apellido || !email || !password) {
                errorMsg.textContent = 'Todos los campos requeridos deben completarse';
                errorMsg.style.display = 'block';
                return;
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                errorMsg.textContent = 'Formato de email inválido';
                errorMsg.style.display = 'block';
                return;
            }

            if (password.length < 6) {
                errorMsg.textContent = 'La contraseña debe tener al menos 6 caracteres';
                errorMsg.style.display = 'block';
                return;
            }

            if (password !== confirmPassword) {
                errorMsg.textContent = 'Las contraseñas no coinciden';
                errorMsg.style.display = 'block';
                return;
            }

            try {
                await registerUser({ nombre, apellido, mail: email, celular, password });
                navigate('../../store/home/home.html');
            } catch (err: any) {
                errorMsg.textContent = err.message || 'Error al registrar';
                errorMsg.style.display = 'block';
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => new RegisterPage());
