import { Suspense } from "react";

import { AuthPanel } from "@/components/auth/auth-panel";

export default function AuthPage() {
    return (
        <Suspense fallback={null}>
            <AuthPanel />
        </Suspense>
    );
}
