import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui";
import { apiClient } from "../../../api";
import logo from "../../../assets/logo.png";

type ConfirmationState = "loading" | "success" | "error";

export const PaymentSuccess = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [state, setState] = useState<ConfirmationState>("loading");
    const [errorMsg, setErrorMsg] = useState("");

    useEffect(() => {
        const confirmPayment = async () => {
            const paymentId = searchParams.get("payment_id");
            const externalRef = searchParams.get("external_reference");

            // Si no hay params de MP, mostrar la página estática de éxito
            if (!paymentId || !externalRef) {
                setState("success");
                return;
            }

            try {
                const response = await apiClient.get("/pagos/mercadopago/confirmar", {
                    params: { payment_id: paymentId, external_reference: externalRef },
                });
                const data = response.data;
                if (data.success) {
                    setState("success");
                } else {
                    setState("error");
                    setErrorMsg(data.error || "No se pudo confirmar el pago.");
                }
            } catch (err) {
                const apiError = (err as { response?: { data?: { error?: string } } })?.response?.data;
                setState("error");
                setErrorMsg(apiError?.error || "Error al verificar el pago. Contacta al soporte.");
            }
        };
        confirmPayment();
    }, [searchParams]);

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
                <div className="p-6" aria-live="polite">
                    {state === "loading" && (
                        <>
                            <h2 className="text-2xl font-semibold text-dark dark:text-gray-100 mb-6">
                                Confirmando pago...
                            </h2>
                            <div className="flex flex-col items-center space-y-4">
                                <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent" role="status" aria-label="Verificando pago" />
                                <p className="text-gray-500 dark:text-gray-400">
                                    Estamos verificando tu pago. Esto puede tomar unos segundos.
                                </p>
                            </div>
                        </>
                    )}

                    {state === "success" && (
                        <>
                            <h2 className="text-2xl font-semibold text-dark dark:text-gray-100 mb-6">
                                ¡Pago exitoso!
                            </h2>
                            <div className="flex flex-col items-center space-y-4">
                                <div className="text-green-500 dark:text-green-400 bg-green-100 dark:bg-green-900/30 p-3 rounded-full">
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                </div>
                                <p className="text-green-600 dark:text-green-400 font-medium">Tu reserva ha sido confirmada.</p>
                                <Button onClick={() => navigate("/reservas")} className="w-full">
                                Volver a reservas
                                </Button>
                            </div>
                        </>
                    )}

                    {state === "error" && (
                        <>
                            <h2 className="text-2xl font-semibold text-dark dark:text-gray-100 mb-6">
                                Error en la confirmación
                            </h2>
                            <div className="flex flex-col items-center space-y-4">
                                <div className="text-red-500 dark:text-red-400 bg-red-100 dark:bg-red-900/30 p-3 rounded-full">
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                </div>
                                <p className="text-red-600 dark:text-red-400 font-medium">{errorMsg}</p>
                                <Button onClick={() => navigate("/reservas")} className="w-full">
                                Volver a reservas
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </Card>

            <p className="text-center text-gray-400 dark:text-gray-500 text-sm mt-8">
                © 2026 RehabilitAR
            </p>
        </div>
    </div>
    );
};
