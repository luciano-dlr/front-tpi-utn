import { login, isAuthenticated, isAdmin } from '../../../utils/auth';
import { navigate } from '../../../utils/navigate';

class LoginPage {
    constructor() {
        this.init();
    }

    private async init(): Promise<void> {
        // If already logged in, redirect immediately
        if (isAuthenticated()) {
            this.redirectByRole();
            return;
        }
        this.setupForm();
    }

    private redirectByRole(): void {
        if (isAdmin()) {
            // NOTE: admin/adminHome/adminHome.html doesn't exist yet (Change 3)
            navigate('../../admin/adminHome/adminHome.html');
        } else {
            navigate('../../store/home/home.html');
        }
    }

    private setupForm(): void {
        const form = document.getElementById('login-form') as HTMLFormElement;
        const errorMsg = document.getElementById('error-message') as HTMLElement;

        form?.addEventListener('submit', async (e) => {
            e.preventDefault();
            errorMsg.style.display = 'none';

            const email = (document.getElementById('email') as HTMLInputElement).value;
            const password = (document.getElementById('password') as HTMLInputElement).value;

            if (!email || !password) {
                errorMsg.textContent = 'Todos los campos son requeridos';
                errorMsg.style.display = 'block';
                return;
            }

            try {
                const user = await login(email, password);
                if (!user) {
                    errorMsg.textContent = 'Credenciales incorrectas';
                    errorMsg.style.display = 'block';
                    return;
                }
                this.redirectByRole();
            } catch (err) {
                errorMsg.textContent = 'Error al conectar. Intente nuevamente.';
                errorMsg.style.display = 'block';
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => new LoginPage());
