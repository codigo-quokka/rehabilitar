import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui";
import logo from "../../../assets/logo.png";

export const PaymentSuccess = () => {
    const navigate = useNavigate();
    return (
    <div className="min-h-screen bg-linear-to-br from-bg-main via-bg-secondary to-bg-surface dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
            <div className="text-center mb-10">
                <img
                    src={logo}
                    alt="RehabilitAR"
                    className="w-24 h-auto mx-auto mb-4"
                />
                <h1 className="text-4xl font-bold text-dark dark:text-gray-100">RehabilitAR</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-2 text-lg">Centro de Rehabilitación</p>
            </div>

            <Card className="shadow-xl text-center">
                <div className="p-6">
                    <h2 className="text-2xl font-semibold text-dark dark:text-gray-100 mb-6">
                    ¡Pago exitoso!
                    </h2>

                    <div className="flex flex-col items-center space-y-4">
                        <div className="text-green-500 bg-green-100 p-3 rounded-full">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                        </div>
                        <p className="text-green-600 font-medium">Tu reserva ha sido confirmada.</p>
                        <Button onClick={() => navigate("/reservas")} className="w-full">
                        Volver a reservas
                        </Button>
                    </div>
                    
                </div>
            </Card>

            <p className="text-center text-gray-400 text-sm mt-8">
                © 2026 RehabilitAR
            </p>
        </div>
    </div>
    );
};
