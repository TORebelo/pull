import { Suspense } from "react";

import { AuthPanel } from "@/components/auth/auth-panel";

export const dynamic = "force-dynamic";

export default function AuthPage() {
    return (
        <Suspense fallback={null}>
            <AuthPanel />
        </Suspense>
    );
}
