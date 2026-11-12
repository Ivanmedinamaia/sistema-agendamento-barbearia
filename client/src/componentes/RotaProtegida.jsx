import { Navigate, useLocation } from 'react-router';
import { useAuth } from '../contexto/AuthContext';

// Exige login para acessar a página. Com somenteAdmin, exige também
// que o usuário seja administrador.
export default function RotaProtegida({ children, somenteAdmin = false }) {
    const { usuario, ehAdmin } = useAuth();
    const location = useLocation();

    if (!usuario) {
        // Guarda a página pedida para voltar a ela depois do login
        return <Navigate to="/login" replace state={{ de: location.pathname + location.search }} />;
    }

    if (somenteAdmin && !ehAdmin) {
        return <Navigate to="/" replace />;
    }

    return children;
}
