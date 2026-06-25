import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/app/AppLayout";
import { HomeScreen } from "@/components/app/HomeScreen";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Booker NoW — Réservez vos pros à domicile" },
      { name: "description", content: "Trouvez et réservez en quelques secondes le pro parfait près de chez vous. Coiffure, sport, beauté, bien-être." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <AppLayout>
      <HomeScreen />
    </AppLayout>
  );
}

