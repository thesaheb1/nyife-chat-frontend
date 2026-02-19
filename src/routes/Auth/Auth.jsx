import { Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import FallbackPage from "@/components/fallback-page";
import Layout from "@/pages/authentication/layout";

// Lazy load pages to improve performance
const Login = lazy(() => import("@/pages/authentication/login"));
const ForgotPassword = lazy(() => import("@/pages/authentication/forgot-password"));
const ResetPassword = lazy(() => import("@/pages/authentication/reset-password"));

const Auth = () => {
    return (
        <Suspense fallback={<FallbackPage />}>
            <Routes>
                <Route path="/login" element={<Layout><Login /></Layout>} />
                <Route path="/forgot-password" element={<Layout><ForgotPassword /></Layout>} />
                <Route path="/reset-password" element={<Layout><ResetPassword /></Layout>} />

                {/* Redirects */}
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        </Suspense>
    );
};

export default Auth;
